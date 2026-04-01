import { logger } from "./services/logger.js";
import { runWorkerCycle } from "./runtime/worker-loop.js";

async function startWorker() {
  await runWorkerCycle();
}

startWorker().catch((error) => {
  logger.error({ error }, "Agent worker failed");
  process.exitCode = 1;
});
