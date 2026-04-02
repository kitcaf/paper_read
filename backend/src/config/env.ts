import { fileURLToPath } from "node:url";

import { config } from "dotenv";
import { z } from "zod";

config({
  path: fileURLToPath(new URL("../../.env", import.meta.url))
});

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  BACKEND_HOST: z.string().default("0.0.0.0"),
  BACKEND_PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().trim().optional(),
  POSTGRES_HOST: z.string().default("localhost"),
  POSTGRES_PORT: z.coerce.number().int().positive().default(5432),
  POSTGRES_DATABASE: z.string().default("paper_read"),
  POSTGRES_USER: z.string().default("postgres"),
  POSTGRES_PASSWORD: z.string().default(""),
  STORAGE_ROOT: z.string().default("./storage"),
  LLM_BASE_URL: z.string().default("https://api.openai.com/v1"),
  LLM_API_KEY: z.string().optional(),
  AGENT_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(3000)
});

function buildDatabaseUrl(parsedEnv: z.infer<typeof envSchema>) {
  if (parsedEnv.DATABASE_URL) {
    return parsedEnv.DATABASE_URL;
  }

  const databaseUrl = new URL("postgresql://localhost");
  databaseUrl.hostname = parsedEnv.POSTGRES_HOST;
  databaseUrl.port = String(parsedEnv.POSTGRES_PORT);
  databaseUrl.pathname = `/${parsedEnv.POSTGRES_DATABASE}`;
  databaseUrl.username = parsedEnv.POSTGRES_USER;
  if (parsedEnv.POSTGRES_PASSWORD) {
    databaseUrl.password = parsedEnv.POSTGRES_PASSWORD;
  }

  return databaseUrl.toString();
}

const parsedEnv = envSchema.parse(process.env);

export const env = {
  ...parsedEnv,
  DATABASE_URL: buildDatabaseUrl(parsedEnv)
};
