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
