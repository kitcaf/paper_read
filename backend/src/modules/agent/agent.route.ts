import type { FastifyInstance } from "fastify";

import { getAgentCapabilities, runAgentCycle } from "./agent.service.js";

export async function registerAgentRoutes(app: FastifyInstance) {
  app.get("/agent", async () => {
    return getAgentCapabilities();
  });

  app.post("/agent/run-cycle", async () => {
    return runAgentCycle();
  });
}
