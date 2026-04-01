import { buildServer } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";

async function startServer() {
  const app = await buildServer();

  await app.listen({
    host: env.BACKEND_HOST,
    port: env.BACKEND_PORT
  });

  logger.info(
    {
      host: env.BACKEND_HOST,
      port: env.BACKEND_PORT
    },
    "Backend server listening"
  );
}

startServer().catch((error) => {
  logger.error({ error }, "Failed to start backend server");
  process.exitCode = 1;
});
