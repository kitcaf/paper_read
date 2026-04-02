import { listPapersFromRepository } from "./papers.repository.js";
import type { ListPapersQuery } from "./papers.schema.js";

export async function listPapers(query: ListPapersQuery) {
  return listPapersFromRepository(query);
}
