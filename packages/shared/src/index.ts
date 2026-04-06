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
  | AgentCommandWithPayload<
      "screening.start",
      {
        sourceKey: string;
        queryText: string;
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
  | "conversation.listed"
  | "conversation.loaded"
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
  | AgentEventBase<"conversation.listed", { conversations: LocalConversationSummary[] }>
  | AgentEventBase<
      "conversation.loaded",
      { conversation: LocalConversationSummary; messages: LocalMessageRecord[] }
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
