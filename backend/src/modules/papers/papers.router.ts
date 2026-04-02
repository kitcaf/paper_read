import { Hono } from "hono";

import { listPapersQuerySchema } from "./papers.schema.js";
import { listPapers } from "./papers.service.js";

export const paperRouter = new Hono().get("/", async (context) => {
  const query = listPapersQuerySchema.parse(context.req.query());

  return context.json(await listPapers(query));
});
