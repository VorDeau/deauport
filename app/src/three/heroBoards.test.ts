import { describe, expect, it } from "vitest";
import { BOARD_MODELS } from "../data/models.generated";
import { HERO_LABEL, HERO_ORDER } from "./heroBoards";

describe("hero boards", () => {
  it("starts with the smallest board so the hero becomes interactive sooner", () => {
    expect(HERO_ORDER[0]).toBe("fides");
  });

  it("offers every board exactly once", () => {
    expect(new Set(HERO_ORDER).size).toBe(HERO_ORDER.length);
  });

  it("only names boards that have a model to show", () => {
    for (const id of HERO_ORDER) expect(BOARD_MODELS).toHaveProperty(id);
  });

  it("labels every board it offers, since the picker is what tells a reader which board is on screen", () => {
    for (const id of HERO_ORDER) expect(HERO_LABEL[id]).toMatch(/^deltaT\d+$/);
  });

  it("gives each board a distinct label", () => {
    const labels = HERO_ORDER.map((id) => HERO_LABEL[id]);
    expect(new Set(labels).size).toBe(labels.length);
  });
});
