import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type {
  AgentCommand,
  AgentCommandType,
  AgentEvent,
  AgentEventType
} from "@paper-read/shared";

const AGENT_EVENT_CHANNEL = "agent-runtime:event";
const AGENT_ERROR_CHANNEL = "agent-runtime:error";
const AGENT_TERMINATED_CHANNEL = "agent-runtime:terminated";
const REQUEST_TIMEOUT_MS = 60_000;

type PendingRequest = {
  expectedType: AgentEventType;
  resolve: (event: AgentEvent) => void;
  reject: (error: Error) => void;
  timeoutId: number;
};

type EventWaiter = {
  expectedType: AgentEventType;
  resolve: (event: AgentEvent) => void;
  reject: (error: Error) => void;
  timeoutId: number;
};

type AgentCommandInput = AgentCommand extends infer TCommand
  ? TCommand extends AgentCommand
    ? Omit<TCommand, "id">
    : never
  : never;

type AgentEventListener = (event: AgentEvent) => void;

function createCommandId() {
  return crypto.randomUUID();
}

function parseAgentEvents(rawPayload: string) {
  return rawPayload
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as AgentEvent);
}

class AgentClient {
  private pendingRequests = new Map<string, PendingRequest>();
  private eventWaiters: EventWaiter[] = [];
  private eventListeners = new Set<AgentEventListener>();
  private listenerPromise: Promise<void> | null = null;
  private bootstrapPromise: Promise<void> | null = null;
  private workspacePath: string | null = null;

  async ensureReady() {
    if (!this.bootstrapPromise) {
      this.bootstrapPromise = this.bootstrap();
    }

    return this.bootstrapPromise;
  }

  async request(
    commandInput: AgentCommandInput,
    expectedType: AgentEventType
  ) {
    await this.ensureReadyUnlessBootstrapping(commandInput.type);
    const command = {
      ...commandInput,
      id: createCommandId()
    } as AgentCommand;

    const responsePromise = new Promise<AgentEvent>((resolve, reject) => {
      const timeoutId = window.setTimeout(() => {
        this.pendingRequests.delete(command.id);
        reject(new Error(`Agent command timed out: ${command.type}`));
      }, REQUEST_TIMEOUT_MS);

      this.pendingRequests.set(command.id, {
        expectedType,
        resolve,
        reject,
        timeoutId
      });
    });

    await invoke("send_agent_command", {
      command: JSON.stringify(command)
    });

    return responsePromise;
  }

  subscribe(listener: AgentEventListener) {
    this.eventListeners.add(listener);
    void this.ensureListeners();

    return () => {
      this.eventListeners.delete(listener);
    };
  }

  private async bootstrap() {
    await this.ensureListeners();
    const workspacePath = await invoke<string>("get_workspace_path");
    const startResult = await invoke<string>("start_agent_runtime");

    if (startResult === "started") {
      await this.waitForEvent("agent.ready", 5000).catch(() => undefined);
    }

    const workspaceEvent = await this.sendBootCommand(
      {
        type: "workspace.open",
        payload: { workspacePath }
      },
      "workspace.opened"
    );
    if (workspaceEvent.type !== "workspace.opened") {
      throw new Error(`Unexpected workspace event: ${workspaceEvent.type}`);
    }
    this.workspacePath = workspaceEvent.payload.workspacePath;

    await this.sendBootCommand({ type: "sources.import_seed" }, "sources.imported");
  }

  private async ensureReadyUnlessBootstrapping(commandType: AgentCommandType) {
    if (commandType === "workspace.open" || commandType === "sources.import_seed") {
      return;
    }

    await this.ensureReady();
  }

  private async sendBootCommand<TType extends "workspace.open" | "sources.import_seed">(
    commandInput: Extract<AgentCommandInput, { type: TType }>,
    expectedType: AgentEventType
  ) {
    const command = {
      ...commandInput,
      id: createCommandId()
    } as AgentCommand;

    const responsePromise = new Promise<AgentEvent>((resolve, reject) => {
      const timeoutId = window.setTimeout(() => {
        this.pendingRequests.delete(command.id);
        reject(new Error(`Agent boot command timed out: ${command.type}`));
      }, REQUEST_TIMEOUT_MS);

      this.pendingRequests.set(command.id, {
        expectedType,
        resolve,
        reject,
        timeoutId
      });
    });

    await invoke("send_agent_command", {
      command: JSON.stringify(command)
    });

    return responsePromise;
  }

  private async ensureListeners() {
    if (!this.listenerPromise) {
      this.listenerPromise = Promise.all([
        listen<string>(AGENT_EVENT_CHANNEL, (event) => this.handleRawEvent(event.payload)),
        listen<string>(AGENT_ERROR_CHANNEL, (event) => this.handleRuntimeError(event.payload)),
        listen(AGENT_TERMINATED_CHANNEL, () =>
          this.rejectAll(new Error("Agent runtime terminated."))
        )
      ]).then(() => undefined);
    }

    return this.listenerPromise;
  }

  private waitForEvent(expectedType: AgentEventType, timeoutMs: number) {
    return new Promise<AgentEvent>((resolve, reject) => {
      const timeoutId = window.setTimeout(() => {
        this.eventWaiters = this.eventWaiters.filter((waiter) => waiter.resolve !== resolve);
        reject(new Error(`Timed out waiting for agent event: ${expectedType}`));
      }, timeoutMs);

      this.eventWaiters.push({
        expectedType,
        resolve,
        reject,
        timeoutId
      });
    });
  }

  private handleRawEvent(rawPayload: string) {
    for (const event of parseAgentEvents(rawPayload)) {
      this.notifyEventListeners(event);
      this.resolveEventWaiters(event);

      if (event.type === "agent.error") {
        const pendingRequest = event.id ? this.pendingRequests.get(event.id) : null;
        pendingRequest?.reject(new Error(event.payload.message));
        if (event.id) {
          this.pendingRequests.delete(event.id);
        }
        continue;
      }

      if (!event.id) {
        continue;
      }

      const pendingRequest = this.pendingRequests.get(event.id);
      if (!pendingRequest || pendingRequest.expectedType !== event.type) {
        continue;
      }

      window.clearTimeout(pendingRequest.timeoutId);
      this.pendingRequests.delete(event.id);
      pendingRequest.resolve(event);
    }
  }

  private notifyEventListeners(event: AgentEvent) {
    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch (error) {
        console.error("Agent event listener failed.", error);
      }
    }
  }

  private resolveEventWaiters(event: AgentEvent) {
    const remainingWaiters: EventWaiter[] = [];

    for (const waiter of this.eventWaiters) {
      if (waiter.expectedType === event.type) {
        window.clearTimeout(waiter.timeoutId);
        waiter.resolve(event);
      } else {
        remainingWaiters.push(waiter);
      }
    }

    this.eventWaiters = remainingWaiters;
  }

  private handleRuntimeError(errorPayload: string) {
    const error = new Error(errorPayload || "Agent runtime error.");
    this.rejectAll(error);
  }

  private rejectAll(error: Error) {
    for (const pendingRequest of this.pendingRequests.values()) {
      window.clearTimeout(pendingRequest.timeoutId);
      pendingRequest.reject(error);
    }
    this.pendingRequests.clear();

    for (const waiter of this.eventWaiters) {
      window.clearTimeout(waiter.timeoutId);
      waiter.reject(error);
    }
    this.eventWaiters = [];
    this.bootstrapPromise = null;
  }
}

export const agentClient = new AgentClient();
