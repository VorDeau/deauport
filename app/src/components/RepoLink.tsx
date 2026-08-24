import type { RepoLink as Repo } from "../data/types";

export default function RepoLink({ repo }: { repo: Repo }) {
  if (!repo.published) {
    return (
      <span className="font-mono text-xs text-muted" title="Repository not published yet">
        repo pending
      </span>
    );
  }
  return (
    <a
      href={repo.url}
      className="font-mono text-xs text-accent hover:underline"
    >
      source →
    </a>
  );
}
