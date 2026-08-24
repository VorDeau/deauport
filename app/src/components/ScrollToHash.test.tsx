import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";
import { MemoryRouter, useNavigate } from "react-router";
import ScrollToHash from "./ScrollToHash";

const scrollIntoView = vi.fn();
const scrollTo = vi.fn();

beforeEach(() => {
  Element.prototype.scrollIntoView = scrollIntoView;
  window.scrollTo = scrollTo as unknown as typeof window.scrollTo;
  scrollIntoView.mockClear();
  scrollTo.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ScrollToHash />
      <section id="hardware">boards</section>
    </MemoryRouter>,
  );
}

describe("ScrollToHash", () => {
  it("scrolls to the element named by the fragment", () => {
    renderAt("/#hardware");
    expect(scrollIntoView).toHaveBeenCalledOnce();
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth" });
  });

  it("jumps instead of animating when the visitor asked for reduced motion", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true,
      media: "(prefers-reduced-motion: reduce)",
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });
    renderAt("/#hardware");
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "auto" });
  });

  it("does nothing without a fragment", () => {
    renderAt("/");
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("does nothing when the fragment names no element on the page", () => {
    renderAt("/#nowhere");
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
  it("does not scroll to the top on the first render", () => {
    renderAt("/");
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("scrolls to the top when the route changes with no fragment", () => {
    let go: (to: string) => void = () => {};
    function Probe() {
      go = useNavigate();
      return null;
    }
    render(
      <MemoryRouter initialEntries={["/"]}>
        <ScrollToHash />
        <Probe />
        <section id="hardware">boards</section>
      </MemoryRouter>,
    );
    expect(scrollTo).not.toHaveBeenCalled();

    act(() => go("/hardware/keel"));
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });

  it("leaves the scroll alone when only the fragment changes", () => {
    let go: (to: string) => void = () => {};
    function Probe() {
      go = useNavigate();
      return null;
    }
    render(
      <MemoryRouter initialEntries={["/"]}>
        <ScrollToHash />
        <Probe />
        <section id="hardware">boards</section>
      </MemoryRouter>,
    );

    act(() => go("/#hardware"));
    expect(scrollTo).not.toHaveBeenCalled();
    expect(scrollIntoView).toHaveBeenCalled();
  });
});
