# Unmute · marketing site

The public site for Unmute ("Talk to an AI so you can talk to people"): a landing page with a live rehearsal demo, plus pricing, manifesto and teams pages.

The site is one world: a wall of glossy green subway tile with objects mounted on it. The objects are steamed mirrors that the conversation clears through word by word, frosted glass for reading, and amber post-it notes for every debrief and dare. The product record is `PRODUCT.md`. The design system is `DESIGN.md`, generated from the built site. Review evidence lives in `.impeccable/`.

## Stack

- Next.js 16 (App Router, Turbopack), React 19, TypeScript
- Tailwind CSS v4, with the world's tokens and utilities in `app/globals.css`
- `motion` for interruptible UI motion; CSS keyframes for predetermined motion
- A canvas fog engine (`components/world/fog-engine.ts`) for condensation, wipes, drips and re-fog
- Mona Sans (variable weight and width) for type, and Kalam only on post-its
- Phosphor icons
- Anthropic SDK for the live rehearsal demo (`app/api/rehearse`)

## Run

```bash
npm install
cp .env.example .env.local   # add ANTHROPIC_API_KEY to make the demo live
npm run dev                  # http://localhost:3000
```

Checks: `npx tsc --noEmit`, `npx eslint .`, `npm run build`.

The tile wall is generated, deterministically: `node scripts/make-wall.mjs` rewrites `public/wall.svg`.

## Environment

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Enables the live rehearsal demo. Without it the demo runs a scripted sample and says so. |
| `UNMUTE_MODEL` | Model for the demo (default `claude-opus-5`). |
| `WAITLIST_WEBHOOK_URL` | If set, waitlist and pilot signups are POSTed here as JSON. Otherwise they are logged. |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for metadata, robots and sitemap. On Vercel the production domain is used when this is unset. |

## Structure

```
app/                  pages, API routes, metadata files
components/world/     the world's objects: fog engine, mirror, steam text, post-it, wipe-clean, tally marks
components/sections/  one file per landing section (hero, problem, how-it-works, live-demo, scenarios, ...)
components/site/      nav, footer, email capture, container, logo
components/ui/        button
lib/content.ts        all copy and data (single source of truth; the name lives in `site.name`)
lib/rehearse.ts       prompts, schemas and scripted sample for the demo
lib/site-url.ts       the public origin for metadata, robots and the sitemap
scripts/make-wall.mjs generator for public/wall.svg
```

## Motion and accessibility

- Text in a mirror is written into the steam at speaking pace. Without JavaScript all text is visible. The `data-js` attribute on `<html>` is what holds sequenced text back until its cue.
- With reduced motion, the steam clears at once, notes fade in instead of dropping, and there are no drips.
- The pointer (or a finger) wipes the glass, and the fog returns a few seconds later.
- Press feedback is `scale(0.97)`. Hover effects only apply on devices that can hover.
