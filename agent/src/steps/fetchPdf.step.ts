import { StorageClient } from "../adapters/storage.client.js";
import { recordCheckpoint } from "../services/checkpoint.service.js";
import type { WorkflowContext } from "../core/job.js";

const storageClient = new StorageClient();

export async function fetchPdfStep(context: WorkflowContext) {
  await recordCheckpoint(context, "fetchPdf");
  const pdfPath = await storageClient.resolvePath("storage/pdf/paper-001.pdf");

  return {
    ...context,
    events: [...context.events, "Fetched PDF"],
    artifacts: {
      ...context.artifacts,
      pdfPath
    }
  };
}
