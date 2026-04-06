import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

import type {
  LocalConversationSummary,
  LocalMessageRecord,
  LocalScreeningResultRecord,
  ModelProviderSettings,
  PaperRecord,
  ScreeningDecision,
  SourceSummary
} from "@paper-read/shared";

import {
  DEFAULT_MODEL_PROVIDER_SETTINGS,
  normalizeModelProviderSettings
} from "../models/config";
import { SQLITE_SCHEMA } from "./schema";

export interface StoredPaperRow {
  id: string;
  source_key: string;
  source_paper_id: string | null;
  title: string;
  abstract: string | null;
  metadata_json: string;
  created_at: string;
}

export interface WorkspaceStorage {
  db: Database;
  workspacePath: string;
}

export interface ImportPaperInput {
  sourceKey: string;
  sourcePaperId: string;
  title: string;
  abstract?: string | null;
  authors?: string[];
  venue?: string | null;
  year?: number | null;
  paperUrl?: string | null;
  metadata?: Record<string, unknown>;
}

function nowIso() {
  return new Date().toISOString();
}

function parseMetadata(value: string) {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch (error) {
    console.warn("Failed to parse local metadata JSON.", error);
    return {};
  }
}

function parseJsonRecord(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch (error) {
    console.warn("Failed to parse local setting JSON.", error);
    return {};
  }
}

function readOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function readOptionalNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function migrateWorkspaceSchema(db: Database) {
  try {
    db.exec("ALTER TABLE conversations ADD COLUMN metadata_json TEXT NOT NULL DEFAULT '{}';");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.toLowerCase().includes("duplicate column")) {
      throw error;
    }
  }
}

export function openWorkspaceStorage(workspacePath: string): WorkspaceStorage {
  if (!workspacePath.trim()) {
    throw new Error("Workspace path cannot be empty.");
  }

  mkdirSync(workspacePath, { recursive: true });
  mkdirSync(join(workspacePath, "cache", "sources"), { recursive: true });
  mkdirSync(join(workspacePath, "imports"), { recursive: true });
  mkdirSync(join(workspacePath, "exports"), { recursive: true });

  const db = new Database(join(workspacePath, "workspace.sqlite"));
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(SQLITE_SCHEMA);
  migrateWorkspaceSchema(db);

  return {
    db,
    workspacePath
  };
}

export function listSourceSummaries(db: Database): SourceSummary[] {
  const rows = db
    .query<{
      source_key: string;
      paper_count: number;
      has_abstract_count: number;
    }, []>(
      `
      SELECT
        source_key,
        COUNT(*) AS paper_count,
        SUM(CASE WHEN abstract IS NOT NULL AND abstract != '' THEN 1 ELSE 0 END) AS has_abstract_count
      FROM papers
      GROUP BY source_key
      ORDER BY source_key ASC
      `
    )
    .all();

  return rows.map((row) => ({
    sourceKey: row.source_key,
    label: row.source_key.toUpperCase().replaceAll("_", " "),
    paperCount: row.paper_count,
    hasAbstractCount: row.has_abstract_count
  }));
}

export function listPapersBySource(db: Database, sourceKey: string): PaperRecord[] {
  const rows = db
    .query<StoredPaperRow, [string]>(
      `
      SELECT id, source_key, source_paper_id, title, abstract, metadata_json, created_at
      FROM papers
      WHERE source_key = ?
      ORDER BY title ASC
      `
    )
    .all(sourceKey);

  return rows.map((row) => ({
    ...mapPaperRow(row)
  }));
}

function mapPaperRow(row: StoredPaperRow): PaperRecord {
  const metadata = parseMetadata(row.metadata_json);

  return {
    id: row.id,
    sourceKey: row.source_key,
    sourcePaperId: row.source_paper_id,
    title: row.title,
    abstract: row.abstract,
    authors: readStringArray(metadata.authors),
    venue: readOptionalString(metadata.venue),
    year: readOptionalNumber(metadata.year),
    paperUrl: readOptionalString(metadata.paperUrl),
    options: metadata
  };
}

export function upsertPapers(db: Database, papers: ImportPaperInput[]) {
  const timestamp = nowIso();
  const selectExistingPaper = db.prepare<
    { id: string },
    [string, string]
  >("SELECT id FROM papers WHERE source_key = ? AND source_paper_id = ?");
  const insertPaper = db.prepare(
    `
    INSERT INTO papers (id, source_key, source_paper_id, title, abstract, metadata_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `
  );
  const updatePaper = db.prepare(
    `
    UPDATE papers
    SET title = ?, abstract = ?, metadata_json = ?
    WHERE id = ?
    `
  );

  const upsertMany = db.transaction((items: ImportPaperInput[]) => {
    for (const paper of items) {
      const metadataJson = JSON.stringify({
        ...(paper.metadata ?? {}),
        authors: paper.authors ?? [],
        venue: paper.venue ?? null,
        year: paper.year ?? null,
        paperUrl: paper.paperUrl ?? null
      });
      const existingPaper = selectExistingPaper.get(paper.sourceKey, paper.sourcePaperId);

      if (existingPaper) {
        updatePaper.run(paper.title, paper.abstract ?? null, metadataJson, existingPaper.id);
      } else {
        insertPaper.run(
          crypto.randomUUID(),
          paper.sourceKey,
          paper.sourcePaperId,
          paper.title,
          paper.abstract ?? null,
          metadataJson,
          timestamp
        );
      }
    }
  });

  upsertMany(papers);
}

export function getModelProviderSettings(db: Database) {
  const row = db
    .query<{ value_json: string }, [string]>(
      "SELECT value_json FROM settings WHERE key = ?"
    )
    .get("model.provider");

  if (!row) {
    return DEFAULT_MODEL_PROVIDER_SETTINGS;
  }

  return normalizeModelProviderSettings(parseJsonRecord(row.value_json));
}

export function updateModelProviderSettings(
  db: Database,
  settings: ModelProviderSettings
) {
  const currentSettings = getModelProviderSettings(db);
  const normalizedSettings = normalizeModelProviderSettings({
    ...settings,
    apiKey: settings.apiKey ?? currentSettings.apiKey
  });

  db.query(
    `
    INSERT INTO settings (key, value_json, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET
      value_json = excluded.value_json,
      updated_at = excluded.updated_at
    `
  ).run("model.provider", JSON.stringify(normalizedSettings), nowIso());

  return normalizedSettings;
}

export function createConversation(
  db: Database,
  input: { title: string; mode: "chat" | "screening"; metadata?: Record<string, unknown> }
) {
  const timestamp = nowIso();
  const conversationId = crypto.randomUUID();

  db.query(
    `
    INSERT INTO conversations (id, title, mode, metadata_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    `
  ).run(
    conversationId,
    input.title,
    input.mode,
    JSON.stringify(input.metadata ?? {}),
    timestamp,
    timestamp
  );

  return conversationId;
}

export function updateConversationMetadata(
  db: Database,
  conversationId: string,
  metadata: Record<string, unknown>
) {
  db.query("UPDATE conversations SET metadata_json = ?, updated_at = ? WHERE id = ?").run(
    JSON.stringify(metadata),
    nowIso(),
    conversationId
  );
}

export function createMessage(
  db: Database,
  input: {
    conversationId: string;
    role: "user" | "assistant" | "tool";
    content: string;
    metadata?: Record<string, unknown>;
  }
) {
  const messageId = crypto.randomUUID();

  db.query(
    `
    INSERT INTO messages (id, conversation_id, role, content, metadata_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
    `
  ).run(
    messageId,
    input.conversationId,
    input.role,
    input.content,
    JSON.stringify(input.metadata ?? {}),
    nowIso()
  );

  db.query("UPDATE conversations SET updated_at = ? WHERE id = ?").run(
    nowIso(),
    input.conversationId
  );

  return messageId;
}

export function createScreeningResult(
  db: Database,
  input: {
    conversationId: string;
    messageId: string;
    paperId: string;
    decision: ScreeningDecision;
    score: number;
    reasoning: string;
    metadata?: Record<string, unknown>;
  }
) {
  db.query(
    `
    INSERT INTO screening_results (
      id, conversation_id, message_id, paper_id, decision, score, reasoning, metadata_json, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
  ).run(
    crypto.randomUUID(),
    input.conversationId,
    input.messageId,
    input.paperId,
    input.decision,
    input.score,
    input.reasoning,
    JSON.stringify(input.metadata ?? {}),
    nowIso()
  );
}

export function listConversations(db: Database): LocalConversationSummary[] {
  return db
    .query<
      {
        id: string;
        title: string;
        mode: "chat" | "screening";
        metadata_json: string;
        created_at: string;
        updated_at: string;
      },
      []
    >(
      `
      SELECT id, title, mode, metadata_json, created_at, updated_at
      FROM conversations
      ORDER BY updated_at DESC
      `
    )
    .all()
    .map((row) => ({
      id: row.id,
      title: row.title,
      mode: row.mode,
      metadata: parseMetadata(row.metadata_json),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
}

export function listMessages(db: Database, conversationId: string): LocalMessageRecord[] {
  return db
    .query<
      {
        id: string;
        conversation_id: string;
        role: "user" | "assistant" | "tool";
        content: string;
        metadata_json: string;
        created_at: string;
      },
      [string]
    >(
      `
      SELECT id, conversation_id, role, content, metadata_json, created_at
      FROM messages
      WHERE conversation_id = ?
      ORDER BY created_at ASC
      `
    )
    .all(conversationId)
    .map((row) => ({
      id: row.id,
      conversationId: row.conversation_id,
      role: row.role,
      content: row.content,
      metadata: parseMetadata(row.metadata_json),
      createdAt: row.created_at
    }));
}

export function listScreeningResults(
  db: Database,
  conversationId: string
): LocalScreeningResultRecord[] {
  return db
    .query<
      {
        id: string;
        conversation_id: string;
        message_id: string;
        paper_id: string;
        decision: ScreeningDecision;
        score: number;
        reasoning: string;
        result_metadata_json: string;
        result_created_at: string;
        source_key: string;
        source_paper_id: string | null;
        title: string;
        abstract: string | null;
        paper_metadata_json: string;
        paper_created_at: string;
      },
      [string]
    >(
      `
      SELECT
        screening_results.id,
        screening_results.conversation_id,
        screening_results.message_id,
        screening_results.paper_id,
        screening_results.decision,
        screening_results.score,
        screening_results.reasoning,
        screening_results.metadata_json AS result_metadata_json,
        screening_results.created_at AS result_created_at,
        papers.source_key,
        papers.source_paper_id,
        papers.title,
        papers.abstract,
        papers.metadata_json AS paper_metadata_json,
        papers.created_at AS paper_created_at
      FROM screening_results
      INNER JOIN papers ON papers.id = screening_results.paper_id
      WHERE screening_results.conversation_id = ?
      ORDER BY screening_results.score DESC, papers.title ASC
      `
    )
    .all(conversationId)
    .map((row) => ({
      id: row.id,
      conversationId: row.conversation_id,
      messageId: row.message_id,
      paperId: row.paper_id,
      decision: row.decision,
      score: row.score,
      reasoning: row.reasoning,
      metadata: parseMetadata(row.result_metadata_json),
      createdAt: row.result_created_at,
      paper: mapPaperRow({
        id: row.paper_id,
        source_key: row.source_key,
        source_paper_id: row.source_paper_id,
        title: row.title,
        abstract: row.abstract,
        metadata_json: row.paper_metadata_json,
        created_at: row.paper_created_at
      })
    }));
}
