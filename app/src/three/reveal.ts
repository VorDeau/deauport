import { BOARD_CLUSTERS } from "../data/clusters.generated";
import { BOARD_MODELS, type BoardModelId } from "../data/models.generated";
import { BOARD_PARTS, type PartGroup, type PartNote } from "../data/parts";

export type Beat = {
  part: PartNote;
  group: PartGroup;
  groupStart: number;
  groupLength: number;
  members: readonly string[];
  anchor: string;
};

const GROUP_ORDER: readonly PartGroup[] = [
  "power",
  "data",
  "sensing",
  "protection",
  "interface",
  "mechanical",
  "passive",
];

type Cluster = {
  place: Record<string, readonly [number, number]>;
  support: Record<string, readonly string[]>;
  roles: readonly { role: string; refs: readonly string[] }[];
};

function clustersFor(modelId: BoardModelId): Cluster | undefined {
  return BOARD_CLUSTERS[modelId as keyof typeof BOARD_CLUSTERS] as Cluster | undefined;
}

function designatorOrder(a: string, b: string): number {
  const split = (ref: string) => {
    const match = ref.match(/^([A-Za-z]+)(\d*)$/);
    return { letters: match?.[1] ?? ref, number: Number(match?.[2] ?? 0) };
  };
  const left = split(a);
  const right = split(b);
  if (left.letters !== right.letters) return left.letters < right.letters ? -1 : 1;
  return left.number - right.number;
}

export function designatorRange(refs: readonly string[]): string {
  if (refs.length === 0) return "";
  const sorted = [...refs].sort(designatorOrder);
  const first = sorted[0] ?? "";
  const last = sorted[sorted.length - 1] ?? "";
  return first === last ? first : `${first}–${last}`;
}

const TURN = Math.PI * 2;

function centroidOf(place: Record<string, readonly [number, number]>): [number, number] {
  const points = Object.values(place);
  const x = points.reduce((sum, point) => sum + point[0], 0) / points.length;
  const y = points.reduce((sum, point) => sum + point[1], 0) / points.length;
  return [x, y];
}

function sweep(
  parts: readonly PartNote[],
  place: Record<string, readonly [number, number]> | undefined,
  from: number,
): { ordered: readonly PartNote[]; last: number } {
  if (!place || Object.keys(place).length === 0) return { ordered: parts, last: from };

  const [cx, cy] = centroidOf(place);
  const angleOf = (part: PartNote): number | null => {
    const at = place[part.ref];
    return at ? Math.atan2(at[1] - cy, at[0] - cx) : null;
  };

  const placed: { part: PartNote; angle: number }[] = [];
  const unplaced: PartNote[] = [];
  for (const part of parts) {
    const angle = angleOf(part);
    if (angle === null) unplaced.push(part);
    else placed.push({ part, angle });
  }

  placed.sort((a, b) => {
    const left = (a.angle - from + TURN) % TURN;
    const right = (b.angle - from + TURN) % TURN;
    return left - right;
  });

  const tail = placed[placed.length - 1];
  return {
    ordered: [...placed.map((entry) => entry.part), ...unplaced],
    last: tail ? tail.angle : from,
  };
}

export function beatsFor(modelId: BoardModelId): readonly Beat[] {
  const parts = BOARD_PARTS[modelId];
  const clusters = clustersFor(modelId);
  const model = BOARD_MODELS[modelId];
  const known: ReadonlySet<string> = new Set<string>([...model.components, ...model.extras]);

  const ordered: PartNote[] = [];
  let heading = -Math.PI;
  for (const group of GROUP_ORDER) {
    const inGroup = parts.filter((part) => part.group === group);
    if (inGroup.length === 0) continue;
    const swept = sweep(inGroup, clusters?.place, heading);
    ordered.push(...swept.ordered);
    heading = swept.last;
  }

  const named = new Set(ordered.map((part) => part.ref));
  const spokenFor = new Set<string>();
  const membersOf = new Map<string, readonly string[]>();

  for (const part of ordered) {
    const support = (clusters?.support[part.ref] ?? []).filter(
      (ref) => known.has(ref) && !named.has(ref) && !spokenFor.has(ref),
    );
    membersOf.set(part.ref, [part.ref, ...support]);
    spokenFor.add(part.ref);
    for (const ref of support) spokenFor.add(ref);
  }

  for (const entry of clusters?.roles ?? []) {
    const refs = entry.refs.filter((ref) => known.has(ref) && !spokenFor.has(ref));
    if (refs.length === 0) continue;

    const note: PartNote = {
      ref: designatorRange(refs),
      part: entry.role,
      role: `${refs.length} ${refs.length === 1 ? "Part" : "Parts"}`,
      group: "passive",
    };
    ordered.push(note);
    membersOf.set(note.ref, refs);
    for (const ref of refs) spokenFor.add(ref);
  }

  return ordered.map((part) => {
    const members = membersOf.get(part.ref) ?? [part.ref];
    return {
      part,
      group: part.group,
      groupStart: ordered.findIndex((other) => other.group === part.group),
      groupLength: ordered.filter((other) => other.group === part.group).length,
      members,
      anchor: known.has(part.ref) ? part.ref : (members[0] ?? part.ref),
    };
  });
}

export function movingGroups(beats: readonly Beat[]): readonly (readonly string[])[] {
  return beats.map((beat) => beat.members);
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
