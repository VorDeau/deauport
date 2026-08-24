import { useMemo, useRef, type RefObject } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Box3, Vector3, type Group, type Object3D } from "three";
import {
  layerOffset,
  placementOf,
  resolveComponentName,
  separationOffset,
  slabOf,
  type Placement,
} from "./explode";

const offset = new Vector3();

const LAYER_MIN = 5;

const TURN_RATE = 2.6;

function shortestTurn(from: number, to: number): number {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

type Part = {
  node: Object3D;
  home: Vector3;
  centre: Vector3;
  placement: Placement;
  order: number;
  layered: boolean;
};

export default function ExplodeRig({
  scene,
  components,
  layers,
  groups,
  hiddenLayers,
  progress,
  onHover,
}: {
  scene: Object3D;
  components: readonly string[];
  layers: readonly string[];
  groups: readonly (readonly string[])[];
  hiddenLayers: ReadonlySet<string>;
  progress: RefObject<number>;
  onHover: (name: string | null) => void;
}) {
  const componentSet = useMemo(() => new Set(components), [components]);
  const orderIndex = useMemo(() => {
    const map = new Map<string, number>();
    groups.forEach((members, index) => {
      for (const name of members) if (!map.has(name)) map.set(name, index);
    });
    return map;
  }, [groups]);
  const layeredGroups = useMemo(
    () => new Set(groups.map((members, index) => (members.length >= LAYER_MIN ? index : -1))),
    [groups],
  );

  const rest = useMemo(() => {
    const bounds = new Box3().setFromObject(scene);
    const boardCentre = bounds.getCenter(new Vector3());
    const size = bounds.getSize(new Vector3());
    const span = Math.max(size.x, size.z);
    const slab = slabOf(scene, layers);

    const parts: Part[] = [];
    scene.traverse((child) => {
      if (!child.name || !componentSet.has(child.name)) return;
      const box = new Box3().setFromObject(child);
      parts.push({
        node: child,
        home: child.position.clone(),
        centre: box.getCenter(new Vector3()),
        placement: placementOf(box, slab),
        order: orderIndex.get(child.name) ?? -1,
        layered: layeredGroups.has(orderIndex.get(child.name) ?? -1),
      });
    });

    const byOrder: (Part | undefined)[] = [];
    for (const part of parts) if (part.order >= 0) byOrder[part.order] = part;

    return { boardCentre, span, parts, byOrder };
  }, [scene, componentSet, orderIndex, layeredGroups, layers]);

  const applied = useRef(Number.NaN);
  const pivot = useRef<Group>(null);

  scene.traverse((child) => {
    if (child.name) child.visible = !hiddenLayers.has(child.name);
  });

  useFrame((state, delta) => {
    const value = progress.current ?? 0;
    const reached = value * groups.length;

    const focus = value <= 0 ? null : rest.byOrder[Math.min(groups.length - 1, Math.floor(reached))];
    let aim = 0;
    if (focus) {
      const cam = state.camera.position;
      aim =
        Math.atan2(cam.x, cam.z) -
        Math.atan2(focus.centre.x - rest.boardCentre.x, focus.centre.z - rest.boardCentre.z);
    }
    const turntable = pivot.current;
    if (turntable) {
      turntable.rotation.y +=
        shortestTurn(turntable.rotation.y, aim) *
        (1 - Math.exp(-TURN_RATE * Math.min(delta, 0.1)));
    }

    if (Math.abs(value - applied.current) < 0.0005) return;
    applied.current = value;

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
        .add(
          part.layered
            ? layerOffset(part.placement, rest.span, eased, offset)
            : separationOffset(
                part.placement,
                part.centre,
                rest.boardCentre,
                rest.span,
                eased,
                offset,
              ),
        );
    }
  });

  return (
    <group ref={pivot}>
      <group position={[-rest.boardCentre.x, -rest.boardCentre.y, -rest.boardCentre.z]}>
        <primitive
          object={scene}
          onPointerOver={(event: ThreeEvent<PointerEvent>) => {
            event.stopPropagation();
            onHover(resolveComponentName(event.object, componentSet));
          }}
          onPointerOut={() => onHover(null)}
        />
      </group>
    </group>
  );
}
