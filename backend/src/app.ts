import { Hono } from "hono";
import { ZodError } from "zod";

import { registerAppMiddleware } from "./middleware/index.js";
import { logger } from "./lib/logger.js";
import { createApiApp } from "./routes/index.js";

export function createApp() {
  const app = new Hono();

  registerAppMiddleware(app);

  app.get("/", (context) => {
    return context.json({
      service: "paper-read-backend",
      framework: "hono",
      runtime: "bun",
      apiBasePath: "/api"
    });
  });

  app.route("/api", createApiApp());

  app.notFound((context) => {
    return context.json(
      {
        message: `Route ${context.req.method} ${context.req.path} not found`
      },
      404
    );
  });

  app.onError((error, context) => {
    if (error instanceof ZodError) {
      return context.json(
        {
          message: "Invalid request payload",
          issues: error.issues
        },
        400
      );
    }

    logger.error(
      {
        error,
        method: context.req.method,
        path: context.req.path
      },
      "Unhandled backend error"
    );

    return context.json(
      {
        message: "Internal server error"
      },
      500
    );
  });

  return app;
}
