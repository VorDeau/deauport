import { Box3, type Object3D, Vector3 } from "three";

const FACE_LIFT = 0.27;

const FACE_SPREAD = 0.11;

const EDGE_SPREAD = 0.34;

export type Placement = "top" | "bottom" | "edge";

export function placementOf(part: Box3, slab: Box3): Placement {
  const thickness = Math.max(slab.max.y - slab.min.y, 1e-9);
  const margin = thickness * 0.5;
  const above = part.max.y - slab.max.y;
  const below = slab.min.y - part.min.y;

  if (above > margin && below > margin) return "edge";
  if (above <= margin && below <= margin) return "edge";
  return above >= below ? "top" : "bottom";
}

const LAYER_LIFT = 0.3;

export function layerOffset(
  placement: Placement,
  span: number,
  amount: number,
  out: Vector3 = new Vector3(),
): Vector3 {
  const sign = placement === "bottom" ? -1 : 1;
  return out.set(0, span * LAYER_LIFT * amount * sign, 0);
}

export function separationOffset(
  placement: Placement,
  centre: Vector3,
  boardCentre: Vector3,
  span: number,
  amount: number,
  out: Vector3 = new Vector3(),
): Vector3 {
  const dx = centre.x - boardCentre.x;
  const dz = centre.z - boardCentre.z;
  const radial = Math.hypot(dx, dz);
  const ux = radial > 1e-9 ? dx / radial : 1;
  const uz = radial > 1e-9 ? dz / radial : 0;

  if (placement === "edge") {
    const reach = span * EDGE_SPREAD * amount;
    return out.set(ux * reach, 0, uz * reach);
  }

  const drift = span * FACE_SPREAD * amount;
  const lift = span * FACE_LIFT * amount * (placement === "top" ? 1 : -1);
  return out.set(ux * drift, lift, uz * drift);
}

export function slabOf(scene: Object3D, layers: readonly string[]): Box3 {
  const slab = new Box3();
  const named = new Set(layers);
  let found = false;

  scene.traverse((child) => {
    if (!child.name || !named.has(child.name)) return;
    slab.union(new Box3().setFromObject(child));
    found = true;
  });

  if (found) return slab;

  const whole = new Box3().setFromObject(scene);
  if (whole.isEmpty()) return new Box3(new Vector3(), new Vector3());

  const middle = (whole.min.y + whole.max.y) / 2;
  const sliver = Math.max((whole.max.y - whole.min.y) * 0.05, 1e-6);
  whole.min.y = middle - sliver;
  whole.max.y = middle + sliver;
  return whole;
}

export function resolveComponentName(
  object: Object3D | null,
  components: ReadonlySet<string>,
): string | null {
  let current: Object3D | null = object;
  while (current) {
    if (current.name && components.has(current.name)) return current.name;
    current = current.parent;
  }
  return null;
}
