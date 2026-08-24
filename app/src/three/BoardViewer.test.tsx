import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./ExplodedBoard", () => ({ default: () => null }));

import BoardViewer from "./BoardViewer";
import { beatsFor } from "./reveal";

const beats = beatsFor("keel");

function partAt(index: number) {
  const beat = beats[index];
  if (!beat) throw new Error(`beat ${index} tidak ada; keel hanya punya ${beats.length}`);
  return beat.part;
}
const TRACK_HEIGHT = 4000;
let travel = 0;
let scrolled = 0;

function rectAt(progress: number): DOMRect {
  return {
    height: TRACK_HEIGHT,
    top: -progress * travel,
    bottom: 0,
    left: 0,
    right: 0,
    width: 800,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect;
}

async function scrollTo(progress: number) {
  scrolled = progress;
  await act(async () => {
    window.dispatchEvent(new Event("scroll"));
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
  });
}

const announcer = () => document.querySelector('[aria-live="polite"]');

beforeEach(() => {
  travel = TRACK_HEIGHT - window.innerHeight;
  scrolled = 0;
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(() => rectAt(scrolled));
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("BoardViewer", () => {
  it("tidak menaruh aria-live pada keterangan yang berubah tiap gulir", () => {
    render(<BoardViewer modelId="keel" />);
    const caption = screen.getByText(partAt(0).part);
    expect(caption.closest("[aria-live]")).toBeNull();
  });

  it("menyediakan satu live region khusus yang tersembunyi", () => {
    render(<BoardViewer modelId="keel" />);
    expect(document.querySelectorAll('[aria-live]')).toHaveLength(1);
    expect(announcer()).toHaveClass("sr-only");
  });

  it("menahan penanda penggaris di dalam wadahnya pada gulir penuh", async () => {
    render(<BoardViewer modelId="keel" />);
    const mark = document.querySelector<HTMLElement>(".inset-y-1");
    if (!mark) throw new Error("penanda penggaris tidak ditemukan");

    expect(mark.style.left).toBe("calc(0.5rem + 0 * (100% - 1rem))");

    await scrollTo(1);

    expect(mark.style.left).not.toBe("100%");
    expect(mark.style.left).toContain("calc");
    expect(mark.style.left).toContain("100% - 1rem");
  });

  it("menggerakkan penanda sebanding dengan kemajuan gulir", async () => {
    render(<BoardViewer modelId="keel" />);
    const mark = document.querySelector<HTMLElement>(".inset-y-1");
    if (!mark) throw new Error("penanda penggaris tidak ditemukan");

    await scrollTo(0.25);
    const quarter = mark.style.left;
    await scrollTo(0.75);

    expect(quarter).not.toBe(mark.style.left);
    expect(quarter).toContain("0.25");
    expect(mark.style.left).toContain("0.75");
  });

  it("belum mengumumkan apa pun sebelum gulir berhenti", async () => {
    render(<BoardViewer modelId="keel" />);
    expect(announcer()).toHaveTextContent("");

    await scrollTo((2 + 0.5) / beats.length);
    expect(announcer()).toHaveTextContent("");
  });

  it("mengumumkan sekali setelah gulir mengendap", async () => {
    render(<BoardViewer modelId="keel" />);
    await scrollTo((2 + 0.5) / beats.length);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 700));
    });

    const target = partAt(2);
    expect(announcer()).toHaveTextContent(`${target.ref} ${target.part}, ${target.role}`);
  });

  it("melewati beat yang tergulir cepat dan hanya menyebut yang terakhir", async () => {
    render(<BoardViewer modelId="keel" />);

    for (const index of [1, 2, 3, 4]) {
      await scrollTo((index + 0.5) / beats.length);
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 80));
      });
      expect(announcer()).toHaveTextContent("");
    }

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 700));
    });

    const last = partAt(4);
    expect(announcer()).toHaveTextContent(`${last.ref} ${last.part}, ${last.role}`);
  });
});
