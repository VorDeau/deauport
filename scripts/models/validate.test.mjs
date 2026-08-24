import { describe, expect, it } from "vitest";
import { Document } from "@gltf-transform/core";
import { collectEntities, validateStructure, boundingBoxes, compareBoundingBoxes } from "./validate.mjs";

function boardDoc({ designators = ["R1", "C1"], layers = ["X_PCB"], junk = [] } = {}) {
  const doc = new Document();
  const buffer = doc.createBuffer();
  const scene = doc.createScene();
  const mesh = () => {
    const position = doc
      .createAccessor()
      .setType("VEC3")
      .setArray(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]))
      .setBuffer(buffer);
    return doc.createMesh().addPrimitive(doc.createPrimitive().setAttribute("POSITION", position));
  };
  for (const name of [...designators, ...layers, ...junk]) {
    scene.addChild(doc.createNode(name).setMesh(mesh()));
  }
  return doc;
}

describe("collectEntities", () => {
  it("memisahkan designator, layer, dan nama sampah", () => {
    const doc = boardDoc({ designators: ["R1", "U2"], layers: ["X_PCB"], junk: ["=>[0:1:1:3]"] });
    const found = collectEntities(doc);
    expect(found.designators).toEqual(["R1", "U2"]);
    expect(found.junk).toEqual(["=>[0:1:1:3]"]);
  });
});

describe("validateStructure", () => {
  const spec = { designators: 2, layers: ["X_PCB"], extras: [] };

  it("lulus saat struktur cocok", () => {
    expect(validateStructure(boardDoc(), spec)).toEqual([]);
  });

  it("gagal saat jumlah designator meleset", () => {
    const errors = validateStructure(boardDoc({ designators: ["R1"] }), spec);
    expect(errors.join(" ")).toMatch(/designator/i);
  });

  it("gagal saat ada nama sampah", () => {
    const errors = validateStructure(boardDoc({ junk: ["NAUO1"] }), spec);
    expect(errors.join(" ")).toMatch(/NAUO1/);
  });

  it("gagal saat layer hilang", () => {
    const errors = validateStructure(boardDoc({ layers: [] }), spec);
    expect(errors.join(" ")).toMatch(/X_PCB/);
  });
});

describe("boundingBoxes", () => {
  it("mengakumulasi mesh dari anak dengan transform bersarang", () => {
    const doc = new Document();
    const buffer = doc.createBuffer();

    const createMesh = () => {
      const position = doc
        .createAccessor()
        .setType("VEC3")
        .setArray(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]))
        .setBuffer(buffer);
      return doc.createMesh().addPrimitive(doc.createPrimitive().setAttribute("POSITION", position));
    };

    const scene = doc.createScene();

    const parent = doc.createNode("component").setTranslation([0.01, 0, 0]);

    const child = doc.createNode("lead").setTranslation([0.02, 0, 0]).setMesh(createMesh());

    parent.addChild(child);
    scene.addChild(parent);

    const boxes = boundingBoxes(doc);

    const childBox = boxes.get("lead");
    expect(childBox).toBeDefined();

    expect(childBox.centre[0]).toBeCloseTo(0.53, 5);
    expect(childBox.centre[1]).toBeCloseTo(0.5, 5);
    expect(childBox.centre[2]).toBeCloseTo(0, 5);

    const parentBox = boxes.get("component");
    expect(parentBox).toBeDefined();

    const childMinX = childBox.centre[0] - childBox.size[0] / 2;
    const childMaxX = childBox.centre[0] + childBox.size[0] / 2;
    const parentMinX = parentBox.centre[0] - parentBox.size[0] / 2;
    const parentMaxX = parentBox.centre[0] + parentBox.size[0] / 2;

    expect(parentMinX).toBeLessThanOrEqual(childMinX);
    expect(parentMaxX).toBeGreaterThanOrEqual(childMaxX);
  });
});

describe("compareBoundingBoxes", () => {
  it("melaporkan node yang bergeser melebihi toleransi", () => {
    const doc = boardDoc();
    const before = boundingBoxes(doc);
    const shifted = new Map(before);
    shifted.set("R1", { centre: [1, 0, 0], size: before.get("R1").size });
    const errors = compareBoundingBoxes(before, shifted, 0.00001);
    expect(errors.join(" ")).toMatch(/R1/);
  });

  it("diam saat tidak ada yang bergeser", () => {
    const doc = boardDoc();
    const boxes = boundingBoxes(doc);
    expect(compareBoundingBoxes(boxes, boxes, 0.00001)).toEqual([]);
  });
});
