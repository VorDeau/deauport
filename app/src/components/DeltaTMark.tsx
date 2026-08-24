import mark from "../data/deltaT-mark";

export default function DeltaTMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 60 56"
      className={className}
      role="img"
      aria-label="deltaT"
      focusable="false"
    >
      <path fill="currentColor" fillRule="evenodd" d={mark} />
    </svg>
  );
}
