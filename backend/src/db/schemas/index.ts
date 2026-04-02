import { getDbPool } from "../client.js";

const schemaStatements = [
  `
    CREATE TABLE IF NOT EXISTS papers (
      id TEXT PRIMARY KEY,
      source_key TEXT NOT NULL,
      source_paper_id TEXT,
      title TEXT NOT NULL,
      abstract TEXT,
      authors JSONB NOT NULL DEFAULT '[]'::jsonb,
      venue TEXT,
      year INT,
      paper_url TEXT,
      options JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `,
  `
    CREATE INDEX IF NOT EXISTS idx_papers_source_key ON papers (source_key);
  `,
  `
    CREATE TABLE IF NOT EXISTS screening_queries (
      id TEXT PRIMARY KEY,
      source_key TEXT NOT NULL,
      query_title TEXT NOT NULL,
      query_text TEXT NOT NULL,
      input_mode TEXT NOT NULL,
      status TEXT NOT NULL,
      intent_summary TEXT,
      intent_json JSONB,
      options JSONB NOT NULL DEFAULT '{}'::jsonb,
      total_papers INT NOT NULL DEFAULT 0,
      processed_papers INT NOT NULL DEFAULT 0,
      matched_papers INT NOT NULL DEFAULT 0,
      failed_papers INT NOT NULL DEFAULT 0,
      last_error TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMPTZ
    );
  `,
  `
    CREATE INDEX IF NOT EXISTS idx_screening_queries_source_created_at
    ON screening_queries (source_key, created_at DESC);
  `,
  `
    CREATE TABLE IF NOT EXISTS screening_results (
      id TEXT PRIMARY KEY,
      query_id TEXT NOT NULL REFERENCES screening_queries(id) ON DELETE CASCADE,
      paper_id TEXT NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
      status TEXT NOT NULL,
      decision TEXT NOT NULL,
      score NUMERIC(5, 4),
      reasoning TEXT,
      title_snapshot TEXT NOT NULL,
      abstract_snapshot TEXT,
      model_name TEXT,
      options JSONB NOT NULL DEFAULT '{}'::jsonb,
      error_message TEXT,
      processed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (query_id, paper_id)
    );
  `,
  `
    CREATE INDEX IF NOT EXISTS idx_screening_results_query_id
    ON screening_results (query_id);
  `
] as const;

export async function ensureDatabaseSchema() {
  const dbPool = getDbPool();

  for (const statement of schemaStatements) {
    await dbPool.query(statement);
  }
}
