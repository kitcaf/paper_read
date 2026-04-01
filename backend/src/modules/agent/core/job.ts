import type { TaskKind, TaskStatus } from "@paper-read/shared";

export type JobKind = TaskKind;
export type JobStatus = TaskStatus;

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
