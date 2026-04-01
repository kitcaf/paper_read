import { Pool } from "pg";

import { env } from "../config/env.js";

export function createDbPool() {
  return new Pool({
    connectionString: env.DATABASE_URL
  });
}
