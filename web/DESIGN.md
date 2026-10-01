# Unmute marketing site · design + build spec

Stack: Next.js 16 (App Router, Turbopack), React 19, Tailwind v4, `motion` v13 (Framer Motion's successor, import from `"motion/react"`), shadcn/ui primitives (`components/ui`), Magic UI components (`components/magicui`, the open-source library 21st.dev aggregates), lucide-react icons.

Heavy reference: **Cluely** (cluely.com). Light, airy, minimal. One bold display headline, a product demo right under it, floating pill nav, sections that reveal on scroll, a sticky "how it works" showcase, pricing with one highlighted tier, one dark block at the end for the big statement and the final CTA, compact footer. Pages: Home, Pricing, Manifesto, Teams (Cluely: Enterprise).

Design system generated with the UI/UX Pro Max skill for the brief "voice AI practice for real-life conversations, consumer, YC-style": pattern *Product Demo + Features*, style *Flat design with restraint* (thin borders, minimal shadows, simple hover, 150 to 200 ms ease), display/body font pairing, and the pre-delivery checklist at the bottom of this file. The revamp applied the verified Taste, Impeccable and Emil audit on top of it; the rules below are the result.

**Owner-pinned (do not change):** the light cool canvas `#F7F8FC`; the lavender + peach mesh in the hero with a faded dot grid; Outfit headlines + Inter body; amber `#FFB454` accent with dark ink pill buttons; the self-playing app-window mock in the hero; the hero pill reading exactly "Conversation practice for real life"; the hand-drawn amber underline on "people"; dark navy bands with an indigo/amber glow. No em or en dashes in user-visible copy. No fabricated claims ("Most popular", invented outcome numbers). Desktop first; nothing scrolls horizontally at 390 px.

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

Brand utilities: `bg-hero-mesh` (lavender + peach radial mesh; the hero lays a faded CSS dot grid over it), `bg-band-ink` (ink with an indigo glow at 0.32 and an amber glow at 0.35; always inside a `.dark` element), `bg-band-lavender` (white to lavender), `glass` (white/72 + blur + hairline; solid white/96 under `prefers-reduced-transparency`), `shadow-soft`, `shadow-window` (the hero window only).

Type utilities: `display-xl` (hero H1: clamp 44 to 76 px, Outfit 700, leading 1, tracking -0.03em), `display-lg` (section H2), `display-md` (card H3, the proof heading), `lede` (subheads, muted, `text-wrap: balance`; width is set at the call site, `max-w-[46ch]` in `SectionHeading`), `eyebrow` (Inter 13 px, medium, tracking 0.01em, sentence case, amber-ink; an explicit `text-*` color class overrides it).

Fonts (self-hosted): `font-display` = Outfit (headlines), `font-sans` = Inter (everything else). Mono is for clocks and numbers only; numbers elsewhere use Inter `tabular-nums`. Labels, moods, speaker tags, legends, status lines and tags are sentence-case `text-xs font-medium` Inter, never mono, never uppercase.

Icons: lucide only, stroke 2 everywhere (a base rule on `svg.lucide` overrides any per-icon `strokeWidth`). Buttons: `default` is the ink pill; `accent` is the amber pill with a 1 px inset highlight and a 1 px drop, no amber glow.

Contrast: never put amber text on the light background (fails). Amber is a **fill** with ink text, or a text color on dark only (`text-amber`). Muted text stays at 4.5:1 or better.

## 3. Layout rhythm

- `Container`: max-w 1200px, px 20/32.
- Section padding: light sections `py-20 md:py-24`; Proof is a short strip (`py-16 md:py-20`); Scenarios and LiveDemo read as one flow (Scenarios `pb-12`, LiveDemo `pt-12`); the dark block `py-24 md:py-28`.
- Section heading: `SectionHeading` (optional eyebrow, H2 `max-w-[20ch]`, lede). Left-aligned on How it works, Scenarios, Together and FAQ; centered on LiveDemo, Pricing and the dark block.
- **Kickers:** the home page has one section kicker, "Not a companion" on the dark band. The hero pill is an owner-pinned exception, and nothing gets appended to it. No other label sits above a home H2. Inner pages (Pricing, Manifesto, Teams, 404) may use `eyebrow` in its sentence-case form.
- **No numbering:** no 01 to 08 on cards or sections, no "04 / 04". The How it works steps are the one real sequence and keep a small inline number inside their h3 (`tabular-nums text-amber-ink`).
- **Cards and surfaces:** a card is for something clickable or a product mock. Features and principles are plain rows split by `border-t`, not cards. Never nest a card in a card: inside a surface, group with a hairline (`border-t border-border pt-4`) or a plain fill. Bordered surfaces are flat. Only three surfaces carry a wide shadow: the hero window (`shadow-window`, no border), the demo panel and the highlighted pricing tier (`ring-2 ring-amber/70`, no badge claims). The scrolled nav is borderless white/90 with `shadow-soft`.
- **Hover:** only clickable cards (the scenario cards) lift, 2 px in 150 ms. Static cards get no lift and no hover border or fill.
- Chips: pill, `bg-muted text-foreground text-sm px-3.5 py-1.5`; selected = `bg-primary text-primary-foreground`.
- Responsive: desktop is the priority. Single column up to 640, 2 columns at md, 3 to 4 at lg. Check 390 / 768 / 1024 / 1440. Nothing scrolls horizontally except a table in `overflow-x-auto`.
- Anchors that the nav and footer point to: `#how-it-works`, `#try`, `#scenarios`, `#early-access` (hero form wrapper; the final CTA uses `id="early-access-bottom"`). Manifesto anchors: `#not-a-companion`, `#privacy`, `#safety`. Anchored sections get `scroll-mt-28` so the floating nav does not cover them.

## 4. Motion spec (`lib/motion.ts`, `components/site/reveal.tsx`)

Motion has to mean something: who is talking, the call playing out, a state change. No decorative infinite loops: BorderBeam, AnimatedShinyText, ping dots, Ripple, ShineBorder and Marquee are not used on the page (the components stay in `components/magicui`). `AnimatedList` stays on the dares only because it now plays once (items drop in from above, spring 0.45 s, 350 ms apart) and shows the finished list at once under reduced motion.

- **Curve and timing:** `ease = [0.23, 1, 0.32, 1]` everywhere (CSS `cubic-bezier(0.23,1,0.32,1)`). UI motion (press, hover, nav, tab and panel swaps) stays under 300 ms; scroll reveals take 0.4 s; the hero window 0.6 s. Exits run faster than entrances (about 150 ms). Every button presses to `scale(0.97)` in 160 ms. Sheets use `cubic-bezier(0.32,0.72,0,1)`, 300 ms open and 200 ms close (overlay 200 / 150 ms).
- **Transform strings:** animate `transform: "translateY(10px)"`, not motion's `x`/`y`/`scale` shorthands, so the browser can run it off the main thread while the page hydrates.
- **Reduced motion:** movement goes, fades stay. Globally, CSS keyframes collapse to a single 0.01 ms run and transitions are limited to color, background, border, outline, opacity, box-shadow, fill and stroke. `MotionConfig reducedMotion="user"` only neutralizes motion's shorthands, so anything that animates a `transform` string drops the movement itself: `motion-reduce:transform-none!` on the element (hero), a fade-only variant (How it works panel), or `fadeUpWith({ reduce })` (reveals). Keep the hidden state identical either way so server HTML matches. Side effects (speech, autoplay loops) check `useReducedMotion()`.
- **Page load (hero only):** pill, H1, sub, form and window stagger in (0.06 s). The H1 arrives word by word, 50 ms apart, each word rising 12 px out of a 4 px blur; the amber underline on "people" draws after the words land. The window rises last (`translateY(16px) scale(0.97)`, 0.6 s).
- **Hero window:** a self-playing call, labeled "Example rehearsal". Each spoken line arrives word by word (`word-in`), the waveform shows who is talking, the title-bar clock runs, then the debrief fills in. Reduced motion: whole lines, stopped clock.
- **Scroll reveals:** `<Reveal>` (fade up 10 px) or `<Reveal group>` + `<RevealItem>` (stagger 0.06 s), `viewport = { once: true, amount: 0.1, margin: "0px 0px -5% 0px" }` so fast scrollers never meet blank blocks. Pass `delay` as a prop: Reveal bakes it into the variant, because motion ignores a `transition` prop once the variant has one, and an explicit `delay: 0` would cancel a parent's stagger. Without JavaScript a `<noscript>` rule shows everything a reveal would have faded in.
- **Nav:** renders statically (it remounts on every route, so no entrance). One soft pill (`layoutId="nav-pill"`, 220 ms) slides to the link under the pointer and rests on the current page or home section. Keyboard focus shows the focus outline only, never a moving pill. Scroll state comes from an IntersectionObserver sentinel, never a scroll listener.
- **Sticky showcase (How it works):** the step in the middle of the screen drives the panel; old and new panels crossfade (no `mode="wait"`), exits in 150 ms.
- **Email capture:** success morphs in place. The form leaves in 150 ms (opacity, 2 px blur, scale 0.98) while the confirmation springs in over it (`AnimatePresence mode="popLayout"`, spring 0.4 s bounce 0.2: opacity, scale 0.96, 2 px blur), in the same shell, so the row keeps its height. While loading, the arrow crossfades into a spinner in one fixed slot, so the label never moves; a guard, not `disabled`, blocks double submits.
- **Scenario cards to demo:** a card's "Rehearse this" dispatches `unmute:rehearse`; the demo below loads that conversation, scrolls down to its panel and focuses Start.
- **Numbers:** proof stats are static text. If `NumberTicker` is used, the server renders the final value and it counts (0.9 s, the signature ease) only when it mounts off screen.

## 5. Component inventory

`components/ui` (shadcn, radix-ui umbrella package): `Button` (variants `default` ink pill, `accent` amber pill, `outline`, `secondary`, `ghost`, `link`; sizes `sm` `default` `lg` `xl` `icon*`; `asChild` for links), `Badge`, `Card`+parts, `Accordion`, `Tabs`, `Dialog`, `Sheet`, `Separator`, `Input`, `Textarea`.

`components/magicui` (read the file for props before using; the looping ones are kept but not used on the page, see §4): `animated-list`, `animated-shiny-text`, `aurora-text`, `avatar-circles`, `blur-fade`, `border-beam`, `dot-pattern`, `highlighter` (rough-notation underline/highlight of a word), `interactive-hover-button`, `line-shadow-text`, `magic-card` (`dark` prop for dark bands), `marquee`, `number-ticker`, `ripple`, `scroll-progress`, `shimmer-button`, `shine-border`, `text-animate`, `typing-animation`, `word-rotate`.

`components/site`: `Container`, `SectionHeading` (props `title`, `sub`, `eyebrow?`, `align`, `inverted`), `Logo`/`LogoMark`, `Nav` (floating pill, Sheet on mobile), `Footer`, `EmailCapture` (posts to `/api/waitlist`; props `source`, `inverted`, `note`, `buttonLabel`), `Reveal`/`RevealItem` (`delay`, `group`, `staggerBy`).

`lib/content.ts` is the only place copy lives. Import `site, nav, hero, rehearsalWindow, proof, stats, howItWorks, steps, scenariosHeading, demoScenarios, liveDemo, moods, together, principles, pricing, faqHeading, faq, finalCta, footnotes, footer, manifesto, teams` from it. `demoScenarios` is the one scenario list: demo chips, scenario cards (`cardTitle`/`cardBody`) and the scripted sample (`SCRIPTS` in `lib/rehearse.ts`, keyed by the same ids) all read from it. Do not hard-code copy in sections; if you need a string that does not exist, add it to `lib/content.ts` (append only, keep existing keys).

Icons: lucide-react only. **No emoji as icons.** Content strings reference lucide names (`together.features[].icon`, `teams.audiences[].icon`); the scenario cards carry no icon tiles (the opener bubble is their visual). Resolve names with a small map in the section file (`import { Users, ... } from "lucide-react"`), never `import * as Icons`.

## 6. Page map and section specs

### `/` (app/page.tsx), in this order
1. `Hero`: `hero.tsx` (server) + `rehearsal-window.tsx` (client mock)
2. `Proof`: `proof.tsx`
3. `HowItWorks`: `how-it-works.tsx` (client, sticky showcase) `id="how-it-works"`
4. `Scenarios`: `scenarios.tsx` `id="scenarios"`. Above the demo, so choosing a card scrolls *down* into it.
5. `LiveDemo`: `live-demo.tsx` (client) `id="try"`
6. `Together`: `together.tsx`
7. `Pricing`: `pricing.tsx`
8. `Faq`: `faq.tsx`
9. One dark block, `<div className="dark bg-band-ink">`, holding `AntiCompanion` and `<FinalCta band={false} />` (a hairline between them), so the page switches theme once. `FinalCta` keeps its own band on inner pages.
10. `Footer` (light)

Each section exports one named component with no required props, is self-contained (its own `<section>` with padding and `Container`) and reads from `lib/content.ts`. All section paths are in `components/sections/`.

**Scenario set** (`demoScenarios`, Gen Z everyday life, one per card and chip): `doctor` (book a doctor's appointment with the student health front desk), `bank-fee` (get a $35 overdraft fee waived), `raise` (ask your manager for $18 an hour), `extension` (ask your professor for an extension), `group-project` (the group project ghost), `pay-me-back` (get your $72 back from a friend), `thanksgiving` (tell your mom you're not coming home for break), `spring-trip` (say no to the trip after everyone sent the $140 deposit). Retired, never reused: the roommate dishes, the $62,000 salary raise, the landlord deposit, the pizza-discount and barista-name dares.

**Hero.** `bg-hero-mesh` with a faded CSS dot grid. Centered stack: the pill (exactly "Conversation practice for real life", plain text with a small amber dot, no shimmer); H1 `display-xl` = `hero.headline` with the hand-drawn amber underline on "people"; sub `lede max-w-[60ch]`; `EmailCapture source="hero"` in a wrapper `id="early-access"`; one quiet text link "Try a rehearsal" to `#try`. Then the **RehearsalWindow**.

**RehearsalWindow (client).** The owner's self-playing mock, labeled "Example rehearsal": a student health front desk call. The front desk (rushed, distracted) puts you on hold, you ask for the earliest morning slot this week, they offer Thursday at 9:40. The debrief fills in: got to the ask 0:11 (was 1:05), apologies before the ask 0 (was 3), filler words 1 ("um"), asked for the earliest slot, and two "Next time, say" lines. `shadow-window` and no border; inner groups split by hairlines, not nested cards. Pure UI, no network. Stacks at phone width. "Try this one" opens `doctor` in the demo.

**Proof.** One short heading (`proof.title`) over the two sourced stats as static text, each with a footnote link to `#fn-N`. No ticker, no marquee, no kicker.

**HowItWorks (client).** Left-aligned heading, no kicker. Four steps; each h3 carries its small inline step number. The sticky panel tells one story, the bank fee call (`mocks.rehearse.scenarioId`): rehearse, debrief, daily rep, real mode. One caption under the panel: "Example screens". Below lg each step shows its own panel.

**Scenarios.** Left-aligned heading, no kicker, no card numbers. Eight clickable cards from `demoScenarios` in a 12-column bento (who line, opener bubble, `cardTitle`, `cardBody`, "Rehearse this"), plus "Or describe your own" in the heading row, which opens the demo's custom box with `customPrefill`.

**LiveDemo (client).** Centered heading, no kicker. One demo panel (`id="try-panel"`, one of the three surfaces allowed a wide shadow) holds the controls and the transcript; nothing inside it is another card, so the transcript and debrief sub-blocks are split by hairlines or a plain fill. Wire to `POST /api/rehearse`; in sample mode show the "Sample" badge and `liveDemo.sampleNote`, and the scripted debrief carries `liveDemo.debrief.sampleNote` because its quotes were written ahead of time. Errors show inline, never `alert()`.

**Together.** `bg-band-lavender`, left-aligned heading. Features are plain rows split by hairlines; the dares are divided rows in one flat card that fill in once via `AnimatedList` (see §4), tags in sentence case ("2 min").

**AntiCompanion.** Inside the dark block. `SectionHeading inverted` with the page's one kicker, "Not a companion". Principles are typographic rows (`border-t border-white/15`), no numbers, no fill, no hover lift, no Ripple. One accent button, "Read the manifesto".

**Pricing (client).** Centered heading, no kicker. Three tiers; the highlighted tier gets `ring-2 ring-amber/70` and its shadow, never a "Most popular" claim. Static cards: no hover lift. `PricingTiers` is reused by `/pricing`.

**Faq.** 12-column grid: a sticky left heading ("Before you sign up.") with the contact line and a `mailto:` link to `site.contactEmail`; on the right every answer is open, as `dl` rows split by hairlines. No accordion.

**FinalCta.** Centered: `finalCta.title`, sub, `EmailCapture source="footer-cta" inverted note={finalCta.note}`. No kicker.

### `/pricing` (app/pricing/page.tsx)
`metadata.title = "Pricing"`. Nav + main: hero block (`pt-36`) with eyebrow "Pricing", H1 `display-lg` "One rep a day is free.", lede `pricing.sub`; `PricingTiers`; then a comparison table from `pricing.comparison` (`overflow-x-auto`, first column feature, check/dash cells, Plus column tinted `bg-lavender/30`); `Faq`; `FinalCta`; `Footer`.

### `/manifesto` (app/manifesto/page.tsx)
`metadata.title = "Manifesto"`. Nav; hero `pt-36`: eyebrow "Manifesto", H1 `manifesto.title`, lede `manifesto.sub`; then `max-w-[68ch] mx-auto` prose sections from `manifesto.sections` with `id`s, each heading `display-md` and paragraphs `text-[1.0625rem] leading-[1.75] text-foreground/85`; pull-quote treatment for "If it works, you will use Unmute less over time. That is the point." (`border-l-4 border-amber pl-6 font-display text-2xl`). A sign-off line, `manifesto.signOff` ("The Unmute team, September 2026"). Then `FinalCta`, `Footer`. Use `Reveal` sparingly (one per section).

### `/teams` (app/teams/page.tsx + a client form component)
`metadata.title = "Teams"`. Nav; hero `pt-36`: eyebrow, H1 `teams.title`, lede `teams.sub`, primary button "Request a campus pilot" → `#pilot`. Three audience cards (`lg:grid-cols-3`) from `teams.audiences` with lucide icons and bullets. Offer band (`bg-band-lavender rounded-3xl`) with `teams.offer`. `id="pilot"` form section: client component `components/sections/pilot-form.tsx` rendering `teams.form.fields` with `Input`s, a `Textarea` "Anything we should know", submit posts to `/api/waitlist` with `{ email, source: "teams", name, org, seats, notes }` (same success/error pattern as `EmailCapture`). Then `Footer` (no FinalCta on this page).

## 7. API contracts

### `POST /api/rehearse` (app/api/rehearse/route.ts, helper in lib/rehearse.ts)
Request JSON:
```json
{ "action": "reply" | "debrief",
  "scenario": { "id": "bank-fee", "who": "A rep at your bank", "setup": "..." },
  "mood": "kind" | "neutral" | "hostile",
  "messages": [ { "role": "persona" | "user", "text": "..." } ] }
```
- `reply`: returns `text/plain` streamed (`ReadableStream` of the persona's next line, 1 to 3 sentences). Uses `@anthropic-ai/sdk` `client.messages.stream` with `model: process.env.UNMUTE_MODEL ?? "claude-opus-5"`, `max_tokens: 300`, omit `thinking` entirely, set `output_config: { effort: "low" }` for latency; system prompt = the persona prompt below; messages mapped persona→assistant, user→user (the conversation must start with a user message: if the first message is the persona's opener, prepend a user message "(The user has just started the conversation.)" or fold the opener into the system prompt as "You already said: ..."). Header `x-unmute-mode: live`.
- `debrief`: returns JSON `{ score: 0-10, worked: string[], folded: string[], next: [string, string], pattern: string }` using `client.messages.parse` with `output_config: { format: zodOutputFormat(DebriefSchema) }` (zod installed) and the coach prompt below; `max_tokens: 1200`.
- **No `ANTHROPIC_API_KEY`:** do not call the SDK. Return scripted content with header `x-unmute-mode: sample`: for `reply`, the scenario's own scripted lines for that mood (`SCRIPTS` in `lib/rehearse.ts`, keyed by `demoScenarios` id), streamed the same way; custom scenarios get relationship-neutral generic lines. For `debrief`, return that scenario's own debrief (`sampleDebrief`).
- Validate the body (zod), 400 on bad input, 500 with `{ error }` on SDK failure, never leak the key. Cap `messages` at 24 entries and each `text` at 800 chars.

Persona system prompt (basis; `buildPersonaSystem` and `moodText` in `lib/rehearse.ts` are the source of truth):
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
- Every interactive element: `cursor-pointer` (global for buttons/links), visible focus (global), hover transition 150 to 300 ms. Icon-only buttons get `aria-label`.
- No `<img>`/photos: everything is CSS, SVG, or component mocks. No emoji anywhere in UI.
- Copy comes from `lib/content.ts`. Numbers with footnotes keep their footnote link.
- Keep bundle small: no new dependencies without noting it.
- Text must not overflow at 390 px: use `break-words`, `min-w-0` on flex children, `max-w-[Nch]` on paragraphs.

## 9. Pre-delivery checklist (UI/UX Pro Max)

- [ ] No emoji icons; lucide only, consistent stroke width
- [ ] Every clickable element has `cursor-pointer` and a hover state with a 150 to 300 ms transition
- [ ] Text contrast ≥ 4.5:1 (amber never as text on light)
- [ ] Focus visible on all interactive elements
- [ ] `prefers-reduced-motion` respected (movement dropped, fades kept; no non-motion side effects)
- [ ] Responsive at 390 / 768 / 1024 / 1440 with no horizontal scroll
- [ ] Headings in order (one H1 per page), landmarks (`header`, `main`, `footer`, `nav aria-label`)
- [ ] Forms: labels (visually hidden ok), `type="email"`, inline errors with `role="alert"`
- [ ] Copy matches `lib/content.ts`; no placeholder lorem
- [ ] Home: one kicker ("Not a companion") besides the hero pill, no section or card numbering, no decorative infinite loops, no static card that lifts on hover
- [ ] No em or en dashes in user-visible copy; no fabricated claims
- [ ] `npm run build`, `npx eslint .` and Playwright screenshots at four widths pass
