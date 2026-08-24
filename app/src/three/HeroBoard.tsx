import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sphere, Vector3, type Group } from "three";
import type { BoardModelId } from "../data/models.generated";
import { HERO_ORDER } from "./heroBoards";
import { preloadBoard, useBoardModel } from "./useBoardModel";

const SETTLE_SECONDS = 0.9;

const SETTLE_FROM = -0.3;

const SETTLE_SCALE = 0.93;

const FRAME_RADIUS = 0.058;

function smootherstep(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function SettlingBoard({ modelId }: { modelId: BoardModelId }) {
  const { scene, bounds } = useBoardModel(modelId);
  const fit = useMemo(() => {
    const radius = bounds.getBoundingSphere(new Sphere()).radius;
    const scale = radius > 0 ? FRAME_RADIUS / radius : 1;
    const centre = bounds.getCenter(new Vector3()).multiplyScalar(-scale);
    return { scale, centre };
  }, [bounds]);
  const scale = fit.scale;
  const ref = useRef<Group>(null);
  const startedAt = useRef<number | null>(null);
  const settled = useRef(false);
  const shown = useRef(modelId);

  useFrame((state) => {
    const node = ref.current;
    if (!node) return;

    if (shown.current !== modelId) {
      shown.current = modelId;
      startedAt.current = null;
      settled.current = false;
    }

    if (settled.current) return;
    if (startedAt.current === null) startedAt.current = state.clock.elapsedTime;

    const elapsed = state.clock.elapsedTime - startedAt.current;
    const t = Math.min(1, elapsed / SETTLE_SECONDS);
    const eased = smootherstep(t);

    node.rotation.y = SETTLE_FROM * (1 - eased);
    node.scale.setScalar(SETTLE_SCALE + (1 - SETTLE_SCALE) * eased);

    if (t >= 1) {
      node.rotation.y = 0;
      node.scale.setScalar(1);
      settled.current = true;
    }
  });

  return (
    <group ref={ref}>
      <primitive
        key={modelId}
        object={scene}
        scale={scale}
        position={[fit.centre.x, fit.centre.y, fit.centre.z]}
        dispose={null}
      />
    </group>
  );
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
