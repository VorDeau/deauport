import { BOARD_MODELS, type BoardModelId } from "../data/models.generated";
import { BOARD_PARTS, type PartGroup, type PartNote } from "../data/parts";

export type Beat = {
  part: PartNote;
  group: PartGroup;
  groupStart: number;
  groupLength: number;
};

const GROUP_ORDER: readonly PartGroup[] = [
  "power",
  "data",
  "sensing",
  "protection",
  "interface",
  "mechanical",
];

export function beatsFor(modelId: BoardModelId): readonly Beat[] {
  const parts = BOARD_PARTS[modelId];
  const ordered: PartNote[] = [];
  for (const group of GROUP_ORDER) {
    for (const part of parts) if (part.group === group) ordered.push(part);
  }

  return ordered.map((part) => {
    const groupStart = ordered.findIndex((other) => other.group === part.group);
    const groupLength = ordered.filter((other) => other.group === part.group).length;
    return { part, group: part.group, groupStart, groupLength };
  });
}

export function revealOrder(beats: readonly Beat[]): readonly string[] {
  return beats.map((beat) => beat.part.ref);
}

export function locate(progress: number, count: number): { index: number; local: number } {
  if (count <= 0) return { index: 0, local: 0 };
  const scaled = Math.min(1, Math.max(0, progress)) * count;
  const index = Math.min(count - 1, Math.floor(scaled));
  return { index, local: Math.min(1, scaled - index) };
}

export const HEIGHT_PER_BEAT = 85;

export function trackHeightVh(beatCount: number): number {
  return 100 + beatCount * HEIGHT_PER_BEAT;
}

export function layersOf(modelId: BoardModelId): ReadonlySet<string> {
  return new Set(BOARD_MODELS[modelId].layers);
}
