import type { JobRecord } from "../core/job.js";

let hasReturnedDemoJob = false;

export async function claimNextJob(): Promise<JobRecord | null> {
  if (hasReturnedDemoJob) {
    return null;
  }

  hasReturnedDemoJob = true;

  return {
    id: "task-001",
    projectId: "demo-project",
    kind: "screening",
    paperId: "paper-001",
    status: "queued",
    payload: {}
  };
}
