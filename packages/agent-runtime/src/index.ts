import type { AgentCommand, AgentEvent } from "@paper-read/shared";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { stdin } from "node:process";

import { generateChatReply } from "./chat";
import { toPublicModelProviderSettings } from "./models/config";
import { createModelRuntime } from "./models/registry";
import { testModelConnection } from "./models/testConnection";
import { analyzeIntentWithModel, scorePaperWithModel } from "./screeningModel";
import { INITIAL_PAPERS, INITIAL_SOURCE_KEY } from "./source-data/initialPapers";
import {
  createConversation,
  createMessage,
  createScreeningResult,
  deleteModelProfile,
  getModelProfileSettings,
  getModelProviderSettings,
  listModelProfiles,
  listConversations,
  listMessages,
  listPapersBySource,
  listScreeningResults,
  listSourceSummaries,
  openWorkspaceStorage,
  updateConversationMetadata,
  updateModelProviderSettings,
  setDefaultModelProfile,
  upsertModelProfile,
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

async function handleModelSettingsGet(
  command: Extract<AgentCommand, { type: "model.settings.get" }>
) {
  const { db } = getWorkspaceStorage();
  const settings = getModelProviderSettings(db);

  emit({
    id: command.id,
    type: "model.settings.loaded",
    payload: {
      settings: toPublicModelProviderSettings(settings)
    }
  });
}

async function handleModelSettingsUpdate(
  command: Extract<AgentCommand, { type: "model.settings.update" }>
) {
  const { db } = getWorkspaceStorage();
  const settings = updateModelProviderSettings(db, command.payload.settings);

  emit({
    id: command.id,
    type: "model.settings.updated",
    payload: {
      settings: toPublicModelProviderSettings(settings)
    }
  });
}

async function handleModelProfilesList(
  command: Extract<AgentCommand, { type: "model.profiles.list" }>
) {
  const { db } = getWorkspaceStorage();

  emit({
    id: command.id,
    type: "model.profiles.loaded",
    payload: {
      profiles: listModelProfiles(db)
    }
  });
}

async function handleModelProfilesUpsert(
  command: Extract<AgentCommand, { type: "model.profiles.upsert" }>
) {
  const { db } = getWorkspaceStorage();
  const profile = upsertModelProfile(db, command.payload.profile);

  emit({
    id: command.id,
    type: "model.profile.upserted",
    payload: {
      profile
    }
  });
}

async function handleModelProfilesDelete(
  command: Extract<AgentCommand, { type: "model.profiles.delete" }>
) {
  const { db } = getWorkspaceStorage();

  emit({
    id: command.id,
    type: "model.profile.deleted",
    payload: {
      profileId: command.payload.profileId,
      profiles: deleteModelProfile(db, command.payload.profileId)
    }
  });
}

async function handleModelProfilesSetDefault(
  command: Extract<AgentCommand, { type: "model.profiles.set_default" }>
) {
  const { db } = getWorkspaceStorage();
  const profile = setDefaultModelProfile(db, command.payload.profileId);

  emit({
    id: command.id,
    type: "model.profile.default_set",
    payload: {
      profile,
      profiles: listModelProfiles(db)
    }
  });
}

function createRuntimeForModelProfileTest(
  command: Extract<AgentCommand, { type: "model.profile.test" }>
) {
  const { db } = getWorkspaceStorage();
  if (!command.payload.profile) {
    return createModelRuntime(getModelProfileSettings(db, command.payload.profileId).settings);
  }

  const existingSettings = command.payload.profile.id
    ? getModelProfileSettings(db, command.payload.profile.id).settings
    : null;

  return createModelRuntime({
    ...command.payload.profile.settings,
    apiKey: command.payload.profile.settings.apiKey ?? existingSettings?.apiKey
  });
}

async function handleModelProfileTest(
  command: Extract<AgentCommand, { type: "model.profile.test" }>
) {
  const modelRuntime = createRuntimeForModelProfileTest(command);
  const result = await testModelConnection(modelRuntime);

  emit({
    id: command.id,
    type: "model.profile.tested",
    payload: result
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

async function handleChatStart(command: Extract<AgentCommand, { type: "chat.start" }>) {
  const { db } = getWorkspaceStorage();
  const selectedModelProfile = getModelProfileSettings(db, command.payload.modelProfileId);
  const modelRuntime = createModelRuntime(selectedModelProfile.settings);
  const existingConversation = command.payload.conversationId
    ? listConversations(db).find((item) => item.id === command.payload.conversationId) ?? null
    : null;

  if (existingConversation && existingConversation.mode !== "chat") {
    throw new Error("当前对话不是自由聊天模式，无法继续追加普通消息。");
  }

  const conversationId =
    existingConversation?.id ??
    createConversation(db, {
      title: command.payload.messageText.slice(0, 80),
      mode: "chat",
      metadata: {
        lastUserMessage: command.payload.messageText,
        status: "completed",
        modelProfileId: selectedModelProfile.profile.id,
        modelProfileName: selectedModelProfile.profile.name
      }
    });

  const userMessageId = createMessage(db, {
    conversationId,
    role: "user",
    content: command.payload.messageText,
    metadata: {
      modelProfileId: selectedModelProfile.profile.id,
      modelProfileName: selectedModelProfile.profile.name
    }
  });

  emit({
    id: command.id,
    type: "model.provider_ready",
    payload: {
      profileId: selectedModelProfile.profile.id,
      profileName: selectedModelProfile.profile.name,
      provider: modelRuntime.provider.kind,
      modelName: modelRuntime.settings.modelName,
      ...(modelRuntime.settings.baseUrl ? { baseUrl: modelRuntime.settings.baseUrl } : {}),
      isFallback: false
    }
  });

  const reply = await generateChatReply(modelRuntime, listMessages(db, conversationId));
  createMessage(db, {
    conversationId,
    role: "assistant",
    content: reply.content,
    metadata: {
      provider: reply.metadata.provider,
      modelName: reply.metadata.modelName,
      modelProfileId: selectedModelProfile.profile.id,
      modelProfileName: selectedModelProfile.profile.name,
      usedStreamingFallback: reply.metadata.usedStreamingFallback,
      ...(reply.metadata.streamingFallbackReason
        ? { streamingFallbackReason: reply.metadata.streamingFallbackReason }
        : {})
    }
  });

  updateConversationMetadata(db, conversationId, {
    lastUserMessage: command.payload.messageText,
    lastAssistantMessage: reply.content,
    status: "completed",
    modelProvider: modelRuntime.provider.kind,
    modelProfileId: selectedModelProfile.profile.id,
    modelProfileName: selectedModelProfile.profile.name,
    modelName: modelRuntime.settings.modelName
  });

  const conversation = listConversations(db).find((item) => item.id === conversationId);
  if (!conversation) {
    throw new Error("Chat conversation not found after generation.");
  }

  emit({
    id: command.id,
    type: "conversation.loaded",
    payload: {
      conversation,
      messages: listMessages(db, conversationId)
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
  const selectedModelProfile = getModelProfileSettings(db, command.payload.modelProfileId);
  const modelRuntime = createModelRuntime(selectedModelProfile.settings);
  const papers = listPapersBySource(db, command.payload.sourceKey);
  const conversationId = createConversation(db, {
    title: command.payload.queryText.slice(0, 80),
    mode: "screening",
    metadata: {
      sourceKey: command.payload.sourceKey,
      queryText: command.payload.queryText,
      inputMode: "title",
      modelProfileId: selectedModelProfile.profile.id,
      modelProfileName: selectedModelProfile.profile.name,
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
      modelProfileId: selectedModelProfile.profile.id,
      modelProfileName: selectedModelProfile.profile.name,
      options: command.payload.options ?? {}
    }
  });

  emit({
    id: command.id,
    type: "model.provider_ready",
    payload: {
      profileId: selectedModelProfile.profile.id,
      profileName: selectedModelProfile.profile.name,
      provider: modelRuntime.provider.kind,
      modelName: modelRuntime.settings.modelName,
      ...(modelRuntime.settings.baseUrl ? { baseUrl: modelRuntime.settings.baseUrl } : {}),
      isFallback: false
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

  const intent = await analyzeIntentWithModel(modelRuntime, command.payload.queryText);
  createMessage(db, {
    conversationId,
    role: "tool",
    content: "Intent analyzed for title-only paper screening.",
    metadata: {
      tool: "screening",
      step: "intent_analyzed",
      summary: intent.summary,
      focusTerms: intent.focusTerms,
      excludeTerms: intent.excludeTerms,
      provider: modelRuntime.provider.kind,
      modelProfileId: selectedModelProfile.profile.id,
      modelProfileName: selectedModelProfile.profile.name,
      modelName: modelRuntime.settings.modelName
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
    const scoredPaper = await scorePaperWithModel(modelRuntime, command.payload.queryText, paper);
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
        mode: "title",
        ...scoredPaper.metadata
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
    excludeTerms: intent.excludeTerms,
    totalCount: papers.length,
    matchedCount,
    modelProvider: modelRuntime.provider.kind,
    modelProfileId: selectedModelProfile.profile.id,
    modelProfileName: selectedModelProfile.profile.name,
    modelName: modelRuntime.settings.modelName
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
    case "model.settings.get":
      await handleModelSettingsGet(command);
      break;
    case "model.settings.update":
      await handleModelSettingsUpdate(command);
      break;
    case "model.profiles.list":
      await handleModelProfilesList(command);
      break;
    case "model.profiles.upsert":
      await handleModelProfilesUpsert(command);
      break;
    case "model.profiles.delete":
      await handleModelProfilesDelete(command);
      break;
    case "model.profiles.set_default":
      await handleModelProfilesSetDefault(command);
      break;
    case "model.profile.test":
      await handleModelProfileTest(command);
      break;
    case "chat.start":
      await handleChatStart(command);
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
