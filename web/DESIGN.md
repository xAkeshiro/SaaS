# Unmute marketing site · design + build spec

Stack: Next.js 16 (App Router, Turbopack), React 19, Tailwind v4, `motion` v13 (Framer Motion's successor, import from `"motion/react"`), shadcn/ui primitives (`components/ui`), Magic UI components (`components/magicui`, the open-source library 21st.dev aggregates), lucide-react icons.

Heavy reference: **Cluely** (cluely.com). Light, airy, minimal. One huge bold display headline, a product demo right under it, floating pill nav, feature sections that animate on scroll, a sticky "how it works" showcase, pricing with one highlighted tier, a dark gradient band for the big statement, compact footer. Pages: Home, Pricing, Manifesto, Teams (Cluely: Enterprise).

Design system generated with the UI/UX Pro Max skill for the brief "voice AI practice for real-life conversations, consumer, YC-style": pattern *Product Demo + Features* (Hero → product mock centered → feature breakdown → comparison → CTA), style *Flat design with restraint* (thin borders, minimal shadows, simple hover, 150–200 ms ease), display/body font pairing, and the pre-delivery checklist at the bottom of this file.

---

## 1. Brand

- **Name:** Unmute. **Tagline:** Talk to an AI so you can talk to people.
- **Voice:** blunt, kind, specific. Short sentences. No hype words ("revolutionary", "unlock"). Say the number and stop talking.
- **Stance:** not a companion. A coach that wants you to need it less.
- **Mark:** amber rounded square with 4 ink bars (a waveform). `components/site/logo.tsx`.

## 2. Tokens (defined in `app/globals.css`)

| Token | Light (default) | Dark band (`.dark` wrapper) |
|---|---|---|
| `bg-background` | `#F7F8FC` cool off-white | `#0B0F1A` ink |
| `text-foreground` | `#0B0F1A` | `#F4F5FB` |
| `bg-card` / `border-border` | `#FFFFFF` / `#E2E6F0` | `#151B2E` / `rgba(255,255,255,.10)` |
| `bg-muted` / `text-muted-foreground` | `#EEF1F8` / `#58627A` (5.6:1 on bg) | `#1C2338` / `#AAB2C8` |
| `bg-primary` (buttons) | ink `#0B0F1A`, white text | white, ink text |
| `bg-accent` / `text-accent-foreground` | amber `#FFB454` / ink | same |
| `text-amber-ink` | `#8A4500` (7:1 on bg, use for amber *text* on light) | `#FFC774` |
| `bg-lavender` `bg-lavender-deep` `bg-peach` | `#DDE2EE` `#C7CDF8` `#FFD9AE` | same |
| `bg-indigo-brand` | `#4F46E5` (rare, gradients only) | same |
| `rounded-lg` base radius | `0.875rem`; cards `rounded-2xl`/`rounded-3xl`; buttons and chips are pills | |

Brand utilities: `bg-hero-mesh` (lavender + peach radial mesh on the page bg), `bg-band-ink` (ink band with indigo + amber glows, always wrap in a `.dark` element), `bg-band-lavender` (white → lavender vertical), `glass` (white/72 + blur + hairline), `shadow-soft`, `shadow-window` (for the app-window mock).

Type utilities: `display-xl` (hero H1, clamp 44–92px, Outfit 700, leading .98, tracking -.035em), `display-lg` (section H2), `display-md` (card H3), `lede` (subheads, muted), `eyebrow` (mono, uppercase, tracked; color it with `text-amber-ink` on light or `text-amber` on dark).

Fonts (self-hosted via next/font/local): `font-display` = Outfit, `font-sans` = Inter, `font-mono` = JetBrains Mono (stats, eyebrows, timers, labels).

Contrast: never put amber text on the light background (fails). Amber is a **fill** with ink text, or a text color on dark only (`text-amber`). Muted text stays ≥ 4.5:1.

## 3. Layout rhythm

- `Container`: max-w 1200px, px 20/32.
- Section vertical padding: `py-24 md:py-32` on light; dark bands `py-24 md:py-28`.
- Section heading: `SectionHeading` (eyebrow → H2 → lede). Center for most; left for the sticky showcase.
- Cards: `bg-card border border-border rounded-2xl p-6 md:p-8`, hover `-translate-y-0.5 border-foreground/20` in 200 ms. No heavy shadows; `shadow-soft` at most.
- Chips: pill, `bg-muted text-foreground text-sm px-3.5 py-1.5`; selected = `bg-primary text-primary-foreground`.
- Responsive: single column ≤ 640, 2 columns at md, 3–4 at lg. Check 375 / 768 / 1024 / 1440. Nothing scrolls horizontally except a table in `overflow-x-auto`.
- Anchors that the nav and footer point to: `#how-it-works`, `#try`, `#scenarios`, `#early-access` (hero form and final CTA both get `id`s: hero form wrapper `id="early-access"`). Manifesto page anchors: `#not-a-companion`, `#privacy`, `#safety`. Add `scroll-mt-28` to anchored sections so the floating nav does not cover them.

## 4. Motion spec (`lib/motion.ts`, `components/site/reveal.tsx`)

- Easing `ease = [0.22, 1, 0.36, 1]`. Durations 0.2 (hover) / 0.5 (reveal) / 0.8 (hero, mock).
- **Page load (hero only):** stagger 0.08 s; eyebrow → H1 → sub → form → mock (mock uses `scaleIn`).
- **Scroll reveals:** wrap blocks in `<Reveal>` (fade-up) or `<Reveal group>` + `<RevealItem>` for grids. `viewport.once = true`. Never animate `filter: blur` on large blocks (perf); `BlurFade` is fine on small text.
- **Hover:** cards lift 2–3 px + border darkens; buttons already handle `active:translate-y-px`.
- **Sticky showcase (How it works):** left column of 4 steps, right column `sticky top-28` panel; the active step drives an `AnimatePresence` panel swap (`mode="wait"`, 0.35 s). Use `useInView` on each step (amount 0.6) to set active; on < md stack step text over its own panel instead of sticky.
- **Ambient:** waveform bars (`animate-wave` keyframe with staggered `animation-delay`), `BorderBeam` on the hero mock, `AnimatedShinyText` on the hero eyebrow, `NumberTicker` for stats, `Marquee` for a chip strip, `AnimatedList` for dares, `ShineBorder` on the highlighted pricing tier, `DotPattern` faded behind the hero (`[mask-image:radial-gradient(...)]`).
- Reduced motion: `MotionConfig reducedMotion="user"` is global; CSS keyframes are neutralized in globals. Do not add your own `matchMedia` checks unless a component has non-motion side effects (speech synthesis, autoplay loops) — then use `useReducedMotion()` from `motion/react`.

## 5. Component inventory

`components/ui` (shadcn, radix-ui umbrella package): `Button` (variants `default` ink pill, `accent` amber pill, `outline`, `secondary`, `ghost`, `link`; sizes `sm` `default` `lg` `xl` `icon*`; `asChild` for links), `Badge`, `Card`+parts, `Accordion`, `Tabs`, `Dialog`, `Sheet`, `Separator`, `Input`, `Textarea`.

`components/magicui` (read the file for props before using): `animated-list`, `animated-shiny-text`, `aurora-text`, `avatar-circles`, `blur-fade`, `border-beam`, `dot-pattern`, `highlighter` (rough-notation underline/highlight of a word), `interactive-hover-button`, `line-shadow-text`, `magic-card` (`dark` prop for dark bands), `marquee`, `number-ticker`, `ripple`, `scroll-progress`, `shimmer-button`, `shine-border`, `text-animate`, `typing-animation`, `word-rotate`.

`components/site`: `Container`, `SectionHeading`, `Logo`/`LogoMark`, `Nav` (floating pill, Sheet on mobile), `Footer`, `EmailCapture` (posts to `/api/waitlist`; props `source`, `inverted`, `note`, `buttonLabel`), `Reveal`/`RevealItem`.

`lib/content.ts` is the only place copy lives. Import `site, nav, hero, stats, steps, moods, demoScenarios, scenarioCards, together, principles, pricing, faq, finalCta, footnotes, footer, manifesto, teams` from it. Do not hard-code copy in sections; if you need a string that does not exist, add it to `lib/content.ts` (append only, keep existing keys).

Icons: lucide-react only. **No emoji as icons.** Content strings reference lucide names (`scenarioCards[].icon`, `together.features[].icon`, `teams.audiences[].icon`); resolve them with a small map in the section file (`import { PhoneCall, ... } from "lucide-react"`), never `import * as Icons`.

## 6. Page map and section specs

### `/` (app/page.tsx) — assembled by the integrator in this order
1. `Hero` — `components/sections/hero.tsx` (server) + `components/sections/rehearsal-window.tsx` (client mock)
2. `Proof` — `components/sections/proof.tsx`
3. `HowItWorks` — `components/sections/how-it-works.tsx` (client, sticky showcase) `id="how-it-works"`
4. `LiveDemo` — `components/sections/live-demo.tsx` (client) `id="try"`
5. `Scenarios` — `components/sections/scenarios.tsx` `id="scenarios"`
6. `Together` — `components/sections/together.tsx`
7. `AntiCompanion` — `components/sections/anti-companion.tsx` (dark band)
8. `Pricing` — `components/sections/pricing.tsx` (client for the monthly/yearly toggle)
9. `Faq` — `components/sections/faq.tsx`
10. `FinalCta` — `components/sections/final-cta.tsx` (dark band) `id` lives on the hero form, so use `id="early-access-bottom"` here
11. `Footer`

Each section exports one named component with no required props, is self-contained (its own `<section>` with padding and `Container`), and reads from `lib/content.ts`.

**Hero.** `bg-hero-mesh`, `DotPattern` faded under it, `pt-36 md:pt-44 pb-16`. Centered stack, max-w 3xl: eyebrow pill (`AnimatedShinyText` inside a `glass` pill with a small amber dot: "Voice practice for real life · early access"); H1 `display-xl` = `hero.headline` with the word "people" wrapped in `Highlighter` (action "underline", amber, animate on view) or a hand-drawn underline SVG; sub `lede max-w-[60ch]`; `EmailCapture source="hero"` inside a wrapper `id="early-access"` `scroll-mt-32`; trust line `text-xs text-muted-foreground` with a lock icon; secondary link "Try a rehearsal ↓" to `#try` (ghost button, ArrowDown icon). Then the **RehearsalWindow** mock, full width up to 1040px, `mt-14`.

**RehearsalWindow (client).** An app-window card: `rounded-3xl border border-border bg-card shadow-window overflow-hidden`, `BorderBeam` (amber → lavender) on the border. Header bar: three traffic dots, center label "Rehearsal · 02:41" in mono, right pill "Hard mode". Body grid `md:grid-cols-[1.1fr_0.9fr]`: **left** = persona card ("Your landlord", scenario line, mood chip "busy, defensive"), an animated waveform (7 bars, `animate-wave`, staggered delays, amber when the persona talks / ink when you talk), and a transcript that plays itself: three bubbles appear in sequence (landlord line, your line, landlord "...Send me the photos.") using `AnimatePresence` + a `useEffect` timer that loops every ~9 s (skip the loop under `useReducedMotion`, show all three static). **Right** = Debrief card: title "Debrief", 4 stat rows using `NumberTicker`: Got to the ask 0:38 (was 1:50), Apologies before the ask 0 (was 3), Filler words 7 ("like"), Held the number ✓; a "Next time, say:" quote block with the two sentences from the old page ("Normal wear is not a deduction. I have move-in photos. I'd like the full $1,200 back within 14 days." / "I'll send the photos tonight. What's the best email?"). Keep it pure UI, no network. Must look good at 375 px (stack columns).

**Proof.** `py-16`, a 3-column grid of the three `stats` with `NumberTicker` on `value` (prefix/suffix outside the ticker), the label below in `text-sm text-muted-foreground`, footnote number as a small mono superscript linking to `#fn-N` in the footer. Above the grid a single line in `eyebrow`: "The problem is loud. The mechanic is proven." Below: a `Marquee` (pauseOnHover) of scenario chips from `scenarioCards[].title` in `bg-muted` pills, faded edges via `[mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]`.

**HowItWorks (client).** `id="how-it-works" scroll-mt-28`. `SectionHeading` left-aligned: eyebrow "How it works", title "Rehearse. Debrief. Repeat. Then do it for real." Then `lg:grid-cols-[1fr_1.1fr] gap-16`: left = the four `steps`, each a block with index in mono amber-ink, `display-md` title, body, three bullets with a small check; the active one is full opacity, others `opacity-50`, transition 300 ms. Right = `sticky top-28` panel `aspect-[4/3] rounded-3xl border bg-card shadow-soft overflow-hidden` with an `AnimatePresence` per step: (1) persona + waveform + mood segmented control, (2) a debrief card with bars, (3) a streak calendar (7 day dots, today amber) + "Tuesday's rep: interview (from your calendar)" card, (4) a "Real mode" phone-style cue card with a 60-s ring countdown (static ring, not a real timer). Below lg: each step renders its own panel under its text (no sticky).

**LiveDemo (client).** `id="try" scroll-mt-28`. `SectionHeading`: eyebrow "Try it", title "Try a rehearsal right now.", sub from the old page ("Pick a conversation and a mood. The AI plays the other person. Say what you would actually say, then end the rehearsal for your debrief. The full app is voice-first; this preview lets you type, and reads the other person's lines aloud where your browser allows it."). Layout `lg:grid-cols-[360px_1fr] gap-8` in one `rounded-3xl border bg-card shadow-soft p-4 md:p-6`: **left** controls = scenario chips (from `demoScenarios`, pill buttons, one selected), "Or describe your own" `Textarea` (2 rows, who + situation, becomes a custom scenario when non-empty), mood `Tabs` (3 tabs from `moods`, show `hint` under it), toggle "Read lines aloud" (`Switch`-like button with aria-pressed; uses `window.speechSynthesis` if available), primary `Button` "Start rehearsal". **Right** = transcript panel `min-h-[380px]` with the persona header (who + mood chip + "Sample" or "Live" `Badge`), message bubbles (persona left, user right ink), a typing indicator while waiting, an input row (`Input` + "Say it" button, Enter submits) and an outline "End and debrief" button that becomes visible after the first exchange. Debrief renders in place of the transcript with the score as a big mono number and `worked`/`folded`/`next`/`pattern` lists, plus "Rehearse again". Wire to `POST /api/rehearse` (contract below); if the response header `x-unmute-mode: sample` comes back, show the "Sample" badge and a one-line note "Running a scripted sample. Add an API key to go live." Errors show inline, never `alert()`.

**Scenarios.** `id="scenarios" scroll-mt-28`. `SectionHeading`: eyebrow "Conversations", title "The ones people rehearse in the shower." Grid `sm:grid-cols-2 lg:grid-cols-4` of 8 `MagicCard`s (gradientFrom lavender-deep `#C7CDF8`, gradientTo peach `#FFD9AE`, gradientColor `#EEF1F8`) each: lucide icon in a `size-10 rounded-xl bg-muted` box, title `font-display font-semibold text-lg`, body `text-sm text-muted-foreground`. `Reveal group` stagger.

**Together.** `bg-band-lavender`. `SectionHeading` from `together`. Grid `lg:grid-cols-[1fr_420px]`: left = three feature cards stacked (icon, title, body); right = an `AnimatedList` of `together.dares` (each a compact card: colored dot by `tone`, title, tag in mono) with the `delay` ~1400 ms, inside a `rounded-3xl border bg-card p-4` with a header "Today's dares".

**AntiCompanion.** `<section className="dark bg-band-ink text-foreground">`. `SectionHeading inverted` from `principles` (eyebrow, title, intro as sub). Then `md:grid-cols-2` of four principle cards `rounded-2xl border border-white/10 bg-white/5 p-6` with an amber index number and title/body. CTA row: `Button variant="accent"` "Read the manifesto" → `/manifesto` and a ghost link "See pricing". A large `Ripple` faded at low opacity behind the heading is allowed (`opacity-30`).

**Pricing (client).** `SectionHeading` from `pricing`; a monthly/yearly segmented toggle (aria-pressed buttons, `pricing.yearlyNote` badge next to yearly). Three tier cards `lg:grid-cols-3`; Plus is wrapped in `ShineBorder` (amber/lavender) with a `Badge` "Most popular" and `bg-card`; the others `bg-card/60`. Price: `font-display text-5xl` number, `text-muted-foreground` period; Teams shows `priceLabel`. Features with a small amber check (`Check` icon in a `size-5 rounded-full bg-amber/20 text-amber-ink`). Free/Plus CTA → `/#early-access` (default button), Teams → `/teams` (outline). Export `PricingTiers` (the cards + toggle, no heading) as a second named export so `/pricing` can reuse it.

**Faq.** `max-w-3xl mx-auto`, `SectionHeading` eyebrow "FAQ", title "Questions people ask before they say yes." `Accordion type="single" collapsible` over `faq`; item triggers `text-left font-medium text-base py-5`.

**FinalCta.** `dark bg-band-ink`, centered: title `display-lg text-white` = `finalCta.title`, sub `text-white/70`, `EmailCapture source="footer-cta" inverted note={finalCta.note}`.

### `/pricing` (app/pricing/page.tsx)
`metadata.title = "Pricing"`. Nav + main: hero block (`pt-36`) with eyebrow "Pricing", H1 `display-lg` "One rep a day is free.", lede `pricing.sub`; `PricingTiers`; then a comparison table from `pricing.comparison` (`overflow-x-auto`, first column feature, check/dash cells, Plus column tinted `bg-lavender/30`); `Faq`; `FinalCta`; `Footer`.

### `/manifesto` (app/manifesto/page.tsx)
`metadata.title = "Manifesto"`. Nav; hero `pt-36`: eyebrow "Manifesto", H1 `manifesto.title`, lede `manifesto.sub`; then `max-w-[68ch] mx-auto` prose sections from `manifesto.sections` with `id`s, each heading `display-md` and paragraphs `text-[1.0625rem] leading-[1.75] text-foreground/85`; pull-quote treatment for "If it works, you will use Unmute less over time. That is the point." (`border-l-4 border-amber pl-6 font-display text-2xl`). A signed-off line "— the Unmute team, September 2026". Then `FinalCta`, `Footer`. Use `Reveal` sparingly (one per section).

### `/teams` (app/teams/page.tsx + a client form component)
`metadata.title = "Teams"`. Nav; hero `pt-36`: eyebrow, H1 `teams.title`, lede `teams.sub`, primary button "Request a campus pilot" → `#pilot`. Three audience cards (`lg:grid-cols-3`) from `teams.audiences` with lucide icons and bullets. Offer band (`bg-band-lavender rounded-3xl`) with `teams.offer`. `id="pilot"` form section: client component `components/sections/pilot-form.tsx` rendering `teams.form.fields` with `Input`s, a `Textarea` "Anything we should know", submit posts to `/api/waitlist` with `{ email, source: "teams", name, org, seats, notes }` (same success/error pattern as `EmailCapture`). Then `Footer` (no FinalCta on this page).

## 7. API contracts

### `POST /api/rehearse` (app/api/rehearse/route.ts, helper in lib/rehearse.ts)
Request JSON:
```json
{ "action": "reply" | "debrief",
  "scenario": { "id": "deposit", "who": "Your former landlord", "setup": "..." },
  "mood": "kind" | "neutral" | "hostile",
  "messages": [ { "role": "persona" | "user", "text": "..." } ] }
```
- `reply`: returns `text/plain` streamed (`ReadableStream` of the persona's next line, 1–3 sentences). Uses `@anthropic-ai/sdk` `client.messages.stream` with `model: process.env.UNMUTE_MODEL ?? "claude-opus-5"`, `max_tokens: 300`, `thinking: { type: "disabled" }` is NOT needed — omit `thinking` entirely, set `output_config: { effort: "low" }` for latency; system prompt = the persona prompt below; messages mapped persona→assistant, user→user (the conversation must start with a user message: if the first message is the persona's opener, prepend a user message "(The user has just started the conversation.)" or fold the opener into the system prompt as "You already said: ..."). Header `x-unmute-mode: live`.
- `debrief`: returns JSON `{ score: 0-10, worked: string[], folded: string[], next: [string, string], pattern: string }` using `client.messages.parse` with `output_config: { format: zodOutputFormat(DebriefSchema) }` (zod installed) and the coach prompt below; `max_tokens: 1200`.
- **No `ANTHROPIC_API_KEY`:** do not call the SDK. Return scripted content with header `x-unmute-mode: sample`: for `reply`, pick from a per-mood list of 3–4 generic pushback lines that reference the scenario `who` (write these in `lib/rehearse.ts`, make them feel real: "I hear you, but…", "Send me that in writing.", etc.), streamed the same way; for `debrief`, return the canned debrief from the old landing page (score 7, the worked/folded/next/pattern strings).
- Validate the body (zod), 400 on bad input, 500 with `{ error }` on SDK failure, never leak the key. Cap `messages` at 24 entries and each `text` at 800 chars.

Persona system prompt (verbatim basis, mood text varies):
> You are roleplaying ONE person in a practice conversation so the user can rehearse a real conversation they are dreading. You play: {who}. Situation: {setup} Your mood: {moodText}. Rules: Stay in character as this person only. Reply with what this person would actually say next, 1 to 3 short sentences, natural spoken language, no narration, no stage directions, no coaching, no quotation marks, no labels. React realistically to what the user says: reward clear, specific, calm asks with movement; punish rambling, apologizing and vagueness with resistance. Never break character. Keep it safe: no slurs, no sexual content, no threats. If the user expresses intent to harm themselves or others, drop the character and say once, plainly, that this is practice and that they should contact local emergency services or a crisis line.

Mood text: kind = "warm, patient and reasonable, but you still have your own interests"; neutral = "businesslike, a little distracted, not hostile but not doing the user any favors"; hostile = "impatient, defensive and dismissive; you interrupt, deflect and try to end the conversation early, though you can be moved by a calm, specific, well-evidenced ask".

Coach prompt:
> You are a blunt, kind communication coach. The user just rehearsed this conversation. They played 'You'; the AI played {who} ({mood} mood). Situation: {setup}. TRANSCRIPT: … Write a debrief of what the user (You) did. Judge only the user's lines. Be specific and quote their words. score: integer 0-10 for how effective the user was at getting what they wanted while staying calm and clear. worked: up to 3 short specific things the user did well, quoting them. folded: up to 3 short specific moments the user apologized, rambled, hedged, gave ground, or buried the ask, quoting them; empty if none. next: exactly 2 short sentences the user should say next time, written in first person, ready to say out loud. pattern: one sentence naming a habit visible in their lines.

### `POST /api/waitlist` (app/api/waitlist/route.ts)
Body `{ email, source, ...extra }`. Validate email with zod; 400 `{ ok:false, error }` on bad input. If `WAITLIST_WEBHOOK_URL` is set, `fetch` it with the JSON (POST, 5 s timeout) and pass through failure as 502; otherwise `console.log("[waitlist]", …)` and return `{ ok: true }`. Always strip anything except `email`, `source`, `name`, `org`, `seats`, `notes` (max 500 chars each). Never store to disk.

## 8. Engineering rules for section builders

- Server components by default. Add `"use client"` only where hooks/motion/handlers are used. Magic UI components are already client components; importing them from a server component is fine.
- Do not edit shared files (`app/globals.css`, `app/layout.tsx`, `lib/content.ts` except appending new keys, `components/ui/*`, `components/site/*`, `components/magicui/*`). If a shared change is unavoidable, note it in your report instead.
- Do not run `next build` or `next dev` (the integrator does). Verify with `npx tsc --noEmit` and `npx eslint <your files>`; only errors in your own files are yours.
- Imports: `@/components/...`, `@/lib/...`. Motion: `import { motion, AnimatePresence, useInView, useReducedMotion } from "motion/react"`.
- Every interactive element: `cursor-pointer` (global for buttons/links), visible focus (global), hover transition 150–300 ms. Icon-only buttons get `aria-label`.
- No `<img>`/photos: everything is CSS, SVG, or component mocks. No emoji anywhere in UI.
- Copy comes from `lib/content.ts`. Numbers with footnotes keep their footnote link.
- Keep bundle small: no new dependencies without noting it.
- Text must not overflow at 375 px: use `break-words`, `min-w-0` on flex children, `max-w-[Nch]` on paragraphs.

## 9. Pre-delivery checklist (UI/UX Pro Max)

- [ ] No emoji icons; lucide only, consistent stroke width
- [ ] Every clickable element has `cursor-pointer` and a hover state with 150–300 ms transition
- [ ] Text contrast ≥ 4.5:1 (amber never as text on light)
- [ ] Focus visible on all interactive elements
- [ ] `prefers-reduced-motion` respected (global config + no non-motion side effects)
- [ ] Responsive at 375 / 768 / 1024 / 1440 with no horizontal scroll
- [ ] Headings in order (one H1 per page), landmarks (`header`, `main`, `footer`, `nav aria-label`)
- [ ] Forms: labels (visually hidden ok), `type="email"`, inline errors with `role="alert"`
- [ ] Copy matches `lib/content.ts`; no placeholder lorem
- [ ] `npm run build`, `npx eslint .` and Playwright screenshots at four widths pass
