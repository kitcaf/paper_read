import type { Hono } from "hono";
import { cors } from "hono/cors";

export function registerAppMiddleware(app: Hono) {
  app.use("/api/*", cors());
}
