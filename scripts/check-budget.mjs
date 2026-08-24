#!/usr/bin/env node
import { gzipSync } from "node:zlib";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "app/dist");
const ASSETS = join(DIST, "assets");
const LIMIT_KB = 100;

const html = readFileSync(join(DIST, "index.html"), "utf8");
const initial = new Set(
  [...html.matchAll(/(?:src|href)="\/assets\/([^"]+\.js)"/g)].map((m) => m[1]),
);

if (initial.size === 0) {
  console.error("no initial JS referenced by index.html - the check would pass vacuously");
  process.exit(1);
}

let total = 0;
for (const file of initial) {
  total += gzipSync(readFileSync(join(ASSETS, file))).length;
}

const kb = total / 1024;
console.log(`initial JS (gzip): ${kb.toFixed(1)} KB across ${initial.size} file(s)`);
for (const file of readdirSync(ASSETS).filter((f) => f.endsWith(".js"))) {
  const size = gzipSync(readFileSync(join(ASSETS, file))).length / 1024;
  console.log(`  ${initial.has(file) ? "initial" : "async  "}  ${file}  ${size.toFixed(1)} KB`);
}

if (kb > LIMIT_KB) {
  console.error(`\nover budget: ${kb.toFixed(1)} KB > ${LIMIT_KB} KB`);
  process.exit(1);
}
