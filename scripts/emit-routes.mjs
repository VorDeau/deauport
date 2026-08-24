#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(SCRIPT_DIR, "../app/dist");
const BOARDS = resolve(SCRIPT_DIR, "../app/src/data/boards.ts");
const PROFILE = resolve(SCRIPT_DIR, "../app/src/data/profile.ts");
const source = join(DIST, "index.html");

function fieldOf(block, name) {
  const pattern = new RegExp(
    "(?:^|[^A-Za-z0-9_$])" + name + ':\\s*(?:\\n\\s*)?"((?:[^"\\\\]|\\\\.)*)"',
  );
  const match = block.match(pattern);
  return match ? match[1].replace(/\\"/g, '"') : null;
}

const boards = readFileSync(BOARDS, "utf8")
  .split("\n  {\n")
  .slice(1)
  .map((block) => ({
    slug: fieldOf(block, "slug"),
    designation: fieldOf(block, "designation"),
    codename: fieldOf(block, "codename"),
    summary: fieldOf(block, "summary"),
  }))
  .filter((board) => board.slug);

if (boards.length === 0) {
  console.error(`no boards found in ${BOARDS} - the shape of that file must have changed`);
  process.exit(1);
}

const profileSource = readFileSync(PROFILE, "utf8");
const name = fieldOf(profileSource, "name") ?? "";
const intro = fieldOf(profileSource, "intro") ?? "";

const ORIGIN = (process.env.PUBLIC_PORTFOLIO_ORIGIN ?? "").replace(/\/$/, "");
if (!ORIGIN) {
  console.warn("PUBLIC_PORTFOLIO_ORIGIN unset: emitting without og:url or og:image");
}

const escape = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function ogImageFor(slug) {
  if (!ORIGIN) return null;
  for (const file of [slug ? `og/${slug}.png` : null, "og/default.png"]) {
    if (file && existsSync(join(DIST, file))) return `${ORIGIN}/${file}`;
  }
  return null;
}

function head({ title, description, path, slug }) {
  const image = ogImageFor(slug);
  const tags = [
    `<meta name="description" data-emitted content="${escape(description)}" />`,
    `<meta property="og:title" content="${escape(title)}" />`,
    `<meta property="og:description" content="${escape(description)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${escape(name)}" />`,
  ];
  if (ORIGIN) {
    tags.push(`<meta property="og:url" content="${escape(ORIGIN + path)}" />`);
    tags.push(`<link rel="canonical" href="${escape(ORIGIN + path)}" />`);
  }
  if (image) {
    tags.push(`<meta property="og:image" content="${escape(image)}" />`);
    tags.push(`<meta property="og:image:width" content="1200" />`);
    tags.push(`<meta property="og:image:height" content="630" />`);
    tags.push(`<meta name="twitter:card" content="summary_large_image" />`);
    tags.push(`<meta name="twitter:image" content="${escape(image)}" />`);
  } else {
    tags.push(`<meta name="twitter:card" content="summary" />`);
  }
  tags.push(`<meta name="twitter:title" content="${escape(title)}" />`);
  tags.push(`<meta name="twitter:description" content="${escape(description)}" />`);
  return tags.map((tag) => "    " + tag).join("\n");
}

const MARK_OPEN = "<!-- emit-routes:begin -->";
const MARK_CLOSE = "<!-- emit-routes:end -->";

function strip(html) {
  let out = html;
  for (;;) {
    const open = out.indexOf(MARK_OPEN);
    if (open < 0) return out;
    const close = out.indexOf(MARK_CLOSE, open);
    if (close < 0) return out;
    let start = open;
    while (start > 0 && (out[start - 1] === " " || out[start - 1] === "\t")) start -= 1;
    if (start > 0 && out[start - 1] === "\n") start -= 1;
    out = out.slice(0, start) + out.slice(close + MARK_CLOSE.length);
  }
}

function render(shell, page) {
  const block = "    " + MARK_OPEN + "\n" + head(page) + "\n    " + MARK_CLOSE + "\n  </head>";
  return strip(shell)
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(page.title)}</title>`)
    .replace("</head>", block);
}

const shell = readFileSync(source, "utf8");

writeFileSync(
  source,
  render(shell, {
    title: `${name} · hardware and systems`,
    description: intro,
    path: "/",
    slug: null,
  }),
);

for (const board of boards) {
  const label = board.codename ? `${board.designation} · ${board.codename}` : board.designation;
  const dir = join(DIST, "hardware", board.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, "index.html"),
    render(shell, {
      title: `${label} · ${name}`,
      description: board.summary ?? intro,
      path: `/hardware/${board.slug}`,
      slug: board.slug,
    }),
  );
}

writeFileSync(
  join(DIST, "404.html"),
  render(shell, {
    title: `Not found · ${name}`,
    description: "No route to that page.",
    path: "/404",
    slug: null,
  }),
);

console.log(
  `emitted ${boards.length} board routes + 404.html` +
    (ORIGIN ? ` for ${ORIGIN}` : " without absolute tags"),
);
