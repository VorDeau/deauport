import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const HERE = dirname(fileURLToPath(import.meta.url));
const PORTFOLIO = resolve(HERE, "global.css");
const MONOREPO = resolve(HERE, "../../../../monorepo/packages/ui/src/styles.css");

const MATERIALS = new Set(["gold", "hasl", "copper"]);

function colourTokens(css: string, pattern: RegExp): Map<string, string> {
  const tokens = new Map<string, string>();
  for (const match of css.matchAll(pattern)) {
    const name = match[1];
    const value = match[2];
    if (name && value) tokens.set(name, value.toLowerCase());
  }
  return tokens;
}

const portfolio = colourTokens(
  readFileSync(PORTFOLIO, "utf8"),
  /^\s*--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/gm,
);

const hasMonorepo = existsSync(MONOREPO);
const monorepo = hasMonorepo
  ? colourTokens(
      readFileSync(MONOREPO, "utf8"),
      /^\s*--(?:kvx|dt)-([a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/gm,
    )
  : new Map<string, string>();

function channels(hex: string): [number, number, number] {
  const full =
    hex.length === 4
      ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
      : hex.slice(0, 7);
  return [1, 3, 5].map((at) => Number.parseInt(full.slice(at, at + 2), 16)) as [
    number,
    number,
    number,
  ];
}

function luminance(hex: string): number {
  const [r, g, b] = channels(hex).map((value) => {
    const channel = value / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4);
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [
    number,
    number,
  ];
  return (high + 0.05) / (low + 0.05);
}

function token(name: string): string {
  const value = portfolio.get(name);
  if (!value) throw new Error(`no --color-${name} in global.css`);
  return value;
}

describe("design token parity", () => {
  it.skipIf(!hasMonorepo)(
    "offers the same colour vocabulary in both implementations",
    () => {
      expect([...monorepo.keys()].sort()).toEqual([...portfolio.keys()].sort());
    },
  );

  it.skipIf(!hasMonorepo)("gives every shared colour the same value", () => {
    const mismatched = [...portfolio.entries()]
      .filter(([name, value]) => monorepo.has(name) && monorepo.get(name) !== value)
      .map(([name, value]) => `${name}: portfolio ${value}, monorepo ${monorepo.get(name)}`);
    expect(mismatched).toEqual([]);
  });

  it.skipIf(!hasMonorepo)("keeps the material finishes under the deltaT prefix", () => {
    const css = readFileSync(MONOREPO, "utf8");
    for (const material of MATERIALS) {
      expect(css).toContain(`--dt-${material}:`);
      expect(css).not.toContain(`--kvx-${material}:`);
    }
  });
});

describe("contrast floors", () => {
  const grounds = ["base", "surface", "surface-raised", "deep"];
  const text = [
    "ink",
    "muted",
    "quiet",
    "accent",
    "ok",
    "warn",
    "danger",
    "info",
    "mech",
    "gold",
    "hasl",
    "copper",
  ];

  it.each(grounds)("carries every text colour at 4.5:1 or better on %s", (ground) => {
    const failures = text
      .map((name) => ({ name, ratio: contrast(token(name), token(ground)) }))
      .filter((result) => result.ratio < 4.5)
      .map((result) => `${result.name} on ${ground}: ${result.ratio.toFixed(2)}:1`);
    expect(failures).toEqual([]);
  });

  it("clears 3:1 on a control boundary, which is what WCAG 1.4.11 asks", () => {
    expect(contrast(token("line-control"), token("base"))).toBeGreaterThanOrEqual(3);
  });

  it("keeps the decorative hairline quieter than the control boundary", () => {
    expect(contrast(token("line"), token("base"))).toBeLessThan(
      contrast(token("line-control"), token("base")),
    );
  });
});

describe("motion law", () => {
  const files = [PORTFOLIO, ...(hasMonorepo ? [MONOREPO] : [])];

  it.each(files)("declares nothing that animates forever in %s", (file) => {
    const css = readFileSync(file, "utf8");
    const offenders = css
      .split("\n")
      .map((line, index) => ({ line: line.trim(), number: index + 1 }))
      .filter(({ line }) => /\binfinite\b/.test(line) && !line.startsWith("*"));
    expect(offenders).toEqual([]);
  });
});

const OFF_PALETTE_BUDGET: Record<string, number> = {
  link: 3,
  pass: 0,
  pulse: 0,
  web: 0,
};

const APPS = resolve(HERE, "../../../../monorepo/apps");

const EXTENSIONS = [".css", ".ts", ".tsx", ".js", ".jsx"];

function offPaletteColours(app: string): number {
  const root = resolve(APPS, app, "src");
  if (!existsSync(root)) return 0;
  const known = new Set(monorepo.values());
  let count = 0;

  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = resolve(dir, entry.name);
      if (entry.isDirectory()) {
        walk(path);
        continue;
      }
      if (!EXTENSIONS.some((extension) => entry.name.endsWith(extension))) continue;
      const matches = readFileSync(path, "utf8").match(/#[0-9a-fA-F]{3,8}/g);
      for (const hex of matches ?? []) {
        const full =
          hex.length === 4
            ? "#" + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3]
            : hex.slice(0, 7);
        if (!known.has(full.toLowerCase())) count += 1;
      }
    }
  };

  walk(root);
  return count;
}

describe.skipIf(!hasMonorepo)("ecosystem ratchet", () => {
  it.each(Object.keys(OFF_PALETTE_BUDGET))(
    "does not add another off-palette colour to %s",
    (app) => {
      const budget = OFF_PALETTE_BUDGET[app] ?? 0;
      expect(offPaletteColours(app)).toBeLessThanOrEqual(budget);
    },
  );
});
