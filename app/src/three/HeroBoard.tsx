import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sphere, type Object3D } from "three";
import type { BoardModelId } from "../data/models.generated";
import { HERO_ORDER } from "./heroBoards";
import { preloadBoard, useBoardModel } from "./useBoardModel";

const SETTLE_SECONDS = 0.64;

const SETTLE_FROM = -0.38;

const FRAME_RADIUS = 0.05;

function expoOut(t: number): number {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function SettlingBoard({ modelId }: { modelId: BoardModelId }) {
  const { scene, bounds } = useBoardModel(modelId);
  const scale = useMemo(() => {
    const radius = bounds.getBoundingSphere(new Sphere()).radius;
    return radius > 0 ? FRAME_RADIUS / radius : 1;
  }, [bounds]);
  const ref = useRef<Object3D>(null);
  const startedAt = useRef<number | null>(null);
  const settled = useRef(false);
  const shown = useRef(modelId);

  useFrame((state) => {
    if (!ref.current) return;

    if (shown.current !== modelId) {
      shown.current = modelId;
      startedAt.current = null;
      settled.current = false;
    }

    if (settled.current) return;
    if (startedAt.current === null) startedAt.current = state.clock.elapsedTime;

    const elapsed = state.clock.elapsedTime - startedAt.current;
    const t = Math.min(1, elapsed / SETTLE_SECONDS);
    ref.current.rotation.y = SETTLE_FROM * (1 - expoOut(t));

    if (t >= 1) {
      ref.current.rotation.y = 0;
      settled.current = true;
    }
  });

  return <primitive key={modelId} ref={ref} object={scene} scale={scale} dispose={null} />;
}

export default function HeroBoard({ modelId }: { modelId: BoardModelId }) {
  useEffect(() => {
    let cancelled = false;
    const idle =
      window.requestIdleCallback ??
      ((cb: IdleRequestCallback) => window.setTimeout(() => cb({} as IdleDeadline), 1500));
    const cancelIdle = window.cancelIdleCallback ?? window.clearTimeout;
    const handle = idle(() => {
      if (cancelled) return;
      for (const id of HERO_ORDER) preloadBoard(id);
    });
    return () => {
      cancelled = true;
      cancelIdle(handle);
    };
  }, []);

  return <SettlingBoard modelId={modelId} />;
}
