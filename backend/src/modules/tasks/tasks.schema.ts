import { z } from "zod";

export const taskSummarySchema = z.object({
  id: z.string(),
  kind: z.enum(["screening", "reading"]),
  status: z.enum(["queued", "running", "completed", "failed"])
});

export type TaskSummary = z.infer<typeof taskSummarySchema>;
