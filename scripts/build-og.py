#!/usr/bin/env python3
"""Compose the social preview cards in app/public/og/.

The board renders come from the site itself rather than from a second
rendering path, so the picture in a link preview is the same picture the page
shows. Capturing them is manual, because a headless WebGL render in CI is a
whole dependency tree for three images that change only when a board does:

    1. serve app/dist and open /hardware/<slug>/
    2. scroll until the walkthrough mounts and the board is whole
    3. hide the chrome, so only the canvas and its glow remain:
         document.querySelectorAll(
           'header.sticky, svg, ul.pointer-events-none, div.pointer-events-none'
         ).forEach(e => { e.style.display = 'none' })
    4. move the pointer off the board, screenshot the viewport, save it
    5. pass the files to this script

    python scripts/build-og.py keel=<shot.jpg> interim=<shot.jpg> fides=<shot.jpg>

Everything else here is deterministic: the crop is found from the pixels, and
the text is read out of app/src/data/boards.ts and profile.ts so a card can
never disagree with the page it previews.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "app" / "public" / "og"
BOARDS = ROOT / "app" / "src" / "data" / "boards.ts"
PROFILE = ROOT / "app" / "src" / "data" / "profile.ts"

CARD = (1200, 630)
BASE = (7, 9, 8)
INK = (239, 245, 240)
MUTED = (132, 147, 138)
QUIET = (118, 133, 124)
GOLD = (217, 164, 65)
LINE = (34, 43, 38)

MONO = "C:/Windows/Fonts/consola.ttf"
MONO_BOLD = "C:/Windows/Fonts/consolab.ttf"


def field(block: str, name: str) -> str | None:
    """Read one string field, whether it sits inline or wrapped to the next line."""
    match = re.search(name + r':\s*(?:\n\s*)?"((?:[^"\\]|\\.)*)"', block)
    return match.group(1).replace('\\"', '"') if match else None


def load_boards() -> dict[str, dict[str, str | None]]:
    blocks = BOARDS.read_text(encoding="utf-8").split("\n  {\n")[1:]
    boards = {}
    for block in blocks:
        slug = field(block, "slug")
        if not slug:
            continue
        boards[slug] = {
            "designation": field(block, "designation"),
            "codename": field(block, "codename"),
            "mainIc": field(block, "mainIc"),
            "dimensions": field(block, "dimensions"),
            "fabricated": "fabricated: true" in block,
        }
    return boards


def board_bbox(image: Image.Image) -> tuple[int, int, int, int]:
    """Find the board in the shot.

    The glow behind it is a gradient, so a plain non-black test would swallow
    the whole frame. The board sits far brighter than the glow ever gets, so a
    luminance threshold separates them cleanly; the fallback keeps this honest
    if a future render breaks that assumption rather than silently cropping to
    nothing.
    """
    mask = image.convert("L").point(lambda value: 255 if value > 55 else 0)
    box = mask.getbbox()
    if box is None or (box[2] - box[0]) < 80 or (box[3] - box[1]) < 80:
        width, height = image.size
        return (width // 6, height // 8, width * 5 // 6, height * 7 // 8)
    pad = 24
    return (
        max(0, box[0] - pad),
        max(0, box[1] - pad),
        min(image.width, box[2] + pad),
        min(image.height, box[3] + pad),
    )


def compose(shot: Path, title: str, subtitle: str, meta: str, accent) -> Image.Image:
    card = Image.new("RGB", CARD, BASE)

    source = Image.open(shot).convert("RGB")
    source = source.crop((2, 2, source.width - 24, source.height - 2))
    cropped = source.crop(board_bbox(source))
    plate = (600, 470)
    scale = min(plate[0] / cropped.width, plate[1] / cropped.height, 1.0)
    board = cropped.resize(
        (max(1, int(cropped.width * scale)), max(1, int(cropped.height * scale))),
        Image.LANCZOS,
    )
    feather = Image.new("L", board.size, 255)
    edge = ImageDraw.Draw(feather)
    fade = 46
    for step in range(fade):
        value = int(255 * (step / fade))
        edge.rectangle(
            (step, step, board.width - 1 - step, board.height - 1 - step),
            outline=value,
        )
    card.paste(
        board,
        (1200 - 60 - plate[0] + (plate[0] - board.width) // 2,
         (630 - board.height) // 2),
        feather,
    )

    draw = ImageDraw.Draw(card)
    big = ImageFont.truetype(MONO_BOLD, 60)
    mid = ImageFont.truetype(MONO, 38)
    small = ImageFont.truetype(MONO, 20)

    x = 72
    draw.text((x, 196), title, font=big, fill=INK)
    if subtitle:
        draw.text((x, 272), subtitle, font=mid, fill=accent)
    draw.line((x, 348, x + 96, 348), fill=accent, width=2)
    if meta:
        draw.text((x, 376), meta, font=small, fill=MUTED)
    draw.text((x, 540), field(PROFILE.read_text(encoding="utf-8"), "name") or "",
              font=small, fill=QUIET)
    return card


def main() -> int:
    shots = {}
    for argument in sys.argv[1:]:
        if "=" not in argument:
            print(f"expected slug=path, got {argument!r}", file=sys.stderr)
            return 2
        slug, path = argument.split("=", 1)
        shots[slug] = Path(path)

    if not shots:
        print(__doc__)
        return 2

    OUT.mkdir(parents=True, exist_ok=True)
    boards = load_boards()

    for slug, shot in shots.items():
        board = boards.get(slug)
        if board is None:
            print(f"no board named {slug!r} in boards.ts", file=sys.stderr)
            return 1
        if not shot.exists():
            print(f"missing {shot}", file=sys.stderr)
            return 1
        meta = " · ".join(part for part in [board["mainIc"], board["dimensions"]] if part)
        card = compose(
            shot,
            board["designation"] or slug,
            board["codename"] or "",
            meta,
            GOLD if board["fabricated"] else MUTED,
        )
        card.save(OUT / f"{slug}.png", optimize=True)
        print(f"wrote {OUT / (slug + '.png')}")

    first = next(iter(shots.values()))
    profile = PROFILE.read_text(encoding="utf-8")
    default = compose(
        first,
        field(profile, "name") or "",
        "",
        field(profile, "tagline") or "",
        MUTED,
    )
    default.save(OUT / "default.png", optimize=True)
    print(f"wrote {OUT / 'default.png'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
