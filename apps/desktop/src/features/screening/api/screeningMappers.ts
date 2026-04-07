import type {
  LocalConversationSummary,
  LocalMessageRecord,
  LocalScreeningResultRecord,
  PaginatedResponse,
  ScreeningDecision,
  ScreeningIntent,
  ScreeningQueryOptions,
  ScreeningQueryStatus,
  ScreeningResultItem,
  ScreeningResultsPage
} from "@paper-read/shared";
import type {
  WorkspaceConversationDetail,
  WorkspaceConversationSummary
} from "../workspaceTypes";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 50;

function readString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function readNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function readStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function readOptions(value: unknown): ScreeningQueryOptions {
  return value && typeof value === "object" ? (value as ScreeningQueryOptions) : {};
}

function normalizeStatus(value: unknown): ScreeningQueryStatus {
  return value === "queued" || value === "running" || value === "completed" || value === "failed"
    ? value
    : "completed";
}

function findIntentMessage(messages: LocalMessageRecord[]) {
  return messages.find((message) => message.metadata.step === "intent_analyzed");
}

function buildIntentFromMessages(messages: LocalMessageRecord[]): ScreeningIntent | null {
  const intentMessage = findIntentMessage(messages);
  if (!intentMessage) {
    return null;
  }

  return {
    focusTerms: readStringArray(intentMessage.metadata.focusTerms),
    excludeTerms: [],
    summary: readString(intentMessage.metadata.summary)
  };
}

export function mapConversationToWorkspaceSummary(
  conversation: LocalConversationSummary
): WorkspaceConversationSummary {
  const metadata = conversation.metadata ?? {};
  const mode = conversation.mode;
  const isScreeningConversation = mode === "screening";
  const status = normalizeStatus(metadata.status);

  return {
    id: conversation.id,
    title: conversation.title,
    preview: readString(
      metadata.lastUserMessage,
      readString(metadata.queryText, conversation.title)
    ),
    mode,
    sourceKey: isScreeningConversation ? readString(metadata.sourceKey, "local") : undefined,
    sourceLabel: isScreeningConversation
      ? readString(metadata.sourceKey, "local").toUpperCase().replaceAll("_", " ")
      : "自由聊天",
    status,
    modelProfileId: readString(metadata.modelProfileId) || undefined,
    modelProfileName: readString(metadata.modelProfileName) || undefined,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt
  };
}

export function mapConversationDetail(
  conversation: LocalConversationSummary,
  messages: LocalMessageRecord[]
): WorkspaceConversationDetail {
  const summary = mapConversationToWorkspaceSummary(conversation);
  const metadata = conversation.metadata ?? {};
  const intent = conversation.mode === "screening" ? buildIntentFromMessages(messages) : null;
  const totalPapers = readNumber(metadata.totalCount);
  const matchedPapers = readNumber(metadata.matchedCount);
  const failedPapers = readNumber(metadata.failedCount);

  return {
    ...summary,
    queryText: readString(
      metadata.queryText,
      messages.filter((message) => message.role === "user").at(-1)?.content ?? summary.preview
    ),
    modelProfileId: readString(metadata.modelProfileId) || undefined,
    modelProfileName: readString(metadata.modelProfileName) || undefined,
    messages,
    options: readOptions(metadata.options),
    intentSummary: intent?.summary ?? (readString(metadata.intentSummary) || null),
    intentJson: intent,
    lastError: readString(metadata.lastError) || null,
    totalPapers,
    processedPapers: summary.status === "completed" ? totalPapers : readNumber(metadata.processedCount),
    matchedPapers,
    failedPapers,
    completedAt: summary.status === "completed" ? conversation.updatedAt : null
  };
}

function mapLocalResult(result: LocalScreeningResultRecord): ScreeningResultItem {
  return {
    id: result.id,
    queryId: result.conversationId,
    paperId: result.paperId,
    status: "completed",
    decision: result.decision,
    score: result.score,
    reasoning: result.reasoning,
    titleSnapshot: result.paper.title,
    abstractSnapshot: result.paper.abstract,
    modelName: "local-title-screening",
    options: result.metadata,
    errorMessage: null,
    processedAt: result.createdAt,
    createdAt: result.createdAt,
    updatedAt: result.createdAt,
    paper: result.paper
  };
}

export function mapLocalResultsPage(results: LocalScreeningResultRecord[]): ScreeningResultsPage {
  const items = results.map(mapLocalResult);
  const countDecision = (decision: ScreeningDecision) =>
    items.filter((item) => item.decision === decision).length;

  return {
    items,
    total: items.length,
    page: DEFAULT_PAGE,
    pageSize: DEFAULT_PAGE_SIZE,
    summary: {
      keepCount: countDecision("keep"),
      discardCount: countDecision("discard"),
      uncertainCount: countDecision("uncertain"),
      failedCount: 0
    }
  };
}

export function mapConversationsPage(
  conversations: LocalConversationSummary[]
): PaginatedResponse<WorkspaceConversationSummary> {
  const items = conversations.map(mapConversationToWorkspaceSummary);

  return {
    items,
    total: items.length,
    page: DEFAULT_PAGE,
    pageSize: DEFAULT_PAGE_SIZE
  };
}
