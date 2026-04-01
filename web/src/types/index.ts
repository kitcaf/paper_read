export interface ProjectSummary {
  id: string;
  name: string;
  researchGoal: string;
  paperCount: number;
  taskCount: number;
}

export interface PaperSummary {
  id: string;
  title: string;
  decision: "keep" | "discard" | "pending";
}

export interface TaskSummary {
  id: string;
  kind: "screening" | "reading";
  status: "queued" | "running" | "completed" | "failed";
}
