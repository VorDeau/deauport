import { describe, expect, it } from "vitest";
import { Object3D, Vector3 } from "three";
import { explodeOffset, resolveComponentName } from "./explode";

const boardCentre = new Vector3(0, 0, 0);

describe("explodeOffset", () => {
  it("tidak menggeser apa pun saat amount nol", () => {
    const offset = explodeOffset(new Vector3(0.01, 0.002, 0), boardCentre, 0, 1);
    expect(offset.length()).toBeCloseTo(0, 9);
  });

  it("mendorong komponen menjauh dari pusat papan", () => {
    const offset = explodeOffset(new Vector3(0.01, 0, 0), boardCentre, 1, 1);
    expect(offset.x).toBeGreaterThan(0);
  });

  it("mendorong ke arah berlawanan untuk sisi berlawanan", () => {
    const right = explodeOffset(new Vector3(0.01, 0, 0), boardCentre, 1, 1);
    const left = explodeOffset(new Vector3(-0.01, 0, 0), boardCentre, 1, 1);
    expect(Math.sign(right.x)).toBe(-Math.sign(left.x));
  });

  it("memisahkan sumbu Y lebih kuat supaya lapisan papan terurai", () => {
    const above = explodeOffset(new Vector3(0, 0.001, 0), boardCentre, 1, 1);
    const sideways = explodeOffset(new Vector3(0.001, 0, 0), boardCentre, 1, 1);
    expect(Math.abs(above.y)).toBeGreaterThan(Math.abs(sideways.x));
  });

  it("berskala linier terhadap amount", () => {
    const half = explodeOffset(new Vector3(0.01, 0, 0), boardCentre, 0.5, 1);
    const full = explodeOffset(new Vector3(0.01, 0, 0), boardCentre, 1, 1);
    expect(full.x).toBeCloseTo(half.x * 2, 9);
  });

  it("tidak menghasilkan NaN untuk komponen tepat di pusat", () => {
    const offset = explodeOffset(boardCentre.clone(), boardCentre, 1, 1);
    expect(Number.isNaN(offset.x)).toBe(false);
    expect(Number.isNaN(offset.y)).toBe(false);
  });

  it("menghitung arah relatif terhadap pusat papan yang tidak nol", () => {
    const offCentre = new Vector3(1, 2, 3);

    const atBoardCentre = explodeOffset(offCentre.clone(), offCentre, 1, 1);
    expect(atBoardCentre.x).toBeCloseTo(0, 9);
    expect(atBoardCentre.z).toBeCloseTo(0, 9);
    expect(Number.isNaN(atBoardCentre.y)).toBe(false);

    const besideBoardCentre = explodeOffset(
      offCentre.clone().add(new Vector3(0.01, 0, 0)),
      offCentre,
      1,
      1,
    );
    expect(besideBoardCentre.x).toBeGreaterThan(0);
    expect(besideBoardCentre.z).toBeCloseTo(0, 9);
  });
});

describe("explodeOffset menulis ke vektor yang diberikan", () => {
  it("mengembalikan vektor keluaran itu sendiri, bukan alokasi baru", () => {
    const out = new Vector3();
    const result = explodeOffset(new Vector3(0.01, 0, 0), boardCentre, 1, 1, out);
    expect(result).toBe(out);
  });

  it("memberi hasil yang sama dengan versi yang mengalokasi sendiri", () => {
    const centre = new Vector3(0.01, 0.002, -0.003);
    const board = new Vector3(0.001, 0, 0.001);
    const fresh = explodeOffset(centre, board, 0.7, 0.5);
    const reused = explodeOffset(centre, board, 0.7, 0.5, new Vector3(9, 9, 9));
    expect([reused.x, reused.y, reused.z]).toEqual([fresh.x, fresh.y, fresh.z]);
  });

  it("tidak membawa sisa hitungan sebelumnya saat vektor gores dipakai ulang", () => {
    const scratch = new Vector3();
    const right = explodeOffset(new Vector3(0.01, 0, 0), boardCentre, 1, 1, scratch).clone();
    const left = explodeOffset(new Vector3(-0.01, 0, 0), boardCentre, 1, 1, scratch).clone();
    expect(Math.sign(right.x)).toBe(-Math.sign(left.x));
    expect(Math.abs(right.x)).toBeCloseTo(Math.abs(left.x), 9);
  });

  it("tidak meninggalkan NaN di vektor gores untuk komponen di pusat", () => {
    const scratch = new Vector3(5, 5, 5);
    const result = explodeOffset(boardCentre.clone(), boardCentre, 1, 1, scratch);
    expect(Number.isNaN(result.x)).toBe(false);
    expect(result.x).toBeCloseTo(0, 9);
    expect(result.z).toBeCloseTo(0, 9);
  });
});

describe("resolveComponentName", () => {
  const components = new Set(["U1", "J2"]);

  it("mengenali hit langsung pada node komponen", () => {
    const node = new Object3D();
    node.name = "U1";
    expect(resolveComponentName(node, components)).toBe("U1");
  });

  it("naik ke leluhur komponen dari child bersarang dua level lebih dalam", () => {
    const component = new Object3D();
    component.name = "J2";
    const child = new Object3D();
    child.name = "USB1100-30-A";
    const mesh = new Object3D();
    mesh.name = "USB1100-30-A_mesh_0";
    component.add(child);
    child.add(mesh);

    expect(resolveComponentName(mesh, components)).toBe("J2");
  });

  it("mengembalikan null saat tidak ada leluhur komponen (mis. lapisan papan)", () => {
    const layer = new Object3D();
    layer.name = "Keel_PCB_Silkscreen_Top";
    const mesh = new Object3D();
    mesh.name = "SOIC-8_39x49mm_P127mm_1";
    layer.add(mesh);

    expect(resolveComponentName(mesh, components)).toBeNull();
  });

  it("mengembalikan null untuk input null", () => {
    expect(resolveComponentName(null, components)).toBeNull();
  });
});
