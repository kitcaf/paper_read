import { createWorkflowContext, type JobRecord } from "../core/job.js";
import { runReadingWorkflow } from "../workflows/reading/reading.workflow.js";
import { runScreeningWorkflow } from "../workflows/screening/screening.workflow.js";

export async function runJob(job: JobRecord) {
  const context = createWorkflowContext(job);
  context.metadata.workflowName = job.kind;

  if (job.kind === "screening") {
    return runScreeningWorkflow(context);
  }

  return runReadingWorkflow(context);
}
