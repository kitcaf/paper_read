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
