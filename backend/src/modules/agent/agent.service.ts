import type { TaskKind } from "@paper-read/shared";

import { runWorkerCycle } from "./runtime/worker-loop.js";

const supportedJobs: TaskKind[] = ["screening", "reading"];

export function getAgentCapabilities() {
  return {
    module: "agent",
    supportedJobs,
    executionMode: "backend-internal-module"
  };
}

export async function runAgentCycle() {
  await runWorkerCycle();

  return {
    status: "ok",
    triggeredAt: new Date().toISOString()
  };
}
