import { useMemo, useRef, type RefObject } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Box3, Vector3, type Object3D } from "three";
import { explodeOffset, resolveComponentName } from "./explode";

const SPREAD = 0.5;

const LIFT = 0.32;

const lift = new Vector3();
const offset = new Vector3();

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

type Part = {
  node: Object3D;
  home: Vector3;
  centre: Vector3;
  face: number;
  order: number;
};

export default function ExplodeRig({
  scene,
  components,
  order,
  hiddenLayers,
  progress,
  onHover,
}: {
  scene: Object3D;
  components: readonly string[];
  order: readonly string[];
  hiddenLayers: ReadonlySet<string>;
  progress: RefObject<number>;
  onHover: (name: string | null) => void;
}) {
  const componentSet = useMemo(() => new Set(components), [components]);
  const orderIndex = useMemo(() => {
    const map = new Map<string, number>();
    order.forEach((name, index) => map.set(name, index));
    return map;
  }, [order]);

  const rest = useMemo(() => {
    const bounds = new Box3().setFromObject(scene);
    const boardCentre = bounds.getCenter(new Vector3());
    const size = bounds.getSize(new Vector3());
    const span = Math.max(size.x, size.z);

    const parts: Part[] = [];
    scene.traverse((child) => {
      if (!child.name || !componentSet.has(child.name)) return;
      const centre = new Box3().setFromObject(child).getCenter(new Vector3());
      parts.push({
        node: child,
        home: child.position.clone(),
        centre,
        face: centre.y >= boardCentre.y ? 1 : -1,
        order: orderIndex.get(child.name) ?? -1,
      });
    });

    return { boardCentre, span, parts };
  }, [scene, componentSet, orderIndex]);

  const applied = useRef(Number.NaN);

  scene.traverse((child) => {
    if (child.name) child.visible = !hiddenLayers.has(child.name);
  });

  useFrame(() => {
    const value = progress.current ?? 0;
    if (Math.abs(value - applied.current) < 0.0005) return;
    applied.current = value;

    const reached = value * order.length;

    for (let i = 0; i < rest.parts.length; i += 1) {
      const part = rest.parts[i];
      if (!part) continue;

      const local = part.order < 0 ? 0 : Math.min(1, Math.max(0, reached - part.order));
      if (local <= 0) {
        part.node.position.copy(part.home);
        continue;
      }

      const eased = smoothstep(local);
      part.node.position
        .copy(part.home)
        .add(explodeOffset(part.centre, rest.boardCentre, eased, SPREAD, offset))
        .add(lift.set(0, rest.span * LIFT * eased * part.face, 0));
    }
  });

  return (
    <primitive
      object={scene}
      onPointerOver={(event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        onHover(resolveComponentName(event.object, componentSet));
      }}
      onPointerOut={() => onHover(null)}
    />
  );
}
