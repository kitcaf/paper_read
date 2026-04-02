import { Hono } from "hono";

import { paperRouter } from "../modules/papers/papers.router.js";
import { screeningRouter } from "../modules/screening/screening.router.js";
import { sourceRouter } from "../modules/sources/sources.router.js";
import { healthRouter } from "./health/health.router.js";

export function createApiApp() {
  const apiApp = new Hono();

  apiApp.route("/health", healthRouter);
  apiApp.route("/sources", sourceRouter);
  apiApp.route("/papers", paperRouter);
  apiApp.route("/screening", screeningRouter);

  return apiApp;
}
