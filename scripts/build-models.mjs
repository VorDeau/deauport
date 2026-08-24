#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { MeshoptDecoder } from "meshoptimizer";
import { normalizeDocument } from "./models/normalize.mjs";
import { BOARD_SPECS, SOURCE_DIR } from "./models/specs.mjs";
import { boundingBoxes, collectEntities, compareBoundingBoxes, validateStructure } from "./models/validate.mjs";
import { emitModelsModule } from "./models/emit.mjs";

const OUT_DIR = resolve("app/public/models");
const TMP_DIR = resolve("node_modules/.cache/models");
const DATA_FILE = resolve("app/src/data/models.generated.ts");
const DRIFT_TOLERANCE_METRES = 0.00001;

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "meshopt.decoder": MeshoptDecoder });

const gltf = (args) =>
  execFileSync("pnpm", ["exec", "gltf-transform", ...args], { stdio: "pipe", shell: true });

const megabytes = (bytes) => (bytes / 1048576).toFixed(2);

async function buildBoard(id, spec) {
  const source = join(SOURCE_DIR, spec.source);
  const original = await io.read(source);
  const before = boundingBoxes(original);

  const normalised = normalizeDocument(await io.read(source));
  const stage = (n) => join(TMP_DIR, `${id}.${n}.glb`);
  await io.write(stage("norm"), normalised);

  gltf(["dedup", stage("norm"), stage("a")]);
  gltf(["join", stage("a"), stage("b"), "--keepMeshes", "true"]);
  gltf(["weld", stage("b"), stage("c")]);

  const out = join(OUT_DIR, `${id}.glb`);
  gltf(["meshopt", stage("c"), out, "--level", "high"]);

  const result = await io.read(out);
  const errors = [
    ...validateStructure(result, spec),
    ...compareBoundingBoxes(before, boundingBoxes(result), DRIFT_TOLERANCE_METRES),
  ];
  if (errors.length > 0) {
    throw new Error(`${id}: pipeline menghasilkan model rusak\n  - ${errors.join("\n  - ")}`);
  }

  const found = collectEntities(result);
  console.log(
    `${id.padEnd(9)} ${megabytes(statSync(source).size).padStart(6)} MB -> ` +
      `${megabytes(statSync(out).size).padStart(5)} MB   ` +
      `${found.designators.length} components, ${found.layers.length} layers`,
  );
  return {
    designators: [...found.designators].sort(),
    layers: spec.layers,
    extras: spec.extras,
  };
}

async function main() {
  rmSync(TMP_DIR, { recursive: true, force: true });
  mkdirSync(TMP_DIR, { recursive: true });
  mkdirSync(OUT_DIR, { recursive: true });

  const entries = {};
  for (const [id, spec] of Object.entries(BOARD_SPECS)) {
    entries[id] = await buildBoard(id, spec);
  }
  emitModelsModule(DATA_FILE, entries);
  console.log(`\nwrote ${DATA_FILE}`);
}

main().catch((error) => {
  console.error(`\n${error.message}`);
  process.exit(1);
});
