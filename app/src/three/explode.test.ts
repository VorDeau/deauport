import { describe, expect, it } from "vitest";
import { Box3, Object3D, Vector3 } from "three";
import { layerOffset, placementOf, resolveComponentName, separationOffset, slabOf } from "./explode";

const boardCentre = new Vector3(0, 0, 0);

const slab = new Box3(new Vector3(-0.05, -0.0008, -0.03), new Vector3(0.05, 0.0008, 0.03));

function boxAt(minY: number, maxY: number): Box3 {
  return new Box3(new Vector3(0.01, minY, 0.01), new Vector3(0.02, maxY, 0.02));
}

describe("placementOf", () => {
  it("menyebut komponen yang seluruhnya di atas papan sebagai top", () => {
    expect(placementOf(boxAt(0.0008, 0.006), slab)).toBe("top");
  });

  it("menyebut komponen yang seluruhnya di bawah papan sebagai bottom", () => {
    expect(placementOf(boxAt(-0.006, -0.0008), slab)).toBe("bottom");
  });

  it("menyebut konektor yang mengapit tepi papan sebagai edge", () => {
    expect(placementOf(boxAt(-0.004, 0.004), slab)).toBe("edge");
  });

  it("menyebut komponen setipis papan sendiri sebagai edge, bukan menebak sisi", () => {
    expect(placementOf(boxAt(-0.0006, 0.0006), slab)).toBe("edge");
  });
});

describe("separationOffset", () => {
  const centre = new Vector3(0.03, 0.002, 0.02);

  it("tidak menggeser apa pun saat amount nol", () => {
    expect(separationOffset("top", centre, boardCentre, 0.1, 0).length()).toBeCloseTo(0, 9);
  });

  it("mengangkat komponen sisi atas ke atas", () => {
    expect(separationOffset("top", centre, boardCentre, 0.1, 1).y).toBeGreaterThan(0);
  });

  it("menurunkan komponen sisi bawah ke bawah", () => {
    expect(separationOffset("bottom", centre, boardCentre, 0.1, 1).y).toBeLessThan(0);
  });

  it("tidak pernah menggeser komponen tepi secara vertikal", () => {
    expect(separationOffset("edge", centre, boardCentre, 0.1, 1).y).toBe(0);
  });

  it("mendorong komponen tepi keluar menjauhi pusat papan", () => {
    const out = separationOffset("edge", centre, boardCentre, 0.1, 1);
    expect(Math.sign(out.x)).toBe(1);
    expect(Math.sign(out.z)).toBe(1);
  });

  it("memberi komponen tepi jangkauan mendatar lebih jauh daripada komponen muka", () => {
    const edge = separationOffset("edge", centre, boardCentre, 0.1, 1);
    const face = separationOffset("top", centre, boardCentre, 0.1, 1);
    expect(Math.hypot(edge.x, edge.z)).toBeGreaterThan(Math.hypot(face.x, face.z));
  });

  it("mengangkat lebih tinggi daripada menggeser, supaya tidak menabrak papan", () => {
    const out = separationOffset("top", centre, boardCentre, 0.1, 1);
    expect(Math.abs(out.y)).toBeGreaterThan(Math.hypot(out.x, out.z));
  });

  it("berskala linier terhadap amount", () => {
    const half = separationOffset("top", centre, boardCentre, 0.1, 0.5);
    const full = separationOffset("top", centre, boardCentre, 0.1, 1);
    expect(full.y).toBeCloseTo(half.y * 2, 9);
  });

  it("menulis ke vektor yang diberikan dan mengembalikannya", () => {
    const out = new Vector3();
    expect(separationOffset("top", centre, boardCentre, 0.1, 1, out)).toBe(out);
  });

  it("tidak menghasilkan NaN untuk komponen tepat di pusat papan", () => {
    const out = separationOffset("top", boardCentre.clone(), boardCentre, 0.1, 1);
    expect(Number.isNaN(out.x)).toBe(false);
    expect(Number.isNaN(out.y)).toBe(false);
  });
});

describe("layerOffset", () => {
  it("mengangkat lurus ke atas tanpa geser mendatar", () => {
    const out = layerOffset("top", 0.1, 1);
    expect(out.x).toBe(0);
    expect(out.z).toBe(0);
    expect(out.y).toBeGreaterThan(0);
  });

  it("menurunkan komponen sisi bawah", () => {
    expect(layerOffset("bottom", 0.1, 1).y).toBeLessThan(0);
  });

  it("memberi jarak yang sama untuk setiap anggota, jadi mereka naik sebagai satu lapisan", () => {
    const first = layerOffset("top", 0.1, 1).clone();
    const second = layerOffset("top", 0.1, 1);
    expect(second.y).toBe(first.y);
  });

  it("tidak menggeser apa pun saat amount nol", () => {
    expect(layerOffset("top", 0.1, 0).length()).toBe(0);
  });

  it("memperlakukan komponen tepi seperti sisi atas, bukan membiarkannya diam", () => {
    expect(layerOffset("edge", 0.1, 1).y).toBeGreaterThan(0);
  });
});

describe("slabOf", () => {
  it("memakai node lapisan papan saat ada", () => {
    const scene = new Object3D();
    const layer = new Object3D();
    layer.name = "Keel_PCB_Top";
    scene.add(layer);
    expect(slabOf(scene, ["Keel_PCB_Top"])).toBeInstanceOf(Box3);
  });

  it("jatuh ke irisan tipis di tengah saat tidak ada lapisan dikenali", () => {
    const scene = new Object3D();
    const child = new Object3D();
    child.name = "U1";
    scene.add(child);
    child.position.set(0, 0.01, 0);
    const fallback = slabOf(scene, ["tidak-ada"]);
    expect(fallback.max.y).toBeGreaterThanOrEqual(fallback.min.y);
    expect(Number.isFinite(fallback.min.y)).toBe(true);
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
