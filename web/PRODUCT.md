# Product

<!-- impeccable:product-schema 1 -->

> Written by Impeccable `init` without a live interview: the owner was not attached to the session. Every fact below is inferred from the owner's own confirmed documents and decisions in this repository (`docs/plan/11-unmute.md`, `site/unmute-brief/`, `web/lib/content.ts`) and marked with its source. Items marked **Open** were never decided and must not be invented.

## Platform

web

## Users

- **Primary: young adults who dread a specific real conversation.** Gen Z and people 18-25, college students first, putting off conversations like booking a doctor's appointment, getting a bank fee waived, asking for $18 an hour, office hours for an extension, the group project ghost, getting paid back by a friend, telling their parents they're not coming home, saying no to a trip they can't afford. They are not in crisis; they are avoiding. *(Inferred from docs/plan/11-unmute.md §3; the owner approved this audience when choosing Unmute.)*
- **Evidence of the problem:** 65% of Gen Z say calling a stranger makes them uncomfortable, and only a third are comfortable making calls at all (YouGov); 37% of adults 18-25 report significant anxiety, the highest adult group (Compass Health Center, 2026). *(Sourced in the brief and site footnotes.)*
- **Secondary (Teams): career centers** running interview season, **companies** training customer-facing staff and new managers, **clinicians** running structured social-anxiety practice between sessions. *(docs/plan/11-unmute.md, launch addendum.)*
- **How they arrive:** a short before-and-after clip (someone's first call next to their tenth), a dare, a friend's practice room, or a career-center link during interview season, usually on a phone. *(Launch sequence in the plan.)*

## Product Purpose

Unmute lets you rehearse the conversation you are dreading, out loud, with an AI that plays the other person and pushes back, then tells you exactly what to do differently. Three minutes a day. Success is not time in the app: it is the user going and having the real conversation, and needing Unmute less over time. *(docs/plan/11-unmute.md §3; the stance "a coach that wants you to need it less" is the owner's approved positioning.)*

## Positioning

- **The anti-companion.** AI companions are built to keep you talking to them; Unmute is built to get you talking to people. Every rehearsal ends with a debrief and a real conversation to go have. *(Brief, "Not a companion".)*
- **Speak's mechanic, pointed at the conversations people actually fear, in their own language.** Speak proved a daily say-it-out-loud habit is worth $100M+ a year for languages. *(Brief; Y Combinator on Speak.)*
- **The gap it fills:** workplace trainers (Yoodli, VirtualSpeech, Second Nature, Hyperbound) cover interviews and sales calls; open chatbots roleplay anything without coaching; the personal hard talks fall between them. *(Launch addendum, evidence gathered Sep 2026.)*

## Operating Context

- **The rehearsal:** pick a scenario or describe your own; choose the other person's mood (kind, neutral, hostile); talk; the persona interrupts, sighs, goes quiet, pushes back.
- **The debrief:** what worked, where you folded, time to the ask, apologies before the ask, filler words, whether you held the number or the boundary, the two sentences to try next time, and a pattern across sessions ("you apologize before every ask").
- **The daily rep:** three minutes, a streak, a scenario chosen from what is coming up (calendar-aware when connected).
- **Real mode:** a 60-second warmup and a cue card before the real call, a debrief from your own notes after. Unmute never listens to real calls.
- **Together:** practice rooms (a friend plays your manager while the AI coaches), dares, shareable before-and-after clips, voice-changed if wanted.
- *(All from docs/plan/11-unmute.md §3 and the site copy the owner approved.)*

## Capabilities and Constraints

- **Stage:** pre-launch. The consumer app (Expo, voice-first) is not built yet; the web marketing site is the live surface. Early access opens campus by campus in interview season (Sep-Nov 2026).
- **Working on the site today:** a text-mode rehearsal demo backed by Claude (`/api/rehearse`; runs a labeled scripted sample when no API key is configured), a waitlist (`/api/waitlist`), and a Teams pilot request form.
- **Pricing (set by the owner):** Free, one rehearsal a day; Plus $14.99 a month or $99 a year; Teams $3-8 per seat per month, free for career centers this interview season.
- **Privacy commitments:** rehearsals are private to the user, never used to train models, deleted when the user says so. Sharing a clip is always explicit.
- **Safety commitments:** a coach, not therapy. Crisis language routes to real resources every time. No romantic roleplay; every persona is clearly synthetic.
- **Routes to keep:** `/`, `/pricing`, `/manifesto`, `/teams`, anchors `#how-it-works`, `#try`, `#scenarios`, `#early-access`, `#pilot`, and manifesto anchors `#not-a-companion`, `#privacy`, `#safety`.
- **Stack (existing):** Next.js 16 App Router, React 19, Tailwind v4, Motion, deployed on Vercel from this repository with root directory `web`.

## Brand Commitments

- **Name: Open.** "Unmute" is the working name. The owner flagged it as taken across domains and app stores and asked for alternatives; Presay, Hearsa and Repsay were researched with domains available. No replacement was chosen, so the site keeps "Unmute" and the name must stay easy to swap (one source of truth in `lib/content.ts`).
- **Tagline:** "Talk to an AI so you can talk to people." *(Approved by the owner.)*
- **Voice:** blunt, kind, specific. Short sentences. No hype words. Say the number and stop talking. *(Established in the brief and site copy.)*
- **Mark:** an amber waveform of four bars; amber (`#FFB454`) has been the brand accent since the first preview. *(Carried through every approved iteration; treat as a recognizable trait, not a locked palette.)*
- **Reference the owner made binding:** Cluely (cluely.com) as a heavy reference for the marketing site: a hyped consumer-AI launch that leads with the product, feels fast and polished, and moves. The owner asked for motion (Framer Motion), open component libraries, and, for this upgrade, the Emil Kowalski, Impeccable and Taste design skills. *(Owner's words in the session.)*

## Evidence on Hand

- **Real:** the problem statistics above (YouGov; Compass Health Center 2026; Y Combinator on Speak), cited in the site footnotes.
- **Real:** pricing, the privacy and safety commitments, the scenario library, the persona and coach prompts (`lib/rehearse.ts`), the working demo.
- **Absent, must not be fabricated:** users, testimonials, reviews, customer or university logos, press, ratings, download counts, retention or outcome numbers, partner names. Any illustrative person, transcript, or debrief shown on the site is demonstration material and must read as an example, never as a customer.

## Product Principles

1. **Success is the user closing the app and talking to a person.** Never design for time-in-app.
2. **Specific beats supportive.** The debrief quotes your words and hands you the next sentence; no vague encouragement.
3. **Practice has friction on purpose.** The other person pushes back; hard mode exists; the product earns trust by being realistic, not flattering.
4. **Private by default, shareable by choice.** Nothing about a rehearsal leaves the user without an explicit act.
5. **A coach, never a companion or a therapist.** Clear edges: synthetic personas, crisis routing, no romance.

## Accessibility & Inclusion

- The audience skews toward people with social or phone anxiety: the site must never pressure (no countdown timers, no fake scarcity), must work fully by keyboard and screen reader, and must respect reduced motion. The demo's text mode is the accessible path for people who cannot or will not speak aloud. *(Inferred from the audience and the owner's no-pressure copy; target WCAG 2.2 AA.)*
