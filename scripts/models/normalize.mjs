import { Mesh } from "@gltf-transform/core";
import { transformMesh } from "@gltf-transform/functions";
import { mat4 } from "gl-matrix";

export const DESIGNATOR = /^[A-Z]{1,3}\d+$/;

const JUNK = /^(=>|NAUO|Upper Part|Compound|COMPOUND|Solid|Shape)|^\s*$/;

const IDENTITY = mat4.create();
const isIdentity = (m) => m.every((v, i) => Math.abs(v - IDENTITY[i]) < 1e-9);

export const isJunkName = (name) => !name || JUNK.test(name);

export function isBoundary(child, parent) {
  const name = child.getName();
  const parentName = parent.getName();
  if (isJunkName(name)) return false;
  if (DESIGNATOR.test(parentName)) return false;
  return name !== parentName && name !== `${parentName}_mesh` && name !== `${parentName}_Mesh`;
}

export function collapseEntity(entity) {
  const sealed = DESIGNATOR.test(entity.getName());
  const invRoot = mat4.invert(mat4.create(), entity.getWorldMatrix());
  const nested = [];
  const owned = [];

  if (entity.getMesh()) owned.push(entity);

  const walk = (node) => {
    for (const child of node.listChildren()) {
      if (!sealed && isBoundary(child, node)) {
        nested.push(child);
        continue;
      }
      if (child.getMesh()) owned.push(child);
      walk(child);
    }
  };
  walk(entity);

  const needsMerge = owned.length > 1 || (owned.length === 1 && owned[0] !== entity);
  if (needsMerge) {
    const target = new Mesh(entity.getGraph(), entity.getName());
    for (const src of owned) {
      const rel = mat4.multiply(mat4.create(), invRoot, src.getWorldMatrix());
      const mesh = src.getMesh();
      if (!isIdentity(rel)) transformMesh(mesh, rel);
      for (const prim of mesh.listPrimitives()) target.addPrimitive(prim);
    }
    entity.setMesh(target);
  }

  for (const child of nested) {
    const rel = mat4.multiply(mat4.create(), invRoot, child.getWorldMatrix());
    const parent = child.getParentNode();
    if (parent && parent !== entity) {
      parent.removeChild(child);
      entity.addChild(child);
      child.setTranslation(mat4.getTranslation([0, 0, 0], rel));
      child.setRotation(mat4.getRotation([0, 0, 0, 1], rel));
      child.setScale(mat4.getScaling([1, 1, 1], rel));
    }
    collapseEntity(child);
  }

  for (const child of [...entity.listChildren()]) {
    if (!nested.includes(child)) {
      entity.removeChild(child);
      child.dispose();
    }
  }
}

export function normalizeDocument(doc) {
  for (const scene of doc.getRoot().listScenes()) {
    for (const top of scene.listChildren()) {
      if (top.listChildren().length === 0) continue;
      for (const child of [...top.listChildren()]) collapseEntity(child);
    }
  }
  return doc;
}
