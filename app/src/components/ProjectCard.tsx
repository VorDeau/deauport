import type { SoftwareProject } from "../data/types";
import { projectRole } from "./finish";

export default function ProjectCard({ project }: { project: SoftwareProject }) {
  const role = projectRole(project.status);
  return (
    <article className={`rounded-lg border bg-surface p-5 ${role.border}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-semibold">{project.name}</h3>
        <span className="kvx-status">
          <span aria-hidden="true" className={`kvx-pad ${role.pad}`} />
          <span className={role.text}>{project.status}</span>
        </span>
      </div>
      <p className="mt-3 text-sm text-muted">{project.summary}</p>
      <p className="mt-3 font-mono text-xs text-muted">{project.stack.join(" · ")}</p>
      {project.repo.published ? (
        <a
          href={project.repo.url}
          className="mt-2 inline-flex min-h-12 items-center rounded-md font-mono text-xs text-accent hover:underline"
        >
          source →
        </a>
      ) : (
        <span className="mt-2 inline-flex min-h-12 items-center font-mono text-xs text-muted">
          repo pending
        </span>
      )}
    </article>
  );
}
