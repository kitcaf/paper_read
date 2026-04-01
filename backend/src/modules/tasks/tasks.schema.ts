import type { TaskSummary } from "@paper-read/shared";
import { z } from "zod";

export type { TaskSummary } from "@paper-read/shared";

export const taskSummarySchema = z.object({
  id: z.string(),
  kind: z.enum(["screening", "reading"]),
  status: z.enum(["queued", "running", "completed", "failed"])
}) satisfies z.ZodType<TaskSummary>;
