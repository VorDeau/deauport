import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ErrorBoundary from "./ErrorBoundary";

function Boom(): never {
  throw new Error("boom");
}

describe("ErrorBoundary", () => {
  it("passes children straight through when nothing throws", () => {
    render(
      <ErrorBoundary fallback={<p>fallback</p>}>
        <p>the real thing</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText("the real thing")).toBeInTheDocument();
    expect(screen.queryByText("fallback")).not.toBeInTheDocument();
  });

  it("swaps in the fallback and leaves the rest of the page standing", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <div>
        <h1>the page</h1>
        <ErrorBoundary fallback={<p>3D view disabled.</p>}>
          <Boom />
        </ErrorBoundary>
      </div>,
    );

    expect(screen.getByRole("heading", { name: "the page" })).toBeInTheDocument();
    expect(screen.getByText("3D view disabled.")).toBeInTheDocument();

    consoleError.mockRestore();
  });
});
