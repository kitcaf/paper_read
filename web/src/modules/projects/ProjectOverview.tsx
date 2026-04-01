import type { ProjectSummary } from "../../types";

const project: ProjectSummary = {
  id: "demo-project",
  name: "LLM Paper Screening",
  researchGoal: "Build a web-first paper reader with a TypeScript-based agent runtime.",
  paperCount: 0,
  taskCount: 0
};

export function ProjectOverview() {
  return (
    <article className="panel">
      <p className="eyebrow">Projects</p>
      <h2>{project.name}</h2>
      <p>{project.researchGoal}</p>
      <dl className="stat-grid">
        <div>
          <dt>Papers</dt>
          <dd>{project.paperCount}</dd>
        </div>
        <div>
          <dt>Tasks</dt>
          <dd>{project.taskCount}</dd>
        </div>
      </dl>
    </article>
  );
}
