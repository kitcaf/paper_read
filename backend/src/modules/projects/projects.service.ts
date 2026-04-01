import { listProjectsFromRepository } from "./projects.repository.js";

export async function listProjects() {
  return listProjectsFromRepository();
}
