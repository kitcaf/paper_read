import type { WorkflowContext } from "./job.js";

export type WorkflowStep = (context: WorkflowContext) => Promise<WorkflowContext>;

export async function runWorkflow(
  workflowName: string,
  steps: WorkflowStep[],
  context: WorkflowContext
) {
  let currentContext: WorkflowContext = {
    ...context,
    metadata: {
      ...context.metadata,
      workflowName
    }
  };

  for (const step of steps) {
    currentContext = await step(currentContext);
  }

  return currentContext;
}
