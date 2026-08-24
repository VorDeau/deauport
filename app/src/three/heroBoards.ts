import type { BoardModelId } from "../data/models.generated";

export const HERO_ORDER: readonly BoardModelId[] = ["fides", "interim", "keel"];

export const HERO_LABEL: Record<BoardModelId, string> = {
  fides: "deltaT35",
  interim: "deltaT52",
  keel: "deltaT26",
  deltat32: "deltaT32",
};
