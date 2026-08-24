import { describe, expect, it } from "vitest";
import { BOARD_CLUSTERS } from "../data/clusters.generated";
import { BOARD_MODELS, type BoardModelId } from "../data/models.generated";
import { BOARD_PARTS } from "../data/parts";
import { beatsFor, designatorRange, movingGroups } from "./reveal";

const ids = Object.keys(BOARD_MODELS) as BoardModelId[];

describe.each(ids)("beats for %s", (id) => {
  const beats = beatsFor(id);
  const known = new Set<string>([...BOARD_MODELS[id].components, ...BOARD_MODELS[id].extras]);

  it("never moves a component that is not in the model", () => {
    const strangers = beats.flatMap((beat) => beat.members).filter((ref) => !known.has(ref));
    expect(strangers).toEqual([]);
  });

  it("never moves the same component in two beats", () => {
    const seen = new Map<string, number>();
    const doubled: string[] = [];
    beats.forEach((beat, index) => {
      for (const ref of beat.members) {
        if (seen.has(ref)) doubled.push(`${ref}: beat ${seen.get(ref)} and ${index}`);
        else seen.set(ref, index);
      }
    });
    expect(doubled).toEqual([]);
  });

  it("leads every named beat with the part the caption names", () => {
    const wrong = beats
      .filter((beat) => beat.group !== "passive" && known.has(beat.part.ref))
      .filter((beat) => beat.members[0] !== beat.part.ref)
      .map((beat) => beat.part.ref);
    expect(wrong).toEqual([]);
  });

  it("anchors every callout on a component the model actually has", () => {
    const dangling = beats.filter((beat) => !known.has(beat.anchor)).map((beat) => beat.part.ref);
    expect(dangling).toEqual([]);
  });

  it("hands the rig one group per beat", () => {
    expect(movingGroups(beats)).toHaveLength(beats.length);
  });
});

describe("supporting passives", () => {
  it("lifts an IC together with the passives its netlist ties to it", () => {
    const u1 = beatsFor("keel").find((beat) => beat.part.ref === "U1");
    expect(u1?.members).toEqual(["U1", ...BOARD_CLUSTERS.keel.support.U1]);
    expect(u1?.members.length).toBeGreaterThan(1);
  });

  it("still names only the IC in the caption", () => {
    const u1 = beatsFor("keel").find((beat) => beat.part.ref === "U1");
    expect(u1?.part.part).toBe("INA226");
    expect(u1?.part.role).toBe("Power Telemetry");
  });

  it("never says a passive is tied to nothing", () => {
    const said = beatsFor("keel")
      .flatMap((beat) => [beat.part.ref, beat.part.part, beat.part.role])
      .join(" ");
    expect(said).not.toMatch(/not tied|unattached|orphan|belongs to no|no ic/i);
  });

  it("gives each leftover role its own beat, named for what the topology is", () => {
    const passive = beatsFor("keel").filter((beat) => beat.group === "passive");
    expect(passive.map((beat) => beat.part.part)).toEqual(
      BOARD_CLUSTERS.keel.roles.map((entry) => entry.role),
    );
    expect(passive.map((beat) => beat.part.part)).toContain("AC Coupling");
    expect(passive.map((beat) => beat.part.part)).toContain("Decoupling");
  });

  it("counts the parts in each role beat", () => {
    const passive = beatsFor("keel").filter((beat) => beat.group === "passive");
    for (const beat of passive) {
      expect(beat.part.role).toBe(
        `${beat.members.length} ${beat.members.length === 1 ? "Part" : "Parts"}`,
      );
    }
  });

  it("labels a role beat with the designator range it covers", () => {
    const coupling = beatsFor("keel").find((beat) => beat.part.part === "AC Coupling");
    expect(coupling?.part.ref).toBe("C36–C44");
  });

  it("adds no passive beat to a board where every passive has an IC", () => {
    expect(BOARD_CLUSTERS.fides.roles).toHaveLength(0);
    expect(beatsFor("fides").some((beat) => beat.group === "passive")).toBe(false);
  });
});

describe("designatorRange", () => {
  it("collapses a run to first and last in designator order", () => {
    expect(designatorRange(["C40", "C36", "C9"])).toBe("C9–C40");
  });

  it("returns the single reference unchanged", () => {
    expect(designatorRange(["R7"])).toBe("R7");
  });

  it("sorts by number, not by string", () => {
    expect(designatorRange(["R10", "R2"])).toBe("R2–R10");
  });
});

describe("walk order", () => {
  const GROUPS = ["power", "data", "sensing", "protection", "interface", "mechanical"] as const;

  function rotationTravel(refs: readonly string[], id: BoardModelId): number {
    const place = BOARD_CLUSTERS[id].place as Record<string, readonly [number, number]>;
    const points = Object.values(place);
    const cx = points.reduce((sum, p) => sum + p[0], 0) / points.length;
    const cy = points.reduce((sum, p) => sum + p[1], 0) / points.length;
    const angle = (ref: string) => {
      const at = place[ref];
      return at ? Math.atan2(at[1] - cy, at[0] - cx) : null;
    };
    let total = 0;
    for (let i = 1; i < refs.length; i += 1) {
      const a = angle(refs[i - 1] ?? "");
      const b = angle(refs[i] ?? "");
      if (a === null || b === null) continue;
      total += Math.abs(Math.atan2(Math.sin(b - a), Math.cos(b - a)));
    }
    return total;
  }

  it.each(ids)("turns the board less than the hand-written order would on %s", (id) => {
    const authored: string[] = [];
    for (const group of GROUPS) {
      for (const part of BOARD_PARTS[id]) if (part.group === group) authored.push(part.ref);
    }
    const walked = beatsFor(id).map((beat) => beat.part.ref);

    expect(rotationTravel(walked, id)).toBeLessThan(rotationTravel(authored, id));
  });

  it.each(ids)("keeps every part of a group together on %s", (id) => {
    const seen = new Set<string>();
    const broken: string[] = [];
    let previous = "";
    for (const beat of beatsFor(id)) {
      if (beat.group !== previous) {
        if (seen.has(beat.group)) broken.push(beat.group);
        seen.add(beat.group);
        previous = beat.group;
      }
    }
    expect(broken).toEqual([]);
  });

  it.each(ids)("loses no part when reordering %s", (id) => {
    const authored = new Set(BOARD_PARTS[id].map((part) => part.ref));
    const walked = beatsFor(id)
      .filter((beat) => beat.group !== "passive")
      .map((beat) => beat.part.ref);
    expect(new Set(walked)).toEqual(authored);
  });

  it("puts a part with no board position last in its group", () => {
    const beats = beatsFor("keel").filter((beat) => beat.group === "mechanical");
    const place = BOARD_CLUSTERS.keel.place as Record<string, unknown>;
    const positioned = beats.map((beat) => beat.part.ref in place);
    expect(positioned).toEqual([...positioned].sort((a, b) => Number(b) - Number(a)));
  });
});
