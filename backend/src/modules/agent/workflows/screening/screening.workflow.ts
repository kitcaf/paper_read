import { runWorkflow } from "../../core/workflow.js";
import type { WorkflowContext } from "../../core/job.js";
import { loadProjectContextStep } from "../../steps/loadProjectContext.step.js";
import { screenAbstractStep } from "../../steps/screenAbstract.step.js";

const screeningSteps = [loadProjectContextStep, screenAbstractStep];

export async function runScreeningWorkflow(context: WorkflowContext) {
  return runWorkflow("screening", screeningSteps, context);
}
