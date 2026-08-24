import { Link } from "react-router";
import type { Board } from "../data/types";
import { boardFinish } from "./finish";
import StatusBadge from "./StatusBadge";

export default function BoardCard({ board }: { board: Board }) {
  const finish = boardFinish(board);
  return (
    <Link
      to={`/hardware/${board.slug}`}
      className={`block rounded-lg border bg-surface p-5 transition-colors hover:bg-surface-raised ${finish.border}`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-mono text-lg">
          {board.designation}
          {board.codename && <span className="text-muted"> · {board.codename}</span>}
        </h3>
        <StatusBadge board={board} />
      </div>
      <p className="mt-3 text-sm text-muted">{board.summary}</p>
      <p className="mt-3 font-mono text-xs text-muted">
        {board.mainIc} · {board.dimensions}
      </p>
    </Link>
  );
}
