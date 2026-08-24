import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, MemoryRouter, Route, Routes } from "react-router";
import BoardDetail from "./BoardDetail";
import { useRenderMode } from "../three/useRenderMode";

vi.mock("../three/useRenderMode", () => ({ useRenderMode: vi.fn() }));

vi.mock("../three/BoardViewer", () => ({
  default: ({ modelId }: { modelId: string }) => {
    if (modelId === "interim") throw new Error("simulated WebGL failure");
    return <div>board-viewer-mounted</div>;
  },
}));

let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.mocked(useRenderMode).mockReturnValue("full");
  consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("BoardDetail error boundary", () => {
  it("recovers on the next board instead of latching failed for the session", async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <MemoryRouter initialEntries={["/hardware/interim"]}>
        <Link to="/hardware/keel">next board</Link>
        <Routes>
          <Route path="/hardware/:slug" element={<BoardDetail />} />
        </Routes>
      </MemoryRouter>,
    );

    await vi.waitFor(() =>
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining("3D view failed"),
        expect.anything(),
        expect.anything(),
      ),
    );
    expect(screen.getByText(/3D view disabled/i)).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: /next board/i }));

    expect(await screen.findByText("board-viewer-mounted")).toBeInTheDocument();
    expect(screen.queryByText(/3D view disabled/i)).not.toBeInTheDocument();
  });
});
