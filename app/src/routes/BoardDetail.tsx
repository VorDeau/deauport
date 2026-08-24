import { lazy, Suspense, type ReactNode } from "react";
import { Link, useParams } from "react-router";
import ComponentList from "../components/ComponentList";
import ErrorBoundary from "../components/ErrorBoundary";
import Meta from "../components/Meta";
import RepoLink from "../components/RepoLink";
import StatusBadge from "../components/StatusBadge";
import { boardBySlug, boards } from "../data/boards";

import { profile } from "../data/profile";
import BoardFallback from "../three/BoardFallback";
import { beatsFor, trackHeightVh } from "../three/reveal";
import { useNearViewport } from "../three/useNearViewport";
import { useRenderMode } from "../three/useRenderMode";

const BoardViewer = lazy(() => import("../three/BoardViewer"));

export default function BoardDetail() {
  const { slug } = useParams();
  const board = slug ? boardBySlug(slug) : undefined;
  const mode = useRenderMode();
  const [near, trackRef] = useNearViewport();

  if (!board) {
    return (
      <section className="mx-auto max-w-5xl px-6 py-32 text-center">
        <Meta title={`Not found · ${profile.name}`} description="No board by that name." />
        <h1 className="kvx-heading">No board by that name.</h1>
        <Link
          to="/#hardware"
          className="mt-8 inline-flex min-h-12 items-center rounded-md font-mono text-sm text-accent"
        >
          ← all boards
        </Link>
      </section>
    );
  }

  const ancestor = board.successorOf ? boards.find((b) => b.slug === board.successorOf) : undefined;

  const highlightList = (
    <ul className="space-y-2">
      {board.highlights.map((item) => (
        <li key={item} className="border-l border-line pl-4 text-sm text-muted">
          {item}
        </li>
      ))}
    </ul>
  );

  const withoutCanvas = (
    <div className="space-y-8">
      {board.modelId && <BoardFallback modelId={board.modelId} />}
      {highlightList}
      {board.modelId && <ComponentList modelId={board.modelId} />}
    </div>
  );

  return (
    <>
    <article className="mx-auto max-w-5xl px-6 pb-10 pt-16">
      <Meta
        title={`${board.designation}${board.codename ? ` · ${board.codename}` : ""} · ${profile.name}`}
        description={board.summary}
      />
      <Link
        to="/#hardware"
        className="inline-flex min-h-12 items-center rounded-md font-mono text-xs text-muted transition-colors hover:text-ink"
      >
        ← all boards
      </Link>

      <header className="mt-6 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="kvx-title">
          {board.designation}
          {board.codename && <span className="text-muted"> · {board.codename}</span>}
        </h1>
        <StatusBadge board={board} />
      </header>

      <p className="mt-6 max-w-2xl text-muted">{board.summary}</p>

      <dl className="mt-8 grid gap-4 font-mono text-xs sm:grid-cols-3">
        <div>
          <dt className="text-muted">MAIN IC</dt>
          <dd className="mt-1">{board.mainIc}</dd>
        </div>
        <div>
          <dt className="text-muted">DIMENSIONS</dt>
          <dd className="mt-1">{board.dimensions}</dd>
        </div>
        <div>
          <dt className="text-muted">REPOSITORY</dt>
          <dd className="mt-1"><RepoLink repo={board.repo} /></dd>
        </div>
      </dl>

      {ancestor && (
        <p className="mt-10 font-mono text-xs text-muted">
          successor to{" "}
          <Link
            to={`/hardware/${ancestor.slug}`}
            className="text-accent hover:underline"
          >
            {ancestor.designation}
          </Link>
        </p>
      )}

      {!board.modelId && <div className="mt-10">{highlightList}</div>}

    </article>

      {board.modelId &&
        (mode === "full" ? (
          <div
            ref={trackRef}
            style={{ minHeight: `${trackHeightVh(beatsFor(board.modelId).length)}vh` }}
          >
            {near && (
              <ErrorBoundary key={board.slug} fallback={<Measured>{withoutCanvas}</Measured>}>
                <Suspense fallback={null}>
                  <BoardViewer modelId={board.modelId} />
                </Suspense>
              </ErrorBoundary>
            )}
          </div>
        ) : (
          <Measured>{withoutCanvas}</Measured>
        ))}
    </>
  );
}

function Measured({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-5xl px-6 pb-16">{children}</div>;
}
