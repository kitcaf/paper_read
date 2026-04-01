import { PapersPanel } from "../modules/papers/PapersPanel";
import { ProjectOverview } from "../modules/projects/ProjectOverview";
import { TasksPanel } from "../modules/tasks/TasksPanel";

export function HomePage() {
  return (
    <section className="dashboard-grid">
      <ProjectOverview />
      <PapersPanel />
      <TasksPanel />
    </section>
  );
}
