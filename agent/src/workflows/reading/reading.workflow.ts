import { runWorkflow } from "../../core/workflow.js";
import type { WorkflowContext } from "../../core/job.js";
import { extractInsightsStep } from "../../steps/extractInsights.step.js";
import { fetchPdfStep } from "../../steps/fetchPdf.step.js";
import { loadProjectContextStep } from "../../steps/loadProjectContext.step.js";
import { parsePdfStep } from "../../steps/parsePdf.step.js";

const readingSteps = [
  loadProjectContextStep,
  fetchPdfStep,
  parsePdfStep,
  extractInsightsStep
];

export async function runReadingWorkflow(context: WorkflowContext) {
  return runWorkflow("reading", readingSteps, context);
}
