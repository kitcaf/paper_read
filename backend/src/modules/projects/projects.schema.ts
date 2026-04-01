import { z } from "zod";

export const projectSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  researchGoal: z.string(),
  paperCount: z.number().int().nonnegative(),
  taskCount: z.number().int().nonnegative()
});

export type ProjectSummary = z.infer<typeof projectSummarySchema>;
