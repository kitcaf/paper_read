import { Pool } from "pg";

import { env } from "../config/env.js";

let dbPool: Pool | null = null;

export function createDbPool() {
  return new Pool({
    connectionString: env.DATABASE_URL,
    max: 10
  });
}

export function getDbPool() {
  if (dbPool) {
    return dbPool;
  }

  dbPool = createDbPool();

  return dbPool;
}
