# Portfolio

Personal portfolio site, served at `port.<root-domain>` and routed through the
Kleavox gateway. Extracted from the Kleavox monorepo so personal data lives in
this private repository only; the gateway connects to it purely by worker name.

## Layout

| Path       | Contents                                                               |
| ---------- | ------------------------------------------------------------------------- |
| `app/`     | Vite + React + Tailwind v4 site, with react-three-fiber board viewers     |
| `worker/`  | Cloudflare Worker: serves the built site + `/api/contact` (Resend)        |
| `scripts/` | GLB compression pipeline, route emitter, bundle budget check              |

## Local development

```bash
pnpm install
pnpm --filter @portfolio/app build
pnpm dev   # wrangler dev for the worker, serving app/dist
```

No env vars are needed to build or browse the site locally: the contact
form's Turnstile widget falls back to Cloudflare's public always-pass test
site key when `PUBLIC_TURNSTILE_SITE_KEY` is unset. Actually submitting the
form still needs a matching `TURNSTILE_SECRET_KEY` and a working
`RESEND_API_KEY` in `worker/.dev.vars` (gitignored, not provided) — the
worker has no local no-op fallback, so without them the Resend call fails
and the form reports a delivery error.

## Board models

Each hardware page renders its PCB as an interactive 3D model built from real
KiCad exports. The source GLBs live outside this repo, in `D:\Project\PCBModel`,
and are large — about 22.4 MB across the three boards. The pipeline in
`scripts/models/` compresses them roughly tenfold, down to about 2.2 MB total,
while keeping every electronic component as a separately named, addressable
node: 41 reference designators on Keel, 54 on Interim, 16 on Fides, each
still selectable and labelled after compression.

```bash
pnpm models:build
```

The interesting part isn't the compression ratio, it's that the pipeline
refuses to emit a broken model. The build fails if a designator goes missing,
if a raw OpenCASCADE export label survives instead of being renamed, if an
expected board layer (silkscreen, soldermask, copper, pads) is missing, or if
any component's bounding-box centre drifts more than 0.01 mm from the source
— a proxy for accidentally moving a part while simplifying the mesh. The
compressed output is committed to `app/public/models/`, so a normal
`pnpm build` never needs the source folder or this script at all.

## Deploy

The worker name MUST be `${WORKER_PREFIX}-portfolio` — the Kleavox gateway's
`PORTFOLIO` service binding targets that exact name, and the `port.<domain>`
custom domain is attached to it. Redeploying under the same name keeps both.

GitHub environment `production` needs:

Variables:

```text
APP_ROOT_DOMAIN
WORKER_PREFIX        (same value as the Kleavox monorepo deploy)
CONTACT_EMAIL        (your personal inbox — contact-form messages land here)
FROM_EMAIL           (e.g. Portfolio <no-reply@<root-domain>>)
```

Secrets:

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
RESEND_API_KEY
TURNSTILE_SITE_KEY
TURNSTILE_SECRET_KEY
```

Run the `Deploy Portfolio` workflow with `domains=none` first, then
`domains=canonical` once verified.

## Contact form

The contact form posts to `/api/contact`; the worker relays each message
through Resend **outbound** straight to `CONTACT_EMAIL` (your personal inbox),
with the visitor's address set as `reply_to` so you can just hit reply. There
is no inbound mailbox to monitor — no MX records or Resend "Receiving" domain
are needed. The only Resend setup is verifying the sending domain used by
`FROM_EMAIL`, plus Turnstile hostname authorization for `port.<root-domain>`.
