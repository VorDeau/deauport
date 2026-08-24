import type { Board } from "../data/types";
import { boardFinish } from "./finish";

const STAGE_LABEL: Record<Board["stage"], string> = {
  "in-progress": "in progress",
  "design-complete": "design complete",
  archived: "archived",
};

export default function StatusBadge({ board }: { board: Board }) {
  const finish = boardFinish(board);
  return (
    <span className="kvx-status flex-wrap">
      <span aria-hidden="true" className={`kvx-pad ${finish.pad}`} />
      <span className={finish.text}>{STAGE_LABEL[board.stage]}</span>
      <span className={board.fabricated ? "text-gold" : "text-muted"}>
        {board.fabricated ? "fabricated" : "not yet fabricated"}
      </span>
    </span>
  );
}
