import { Hono } from "hono";

export const healthRouter = new Hono().get("/", (context) => {
  return context.json({
      status: "ok",
      service: "paper-read-backend",
      timestamp: new Date().toISOString()
  });
});
