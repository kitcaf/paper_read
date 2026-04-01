import type { ProjectSummary } from "./projects.schema.js";

const demoProjects: ProjectSummary[] = [
  {
    id: "demo-project",
    name: "LLM Paper Screening",
    researchGoal: "Move the product to a web-first TypeScript architecture.",
    paperCount: 0,
    taskCount: 0
  }
];

export async function listProjectsFromRepository() {
  return demoProjects;
}
