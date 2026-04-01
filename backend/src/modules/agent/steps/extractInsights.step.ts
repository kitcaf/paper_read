import { LlmClient } from "../adapters/llm.client.js";
import { readingPromptTemplate } from "../prompts/index.js";
import { recordCheckpoint } from "../services/checkpoint.service.js";
import type { WorkflowContext } from "../core/job.js";

const llmClient = new LlmClient();

export async function extractInsightsStep(context: WorkflowContext) {
  await recordCheckpoint(context, "extractInsights");
  const completion = await llmClient.complete({
    prompt: readingPromptTemplate
  });

  return {
    ...context,
    events: [...context.events, "Extracted reading insights"],
    metadata: {
      ...context.metadata,
      readingResult: completion.rawText
    }
  };
}
