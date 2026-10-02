# Unmute · marketing site

The public site for Unmute ("Talk to an AI so you can talk to people"): landing page with a live rehearsal demo, pricing, manifesto and teams pages.

## Stack

- Next.js 16 (App Router, Turbopack), React 19, TypeScript
- Tailwind CSS v4 with design tokens in `app/globals.css`
- `motion` (Framer Motion's successor) for page-load, scroll and hover animation
- shadcn/ui primitives in `components/ui` (radix-ui) and Magic UI components in `components/magicui`
- Anthropic SDK for the live rehearsal demo (`app/api/rehearse`)

The design spec, tokens, motion rules and section specs live in `DESIGN.md`.

## Run

```bash
npm install
cp .env.example .env.local   # add ANTHROPIC_API_KEY to make the demo live
npm run dev                  # http://localhost:3000
```

Checks: `npm run typecheck`, `npm run lint`, `npm test` (Vitest), `npm run build`. CI runs all four on every push (`.github/workflows/ci.yml`).

## Environment

| Variable | Purpose |
|---|---|
| `ANTHROPIC_DEMO_API_KEY` | Key from the Anthropic `demo` workspace (with a daily spend limit). Makes the site demo live. Preferred over `ANTHROPIC_API_KEY`. |
| `ANTHROPIC_API_KEY` | Also makes the demo live if no demo key is set. Without either, the demo runs a scripted sample and says so. |
| `UNMUTE_PERSONA_MODEL` | The persona (default `claude-sonnet-5-5`, no up-front thinking). |
| `UNMUTE_DEBRIEF_MODEL` | The debrief (default `claude-opus-5-5`, effort low). |
| `UNMUTE_CLASSIFIER_MODEL` | Safety checks on typed lines and custom scenarios (default `claude-haiku-4-5`). |
| `DEMO_SIGNING_SECRET` | Optional. Signs persona lines so the demo cannot be fed fake ones. Without it, a key is derived from the Anthropic key. |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Shared rate limits (`KV_REST_API_URL` and `KV_REST_API_TOKEN` also work). Without them, limits are per function instance. |
| `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SECRET_KEY` | Waitlist and pilot requests go to Supabase (`supabase/migrations`). `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` also work. |
| `WAITLIST_WEBHOOK_URL` | Used only when Supabase is not configured: signups are POSTed here as JSON. With neither, signups are accepted and only counted in logs (never the email). |
| `RESEND_API_KEY`, `OWNER_NOTIFY_EMAIL`, `RESEND_FROM` | Emails the owner on each Teams pilot request. |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for metadata, robots and sitemap. |

## Structure

```
app/                pages, API routes, metadata files
components/site/    nav, footer, email capture, reveal, container, logo
components/sections/ one file per landing section (hero, proof, how-it-works, live-demo, ...)
components/ui/      shadcn primitives
components/magicui/ vendored Magic UI components
lib/content.ts      all copy and data (single source of truth)
lib/motion.ts       easing, variants, viewport settings
lib/rehearse.ts     prompts, schemas and scripted sample for the demo
lib/demo/           demo wire protocol, persona-line signing, rate limits
lib/safety/         keyword screens and the model classifier (crisis, refused scenarios)
lib/server/         server-only clients: Supabase, owner email
tests/              route tests (Vitest); unit tests sit next to their modules
```
