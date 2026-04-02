import type {
  PaperRecord,
  ScreeningDecision,
  ScreeningIntent,
  ScreeningQueryDetail,
  ScreeningQueryOptions,
  ScreeningQueryStatus,
  ScreeningResultItem,
  ScreeningResultsSummary
} from "@paper-read/shared";

import { getDbPool } from "../../db/client.js";
import { paginateItems } from "../../lib/pagination.js";
import type {
  CreateScreeningQueryInput,
  ListScreeningQueriesQuery,
  ListScreeningResultsQuery
} from "./screening.schema.js";

interface ScreeningQueryRow {
  id: string;
  source_key: string;
  query_title: string;
  query_text: string;
  input_mode: "title" | "title_abstract";
  status: ScreeningQueryStatus;
  intent_summary: string | null;
  intent_json: unknown;
  options: unknown;
  total_papers: number;
  processed_papers: number;
  matched_papers: number;
  failed_papers: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

interface ScreeningResultRow {
  id: string;
  query_id: string;
  paper_id: string;
  status: "pending" | "completed" | "failed";
  decision: ScreeningDecision;
  score: string | null;
  reasoning: string | null;
  title_snapshot: string;
  abstract_snapshot: string | null;
  model_name: string | null;
  options: unknown;
  error_message: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
  paper_source_key: string;
  paper_source_paper_id: string | null;
  paper_title: string;
  paper_abstract: string | null;
  paper_authors: unknown;
  paper_venue: string | null;
  paper_year: number | null;
  paper_paper_url: string | null;
  paper_options: unknown;
}

interface SummaryRow {
  keep_count: string;
  discard_count: string;
  uncertain_count: string;
  failed_count: string;
}

function nowIso() {
  return new Date().toISOString();
}

function toObjectRecord(value: unknown) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function toStringArray(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}

function mapScreeningQueryRow(row: ScreeningQueryRow): ScreeningQueryDetail {
  return {
    id: row.id,
    sourceKey: row.source_key,
    queryTitle: row.query_title,
    queryText: row.query_text,
    inputMode: row.input_mode,
    status: row.status,
    intentSummary: row.intent_summary,
    intentJson:
      row.intent_json && typeof row.intent_json === "object" && !Array.isArray(row.intent_json)
        ? (row.intent_json as ScreeningIntent)
        : null,
    options: toObjectRecord(row.options) as ScreeningQueryOptions,
    totalPapers: row.total_papers,
    processedPapers: row.processed_papers,
    matchedPapers: row.matched_papers,
    failedPapers: row.failed_papers,
    lastError: row.last_error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at
  };
}

function mapPaperFields(row: ScreeningResultRow): PaperRecord {
  return {
    id: row.paper_id,
    sourceKey: row.paper_source_key,
    sourcePaperId: row.paper_source_paper_id,
    title: row.paper_title,
    abstract: row.paper_abstract,
    authors: toStringArray(row.paper_authors),
    venue: row.paper_venue,
    year: row.paper_year,
    paperUrl: row.paper_paper_url,
    options: toObjectRecord(row.paper_options)
  };
}

function mapScreeningResultRow(row: ScreeningResultRow): ScreeningResultItem {
  return {
    id: row.id,
    queryId: row.query_id,
    paperId: row.paper_id,
    status: row.status,
    decision: row.decision,
    score: row.score === null ? null : Number(row.score),
    reasoning: row.reasoning,
    titleSnapshot: row.title_snapshot,
    abstractSnapshot: row.abstract_snapshot,
    modelName: row.model_name,
    options: toObjectRecord(row.options),
    errorMessage: row.error_message,
    processedAt: row.processed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    paper: mapPaperFields(row)
  };
}

function buildQueryTitle(queryText: string) {
  const trimmedQueryText = queryText.trim();
  if (trimmedQueryText.length <= 64) {
    return trimmedQueryText;
  }

  return `${trimmedQueryText.slice(0, 61)}...`;
}

function buildListQueriesWhereClause(query: ListScreeningQueriesQuery) {
  const values: string[] = [];
  const conditions: string[] = [];

  if (query.sourceKey) {
    values.push(query.sourceKey);
    conditions.push(`source_key = $${values.length}`);
  }

  if (query.status) {
    values.push(query.status);
    conditions.push(`status = $${values.length}`);
  }

  return {
    values,
    whereClause: conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""
  };
}

function buildResultsOrderClause(
  sortBy: ListScreeningResultsQuery["sortBy"],
  sortOrder: ListScreeningResultsQuery["sortOrder"]
) {
  const direction = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

  if (sortBy === "title") {
    return `ORDER BY sr.title_snapshot ${direction}`;
  }

  if (sortBy === "processedAt") {
    return `ORDER BY sr.processed_at ${direction} NULLS LAST`;
  }

  return `ORDER BY sr.score ${direction} NULLS LAST`;
}

function buildResultsFilters(queryId: string, query: ListScreeningResultsQuery) {
  const values: string[] = [queryId];
  const conditions = ["sr.query_id = $1"];

  if (query.status) {
    values.push(query.status);
    conditions.push(`sr.status = $${values.length}`);
  }

  if (query.decision) {
    values.push(query.decision);
    conditions.push(`sr.decision = $${values.length}`);
  }

  return {
    values,
    whereClause: `WHERE ${conditions.join(" AND ")}`
  };
}

export async function createScreeningQueryRecord(
  input: CreateScreeningQueryInput
): Promise<ScreeningQueryDetail> {
  const dbPool = getDbPool();
  const timestamp = nowIso();
  const queryId = crypto.randomUUID();
  const result = await dbPool.query<ScreeningQueryRow>(
    `
      INSERT INTO screening_queries (
        id,
        source_key,
        query_title,
        query_text,
        input_mode,
        status,
        intent_summary,
        intent_json,
        options,
        total_papers,
        processed_papers,
        matched_papers,
        failed_papers,
        last_error,
        created_at,
        updated_at,
        completed_at
      )
      VALUES (
        $1, $2, $3, $4, $5, 'queued', NULL, NULL, $6::jsonb, 0, 0, 0, 0, NULL, $7, $7, NULL
      )
      RETURNING *
    `,
    [
      queryId,
      input.sourceKey,
      buildQueryTitle(input.queryText),
      input.queryText,
      input.inputMode,
      JSON.stringify({
        includeReasoning: true,
        ...input.options
      }),
      timestamp
    ]
  );

  return mapScreeningQueryRow(result.rows[0]);
}

export async function listScreeningQueriesFromStore(query: ListScreeningQueriesQuery) {
  const dbPool = getDbPool();
  const { values, whereClause } = buildListQueriesWhereClause(query);
  const result = await dbPool.query<ScreeningQueryRow>(
    `
      SELECT *
      FROM screening_queries
      ${whereClause}
      ORDER BY created_at DESC
    `,
    values
  );

  return paginateItems(result.rows.map(mapScreeningQueryRow), query);
}

export async function getScreeningQueryFromStore(queryId: string) {
  const dbPool = getDbPool();
  const result = await dbPool.query<ScreeningQueryRow>(
    "SELECT * FROM screening_queries WHERE id = $1 LIMIT 1",
    [queryId]
  );

  return result.rows[0] ? mapScreeningQueryRow(result.rows[0]) : null;
}

export async function updateScreeningQueryFromStore(
  queryId: string,
  update: Partial<Omit<ScreeningQueryDetail, "id" | "createdAt">>
) {
  const currentQuery = await getScreeningQueryFromStore(queryId);
  if (!currentQuery) {
    return null;
  }

  const dbPool = getDbPool();
  const nextRecord = {
    ...currentQuery,
    ...update,
    updatedAt: nowIso()
  };

  const result = await dbPool.query<ScreeningQueryRow>(
    `
      UPDATE screening_queries
      SET
        source_key = $2,
        query_title = $3,
        query_text = $4,
        input_mode = $5,
        status = $6,
        intent_summary = $7,
        intent_json = $8::jsonb,
        options = $9::jsonb,
        total_papers = $10,
        processed_papers = $11,
        matched_papers = $12,
        failed_papers = $13,
        last_error = $14,
        updated_at = $15,
        completed_at = $16
      WHERE id = $1
      RETURNING *
    `,
    [
      queryId,
      nextRecord.sourceKey,
      nextRecord.queryTitle,
      nextRecord.queryText,
      nextRecord.inputMode,
      nextRecord.status,
      nextRecord.intentSummary,
      nextRecord.intentJson ? JSON.stringify(nextRecord.intentJson) : null,
      JSON.stringify(nextRecord.options ?? {}),
      nextRecord.totalPapers,
      nextRecord.processedPapers,
      nextRecord.matchedPapers,
      nextRecord.failedPapers,
      nextRecord.lastError,
      nextRecord.updatedAt,
      nextRecord.completedAt
    ]
  );

  return mapScreeningQueryRow(result.rows[0]);
}

export async function setScreeningIntent(
  queryId: string,
  intent: ScreeningIntent,
  totalPapers: number
) {
  return updateScreeningQueryFromStore(queryId, {
    intentSummary: intent.summary,
    intentJson: intent,
    totalPapers
  });
}

export async function initializeScreeningResults(queryId: string, papers: PaperRecord[]) {
  if (!papers.length) {
    return;
  }

  const dbPool = getDbPool();
  const timestamp = nowIso();

  for (const paper of papers) {
    await dbPool.query(
      `
        INSERT INTO screening_results (
          id,
          query_id,
          paper_id,
          status,
          decision,
          score,
          reasoning,
          title_snapshot,
          abstract_snapshot,
          model_name,
          options,
          error_message,
          processed_at,
          created_at,
          updated_at
        )
        VALUES (
          $1, $2, $3, 'pending', 'uncertain', NULL, 'Queued for screening.', $4, $5, NULL, '{}'::jsonb, NULL, NULL, $6, $6
        )
        ON CONFLICT (query_id, paper_id) DO NOTHING
      `,
      [crypto.randomUUID(), queryId, paper.id, paper.title, paper.abstract, timestamp]
    );
  }
}

export async function updateScreeningResult(
  queryId: string,
  paperId: string,
  update: Partial<Omit<ScreeningResultItem, "id" | "queryId" | "paperId" | "paper" | "createdAt">>
) {
  const dbPool = getDbPool();
  const nextUpdatedAt = nowIso();
  const currentResult = await dbPool.query<{ id: string }>(
    "SELECT id FROM screening_results WHERE query_id = $1 AND paper_id = $2 LIMIT 1",
    [queryId, paperId]
  );

  if (!currentResult.rows[0]) {
    return null;
  }

  await dbPool.query(
    `
      UPDATE screening_results
      SET
        status = COALESCE($3, status),
        decision = COALESCE($4, decision),
        score = COALESCE($5, score),
        reasoning = CASE WHEN $6::text IS NULL THEN reasoning ELSE $6 END,
        title_snapshot = COALESCE($7, title_snapshot),
        abstract_snapshot = CASE WHEN $8::text IS NULL THEN abstract_snapshot ELSE $8 END,
        model_name = CASE WHEN $9::text IS NULL THEN model_name ELSE $9 END,
        options = COALESCE($10::jsonb, options),
        error_message = CASE WHEN $11::text IS NULL THEN error_message ELSE $11 END,
        processed_at = COALESCE($12::timestamptz, processed_at),
        updated_at = $13
      WHERE query_id = $1 AND paper_id = $2
    `,
    [
      queryId,
      paperId,
      update.status ?? null,
      update.decision ?? null,
      update.score ?? null,
      update.reasoning ?? null,
      update.titleSnapshot ?? null,
      update.abstractSnapshot ?? null,
      update.modelName ?? null,
      update.options ? JSON.stringify(update.options) : null,
      update.errorMessage ?? null,
      update.processedAt ?? null,
      nextUpdatedAt
    ]
  );

  return currentResult.rows[0];
}

export async function getScreeningResultsSummary(
  queryId: string
): Promise<ScreeningResultsSummary> {
  const dbPool = getDbPool();
  const result = await dbPool.query<SummaryRow>(
    `
      SELECT
        COUNT(*) FILTER (WHERE status = 'completed' AND decision = 'keep')::text AS keep_count,
        COUNT(*) FILTER (WHERE status = 'completed' AND decision = 'discard')::text AS discard_count,
        COUNT(*) FILTER (WHERE status = 'completed' AND decision = 'uncertain')::text AS uncertain_count,
        COUNT(*) FILTER (WHERE status = 'failed')::text AS failed_count
      FROM screening_results
      WHERE query_id = $1
    `,
    [queryId]
  );

  const row = result.rows[0];

  return {
    keepCount: Number(row?.keep_count ?? 0),
    discardCount: Number(row?.discard_count ?? 0),
    uncertainCount: Number(row?.uncertain_count ?? 0),
    failedCount: Number(row?.failed_count ?? 0)
  };
}

export async function listScreeningResultsFromStore(
  queryId: string,
  query: ListScreeningResultsQuery
) {
  const dbPool = getDbPool();
  const { values, whereClause } = buildResultsFilters(queryId, query);
  const result = await dbPool.query<ScreeningResultRow>(
    `
      SELECT
        sr.id,
        sr.query_id,
        sr.paper_id,
        sr.status,
        sr.decision,
        sr.score::text,
        sr.reasoning,
        sr.title_snapshot,
        sr.abstract_snapshot,
        sr.model_name,
        sr.options,
        sr.error_message,
        sr.processed_at::text,
        sr.created_at::text,
        sr.updated_at::text,
        p.source_key AS paper_source_key,
        p.source_paper_id AS paper_source_paper_id,
        p.title AS paper_title,
        p.abstract AS paper_abstract,
        p.authors AS paper_authors,
        p.venue AS paper_venue,
        p.year AS paper_year,
        p.paper_url AS paper_paper_url,
        p.options AS paper_options
      FROM screening_results sr
      INNER JOIN papers p ON p.id = sr.paper_id
      ${whereClause}
      ${buildResultsOrderClause(query.sortBy, query.sortOrder)}
    `,
    values
  );

  const items = result.rows.map(mapScreeningResultRow);
  const summary = await getScreeningResultsSummary(queryId);

  return {
    ...paginateItems(items, query),
    summary
  };
}

export async function countMatchingResults(queryId: string) {
  return (await getScreeningResultsSummary(queryId)).keepCount;
}

export async function finalizeScreeningQuery(
  queryId: string,
  status: ScreeningQueryStatus,
  lastError: string | null
) {
  return updateScreeningQueryFromStore(queryId, {
    status,
    completedAt: status === "completed" ? nowIso() : null,
    lastError
  });
}

export async function applyTopKToResults(queryId: string, topK: number) {
  if (topK <= 0) {
    return;
  }

  const dbPool = getDbPool();
  const result = await dbPool.query<{ paper_id: string; reasoning: string | null }>(
    `
      SELECT paper_id, reasoning
      FROM screening_results
      WHERE query_id = $1 AND status = 'completed'
      ORDER BY score DESC NULLS LAST
    `,
    [queryId]
  );

  for (const [index, row] of result.rows.entries()) {
    if (index < topK) {
      continue;
    }

    await dbPool.query(
      `
        UPDATE screening_results
        SET
          decision = 'discard',
          reasoning = $3,
          updated_at = $4
        WHERE query_id = $1 AND paper_id = $2
      `,
      [
        queryId,
        row.paper_id,
        `${row.reasoning ?? "Screened by the rule-based agent."} Discarded because it fell outside the configured topK window.`,
        nowIso()
      ]
    );
  }
}

export async function updateProgressCounters(
  queryId: string,
  processedPapers: number,
  matchedPapers: number,
  failedPapers: number
) {
  return updateScreeningQueryFromStore(queryId, {
    processedPapers,
    matchedPapers,
    failedPapers
  });
}
