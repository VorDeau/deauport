import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import StatusBadge from "./StatusBadge";
import type { Board } from "../data/types";

const board = (overrides: Partial<Board>): Board => ({
  slug: "x",
  designation: "deltaT00",
  codename: null,
  stage: "design-complete",
  fabricated: false,
  summary: "",
  dimensions: "",
  mainIc: "",
  modelId: null,
  repo: { url: "https://example.test", published: true },
  highlights: [],
  ...overrides,
});

describe("StatusBadge", () => {
  it("menyebut papan yang belum difabrikasi apa adanya", () => {
    render(<StatusBadge board={board({ fabricated: false })} />);
    expect(screen.getByText(/not yet fabricated/i)).toBeInTheDocument();
  });

  it("menandai papan yang sudah jadi barang fisik", () => {
    render(<StatusBadge board={board({ fabricated: true, stage: "archived" })} />);
    expect(screen.getByText(/fabricated/i)).toBeInTheDocument();
    expect(screen.queryByText(/not yet/i)).not.toBeInTheDocument();
  });

  it("tidak pernah memakai kata shipped untuk hardware", () => {
    const { container } = render(<StatusBadge board={board({ fabricated: true })} />);
    expect(container.textContent?.toLowerCase()).not.toContain("shipped");
  });
});
