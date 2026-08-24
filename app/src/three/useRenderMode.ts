import { useState } from "react";

export type RenderMode = "full" | "static";

export function detectRenderMode(win: Window): RenderMode {
  if (win.matchMedia("(prefers-reduced-motion: reduce)").matches) return "static";

  const connection = (win.navigator as Navigator & { connection?: { saveData?: boolean } })
    .connection;
  if (connection?.saveData) return "static";

  try {
    const canvas = win.document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (!gl) return "static";
  } catch {
    return "static";
  }
  return "full";
}

let detected: RenderMode | null = null;

export function useRenderMode(): RenderMode {
  const [mode] = useState<RenderMode>(() => {
    if (typeof window === "undefined") return "static";
    if (detected === null) detected = detectRenderMode(window);
    return detected;
  });
  return mode;
}
