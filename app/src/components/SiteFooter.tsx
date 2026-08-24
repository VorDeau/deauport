import { profile } from "../data/profile";

export default function SiteFooter() {
  return (
    <footer className="border-t border-line bg-deep px-6 py-14">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 font-mono text-xs text-muted">
        <span>{profile.name} / {new Date().getFullYear()}</span>
        <span>{profile.location}</span>
        <span className="flex items-center">
          <a
            href={profile.github}
            className="flex min-h-12 items-center rounded-md px-3 transition-colors hover:text-ink"
          >
            GitHub
          </a>
          <a
            href={profile.linkedin}
            className="flex min-h-12 items-center rounded-md px-3 transition-colors hover:text-ink"
          >
            LinkedIn
          </a>
        </span>
      </div>
    </footer>
  );
}
