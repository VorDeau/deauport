import { Html } from "@react-three/drei";

export default function ComponentTooltip({ name }: { name: string }) {
  return (
    <Html center distanceFactor={0.3}>
      <span className="whitespace-nowrap rounded-sm bg-base px-2 py-1 font-mono text-xs text-ink">
        {name}
      </span>
    </Html>
  );
}
