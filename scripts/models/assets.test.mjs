import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { MeshoptDecoder } from "meshoptimizer";
import { BOARD_SPECS } from "./specs.mjs";
import { collectEntities, validateStructure } from "./validate.mjs";

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "meshopt.decoder": MeshoptDecoder });

const generated = resolve("app/src/data/models.generated.ts");

function generatedComponents(source, id) {
  const block = new RegExp(`^  ${id}: \\{$([\\s\\S]*?)^  \\},$`, "m").exec(source);
  if (!block?.[1]) throw new Error(`no "${id}" block in models.generated.ts`);

  const list = /^    components: \[$([\s\S]*?)^    \],$/m.exec(block[1]);
  if (!list?.[1]) throw new Error(`no components array for "${id}" in models.generated.ts`);

  return [...list[1].matchAll(/^\s*"([^"]+)",$/gm)].map((match) => match[1]);
}

describe.each(Object.entries(BOARD_SPECS))("aset %s", (id, spec) => {
  const file = resolve(`app/public/models/${id}.glb`);

  it("ada di repo", () => {
    expect(existsSync(file)).toBe(true);
  });

  it("cocok dengan spesifikasi papan", async () => {
    expect(validateStructure(await io.read(file), spec)).toEqual([]);
  });

  it("sinkron dengan models.generated.ts", async () => {
    const expected = generatedComponents(readFileSync(generated, "utf8"), id);
    expect(expected.length).toBe(spec.designators);

    const found = collectEntities(await io.read(file)).designators;
    expect([...found].sort()).toEqual([...expected].sort());
  });
});
