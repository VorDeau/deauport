import { type Object3D, Vector3 } from "three";

const VERTICAL_GAIN = 6;

export function explodeOffset(
  centre: Vector3,
  boardCentre: Vector3,
  amount: number,
  spread: number,
  out: Vector3 = new Vector3(),
): Vector3 {
  out.copy(centre).sub(boardCentre);
  if (out.lengthSq() === 0) return out.set(0, amount * spread * VERTICAL_GAIN * 0.05, 0);

  out.y *= VERTICAL_GAIN;
  return out.multiplyScalar(amount * spread);
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
