import { listTasksFromRepository } from "./tasks.repository.js";

export async function listTasks() {
  return listTasksFromRepository();
}
