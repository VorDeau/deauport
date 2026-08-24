import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { Box3, type Object3D } from "three";
import { BOARD_MODELS, type BoardModelId } from "../data/models.generated";

export type BoardModelData = {
  scene: Object3D;
  nodes: Map<string, Object3D>;
  bounds: Box3;
};

export function useBoardModel(modelId: BoardModelId): BoardModelData {
  const gltf = useGLTF(BOARD_MODELS[modelId].file, false, true);

  return useMemo(() => {
    const scene = gltf.scene.clone(true);
    const nodes = new Map<string, Object3D>();
    scene.traverse((child) => {
      if (child.name) nodes.set(child.name, child);
    });
    return { scene, nodes, bounds: new Box3().setFromObject(scene) };
  }, [gltf]);
}

export function preloadBoard(modelId: BoardModelId): void {
  useGLTF.preload(BOARD_MODELS[modelId].file, false, true);
}
