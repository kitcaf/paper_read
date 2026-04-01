import type { FastifyInstance } from "fastify";

import { registerAgentRoutes } from "../modules/agent/agent.route.js";
import { registerPaperRoutes } from "../modules/papers/papers.route.js";
import { registerProjectRoutes } from "../modules/projects/projects.route.js";
import { registerTaskRoutes } from "../modules/tasks/tasks.route.js";
import { registerHealthRoute } from "./health/health.route.js";

export async function registerRoutes(app: FastifyInstance) {
  await registerHealthRoute(app);
  await registerAgentRoutes(app);
  await registerProjectRoutes(app);
  await registerPaperRoutes(app);
  await registerTaskRoutes(app);
}
