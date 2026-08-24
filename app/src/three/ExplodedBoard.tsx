import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3, type Object3D } from "three";
import { BOARD_MODELS, type BoardModelId } from "../data/models.generated";
import { GROUP_STYLE, type PartNote } from "../data/parts";
import BoardCanvas from "./BoardCanvas";
import ComponentTooltip from "./ComponentTooltip";
import ExplodeRig from "./ExplodeRig";
import { useBoardModel } from "./useBoardModel";

type Projected = { x: number; y: number; visible: boolean };

function CalloutProjector({
  scene,
  refs,
  onProject,
}: {
  scene: Object3D;
  refs: readonly string[];
  onProject: (points: readonly Projected[]) => void;
}) {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const nodes = useMemo(
    () => refs.map((name) => scene.getObjectByName(name) ?? null),
    [scene, refs],
  );
  const scratch = useMemo(() => new Vector3(), []);
  const points = useMemo<Projected[]>(
    () => refs.map(() => ({ x: 0, y: 0, visible: false })),
    [refs],
  );

  useFrame(() => {
    for (let i = 0; i < nodes.length; i += 1) {
      const node = nodes[i];
      const point = points[i];
      if (!point) continue;
      if (!node) {
        point.visible = false;
        continue;
      }
      node.getWorldPosition(scratch).project(camera);
      point.x = (scratch.x * 0.5 + 0.5) * size.width;
      point.y = (-scratch.y * 0.5 + 0.5) * size.height;
      point.visible = scratch.z < 1 && node.visible;
    }
    onProject(points);
  });

  return null;
}

function Scene({
  modelId,
  progress,
  order,
  hidden,
  onHover,
  callouts,
  onProject,
}: {
  modelId: BoardModelId;
  progress: RefObject<number>;
  order: readonly string[];
  hidden: ReadonlySet<string>;
  onHover: (name: string | null) => void;
  callouts: readonly string[];
  onProject: (points: readonly Projected[]) => void;
}) {
  const { scene } = useBoardModel(modelId);
  const movable = useMemo(
    () => [...BOARD_MODELS[modelId].components, ...BOARD_MODELS[modelId].extras],
    [modelId],
  );
  return (
    <>
      <ExplodeRig
        scene={scene}
        components={movable}
        order={order}
        hiddenLayers={hidden}
        progress={progress}
        onHover={onHover}
      />
      <CalloutProjector scene={scene} refs={callouts} onProject={onProject} />
    </>
  );
}

export default function ExplodedBoard({
  modelId,
  progress,
  order,
  hidden,
  parts,
  activeRef,
}: {
  modelId: BoardModelId;
  progress: RefObject<number>;
  order: readonly string[];
  hidden: ReadonlySet<string>;
  parts: readonly PartNote[];
  activeRef: string | null;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(SVGLineElement | null)[]>([]);
  const anchorRefs = useRef<(HTMLElement | null)[]>([]);
  const anchors = useRef<{ x: number; y: number }[]>([]);

  const refs = useMemo(() => parts.map((p) => p.ref), [parts]);

  const measureAnchors = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const box = stage.getBoundingClientRect();
    anchors.current = anchorRefs.current.map((element) => {
      if (!element) return { x: 0, y: 0 };
      const rect = element.getBoundingClientRect();
      return {
        x: rect.left - box.left + (rect.left - box.left < box.width / 2 ? rect.width : 0),
        y: rect.top - box.top + rect.height / 2,
      };
    });
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    measureAnchors();
    const observer = new ResizeObserver(measureAnchors);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [measureAnchors, parts]);

  const activeIndex = parts.findIndex((part) => part.ref === activeRef);

  const handleProject = useCallback((points: readonly Projected[]) => {
    for (let i = 0; i < points.length; i += 1) {
      const line = lineRefs.current[i];
      const point = points[i];
      const anchor = anchors.current[i];
      if (!line || !point || !anchor) continue;
      if (!point.visible) {
        line.style.opacity = "0";
        continue;
      }
      line.style.opacity = "1";
      line.setAttribute("x1", String(anchor.x));
      line.setAttribute("y1", String(anchor.y));
      line.setAttribute("x2", String(point.x));
      line.setAttribute("y2", String(point.y));
    }
  }, []);

  const columns = [
    parts.filter((_, index) => index % 2 === 0),
    parts.filter((_, index) => index % 2 === 1),
  ];

  return (
    <div ref={stageRef} className="relative h-full w-full">
      <BoardCanvas fitKey={modelId} steady controls={false} margin={1.65}>
        <Scene
          modelId={modelId}
          progress={progress}
          order={order}
          hidden={hidden}
          onHover={setHovered}
          callouts={refs}
          onProject={handleProject}
        />
        {hovered && <ComponentTooltip name={hovered} />}
      </BoardCanvas>

      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden h-full w-full sm:block"
      >
        {parts.map((part, index) => (
          <line
            key={part.ref}
            ref={(element) => {
              lineRefs.current[index] = element;
            }}
            stroke="currentColor"
            strokeWidth={1}
            className={index === activeIndex ? "text-accent" : "text-line-control"}
            style={{ opacity: 0 }}
          />
        ))}
      </svg>

      {columns.map((column, columnIndex) => (
        <ul
          key={columnIndex}
          className={`pointer-events-none absolute hidden max-w-[38%] space-y-2 sm:block ${
            columnIndex === 0
              ? "bottom-40 left-6"
              : "right-6 top-24 [&>li]:flex-row-reverse"
          }`}
        >
          {column.map((part) => {
            const index = parts.indexOf(part);
            return (
              <li
                key={part.ref}
                ref={(element) => {
                  anchorRefs.current[index] = element;
                }}
                className="flex items-center gap-2 font-mono text-[0.68rem] leading-tight"
              >
                <span
                  aria-hidden="true"
                  className={`kvx-pad ${GROUP_STYLE[part.group].pad}`}
                />
                <span className={part.ref === activeRef ? "text-accent" : "text-ink"}>
                  {part.ref}
                </span>
                <span className={part.ref === activeRef ? "text-ink" : "text-muted"}>
                  {part.part}
                </span>
              </li>
            );
          })}
        </ul>
      ))}
    </div>
  );
}
