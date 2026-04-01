import { recordCheckpoint } from "../services/checkpoint.service.js";
import type { WorkflowContext } from "../core/job.js";

export async function parsePdfStep(context: WorkflowContext) {
  await recordCheckpoint(context, "parsePdf");

  return {
    ...context,
    events: [...context.events, "Parsed PDF into markdown"],
    artifacts: {
      ...context.artifacts,
      markdownPath: "storage/markdown/paper-001.md"
    }
  };
}
