import { lazy, Suspense, useState } from "react";
import { boards } from "../data/boards";
import { profile } from "../data/profile";
import type { BoardModelId } from "../data/models.generated";
import BoardFallback from "../three/BoardFallback";
import { HERO_LABEL, HERO_ORDER } from "../three/heroBoards";
import { useRenderMode } from "../three/useRenderMode";
import ErrorBoundary from "./ErrorBoundary";
import { boardFinish } from "./finish";

const HeroStage = lazy(() => import("../three/HeroStage"));

export default function HeroSection() {
  const mode = useRenderMode();
  const [boardId, setBoardId] = useState<BoardModelId>(HERO_ORDER[0] ?? "fides");
  const shown = boards.find((board) => board.modelId === boardId);

  return (
    <section className="mx-auto grid max-w-5xl gap-10 px-6 py-20 lg:grid-cols-2 lg:items-center">
      <div className="min-w-0">
        <p className="kvx-kicker">
          {profile.location.toUpperCase()}
        </p>
        <h1 className="kvx-title mt-4">
          {profile.tagline}
        </h1>
        <p className="kvx-lede mt-6">{profile.intro}</p>
        <a
          href="#hardware"
          className="mt-8 inline-flex min-h-12 items-center font-mono text-sm text-accent hover:underline"
        >
          selected boards →
        </a>
      </div>

      <div className="min-w-0">
        <div className="relative h-80 lg:h-[26rem]">
          {shown && (
            <div
              aria-hidden="true"
              className={`kvx-wash absolute inset-0 ${boardFinish(shown).wash}`}
            />
          )}
          {mode === "full" ? (
            <ErrorBoundary resetKey={boardId} fallback={<BoardFallback modelId={boardId} />}>
              <Suspense fallback={<BoardFallback modelId={boardId} />}>
                <HeroStage modelId={boardId} />
              </Suspense>
            </ErrorBoundary>
          ) : (
            <BoardFallback modelId={boardId} />
          )}
        </div>

        <div
          role="group"
          aria-label="Board shown in the viewer"
          className="mt-4 flex flex-wrap gap-2"
        >
          {HERO_ORDER.map((id) => {
            const shown = id === boardId;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={shown}
                onClick={() => setBoardId(id)}
                className={`min-h-12 rounded-md border px-4 font-mono text-xs tracking-widest transition-colors ${
                  shown
                    ? "border-accent text-accent"
                    : "border-line-control text-muted hover:text-ink"
                }`}
              >
                {HERO_LABEL[id]}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
