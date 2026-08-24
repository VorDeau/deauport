import type { BoardModelId } from "../data/models.generated";
import BoardCanvas from "./BoardCanvas";
import HeroBoard from "./HeroBoard";

export default function HeroStage({ modelId }: { modelId: BoardModelId }) {
  return (
    <BoardCanvas fitKey={modelId}>
      <HeroBoard modelId={modelId} />
    </BoardCanvas>
  );
}
