import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import BoardDetail from "./BoardDetail";
import { useRenderMode } from "../three/useRenderMode";

vi.mock("../three/useRenderMode", () => ({
  useRenderMode: vi.fn(),
}));

vi.mock("../three/BoardViewer", () => ({
  default: () => <div>board-viewer-mounted</div>,
}));

const mockUseRenderMode = vi.mocked(useRenderMode);

beforeEach(() => {
  mockUseRenderMode.mockReturnValue("static");
});

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/hardware/:slug" element={<BoardDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("BoardDetail", () => {
  it("menampilkan designation dan codename", () => {
    renderAt("/hardware/keel");
    expect(screen.getByRole("heading", { name: /deltaT26/i })).toBeInTheDocument();
  });

  it("menandai repo yang belum dipublikasikan tanpa tautan aktif", () => {
    renderAt("/hardware/fides");
    expect(screen.getByText(/repo pending/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /source/i })).not.toBeInTheDocument();
  });

  it("memberi tautan aktif untuk repo publik", () => {
    renderAt("/hardware/deltat32");
    expect(screen.getByRole("link", { name: /source/i })).toHaveAttribute(
      "href",
      "https://github.com/Kleavox/deltaT32",
    );
  });

  it("mendaftar komponen sebagai teks untuk papan yang punya model", () => {
    renderAt("/hardware/interim");
    expect(screen.getByText("U4")).toBeInTheDocument();
  });

  it("tetap tampil untuk papan tanpa model 3D", () => {
    renderAt("/hardware/paritas");
    expect(screen.getByRole("heading", { name: /deltaT20/i })).toBeInTheDocument();
  });

  it("menampilkan 404 untuk slug tak dikenal", () => {
    renderAt("/hardware/entah");
    expect(screen.getByText(/no board/i)).toBeInTheDocument();
  });

  it("renders the text fallback and never mounts the lazy viewer when render mode is static", async () => {
    mockUseRenderMode.mockReturnValue("static");
    renderAt("/hardware/interim");

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(screen.getByText(/3D view disabled/i)).toBeInTheDocument();
    expect(screen.getByText(/\d+ components, \d+ board layers/i)).toBeInTheDocument();
    expect(screen.queryByText("board-viewer-mounted")).not.toBeInTheDocument();
  });

  it("mounts the lazy viewer instead of the fallback when render mode is full", async () => {
    mockUseRenderMode.mockReturnValue("full");
    renderAt("/hardware/interim");

    expect(await screen.findByText("board-viewer-mounted")).toBeInTheDocument();
    expect(screen.queryByText(/3D view disabled/i)).not.toBeInTheDocument();
  });
});
