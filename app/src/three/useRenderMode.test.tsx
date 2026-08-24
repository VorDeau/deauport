import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { detectRenderMode } from "./useRenderMode";

function fakeWindow(options: {
  reducedMotion?: boolean;
  saveData?: boolean;
  webgl?: boolean;
}): Window {
  return {
    matchMedia: (query: string) => ({
      matches: query.includes("reduced-motion") ? options.reducedMotion === true : false,
    }),
    navigator: { connection: { saveData: options.saveData === true } },
    document: {
      createElement: () => ({
        getContext: (kind: string) =>
          options.webgl !== false && kind.startsWith("webgl") ? {} : null,
      }),
    },
  } as unknown as Window;
}

describe("detectRenderMode", () => {
  it("penuh saat semua mendukung", () => {
    expect(detectRenderMode(fakeWindow({}))).toBe("full");
  });

  it("statis saat pengguna minta gerak dikurangi", () => {
    expect(detectRenderMode(fakeWindow({ reducedMotion: true }))).toBe("static");
  });

  it("statis saat mode hemat data aktif", () => {
    expect(detectRenderMode(fakeWindow({ saveData: true }))).toBe("static");
  });

  it("statis saat WebGL tidak tersedia", () => {
    expect(detectRenderMode(fakeWindow({ webgl: false }))).toBe("static");
  });
});

describe("useRenderMode", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it("sudah tahu modenya pada render pertama, tanpa menunggu effect", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      {} as unknown as RenderingContext,
    );
    const { useRenderMode } = await import("./useRenderMode");

    const seen: string[] = [];
    function Probe() {
      seen.push(useRenderMode());
      return null;
    }
    render(<Probe />);

    expect(seen[0]).toBe("full");
    expect(new Set(seen)).toEqual(new Set(["full"]));
  });

  it("tidak berpindah mode setelah mount, jadi tidak ada tukar tata letak", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const { useRenderMode } = await import("./useRenderMode");

    const seen: string[] = [];
    function Probe() {
      seen.push(useRenderMode());
      return null;
    }
    render(<Probe />);
    await new Promise((resolve) => setTimeout(resolve, 30));

    expect(new Set(seen)).toEqual(new Set(["static"]));
  });

  it("mendeteksi sekali saja walau dipakai beberapa komponen", async () => {
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue({} as unknown as RenderingContext);
    const { useRenderMode } = await import("./useRenderMode");

    function Probe() {
      useRenderMode();
      return null;
    }
    render(
      <>
        <Probe />
        <Probe />
        <Probe />
      </>,
    );

    expect(getContext).toHaveBeenCalledTimes(1);
  });
});
