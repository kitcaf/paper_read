import { setTimeout as delay } from "node:timers/promises";

import { env } from "../config/env.js";
import { claimNextJob } from "../repositories/task.repository.js";
import { logger } from "../services/logger.js";
import { runJob } from "../services/job-runner.js";

export async function runWorkerCycle() {
  const job = await claimNextJob();

  if (!job) {
    logger.info("No pending jobs found");
    await delay(env.AGENT_POLL_INTERVAL_MS);
    return;
  }

  const result = await runJob(job);
  logger.info(
    {
      jobId: result.job.id,
      workflow: result.metadata.workflowName,
      events: result.events
    },
    "Processed job"
  );
}
