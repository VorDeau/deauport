import { useEffect, useRef, useState, type FormEvent } from "react";
import SectionHeading from "./SectionHeading";

type Status = { kind: "idle" | "sending" | "ok" | "error"; message?: string };

const TEST_SITE_KEY = "1x00000000000000000000AA";
const POLL_MS = 150;
const POLL_ATTEMPTS = 80;

export default function ContactSection({ testToken }: { testToken?: string }) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [token, setToken] = useState("");
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const container = widgetRef.current;
    if (!container) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;
    let cancelled = false;

    const mount = () => {
      if (cancelled) return;
      const api = window.turnstile;
      if (!api) {
        if (++attempts > POLL_ATTEMPTS) return;
        timer = setTimeout(mount, POLL_MS);
        return;
      }
      widgetIdRef.current = api.render(container, {
        sitekey: import.meta.env.PUBLIC_TURNSTILE_SITE_KEY ?? TEST_SITE_KEY,
        theme: "dark",
        size: window.matchMedia("(max-width: 22rem)").matches ? "compact" : "normal",
        callback: (value) => setToken(value),
        "expired-callback": () => setToken(""),
        "error-callback": () => setToken(""),
      });
    };
    mount();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      const widgetId = widgetIdRef.current;
      widgetIdRef.current = undefined;
      if (widgetId !== undefined) window.turnstile?.remove(widgetId);
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const turnstileToken = testToken ?? token;

    if (!turnstileToken) {
      setStatus({ kind: "error", message: "Complete the verification first." });
      return;
    }

    setStatus({ kind: "sending" });
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          message: data.get("message"),
          turnstileToken,
        }),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(result.message ?? "Message failed.");
      form.reset();
      const widgetId = widgetIdRef.current;
      if (widgetId !== undefined) window.turnstile?.reset(widgetId);
      setToken("");
      setStatus({ kind: "ok", message: "Message sent." });
    } catch (error) {
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "Message failed.",
      });
    }
  }

  const field =
    "kvx-control mt-2 w-full text-sm";

  return (
    <section id="contact" className="mx-auto max-w-5xl px-6 py-16">
      <SectionHeading title="Say something." />
      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <label className="block">
          <span className="kvx-kicker">Name</span>
          <input name="name" maxLength={100} required className={field} />
        </label>
        <label className="block">
          <span className="kvx-kicker">Email</span>
          <input name="email" type="email" required className={field} />
        </label>
        <label className="block">
          <span className="kvx-kicker">Message</span>
          <textarea name="message" minLength={10} maxLength={2000} rows={5} required className={field} />
        </label>

        <div ref={widgetRef} />

        <button
          type="submit"
          disabled={status.kind === "sending"}
          className="inline-flex min-h-12 items-center rounded-md border border-accent px-5 font-mono text-xs font-bold uppercase tracking-[0.1em] text-accent transition-colors hover:bg-accent/10 disabled:opacity-50"
        >
          {status.kind === "sending" ? "Sending…" : "Send message"}
        </button>

        <p role="status" className="min-h-5 font-mono text-xs text-muted">
          {status.message}
        </p>
      </form>
    </section>
  );
}
