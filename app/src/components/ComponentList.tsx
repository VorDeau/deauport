import { BOARD_MODELS, type BoardModelId } from "../data/models.generated";
import { BOARD_PARTS, GROUP_STYLE } from "../data/parts";

export default function ComponentList({ modelId }: { modelId: BoardModelId }) {
  const model = BOARD_MODELS[modelId];
  const parts = BOARD_PARTS[modelId];

  return (
    <div>
      <h2 className="kvx-kicker">
        PARTS · {parts.length} NAMED OF {model.components.length} PLACED
      </h2>
      <dl className="mt-4 divide-y divide-line border-t border-line">
        {parts.map((part) => (
          <div
            key={part.ref}
            className="grid gap-x-6 gap-y-1 py-3 sm:grid-cols-[4rem_minmax(0,14rem)_minmax(0,1fr)]"
          >
            <dt className="flex items-center gap-2 font-mono text-xs text-ink">
              <span aria-hidden="true" className={`kvx-pad ${GROUP_STYLE[part.group].pad}`} />
              {part.ref}
            </dt>
            <dd className="font-mono text-xs text-muted">{part.part}</dd>
            <dd className="text-sm text-muted">
              {part.role}
              <span className={`ml-2 font-mono text-xs ${GROUP_STYLE[part.group].text}`}>
                {part.group}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
