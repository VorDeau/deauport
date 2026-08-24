import { describe, expect, it } from "vitest";
import { Document } from "@gltf-transform/core";
import { normalizeDocument } from "./normalize.mjs";

function makeMesh(doc, name, shared = false) {
  const buffer = doc.createBuffer();
  const position = doc
    .createAccessor()
    .setType("VEC3")
    .setArray(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]))
    .setBuffer(buffer);
  const mesh = doc.createMesh(name);
  mesh.addPrimitive(doc.createPrimitive().setAttribute("POSITION", position));
  if (shared) {
    mesh.addPrimitive(doc.createPrimitive().setAttribute("POSITION", position));
  }
  return mesh;
}

const findNode = (doc, name) => {
  let found = null;
  const walk = (n) => {
    if (n.getName() === name) found = n;
    n.listChildren().forEach(walk);
  };
  doc.getRoot().listScenes()[0].listChildren().forEach(walk);
  return found;
};

describe("normalizeDocument", () => {
  it("memberi nama designator pada leaf berlabel sampah OpenCASCADE", () => {
    const doc = new Document();
    const leaf = doc.createNode("=>[0:1:1:5]").setMesh(makeMesh(doc, "leaf"));
    const comp = doc.createNode("C5").addChild(leaf);
    doc.createScene().addChild(doc.createNode("Board").addChild(comp));

    normalizeDocument(doc);

    const c5 = findNode(doc, "C5");
    expect(c5.getMesh()).not.toBeNull();
    expect(findNode(doc, "=>[0:1:1:5]")).toBeNull();
  });

  it("menyegel subtree di bawah designator, termasuk nama part CAD", () => {
    const doc = new Document();
    const part = doc
      .createNode("Pin Header - RaspberryPi - Stacking - Male - 2.54mm v1:1")
      .setMesh(makeMesh(doc, "part"));
    const junk = doc.createNode("=>[0:1:1:7]").addChild(part);
    const comp = doc.createNode("J1").addChild(junk);
    doc.createScene().addChild(doc.createNode("Board").addChild(comp));

    normalizeDocument(doc);

    const j1 = findNode(doc, "J1");
    expect(j1).not.toBeNull();
    expect(j1.getMesh()).not.toBeNull();
    expect(
      findNode(doc, "Pin Header - RaspberryPi - Stacking - Male - 2.54mm v1:1"),
    ).toBeNull();
  });

  it("mempertahankan anak bernama bermakna sebagai entitas terpisah", () => {
    const doc = new Document();
    const copper = doc.createNode("PCB_copper").setMesh(makeMesh(doc, "copper"));
    const mask = doc.createNode("PCB_mask").setMesh(makeMesh(doc, "mask"));
    const pcb = doc.createNode("PCB").addChild(copper).addChild(mask);
    doc.createScene().addChild(doc.createNode("Board").addChild(pcb));

    normalizeDocument(doc);

    expect(findNode(doc, "PCB_copper")).not.toBeNull();
    expect(findNode(doc, "PCB_mask")).not.toBeNull();
  });

  it("membake transform tepat sekali walau primitive berbagi accessor", () => {
    const doc = new Document();
    const leaf = doc.createNode("NAUO1").setMesh(makeMesh(doc, "leaf", true));
    const junk = doc.createNode("=>[0:1:1:7]").setTranslation([5, 0, 0]).addChild(leaf);
    const comp = doc.createNode("R1").setTranslation([10, 0, 0]).addChild(junk);
    doc.createScene().addChild(doc.createNode("Board").addChild(comp));

    normalizeDocument(doc);

    const r1 = findNode(doc, "R1");
    const xs = r1
      .getMesh()
      .listPrimitives()
      .map((p) => p.getAttribute("POSITION").getElement(0, [0, 0, 0])[0]);
    for (const x of xs) expect(x).toBeCloseTo(5, 6);
  });

  it("mempertahankan posisi dunia saat reparenting di cabang junk parent", () => {
    const doc = new Document();

    const copper = doc
      .createNode("PCB_copper")
      .setTranslation([0.001, 0.002, 0.003])
      .setMesh(makeMesh(doc, "copper"));

    const wrapper = doc
      .createNode("=>[0:1:1:9]")
      .setTranslation([0.004, 0.005, 0.006])
      .addChild(copper);

    const pcb = doc.createNode("PCB").addChild(wrapper);

    doc.createScene().addChild(doc.createNode("Board").addChild(pcb));

    const copperBefore = findNode(doc, "PCB_copper");
    const matBefore = copperBefore.getWorldMatrix();
    const posBefore = [matBefore[12], matBefore[13], matBefore[14]];

    normalizeDocument(doc);

    const copperAfter = findNode(doc, "PCB_copper");
    expect(copperAfter).not.toBeNull();
    expect(findNode(doc, "=>[0:1:1:9]")).toBeNull();

    const matAfter = copperAfter.getWorldMatrix();
    const posAfter = [matAfter[12], matAfter[13], matAfter[14]];

    for (let i = 0; i < 3; i++) {
      expect(posAfter[i]).toBeCloseTo(posBefore[i], 6);
    }
  });
});
