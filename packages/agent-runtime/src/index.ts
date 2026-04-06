import type { AgentCommand, AgentEvent } from "@paper-read/shared";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { stdin } from "node:process";

import { analyzeIntent, scorePaperTitle } from "./screening";
import { INITIAL_PAPERS, INITIAL_SOURCE_KEY } from "./source-data/initialPapers";
import {
  createConversation,
  createMessage,
  createScreeningResult,
  listConversations,
  listMessages,
  listPapersBySource,
  listScreeningResults,
  listSourceSummaries,
  openWorkspaceStorage,
  updateConversationMetadata,
  upsertPapers,
  type WorkspaceStorage
} from "./storage/workspace";

const RUNTIME_NAME = "paper-read-agent-runtime";
const RUNTIME_VERSION = "0.1.0";

let workspaceStorage: WorkspaceStorage | null = null;

function emit(event: AgentEvent) {
  process.stdout.write(`${JSON.stringify(event)}\n`);
}

function emitError(id: string | undefined, error: unknown) {
  emit({
    id,
    type: "agent.error",
    payload: {
      message: error instanceof Error ? error.message : "Unknown agent runtime error."
    }
  });
}

function getWorkspaceStorage() {
  if (!workspaceStorage) {
    throw new Error("Workspace is not opened.");
  }

  return workspaceStorage;
}

async function handleWorkspaceOpen(command: Extract<AgentCommand, { type: "workspace.open" }>) {
  workspaceStorage?.db.close();
  workspaceStorage = openWorkspaceStorage(command.payload.workspacePath);

  emit({
    id: command.id,
    type: "workspace.opened",
    payload: {
      workspacePath: workspaceStorage.workspacePath
    }
  });
}

async function handleSourcesList(command: Extract<AgentCommand, { type: "sources.list" }>) {
  const { db } = getWorkspaceStorage();

  emit({
    id: command.id,
    type: "sources.loaded",
    payload: {
      sources: listSourceSummaries(db)
    }
  });
}

async function handleSourcesImportSeed(
  command: Extract<AgentCommand, { type: "sources.import_seed" }>
) {
  const storage = getWorkspaceStorage();
  const seedImportPath = join(storage.workspacePath, "imports", "aaai_2026.seed.json");

  writeFileSync(
    seedImportPath,
    JSON.stringify(
      {
        sourceKey: INITIAL_SOURCE_KEY,
        importedAt: new Date().toISOString(),
        papers: INITIAL_PAPERS
      },
      null,
      2
    )
  );
  upsertPapers(storage.db, INITIAL_PAPERS);

  emit({
    id: command.id,
    type: "sources.imported",
    payload: {
      sourceKey: INITIAL_SOURCE_KEY,
      importedCount: INITIAL_PAPERS.length,
      skippedCount: 0
    }
  });
}

async function handleConversationList(
  command: Extract<AgentCommand, { type: "conversation.list" }>
) {
  const { db } = getWorkspaceStorage();

  emit({
    id: command.id,
    type: "conversation.listed",
    payload: {
      conversations: listConversations(db)
    }
  });
}

async function handleConversationGet(command: Extract<AgentCommand, { type: "conversation.get" }>) {
  const { db } = getWorkspaceStorage();
  const conversation = listConversations(db).find(
    (item) => item.id === command.payload.conversationId
  );

  if (!conversation) {
    throw new Error("Conversation not found.");
  }

  emit({
    id: command.id,
    type: "conversation.loaded",
    payload: {
      conversation,
      messages: listMessages(db, conversation.id)
    }
  });
}

async function handleScreeningResultsGet(
  command: Extract<AgentCommand, { type: "screening.results.get" }>
) {
  const { db } = getWorkspaceStorage();

  emit({
    id: command.id,
    type: "screening.results.loaded",
    payload: {
      conversationId: command.payload.conversationId,
      results: listScreeningResults(db, command.payload.conversationId)
    }
  });
}

async function handleScreeningStart(command: Extract<AgentCommand, { type: "screening.start" }>) {
  const { db } = getWorkspaceStorage();
  const papers = listPapersBySource(db, command.payload.sourceKey);
  const conversationId = createConversation(db, {
    title: command.payload.queryText.slice(0, 80),
    mode: "screening",
    metadata: {
      sourceKey: command.payload.sourceKey,
      queryText: command.payload.queryText,
      inputMode: "title",
      options: command.payload.options ?? {},
      status: "running"
    }
  });
  const messageId = createMessage(db, {
    conversationId,
    role: "user",
    content: command.payload.queryText,
    metadata: {
      tool: "screening",
      sourceKey: command.payload.sourceKey,
      options: command.payload.options ?? {}
    }
  });

  emit({
    id: command.id,
    type: "screening.started",
    payload: {
      conversationId,
      messageId,
      sourceKey: command.payload.sourceKey,
      queryText: command.payload.queryText
    }
  });

  const intent = analyzeIntent(command.payload.queryText);
  createMessage(db, {
    conversationId,
    role: "tool",
    content: "Intent analyzed for title-only paper screening.",
    metadata: {
      tool: "screening",
      step: "intent_analyzed",
      summary: intent.summary,
      focusTerms: intent.focusTerms
    }
  });

  emit({
    id: command.id,
    type: "screening.intent_analyzed",
    payload: {
      conversationId,
      summary: intent.summary,
      focusTerms: intent.focusTerms
    }
  });

  let matchedCount = 0;
  for (const paper of papers) {
    const scoredPaper = scorePaperTitle(command.payload.queryText, paper);
    if (scoredPaper.decision === "keep") {
      matchedCount += 1;
    }

    createScreeningResult(db, {
      conversationId,
      messageId,
      paperId: paper.id,
      decision: scoredPaper.decision,
      score: scoredPaper.score,
      reasoning: scoredPaper.reasoning,
      metadata: {
        mode: "title"
      }
    });

    emit({
      id: command.id,
      type: "screening.paper_scored",
      payload: {
        conversationId,
        paperId: paper.id,
        decision: scoredPaper.decision,
        score: scoredPaper.score,
        reasoning: scoredPaper.reasoning
      }
    });
  }

  createMessage(db, {
    conversationId,
    role: "assistant",
    content: `Completed title-only screening: ${matchedCount}/${papers.length} papers kept.`,
    metadata: {
      totalCount: papers.length,
      matchedCount
    }
  });

  updateConversationMetadata(db, conversationId, {
    sourceKey: command.payload.sourceKey,
    queryText: command.payload.queryText,
    inputMode: "title",
    options: command.payload.options ?? {},
    status: "completed",
    intentSummary: intent.summary,
    focusTerms: intent.focusTerms,
    totalCount: papers.length,
    matchedCount
  });

  emit({
    id: command.id,
    type: "screening.completed",
    payload: {
      conversationId,
      totalCount: papers.length,
      matchedCount
    }
  });
}

async function handleCommand(command: AgentCommand) {
  switch (command.type) {
    case "workspace.open":
      await handleWorkspaceOpen(command);
      break;
    case "sources.import_seed":
      await handleSourcesImportSeed(command);
      break;
    case "sources.list":
      await handleSourcesList(command);
      break;
    case "conversation.list":
      await handleConversationList(command);
      break;
    case "conversation.get":
      await handleConversationGet(command);
      break;
    case "screening.start":
      await handleScreeningStart(command);
      break;
    case "screening.results.get":
      await handleScreeningResultsGet(command);
      break;
    case "agent.stop":
      workspaceStorage?.db.close();
      process.exit(0);
      break;
    default:
      throw new Error(`Unsupported agent command: ${(command as AgentCommand).type}`);
  }
}

function parseCommandLine(line: string) {
  const parsed = JSON.parse(line) as AgentCommand;
  if (!parsed.id || !parsed.type) {
    throw new Error("Agent command must include id and type.");
  }

  return parsed;
}

async function main() {
  emit({
    type: "agent.ready",
    payload: {
      runtime: RUNTIME_NAME,
      version: RUNTIME_VERSION
    }
  });

  let buffer = "";
  stdin.setEncoding("utf8");
  for await (const chunk of stdin) {
    buffer += chunk;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) {
        continue;
      }

      let command: AgentCommand | undefined;
      try {
        command = parseCommandLine(trimmedLine);
        await handleCommand(command);
      } catch (error) {
        emitError(command?.id, error);
      }
    }
  }
}

void main().catch((error) => {
  emitError(undefined, error);
  process.exit(1);
});
