import type { Profile } from "./types";

export const profile: Profile = {
  name: "Hafidh Musyafa",
  location: "Indonesia",
  tagline: "Hardware that reports on itself.",
  intro:
    "I design PCBs and the software that reads them: power paths, sensor front-ends, and the edge services and interfaces that make their measurements legible.",
  github: "https://github.com/Kleavox",
  linkedin: "https://www.linkedin.com/in/hmus122/",
  timeline: [
    { period: "NOW", title: "Boards and systems", note: "deltaT hardware, edge infrastructure" },
    { period: "2026", title: "Graduated", note: "Computer Engineering, Universitas Negeri Semarang" },
    { period: "2024–2025", title: "Product engineering", note: "Doswall, rebuilt from DoGoes" },
  ],
};
