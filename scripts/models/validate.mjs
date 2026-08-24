import { vec3 } from "gl-matrix";
import { DESIGNATOR, isJunkName } from "./normalize.mjs";

const topNodes = (doc) => doc.getRoot().listScenes()[0].listChildren();

export function collectEntities(doc) {
  const all = topNodes(doc).map((n) => n.getName());
  return {
    all,
    designators: all.filter((n) => DESIGNATOR.test(n)),
    junk: all.filter((n) => isJunkName(n)),
    layers: all.filter((n) => !DESIGNATOR.test(n) && !isJunkName(n)),
  };
}

export function validateStructure(doc, spec) {
  const errors = [];
  const found = collectEntities(doc);

  if (found.designators.length !== spec.designators) {
    errors.push(
      `jumlah designator ${found.designators.length}, seharusnya ${spec.designators}`,
    );
  }
  for (const name of found.junk) {
    errors.push(`node bernama sampah tersisa: "${name}"`);
  }
  for (const layer of spec.layers) {
    if (!found.all.includes(layer)) errors.push(`node layer hilang: "${layer}"`);
  }
  for (const extra of spec.extras) {
    if (!found.all.includes(extra)) errors.push(`node tambahan hilang: "${extra}"`);
  }
  return errors;
}

export function boundingBoxes(doc) {
  const boxes = new Map();
  const walk = (node) => {
    if (node.getName()) {
      const min = [Infinity, Infinity, Infinity];
      const max = [-Infinity, -Infinity, -Infinity];
      const accumulate = (n) => {
        const matrix = n.getWorldMatrix();
        const mesh = n.getMesh();
        if (mesh) {
          for (const prim of mesh.listPrimitives()) {
            const position = prim.getAttribute("POSITION");
            if (!position) continue;
            const v = [0, 0, 0];
            for (let i = 0; i < position.getCount(); i++) {
              position.getElement(i, v);
              vec3.transformMat4(v, v, matrix);
              for (let k = 0; k < 3; k++) {
                if (v[k] < min[k]) min[k] = v[k];
                if (v[k] > max[k]) max[k] = v[k];
              }
            }
          }
        }
        n.listChildren().forEach(accumulate);
      };
      accumulate(node);
      if (Number.isFinite(min[0])) {
        boxes.set(node.getName(), {
          centre: min.map((v, i) => (v + max[i]) / 2),
          size: min.map((v, i) => max[i] - v),
        });
      }
    }
    node.listChildren().forEach(walk);
  };
  topNodes(doc).forEach(walk);
  return boxes;
}

export function compareBoundingBoxes(before, after, toleranceMetres) {
  const errors = [];
  for (const [name, box] of after) {
    const original = before.get(name);
    if (!original) continue;
    const drift = vec3.distance(original.centre, box.centre);
    if (drift > toleranceMetres) {
      errors.push(`"${name}" bergeser ${(drift * 1000).toFixed(3)} mm`);
    }
  }
  return errors;
}
