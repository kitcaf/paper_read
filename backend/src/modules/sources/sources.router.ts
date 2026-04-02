import { Hono } from "hono";

import { listSources } from "./sources.service.js";

export const sourceRouter = new Hono().get("/", async (context) => {
  return context.json({
    items: await listSources()
  });
});
