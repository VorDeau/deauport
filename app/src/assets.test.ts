import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const HERE = dirname(fileURLToPath(import.meta.url));
const PUBLIC = resolve(HERE, "../public");

function svgFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...svgFiles(path));
    else if (entry.name.endsWith(".svg")) found.push(path);
  }
  return found;
}

const files = svgFiles(PUBLIC);

describe("shipped SVG assets", () => {
  it("finds something to check", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)("parses as well-formed XML: %s", (file) => {
    const text = readFileSync(file, "utf8");
    const parsed = new DOMParser().parseFromString(text, "image/svg+xml");
    const failure = parsed.querySelector("parsererror");
    expect(failure?.textContent ?? null).toBeNull();
  });

  it.each(files)("carries no double hyphen inside a comment: %s", (file) => {
    const text = readFileSync(file, "utf8");
    const offenders: string[] = [];
    let at = text.indexOf("<!--");
    while (at !== -1) {
      const close = text.indexOf("-->", at + 4);
      const body = text.slice(at + 4, close === -1 ? text.length : close);
      if (body.includes("--")) offenders.push(body.trim().slice(0, 60));
      at = text.indexOf("<!--", close === -1 ? text.length : close + 3);
    }
    expect(offenders).toEqual([]);
  });
});
