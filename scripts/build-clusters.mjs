#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(SCRIPT_DIR, "../app/src/data/clusters.generated.ts");

const SOURCES = {
  keel: "D:/Project/Keel/hardware/deltaT26.kicad_pcb",
  fides: "D:/Project/Fides/hardware/deltaT35.kicad_pcb",
  interim: "D:/Project/Interim/DeltaT52/DeltaT52.kicad_pcb",
  deltat32: [
    "D:/Project/DeltaT32/Hardwares/esp-unit-c3-v3/esp-unit-c3-v3.kicad_pcb",
    "D:/Project/DeltaT32/Hardwares/sensor-bmi-v2/sensor-bmi-v2.kicad_pcb",
  ],
};

const FANOUT_LIMIT = 8;
const PROXIMITY_MM = 9;

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
    blocks.push(text.slice(at, i + 1));
    at = text.indexOf("(footprint ", i + 1);
  }
  return blocks;
}

function parseBoard(file) {
  const text = readFileSync(file, "utf8");
  const parts = [];

  for (const block of footprintBlocks(text)) {
    const ref = block.match(/\(property "Reference" "([^"]+)"/)?.[1];
    if (!ref || ref.startsWith("#")) continue;

    const value = block.match(/\(property "Value" "([^"]*)"/)?.[1] ?? "";
    const place = block.match(/\(at ([-\d.]+) ([-\d.]+)/);
    const nets = new Set();
    for (const match of block.matchAll(/\(net (?:\d+ )?"([^"]*)"\)/g)) nets.add(match[1]);

    parts.push({
      ref,
      value,
      x: place ? Number(place[1]) : 0,
      y: place ? Number(place[2]) : 0,
      nets,
    });
  }
  return parts;
}

const GROUND = /^(a|d|p)?gnd/i;
const SUPPLY = /^\+|vbus|vcc|vdd|vin|vsys|3v3|5v|1v8|vbat/i;

const isGround = (net) => GROUND.test(net);
const isSupply = (net) => !isGround(net) && SUPPLY.test(net);

const FARAD = { p: 1e-12, n: 1e-9, u: 1e-6, "µ": 1e-6, m: 1e-3 };

function farads(value) {
  const match = value.match(/([\d.]+)\s*(p|n|u|µ|m)?F?/i);
  if (!match) return null;
  const unit = match[2];
  const spelled = /F/i.test(value.slice(match.index ?? 0, (match.index ?? 0) + match[0].length));
  if (!unit && !spelled) return null;
  return Number(match[1]) * (unit ? (FARAD[unit.toLowerCase()] ?? 1) : 1);
}

const BULK_FARADS = 1e-5;

export function roleOf(part) {
  const letter = part.ref.replace(/[0-9]+$/, "");
  const nets = [...part.nets];
  const rails = nets.filter(isSupply);
  const grounds = nets.filter(isGround);
  const signals = nets.filter((net) => !isSupply(net) && !isGround(net));

  if (letter === "C") {
    if (rails.length > 0 && grounds.length > 0) {
      const size = farads(part.value);
      return size !== null && size >= BULK_FARADS ? "Bulk Capacitance" : "Decoupling";
    }
    if (signals.length >= 2) return "AC Coupling";
    if (grounds.length > 0 && signals.length > 0) return "Filtering";
    return "Capacitance";
  }

  if (letter === "R" || letter === "L" || letter === "FB") {
    if (grounds.length > 0 && signals.length > 0) return "Pull-Down";
    if (rails.length > 0 && signals.length > 0) return "Pull-Up";
    if (signals.length >= 2) return "Series";
    return "Passive Network";
  }

  return "Passive Network";
}

const kindOf = (ref) => {
  const letter = ref.replace(/[0-9]+$/, "");
  if (letter === "U") return "ic";
  if (letter === "R" || letter === "C" || letter === "L" || letter === "FB") return "passive";
  return "other";
};

function clusterBoard(parts) {
  const fanout = new Map();
  for (const part of parts) {
    for (const net of part.nets) fanout.set(net, (fanout.get(net) ?? 0) + 1);
  }

  const ics = parts.filter((part) => kindOf(part.ref) === "ic");
  const members = new Map(ics.map((ic) => [ic.ref, [ic.ref]]));
  const loose = [];

  for (const part of parts) {
    if (kindOf(part.ref) !== "passive") continue;

    let best = null;
    for (const ic of ics) {
      for (const net of part.nets) {
        if (!ic.nets.has(net)) continue;
        const spread = fanout.get(net) ?? 0;
        if (spread > FANOUT_LIMIT) continue;
        if (!best || spread < best.spread) best = { ic, spread, rule: "net" };
      }
    }

    if (!best) {
      const shares = ics.filter((ic) => [...part.nets].some((net) => ic.nets.has(net)));
      let near = null;
      for (const ic of shares) {
        const distance = Math.hypot(ic.x - part.x, ic.y - part.y);
        if (distance <= PROXIMITY_MM && (!near || distance < near.distance)) {
          near = { ic, distance };
        }
      }
      if (near) best = { ic: near.ic, rule: "proximity" };
    }

    if (best) members.get(best.ic.ref)?.push(part.ref);
    else loose.push(part);
  }

  return { members, loose };
}

const round = (n) => Math.round(n * 100) / 100;

const boards = {};
const missing = [];

for (const [id, entry] of Object.entries(SOURCES)) {
  // deltaT32 is one model built from two boards, so its netlist is the union of
  // both. Their designators are numbered apart, so nothing collides.
  const files = Array.isArray(entry) ? entry : [entry];
  const absent = files.filter((file) => !existsSync(file));
  if (absent.length > 0) {
    missing.push(`${id}: ${absent.join(", ")}`);
    continue;
  }
  const parts = files.flatMap((file) => parseBoard(file));
  const icCount = parts.filter((part) => kindOf(part.ref) === "ic").length;
  const netted = parts.filter((part) => part.nets.size > 0).length;
  if (icCount === 0 || netted === 0) {
    console.error(
      `${id}: parsed ${parts.length} footprints but found ${icCount} ICs and ${netted} with nets - the file shape must have changed`,
    );
    process.exit(1);
  }
  const { members, loose } = clusterBoard(parts);
  const byRole = new Map();
  for (const part of loose) {
    const role = roleOf(part);
    if (!byRole.has(role)) byRole.set(role, []);
    byRole.get(role).push(part.ref);
  }

  const place = {};
  for (const part of parts) place[part.ref] = [round(part.x), round(part.y)];

  boards[id] = {
    place,
    support: Object.fromEntries(
      [...members].map(([ref, group]) => [ref, group.filter((one) => one !== ref).sort()]),
    ),
    roles: [...byRole]
      .map(([role, refs]) => ({ role, refs: refs.sort() }))
      .sort((a, b) => b.refs.length - a.refs.length),
  };
}

if (missing.length > 0) {
  console.error("PCB source not found:\n  " + missing.join("\n  "));
  process.exit(1);
}

const body = Object.entries(boards)
  .map(([id, data]) => {
    const support = Object.entries(data.support)
      .filter(([, group]) => group.length > 0)
      .map(([ref, group]) => `      ${ref}: [${group.map((r) => `"${r}"`).join(", ")}],`)
      .join("\n");
    const loose = data.roles
      .map(
        (entry) =>
          `      { role: "${entry.role}", refs: [${entry.refs.map((r) => `"${r}"`).join(", ")}] },`,
      )
      .join("\n");
    const place = Object.entries(data.place)
      .map(([ref, [x, y]]) => `      ${/^[A-Za-z_$][\w$]*$/.test(ref) ? ref : `"${ref}"`}: [${x}, ${y}],`)
      .join("\n");
    return `  ${id}: {\n    place: {\n${place}\n    },\n    support: {\n${support}\n    },\n    roles: [\n${loose}\n    ],\n  },`;
  })
  .join("\n");

writeFileSync(
  OUT,
  `\nexport const BOARD_CLUSTERS = {\n${body}\n} as const;\n\nexport type ClusteredBoardId = keyof typeof BOARD_CLUSTERS;\n`,
  "utf8",
);

for (const [id, data] of Object.entries(boards)) {
  const grouped = Object.values(data.support).reduce((sum, group) => sum + group.length, 0);
  const loose = data.roles.map((entry) => `${entry.role} x${entry.refs.length}`).join(", ");
  console.log(
    `${id}: ${Object.values(data.support).filter((g) => g.length > 0).length} ICs carry ${grouped} passives | ${loose || "no leftovers"}`,
  );
}
