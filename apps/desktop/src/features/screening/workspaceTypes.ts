import type {
  LocalMessageRecord,
  ScreeningIntent,
  ScreeningQueryOptions,
  ScreeningQueryStatus
} from "@paper-read/shared";

export type WorkspaceConversationMode = "chat" | "screening";

export interface WorkspaceConversationSummary {
  id: string;
  title: string;
  preview: string;
  mode: WorkspaceConversationMode;
  sourceKey?: string;
  sourceLabel?: string;
  status: ScreeningQueryStatus;
  modelProfileId?: string;
  modelProfileName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceConversationDetail extends WorkspaceConversationSummary {
  queryText: string;
  messages: LocalMessageRecord[];
  options: ScreeningQueryOptions;
  intentSummary: string | null;
  intentJson: ScreeningIntent | null;
  lastError: string | null;
  totalPapers: number;
  processedPapers: number;
  matchedPapers: number;
  failedPapers: number;
  completedAt: string | null;
}
