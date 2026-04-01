import Fastify from "fastify";

import { registerAppPlugins } from "./plugins/index.js";
import { registerRoutes } from "./routes/index.js";

export async function buildServer() {
  const app = Fastify({
    logger: false
  });

  await registerAppPlugins(app);
  await registerRoutes(app);

  return app;
}
