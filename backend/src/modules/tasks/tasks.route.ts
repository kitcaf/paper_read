import type { FastifyInstance } from "fastify";

import { listTasks } from "./tasks.service.js";

export async function registerTaskRoutes(app: FastifyInstance) {
  app.get("/tasks", async () => {
    return {
      items: await listTasks()
    };
  });
}
