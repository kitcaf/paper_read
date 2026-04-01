import type { FastifyInstance } from "fastify";

import { listProjects } from "./projects.service.js";

export async function registerProjectRoutes(app: FastifyInstance) {
  app.get("/projects", async () => {
    return {
      items: await listProjects()
    };
  });
}
