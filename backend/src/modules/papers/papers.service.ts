import { listPapersFromRepository } from "./papers.repository.js";

export async function listPapers() {
  return listPapersFromRepository();
}
