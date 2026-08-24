import type { SoftwareProject } from "./types";

export const softwareProjects: readonly SoftwareProject[] = [
  {
    slug: "kleavox-monorepo",
    name: "Kleavox monorepo",
    status: "active",
    summary:
      "A Cloudflare-first ecosystem: identity, short routes, temporary file delivery, and infrastructure monitoring, all on one edge runtime.",
    stack: ["TypeScript", "Workers", "D1", "R2", "Go"],
    repo: { url: "https://github.com/Kleavox/kleavox-monorepo", published: true },
  },
  {
    slug: "doswall",
    name: "Doswall",
    status: "shipped",
    summary:
      "A lecturer wallboard: live attendance status and campus announcements rendered on TV screens, with location-aware check-in.",
    stack: ["Flutter", "Dart", "REST", "Geolocation"],
    repo: { url: "https://github.com/doswall/doswall-mobile", published: true },
    successorOf: "dogoes",
  },
  {
    slug: "dogoes",
    name: "DoGoes",
    status: "archived",
    summary:
      "The original Kotlin build of the wallboard, rewritten from scratch in Flutter once cross-platform became the requirement.",
    stack: ["Kotlin", "Android"],
    repo: { url: "https://github.com/Kleavox/DoGoes", published: true },
  },
  {
    slug: "portfolio",
    name: "This portfolio",
    status: "active",
    summary:
      "The site you are reading. Board models come straight out of KiCad and are compressed roughly tenfold without losing a single component name.",
    stack: ["Vite", "React", "TypeScript", "Tailwind v4", "three.js", "Workers"],
    repo: { url: "https://github.com/Kleavox/deauport", published: false },
  },
];
