import { Link } from "react-router";
import Meta from "../components/Meta";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-32 text-center">
      <Meta title="Not found" description="No route to that page." />
      <p className="font-mono text-xs text-muted">404</p>
      <h1 className="kvx-heading mt-4">No route to that page.</h1>
      <Link
        to="/"
        className="mt-8 inline-flex min-h-12 items-center font-mono text-sm text-accent hover:underline"
      >
        ← back home
      </Link>
    </section>
  );
}
