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

Checks: `npx tsc --noEmit`, `npx eslint .`, `npm run build`.

## Environment

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Enables the live rehearsal demo. Without it the demo runs a scripted sample and says so. |
| `UNMUTE_MODEL` | Model for the demo (default `claude-opus-5`). |
| `WAITLIST_WEBHOOK_URL` | If set, waitlist and pilot signups are POSTed here as JSON. Otherwise they are logged. |
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
```
