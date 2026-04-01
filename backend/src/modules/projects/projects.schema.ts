import type { ProjectSummary } from "@paper-read/shared";
import { z } from "zod";

export type { ProjectSummary } from "@paper-read/shared";

export const projectSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  researchGoal: z.string(),
  paperCount: z.number().int().nonnegative(),
  taskCount: z.number().int().nonnegative()
}) satisfies z.ZodType<ProjectSummary>;
