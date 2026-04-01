import { recordCheckpoint } from "../services/checkpoint.service.js";
import type { WorkflowContext } from "../core/job.js";

export async function loadProjectContextStep(context: WorkflowContext) {
  await recordCheckpoint(context, "loadProjectContext");

  return {
    ...context,
    events: [...context.events, "Loaded project context"],
    metadata: {
      ...context.metadata,
      projectName: "LLM Paper Screening"
    }
  };
}
