import type { BoardModelId } from "./models.generated";

export type BoardStage = "in-progress" | "design-complete" | "archived";

export type RepoLink = {
  url: string;
  published: boolean;
};

export type Board = {
  slug: string;
  designation: string;
  codename: string | null;
  stage: BoardStage;
  fabricated: boolean;
  summary: string;
  dimensions: string;
  mainIc: string;
  modelId: BoardModelId | null;
  repo: RepoLink;
  highlights: readonly string[];
  successorOf?: string;
};

export type SoftwareProject = {
  slug: string;
  name: string;
  status: "active" | "shipped" | "archived";
  summary: string;
  stack: readonly string[];
  repo: RepoLink;
  successorOf?: string;
};

export type Profile = {
  name: string;
  location: string;
  tagline: string;
  intro: string;
  github: string;
  linkedin: string;
  timeline: readonly { period: string; title: string; note: string }[];
};
