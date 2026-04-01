import type { PaperSummary } from "@paper-read/shared";
import { z } from "zod";

export type { PaperSummary } from "@paper-read/shared";

export const paperSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  decision: z.enum(["keep", "discard", "pending"])
}) satisfies z.ZodType<PaperSummary>;
