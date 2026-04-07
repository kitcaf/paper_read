export interface ProjectSummary {
  id: string;
  name: string;
  researchGoal: string;
  paperCount: number;
  taskCount: number;
}

export type PaperDecision = "keep" | "discard" | "pending";

export interface PaperSummary {
  id: string;
  title: string;
  decision: PaperDecision;
}

export type TaskKind = "screening" | "reading";
export type TaskStatus = "queued" | "running" | "completed" | "failed";

export interface TaskSummary {
  id: string;
  kind: TaskKind;
  status: TaskStatus;
}

export interface SourceSummary {
  sourceKey: string;
  label: string;
  paperCount: number;
  hasAbstractCount: number;
}

export interface PaperRecord {
  id: string;
  sourceKey: string;
  sourcePaperId: string | null;
  title: string;
  abstract: string | null;
  authors: string[];
  venue: string | null;
  year: number | null;
  paperUrl: string | null;
  options: Record<string, unknown>;
}

export interface PaginatedResponse<TItem> {
  items: TItem[];
  total: number;
  page: number;
  pageSize: number;
}

export type ScreeningInputMode = "title" | "title_abstract";
export type ScreeningQueryStatus = "queued" | "running" | "completed" | "failed";
export type ScreeningResultStatus = "pending" | "completed" | "failed";
export type ScreeningDecision = "keep" | "discard" | "uncertain";
export type ModelProviderKind =
  | "openai-compatible"
  | "ollama"
  | "anthropic"
  | "gemini"
  | "deepseek"
  | "kimi";
export type ModelResponseFormat = "text" | "json_object";

export interface ModelProviderSettings {
  provider: ModelProviderKind;
  modelName: string;
  baseUrl?: string;
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: ModelResponseFormat;
  stream?: boolean;
}

export interface PublicModelProviderSettings
  extends Omit<ModelProviderSettings, "apiKey"> {
  hasApiKey: boolean;
}

export interface ModelProviderProfile {
  id: string;
  name: string;
  isDefault: boolean;
  settings: PublicModelProviderSettings;
  createdAt: string;
  updatedAt: string;
}

export interface ModelProviderProfileInput {
  id?: string;
  name: string;
  isDefault?: boolean;
  settings: ModelProviderSettings;
}

export interface ModelProfileTestResult {
  ok: boolean;
  provider: ModelProviderKind;
  modelName: string;
  latencyMs: number;
  message: string;
}

export interface ScreeningQueryOptions {
  threshold?: number;
  topK?: number;
  includeReasoning?: boolean;
  preferredYears?: number[];
  excludeKeywords?: string[];
  sourceFilters?: string[];
}

export interface ScreeningIntent {
  focusTerms: string[];
  excludeTerms: string[];
  summary: string;
}

export interface ScreeningQuerySummary {
  id: string;
  sourceKey: string;
  modelProfileId?: string;
  modelProfileName?: string;
  queryTitle: string;
  queryText: string;
  inputMode: ScreeningInputMode;
  status: ScreeningQueryStatus;
  totalPapers: number;
  processedPapers: number;
  matchedPapers: number;
  createdAt: string;
  completedAt: string | null;
}

export interface ScreeningQueryDetail extends ScreeningQuerySummary {
  intentSummary: string | null;
  intentJson: ScreeningIntent | null;
  options: ScreeningQueryOptions;
  failedPapers: number;
  lastError: string | null;
  updatedAt: string;
}

export interface ScreeningResultItem {
  id: string;
  queryId: string;
  paperId: string;
  status: ScreeningResultStatus;
  decision: ScreeningDecision;
  score: number | null;
  reasoning: string | null;
  titleSnapshot: string;
  abstractSnapshot: string | null;
  modelName: string | null;
  options: Record<string, unknown>;
  errorMessage: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
  paper: PaperRecord;
}

export interface ScreeningResultsSummary {
  keepCount: number;
  discardCount: number;
  uncertainCount: number;
  failedCount: number;
}

export interface ScreeningResultsPage extends PaginatedResponse<ScreeningResultItem> {
  summary: ScreeningResultsSummary;
}

export type AgentCommandType =
  | "workspace.open"
  | "sources.import_seed"
  | "sources.list"
  | "model.settings.get"
  | "model.settings.update"
  | "model.profiles.list"
  | "model.profiles.upsert"
  | "model.profiles.delete"
  | "model.profiles.set_default"
  | "model.profile.test"
  | "chat.start"
  | "screening.start"
  | "screening.results.get"
  | "conversation.list"
  | "conversation.get"
  | "agent.stop";

export interface AgentCommandBase<TType extends AgentCommandType> {
  id: string;
  type: TType;
}

export interface AgentCommandWithPayload<TType extends AgentCommandType, TPayload>
  extends AgentCommandBase<TType> {
  payload: TPayload;
}

export type AgentCommand =
  | AgentCommandWithPayload<"workspace.open", { workspacePath: string }>
  | AgentCommandBase<"sources.import_seed">
  | AgentCommandBase<"sources.list">
  | AgentCommandBase<"model.settings.get">
  | AgentCommandWithPayload<"model.settings.update", { settings: ModelProviderSettings }>
  | AgentCommandBase<"model.profiles.list">
  | AgentCommandWithPayload<"model.profiles.upsert", { profile: ModelProviderProfileInput }>
  | AgentCommandWithPayload<"model.profiles.delete", { profileId: string }>
  | AgentCommandWithPayload<"model.profiles.set_default", { profileId: string }>
  | AgentCommandWithPayload<
      "model.profile.test",
      { profileId?: string; profile?: ModelProviderProfileInput }
    >
  | AgentCommandWithPayload<
      "chat.start",
      { conversationId?: string; messageText: string; modelProfileId?: string }
    >
  | AgentCommandWithPayload<
      "screening.start",
      {
        sourceKey: string;
        queryText: string;
        modelProfileId?: string;
        options?: ScreeningQueryOptions;
      }
    >
  | AgentCommandWithPayload<"screening.results.get", { conversationId: string }>
  | AgentCommandBase<"conversation.list">
  | AgentCommandWithPayload<"conversation.get", { conversationId: string }>
  | AgentCommandBase<"agent.stop">;

export type AgentEventType =
  | "agent.ready"
  | "workspace.opened"
  | "sources.imported"
  | "sources.loaded"
  | "model.settings.loaded"
  | "model.settings.updated"
  | "model.profiles.loaded"
  | "model.profile.upserted"
  | "model.profile.deleted"
  | "model.profile.default_set"
  | "model.profile.tested"
  | "model.provider_ready"
  | "conversation.listed"
  | "conversation.loaded"
  | "chat.started"
  | "chat.delta"
  | "chat.completed"
  | "screening.started"
  | "screening.intent_analyzed"
  | "screening.paper_scored"
  | "screening.results.loaded"
  | "screening.completed"
  | "agent.error";

export interface AgentEventBase<TType extends AgentEventType, TPayload = undefined> {
  id?: string;
  type: TType;
  payload: TPayload;
}

export interface LocalConversationSummary {
  id: string;
  title: string;
  mode: "chat" | "screening";
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface LocalMessageRecord {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "tool";
  content: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface LocalScreeningResultRecord {
  id: string;
  conversationId: string;
  messageId: string;
  paperId: string;
  decision: ScreeningDecision;
  score: number;
  reasoning: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  paper: PaperRecord;
}

export type AgentEvent =
  | AgentEventBase<"agent.ready", { runtime: string; version: string }>
  | AgentEventBase<"workspace.opened", { workspacePath: string }>
  | AgentEventBase<
      "sources.imported",
      { sourceKey: string; importedCount: number; skippedCount: number }
    >
  | AgentEventBase<"sources.loaded", { sources: SourceSummary[] }>
  | AgentEventBase<"model.settings.loaded", { settings: PublicModelProviderSettings }>
  | AgentEventBase<"model.settings.updated", { settings: PublicModelProviderSettings }>
  | AgentEventBase<"model.profiles.loaded", { profiles: ModelProviderProfile[] }>
  | AgentEventBase<"model.profile.upserted", { profile: ModelProviderProfile }>
  | AgentEventBase<"model.profile.deleted", { profileId: string; profiles: ModelProviderProfile[] }>
  | AgentEventBase<"model.profile.default_set", { profile: ModelProviderProfile; profiles: ModelProviderProfile[] }>
  | AgentEventBase<"model.profile.tested", ModelProfileTestResult>
  | AgentEventBase<
      "model.provider_ready",
      {
        profileId?: string;
        profileName?: string;
        provider: ModelProviderKind;
        modelName: string;
        baseUrl?: string;
        isFallback: boolean;
      }
    >
  | AgentEventBase<"conversation.listed", { conversations: LocalConversationSummary[] }>
  | AgentEventBase<
      "conversation.loaded",
      { conversation: LocalConversationSummary; messages: LocalMessageRecord[] }
    >
  | AgentEventBase<
      "chat.started",
      {
        conversationId: string;
        modelProfileId?: string;
        modelProfileName?: string;
      }
    >
  | AgentEventBase<
      "chat.delta",
      {
        conversationId: string;
        delta: string;
      }
    >
  | AgentEventBase<
      "chat.completed",
      {
        conversationId: string;
        messageId: string;
      }
    >
  | AgentEventBase<
      "screening.started",
      { conversationId: string; messageId: string; sourceKey: string; queryText: string }
    >
  | AgentEventBase<
      "screening.intent_analyzed",
      { conversationId: string; summary: string; focusTerms: string[] }
    >
  | AgentEventBase<
      "screening.paper_scored",
      {
        conversationId: string;
        paperId: string;
        decision: ScreeningDecision;
        score: number;
        reasoning: string;
      }
    >
  | AgentEventBase<
      "screening.results.loaded",
      { conversationId: string; results: LocalScreeningResultRecord[] }
    >
  | AgentEventBase<
      "screening.completed",
      { conversationId: string; totalCount: number; matchedCount: number }
    >
  | AgentEventBase<"agent.error", { message: string; detail?: string }>;
