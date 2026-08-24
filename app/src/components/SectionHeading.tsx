export default function SectionHeading({ index, title }: { index?: string; title: string }) {
  return (
    <header className="mb-10">
      <span aria-hidden="true" className="mb-4 block h-0.5 w-10 rounded-sm bg-accent" />
      {index && <p className="kvx-kicker">{index}</p>}
      <h2 className="kvx-heading mt-3">{title}</h2>
    </header>
  );
}
