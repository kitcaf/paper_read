import type { WorkflowContext } from "../core/job.js";

export async function recordCheckpoint(context: WorkflowContext, stepName: string) {
  return {
    jobId: context.job.id,
    stepName,
    recordedAt: new Date().toISOString()
  };
}
