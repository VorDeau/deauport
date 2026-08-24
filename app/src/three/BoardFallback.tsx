import { BOARD_MODELS, type BoardModelId } from "../data/models.generated";

export default function BoardFallback({ modelId }: { modelId: BoardModelId }) {
  const model = BOARD_MODELS[modelId];
  return (
    <div className="flex h-full min-h-64 items-center justify-center rounded-lg border border-line bg-surface p-8 text-center">
      <p className="font-mono text-xs text-muted">
        3D view disabled.
        <br />
        {model.components.length} components, {model.layers.length} board layers.
      </p>
    </div>
  );
}
