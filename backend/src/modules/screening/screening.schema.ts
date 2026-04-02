import { z } from "zod";

const screeningQueryOptionsSchema = z.object({
  threshold: z.number().min(0).max(1).optional(),
  topK: z.number().int().positive().max(200).optional(),
  includeReasoning: z.boolean().optional(),
  preferredYears: z.array(z.number().int()).max(10).optional(),
  excludeKeywords: z.array(z.string().trim().min(1)).max(20).optional(),
  sourceFilters: z.array(z.string().trim().min(1)).max(20).optional()
});

export const createScreeningQuerySchema = z.object({
  sourceKey: z.string().trim().min(1),
  queryText: z.string().trim().min(3).max(500),
  inputMode: z.enum(["title", "title_abstract"]).default("title"),
  options: screeningQueryOptionsSchema.default({})
});

export const listScreeningQueriesQuerySchema = z.object({
  sourceKey: z.string().trim().min(1).optional(),
  status: z.enum(["queued", "running", "completed", "failed"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(12)
});

export const listScreeningResultsQuerySchema = z.object({
  status: z.enum(["pending", "completed", "failed"]).optional(),
  decision: z.enum(["keep", "discard", "uncertain"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(20),
  sortBy: z.enum(["score", "processedAt", "title"]).default("score"),
  sortOrder: z.enum(["asc", "desc"]).default("desc")
});

export type CreateScreeningQueryInput = z.infer<typeof createScreeningQuerySchema>;
export type ListScreeningQueriesQuery = z.infer<typeof listScreeningQueriesQuerySchema>;
export type ListScreeningResultsQuery = z.infer<typeof listScreeningResultsQuerySchema>;
