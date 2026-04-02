import type { PaperRecord, SourceSummary } from "@paper-read/shared";

import { getDbPool } from "../../db/client.js";
import { paginateItems } from "../../lib/pagination.js";
import { toSourceLabel } from "../sources/source.utils.js";
import type { ListPapersQuery } from "./papers.schema.js";

interface PaperRow {
  id: string;
  source_key: string;
  source_paper_id: string | null;
  title: string;
  abstract: string | null;
  authors: unknown;
  venue: string | null;
  year: number | null;
  paper_url: string | null;
  options: unknown;
}

interface SourceRow {
  source_key: string;
  paper_count: string;
  has_abstract_count: string;
}

function mapPaperRow(row: PaperRow): PaperRecord {
  return {
    id: row.id,
    sourceKey: row.source_key,
    sourcePaperId: row.source_paper_id,
    title: row.title,
    abstract: row.abstract,
    authors: Array.isArray(row.authors) ? row.authors.map(String) : [],
    venue: row.venue,
    year: row.year,
    paperUrl: row.paper_url,
    options:
      row.options && typeof row.options === "object" && !Array.isArray(row.options)
        ? (row.options as Record<string, unknown>)
        : {}
  };
}

function buildListPapersQuery(query: ListPapersQuery) {
  const whereClauses: string[] = [];
  const values: Array<string | number | boolean> = [];

  if (query.sourceKey) {
    values.push(query.sourceKey);
    whereClauses.push(`source_key = $${values.length}`);
  }

  if (typeof query.hasAbstract === "boolean") {
    whereClauses.push(
      query.hasAbstract
        ? "abstract IS NOT NULL AND LENGTH(TRIM(abstract)) > 0"
        : "(abstract IS NULL OR LENGTH(TRIM(abstract)) = 0)"
    );
  }

  if (query.search?.trim()) {
    values.push(`%${query.search.trim().toLowerCase()}%`);
    whereClauses.push(`(LOWER(title) LIKE $${values.length} OR LOWER(COALESCE(abstract, '')) LIKE $${values.length})`);
  }

  const whereStatement = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

  return {
    values,
    whereStatement
  };
}

export async function listSourcesFromRepository(): Promise<SourceSummary[]> {
  const dbPool = getDbPool();
  const result = await dbPool.query<SourceRow>(`
    SELECT
      source_key,
      COUNT(*)::text AS paper_count,
      COUNT(*) FILTER (WHERE abstract IS NOT NULL AND LENGTH(TRIM(abstract)) > 0)::text AS has_abstract_count
    FROM papers
    GROUP BY source_key
    ORDER BY source_key DESC
  `);

  return result.rows.map((row) => ({
    sourceKey: row.source_key,
    label: toSourceLabel(row.source_key),
    paperCount: Number(row.paper_count),
    hasAbstractCount: Number(row.has_abstract_count)
  }));
}

export async function listPapersFromRepository(query: ListPapersQuery) {
  const dbPool = getDbPool();
  const { values, whereStatement } = buildListPapersQuery(query);
  const result = await dbPool.query<PaperRow>(
    `
      SELECT
        id,
        source_key,
        source_paper_id,
        title,
        abstract,
        authors,
        venue,
        year,
        paper_url,
        options
      FROM papers
      ${whereStatement}
      ORDER BY year DESC NULLS LAST, title ASC
    `,
    values
  );

  return paginateItems(result.rows.map(mapPaperRow), query);
}

export async function listPapersBySource(sourceKey: string) {
  const dbPool = getDbPool();
  const result = await dbPool.query<PaperRow>(
    `
      SELECT
        id,
        source_key,
        source_paper_id,
        title,
        abstract,
        authors,
        venue,
        year,
        paper_url,
        options
      FROM papers
      WHERE source_key = $1
      ORDER BY year DESC NULLS LAST, title ASC
    `,
    [sourceKey]
  );

  return result.rows.map(mapPaperRow);
}

export async function sourceExists(sourceKey: string) {
  const dbPool = getDbPool();
  const result = await dbPool.query<{ exists: boolean }>(
    "SELECT EXISTS(SELECT 1 FROM papers WHERE source_key = $1) AS exists",
    [sourceKey]
  );

  return Boolean(result.rows[0]?.exists);
}
