import { z } from "zod";

import { DEFAULT_PAPER_PAGE_SIZE } from "./papers.constants.js";

const booleanQueryParamSchema = z
  .enum(["true", "false"])
  .transform((value) => value === "true");

export const listPapersQuerySchema = z.object({
  sourceKey: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(DEFAULT_PAPER_PAGE_SIZE),
  search: z.string().trim().optional(),
  hasAbstract: booleanQueryParamSchema.optional()
});

export type ListPapersQuery = z.infer<typeof listPapersQuerySchema>;
