import type { TaskSummary } from "./tasks.schema.js";

const demoTasks: TaskSummary[] = [
  {
    id: "task-001",
    kind: "screening",
    status: "queued"
  }
];

export async function listTasksFromRepository() {
  return demoTasks;
}
