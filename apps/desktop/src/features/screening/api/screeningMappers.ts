import type {
  LocalConversationSummary,
  LocalMessageRecord,
  LocalScreeningResultRecord,
  PaginatedResponse,
  ScreeningDecision,
  ScreeningIntent,
  ScreeningQueryDetail,
  ScreeningQueryOptions,
  ScreeningQueryStatus,
  ScreeningResultItem,
  ScreeningResultsPage
} from "@paper-read/shared";

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

export function mapConversationToScreeningSummary(
  conversation: LocalConversationSummary
): ScreeningQueryDetail {
  const metadata = conversation.metadata ?? {};
  const status = normalizeStatus(metadata.status);
  const totalPapers = readNumber(metadata.totalCount);
  const matchedPapers = readNumber(metadata.matchedCount);
  const failedPapers = readNumber(metadata.failedCount);

  return {
    id: conversation.id,
    sourceKey: readString(metadata.sourceKey, "local"),
    modelProfileId: readString(metadata.modelProfileId) || undefined,
    modelProfileName: readString(metadata.modelProfileName) || undefined,
    queryTitle: conversation.title,
    queryText: readString(metadata.queryText, conversation.title),
    inputMode: "title",
    status,
    totalPapers,
    processedPapers: status === "completed" ? totalPapers : readNumber(metadata.processedCount),
    matchedPapers,
    failedPapers,
    intentSummary: readString(metadata.intentSummary) || null,
    intentJson: metadata.focusTerms
      ? {
          focusTerms: readStringArray(metadata.focusTerms),
          excludeTerms: [],
          summary: readString(metadata.intentSummary)
        }
      : null,
    options: readOptions(metadata.options),
    lastError: readString(metadata.lastError) || null,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    completedAt: status === "completed" ? conversation.updatedAt : null
  };
}

export function mapConversationDetail(
  conversation: LocalConversationSummary,
  messages: LocalMessageRecord[]
): ScreeningQueryDetail {
  const summary = mapConversationToScreeningSummary(conversation);
  const intent = buildIntentFromMessages(messages);

  return {
    ...summary,
    intentSummary: intent?.summary || summary.intentSummary,
    intentJson: intent ?? summary.intentJson
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
): PaginatedResponse<ScreeningQueryDetail> {
  const items = conversations.map(mapConversationToScreeningSummary);

  return {
    items,
    total: items.length,
    page: DEFAULT_PAGE,
    pageSize: DEFAULT_PAGE_SIZE
  };
}
