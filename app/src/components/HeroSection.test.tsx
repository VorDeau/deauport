import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HeroSection from "./HeroSection";
import { useRenderMode } from "../three/useRenderMode";

vi.mock("../three/useRenderMode", () => ({
  useRenderMode: vi.fn(),
}));

vi.mock("../three/HeroStage", () => ({
  default: ({ modelId }: { modelId: string }) => <div>{`hero-stage:${modelId}`}</div>,
}));

const mockUseRenderMode = vi.mocked(useRenderMode);

afterEach(() => {
  vi.useRealTimers();
});

describe("HeroSection", () => {
  it("renders the text fallback and never mounts the lazy stage when render mode is static", async () => {
    mockUseRenderMode.mockReturnValue("static");
    render(<HeroSection />);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(screen.getByText(/3D view disabled/i)).toBeInTheDocument();
    expect(screen.getByText(/\d+ components, \d+ board layers/i)).toBeInTheDocument();
    expect(screen.queryByText(/^hero-stage:/)).not.toBeInTheDocument();
  });

  it("mounts the lazy stage instead of the fallback when render mode is full", async () => {
    mockUseRenderMode.mockReturnValue("full");
    render(<HeroSection />);

    expect(await screen.findByText("hero-stage:fides")).toBeInTheDocument();
    expect(screen.queryByText(/3D view disabled/i)).not.toBeInTheDocument();
  });

  it("shows the board the reader picked, and names which one that is", async () => {
    mockUseRenderMode.mockReturnValue("full");
    render(<HeroSection />);

    expect(await screen.findByText("hero-stage:fides")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "deltaT35" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await userEvent.click(screen.getByRole("button", { name: "deltaT52" }));

    expect(await screen.findByText("hero-stage:interim")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "deltaT52" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "deltaT35" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });
  it("never changes the board on its own", async () => {
    mockUseRenderMode.mockReturnValue("full");
    render(<HeroSection />);
    expect(await screen.findByText("hero-stage:fides")).toBeInTheDocument();

    vi.useFakeTimers();
    await act(async () => {
      vi.advanceTimersByTime(60_000);
    });

    expect(screen.getByText("hero-stage:fides")).toBeInTheDocument();
  });
});
