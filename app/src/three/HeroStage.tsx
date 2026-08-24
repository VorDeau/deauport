import type { BoardModelId } from "../data/models.generated";
import BoardCanvas from "./BoardCanvas";
import HeroBoard from "./HeroBoard";

export default function HeroStage({ modelId }: { modelId: BoardModelId }) {
  return (
    <BoardCanvas autoFit={false}>
      <HeroBoard modelId={modelId} />
    </BoardCanvas>
  );
}
