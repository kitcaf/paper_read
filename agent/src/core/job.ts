export type JobKind = "screening" | "reading";
export type JobStatus = "queued" | "running" | "completed" | "failed";

export interface JobRecord {
  id: string;
  projectId: string;
  kind: JobKind;
  paperId?: string;
  status: JobStatus;
  payload: Record<string, unknown>;
}

export interface WorkflowContext {
  job: JobRecord;
  events: string[];
  artifacts: Record<string, string>;
  metadata: Record<string, unknown>;
}

export function createWorkflowContext(job: JobRecord): WorkflowContext {
  return {
    job,
    events: [],
    artifacts: {},
    metadata: {}
  };
}
