import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { getDbPool } from "./db/client.js";
import { ensureDatabaseSchema } from "./db/schemas/index.js";
import { logger } from "./lib/logger.js";

async function startServer() {
  const dbPool = getDbPool();
  await dbPool.query("SELECT 1");
  await ensureDatabaseSchema();

  const app = createApp();

  Bun.serve({
    hostname: env.BACKEND_HOST,
    port: env.BACKEND_PORT,
    fetch: app.fetch
  });

  logger.info(
    {
      host: env.BACKEND_HOST,
      port: env.BACKEND_PORT,
      framework: "hono",
      runtime: "bun"
    },
    "Backend server listening"
  );
}

startServer().catch((error) => {
  logger.error({ error }, "Failed to start backend server");
  process.exitCode = 1;
});
