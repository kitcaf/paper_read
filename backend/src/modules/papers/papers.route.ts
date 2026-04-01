import type { FastifyInstance } from "fastify";

import { listPapers } from "./papers.service.js";

export async function registerPaperRoutes(app: FastifyInstance) {
  app.get("/papers", async () => {
    return {
      items: await listPapers()
    };
  });
}
