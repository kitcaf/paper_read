import { listSourcesFromRepository } from "../papers/papers.repository.js";

export async function listSources() {
  return listSourcesFromRepository();
}
