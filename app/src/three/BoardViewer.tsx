import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BoardModelId } from "../data/models.generated";
import { GROUP_STYLE } from "../data/parts";
import ExplodedBoard from "./ExplodedBoard";
import { beatsFor, locate, movingGroups, trackHeightVh } from "./reveal";
import { useScrollProgress } from "./useScrollProgress";

const TICKS = 56;

const SETTLE_MS = 600;

export default function BoardViewer({ modelId }: { modelId: BoardModelId }) {
  const beats = useMemo(() => beatsFor(modelId), [modelId]);
  const groups = useMemo(() => movingGroups(beats), [beats]);

  const trackRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);
  const progress = useRef(0);

  const [beatIndex, setBeatIndex] = useState(0);

  const onProgress = useCallback(
    (value: number) => {
      progress.current = value;

      if (markerRef.current)
        markerRef.current.style.left = `calc(0.5rem + ${value} * (100% - 1rem))`;

      const { index } = locate(value, beats.length);
      setBeatIndex((current) => (current === index ? current : index));
    },
    [beats.length],
  );

  useScrollProgress(trackRef, onProgress);

  const beat = beats[beatIndex] ?? beats[0];

  const [announced, setAnnounced] = useState("");
  useEffect(() => {
    if (!beat) return;
    const timer = setTimeout(
      () => setAnnounced(`${beat.part.ref} ${beat.part.part}, ${beat.part.role}`),
      SETTLE_MS,
    );
    return () => clearTimeout(timer);
  }, [beat]);

  if (!beat) return null;

  const tone = GROUP_STYLE[beat.group];
  const labelled = beats
    .slice(beat.groupStart, beatIndex + 1)
    .map((entry) => ({ note: entry.part, anchor: entry.anchor }));

  return (
    <div
      ref={trackRef}
      className="relative"
      style={{ height: `${trackHeightVh(beats.length)}vh` }}
    >
      <div className="sticky top-0 h-screen">
        <div aria-hidden="true" className={`kvx-wash absolute inset-0 ${tone.wash}`} />

        <div className="absolute inset-0">
          <ExplodedBoard
            modelId={modelId}
            progress={progress}
            groups={groups}
            hidden={EMPTY}
            labels={labelled}
            activeRef={beat.part.ref}
          />
        </div>

        <div className="pointer-events-none relative mx-auto flex h-full max-w-5xl flex-col justify-end px-6 pb-12">
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
            <div>
              <p className="kvx-kicker flex items-center gap-2">
                <span aria-hidden="true" className={`kvx-pad ${tone.pad}`} />
                <span>
                  {String(beatIndex + 1).padStart(2, "0")} /{" "}
                  {String(beats.length).padStart(2, "0")}
                </span>{" "}
                <span className={tone.text}>{beat.group}</span>
              </p>
              <p className="mt-2 max-w-xs text-[0.95rem] font-medium leading-snug sm:max-w-sm">
                <span className="font-mono text-ink">{beat.part.ref}</span>{" "}
                <span className="text-ink">{beat.part.part}</span>
                <span className="text-muted">, {beat.part.role}</span>
              </p>
            </div>

            <div
              aria-hidden="true"
              className="relative hidden h-8 w-64 shrink-0 overflow-hidden rounded-md border border-line-control sm:block"
            >
              <div className="flex h-full items-center justify-between px-2">
                {Array.from({ length: TICKS }, (_, index) => (
                  <span
                    key={index}
                    className={`w-px bg-line ${index % 7 === 0 ? "h-3" : "h-1.5"}`}
                  />
                ))}
              </div>
              <div
                ref={markerRef}
                className="absolute inset-y-1 w-0.5 rounded-sm bg-accent"
                style={{ left: "0.5rem" }}
              />
            </div>
          </div>
        </div>

        <div aria-live="polite" className="sr-only">
          {announced}
        </div>
      </div>
    </div>
  );
}

const EMPTY: ReadonlySet<string> = new Set();
