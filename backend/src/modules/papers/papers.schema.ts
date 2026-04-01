import { z } from "zod";

export const paperSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  decision: z.enum(["keep", "discard", "pending"])
});

export type PaperSummary = z.infer<typeof paperSummarySchema>;
