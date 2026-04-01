import { config } from "dotenv";
import { z } from "zod";

config({ path: "../.env" });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  BACKEND_HOST: z.string().default("0.0.0.0"),
  BACKEND_PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().default("postgresql://postgres:postgres@localhost:5432/paper_read"),
  STORAGE_ROOT: z.string().default("./storage"),
  LLM_BASE_URL: z.string().default("https://api.openai.com/v1"),
  LLM_API_KEY: z.string().optional(),
  AGENT_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(3000)
});

export const env = envSchema.parse(process.env);
