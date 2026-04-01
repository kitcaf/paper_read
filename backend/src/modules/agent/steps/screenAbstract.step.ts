import { LlmClient } from "../adapters/llm.client.js";
import { screeningPromptTemplate } from "../prompts/index.js";
import { recordCheckpoint } from "../services/checkpoint.service.js";
import type { WorkflowContext } from "../core/job.js";

const llmClient = new LlmClient();

export async function screenAbstractStep(context: WorkflowContext) {
  await recordCheckpoint(context, "screenAbstract");
  const completion = await llmClient.complete({
    prompt: screeningPromptTemplate
  });

  return {
    ...context,
    events: [...context.events, "Screened abstract"],
    metadata: {
      ...context.metadata,
      screeningResult: completion.rawText
    }
  };
}
