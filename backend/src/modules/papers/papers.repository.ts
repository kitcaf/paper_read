import type { PaperSummary } from "./papers.schema.js";

const demoPapers: PaperSummary[] = [
  {
    id: "paper-001",
    title: "Scaffold placeholder for paper screening",
    decision: "pending"
  }
];

export async function listPapersFromRepository() {
  return demoPapers;
}
