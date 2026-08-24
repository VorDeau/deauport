#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { mergeDocuments } from "@gltf-transform/functions";

const KICAD = "C:/Program Files/KiCad/10.0/bin/kicad-cli.exe";
const SOURCE = "D:/Project/DeltaT32/Hardwares";
const CACHE = resolve("node_modules/.cache/deltat32");
const OUT = join(CACHE, "deltat32.source.glb");

const BOARDS = [
  // J1 carries `(hide yes)` on its 3D model in the footprint, so KiCad leaves
  // the sensor header out of every export. It is a real part on the board, so
  // it is shown here. The rewrite happens on a copy; the project is read-only.
  { id: "c3", file: "esp-unit-c3-v3", link: [144.88, 89.725], show: ["J1"] },
  { id: "bmi", file: "sensor-bmi-v2", link: [135.215, 108.96], show: [] },
];

// The two boards are laid out on separate KiCad sheets but exported in page
// coordinates, so they arrive far apart. They are brought together on the one
// feature that actually ties them: the four-pin sensor link, J1 under the C3
// and J41 on top of the BMI.
const STACK_GAP_MM = 14;

const LAYER_ROLES = [
  ["_PCB", "pcb"],
  ["_copper", "copper"],
  ["_pad", "pads"],
  ["_via", "vias"],
  ["_silkscreen", "silkscreen"],
  ["_soldermask", "soldermask"],
];

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);

function footprintBlocks(text) {
  const blocks = [];
  let at = text.indexOf("(footprint ");
  while (at !== -1) {
    let depth = 0;
    let i = at;
    for (; i < text.length; i += 1) {
      const c = text[i];
      if (c === '"') {
        i += 1;
        while (i < text.length && text[i] !== '"') i += text[i] === "\\" ? 2 : 1;
        continue;
      }
      if (c === "(") depth += 1;
      else if (c === ")") {
        depth -= 1;
        if (depth === 0) break;
      }
    }
    blocks.push({ start: at, end: i + 1, text: text.slice(at, i + 1) });
    at = text.indexOf("(footprint ", i + 1);
  }
  return blocks;
}

function sourceFor(file, show) {
  const original = join(SOURCE, file, `${file}.kicad_pcb`);
  if (show.length === 0) return original;

  const text = readFileSync(original, "utf8");
  const wanted = new Set(show);
  let out = "";
  let cursor = 0;
  let shown = 0;

  for (const block of footprintBlocks(text)) {
    const ref = block.text.match(/\(property "Reference" "([^"]+)"/)?.[1];
    if (!ref || !wanted.has(ref)) continue;
    const revealed = block.text.replace(/(\(model "[^"]+"\s*)\(hide yes\)/g, (whole, head) => {
      shown += 1;
      return head;
    });
    if (revealed === block.text) continue;
    out += text.slice(cursor, block.start) + revealed;
    cursor = block.end;
  }
  if (shown === 0) return original;

  const patched = join(CACHE, `${file}.shown.kicad_pcb`);
  writeFileSync(patched, out + text.slice(cursor), "utf8");
  console.log(`${file}: ${shown} model disembunyikan ditampilkan (${show.join(", ")})`);
  return patched;
}

function exportBoard(file, show) {
  const out = join(CACHE, `${file}.glb`);
  execFileSync(
    KICAD,
    [
      "pcb", "export", "glb", "--force", "--subst-models",
      "--include-tracks", "--include-pads", "--include-zones",
      "--include-silkscreen", "--include-soldermask",
      "-o", out, sourceFor(file, show),
    ],
    { stdio: "pipe" },
  );
  return out;
}

function worldBox(node) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  const visit = (n) => {
    const mesh = n.getMesh();
    if (mesh) {
      const m = n.getWorldMatrix();
      const v = [0, 0, 0];
      for (const prim of mesh.listPrimitives()) {
        const position = prim.getAttribute("POSITION");
        if (!position) continue;
        for (let i = 0; i < position.getCount(); i += 1) {
          position.getElement(i, v);
          const p = [
            m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12],
            m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13],
            m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14],
          ];
          for (let k = 0; k < 3; k += 1) {
            if (p[k] < min[k]) min[k] = p[k];
            if (p[k] > max[k]) max[k] = p[k];
          }
        }
      }
    }
    for (const child of n.listChildren()) visit(child);
  };
  visit(node);
  return { min, max };
}

function sceneBox(scene) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const node of scene.listChildren()) {
    const box = worldBox(node);
    for (let k = 0; k < 3; k += 1) {
      if (box.min[k] < min[k]) min[k] = box.min[k];
      if (box.max[k] > max[k]) max[k] = box.max[k];
    }
  }
  return { min, max };
}

// KiCad names component nodes by designator but leaves the board layers
// anonymous; the mesh underneath still carries the layer name. Silkscreen and
// soldermask each appear twice, so the higher one is the top face.
function nameLayers(doc, id) {
  const found = [];
  for (const node of doc.getRoot().listNodes()) {
    const mesh = node.getMesh();
    if (!mesh) continue;
    const meshName = mesh.getName() ?? "";
    const role = LAYER_ROLES.find(([suffix]) => meshName.endsWith(suffix))?.[1];
    if (!role) continue;
    found.push({ node, role, y: worldBox(node).max[1] });
  }

  const byRole = new Map();
  for (const entry of found) {
    if (!byRole.has(entry.role)) byRole.set(entry.role, []);
    byRole.get(entry.role).push(entry);
  }

  const names = [];
  for (const [role, entries] of byRole) {
    entries.sort((a, b) => b.y - a.y);
    entries.forEach((entry, index) => {
      const suffix =
        entries.length === 1 ? "" : index === 0 ? "_top" : index === 1 ? "_bottom" : `_${index}`;
      const name = `${id}_${role}${suffix}`;
      entry.node.setName(name);
      names.push(name);
    });
  }
  return names.sort();
}

mkdirSync(CACHE, { recursive: true });
if (!existsSync(KICAD)) {
  console.error(`kicad-cli not found at ${KICAD}`);
  process.exit(1);
}

const built = [];
for (const board of BOARDS) {
  const glb = exportBoard(board.file, board.show);
  const doc = await io.read(glb);
  const layers = nameLayers(doc, board.id);
  const box = sceneBox(doc.getRoot().listScenes()[0]);
  built.push({ ...board, doc, layers, box });
  console.log(`${board.file}: ${layers.length} lapisan dinamai`);
}

const [top, bottom] = built;

// Millimetres in the KiCad page frame; the exporter writes metres.
const shiftX = (top.link[0] - bottom.link[0]) / 1000;
const shiftZ = (top.link[1] - bottom.link[1]) / 1000;
const shiftY = top.box.min[1] - bottom.box.max[1] - STACK_GAP_MM / 1000;

const merged = top.doc;
const before = new Set(merged.getRoot().listScenes());
mergeDocuments(merged, bottom.doc);

const scenes = merged.getRoot().listScenes();
const target = scenes.find((scene) => before.has(scene));
const added = scenes.filter((scene) => !before.has(scene));
if (!target) throw new Error("adegan utama hilang setelah penggabungan");
const stack = merged.createNode(`${bottom.id}_stack`).setTranslation([shiftX, shiftY, shiftZ]);

for (const scene of added) {
  for (const child of scene.listChildren()) stack.addChild(child);
  scene.dispose();
}
target.addChild(stack);

// Merging brings the second document's buffer along, and GLB allows only one.
const buffers = merged.getRoot().listBuffers();
const keep = buffers[0];
if (!keep) throw new Error("dokumen gabungan tidak punya buffer");
for (const accessor of merged.getRoot().listAccessors()) accessor.setBuffer(keep);
for (const spare of buffers.slice(1)) spare.dispose();

await io.write(OUT, merged);

console.log(
  `\ndeltat32: ${top.refs.length + bottom.refs.length} komponen, ` +
    `${top.layers.length + bottom.layers.length} lapisan, ` +
    `${(statSync(OUT).size / 1048576).toFixed(2)} MB -> ${OUT}`,
);
console.log(
  `susunan: ${bottom.id} digeser [${(shiftX * 1000).toFixed(2)}, ${(shiftY * 1000).toFixed(2)}, ${(shiftZ * 1000).toFixed(2)}] mm ` +
    `(J41 di bawah J1, jarak pentas ${STACK_GAP_MM} mm)`,
);
console.log("lapisan:", [...top.layers, ...bottom.layers].join(" "));
