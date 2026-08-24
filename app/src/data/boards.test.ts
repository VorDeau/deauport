import { describe, expect, it } from "vitest";
import { boardBySlug, boards } from "./boards";
import { softwareProjects } from "./software";
import { BOARD_MODELS } from "./models.generated";

describe("boards", () => {
  it("punya lima papan dengan slug unik", () => {
    expect(boards).toHaveLength(5);
    expect(new Set(boards.map((b) => b.slug)).size).toBe(5);
  });

  it("hanya deltaT32 yang difabrikasi", () => {
    expect(boards.filter((b) => b.fabricated).map((b) => b.slug)).toEqual(["deltat32"]);
  });

  it("memetakan setiap papan ke model 3D yang benar", () => {
    const mapping = Object.fromEntries(boards.map((b) => [b.slug, b.modelId]));
    expect(mapping).toEqual({
      keel: "keel",
      deltat32: null,
      fides: "fides",
      interim: "interim",
      paritas: null,
    });
  });

  it("setiap modelId non-null ada di BOARD_MODELS", () => {
    const withModels = boards.filter((b) => b.modelId !== null);
    expect(withModels).toHaveLength(3);
    for (const board of withModels) {
      const modelId = board.modelId;
      if (modelId) {
        expect(BOARD_MODELS[modelId]).toBeDefined();
      }
    }
  });

  it("setiap successorOf menunjuk slug yang ada", () => {
    const slugs = new Set(boards.map((b) => b.slug));
    for (const board of boards) {
      if (board.successorOf) expect(slugs.has(board.successorOf)).toBe(true);
    }
  });

  it("menemukan papan lewat slug", () => {
    expect(boardBySlug("keel")?.designation).toBe("deltaT26");
    expect(boardBySlug("tidak-ada")).toBeUndefined();
  });
});

describe("software", () => {
  it("punya slug unik dan successorOf yang valid", () => {
    const slugs = new Set(softwareProjects.map((p) => p.slug));
    expect(slugs.size).toBe(softwareProjects.length);
    for (const project of softwareProjects) {
      if (project.successorOf) expect(slugs.has(project.successorOf)).toBe(true);
    }
  });
});
