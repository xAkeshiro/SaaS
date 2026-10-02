# Unmute: codebase, promise inventory and reuse map

Research area: the current code and every promise the site makes. Read on 2026-10-02 from `/home/user/SaaS` at commit `fb87235` (branch `claude/charming-fermi-vwwai8`). Every path below is relative to `/home/user/SaaS` unless it says otherwise. Nothing in the repo or in any external account was changed.

Sources used:
- The repo itself, with `file:line` references.
- The Next.js docs that ship with the installed version (`web/node_modules/next/dist/docs/`, Next 16.3.5). These are version-locked, so they are more reliable than memory.
- Anthropic model and pricing facts from the bundled Claude API skill. Its cache is dated 2026-09-25 and points to the official pages listed in section 3.2. I did not fetch those pages live.
- Read-only calls to the Vercel and Supabase MCP servers.
- Vercel docs search results, and one web search for Expo.

The proxy blocked direct fetches of vercel.com, docs.expo.dev and the deployed `*.vercel.app` site. Anything I could not verify is marked **unverified**.

---

## 0. Key findings

1. **The site sells a voice product, but only a typed demo exists.** "Out loud", "interrupts, sighs, puts you on hold", "time to the ask", "every filler word", streaks, the calendar, real mode, practice rooms, dares, clips, patterns and Teams dashboards appear as present-tense features. The only working pieces are:
   - a typed text demo (`app/api/rehearse`)
   - optional browser `speechSynthesis` read-aloud (`components/sections/live-demo.tsx:301-311`)
   - an email capture
   - a pilot form
   
   There is no speech input anywhere in `web/`.
2. **Four copy contradictions need a decision before the product gates anything.** Details are in section 1.16.
   - Custom scenarios are "Plus only" (`lib/content.ts:311`), but the free demo offers them, and Free says "any scenario" (`:223`).
   - Hostile "hard mode" is "Plus only" (`:269`), but the demo and FAQ give everyone hostile (`:87`, `:303`).
   - "Private to you" (`:205`) sits next to Teams promises of "a debrief the counselor can see" (`:417`) and "clinician-visible debriefs" (`:430`).
   - "We stop rehearsing" on crisis language (`:389`) does not match the persona prompt, which only says one line and keeps the session going (`lib/rehearse.ts:138-139`).
3. **The Teams page promises service that is running right now.** It offers a free career-center offer for "September to November 2026" (`lib/content.ts:435`) and says "Your people rehearse the same week" (`:718`). Today is 2026-10-02 and no Teams product exists. Either change the copy or run concierge pilots on consumer accounts.
4. **Waitlist and pilot emails are not stored anywhere durable unless a webhook is set.** `app/api/waitlist/route.ts:97-106` forwards to `WAITLIST_WEBHOOK_URL` if it is set. Otherwise it only `console.log`s the payload. I could not see whether the variable is set on Vercel (the env listing returned 403). Production runtime logs for the last 30 days show no `/api/waitlist` or `/api/rehearse` requests at all, only page views.
5. **`/api/rehearse` is an open Claude proxy whenever a key is set.** It has no auth and no rate limit. The client sends free-text `who` and `setup` (`lib/rehearse.ts:24-28`), so anyone can steer the model on the owner's key. This must change before any ElevenLabs token minting goes on the same pattern.
6. **The model id `claude-opus-5` is valid, but the reply route as written has two problems on that model.**
   - On Opus 5, omitting `thinking` means it thinks by default.
   - `max_tokens` caps thinking plus text together, so `max_tokens: 300` on the persona route (`app/api/rehearse/route.ts:95`) can truncate or empty a line.
   - Default thinking also adds latency to every voice turn.
   - No route checks for `stop_reason: "refusal"`.
   - `claude-opus-5-5` is now the current Opus at $4/$20 per MTok, against $5/$25 for Opus 5.
   
   Section 3.2 has the details and sources.
7. **Realtime audio cannot go through Next route handlers on Vercel.** The bundled Next docs say WebSockets "won't work" on hosts that run route handlers as lambdas (`web/node_modules/next/dist/docs/01-app/02-guides/backend-for-frontend.md:921-927`). The live audio loop has to run browser to vendor (with a short-lived token minted by our route), or through a separate long-lived service.
8. **About 70% of the logic is ready to become shared product code.** Candidates: scenario data, mood text, persona and coach prompts, the debrief zod schema plus normalizer, the scripted samples and the metric regexes. Today it is coupled to marketing copy: `lib/rehearse.ts:8` imports scenarios from `lib/content.ts`. Inverting that is the first step of the restructure.
9. **Do the monorepo move first, as one mechanical PR before any product code.** It is cheap now. It needs one setting change in Vercel (Root Directory `web` → `apps/web`) and one code fix: the `next/font/local` paths in `app/layout.tsx:9,18,22,32` point at `../node_modules/...` and will break when workspaces hoist dependencies.
10. **No Unmute database exists in the connected accounts.** The only Supabase project is "Limohunter v2 Database" in org "Limo Hunter". It is unrelated and should not be reused. Accounts, sessions and debriefs need a new project or a new store.

---

## 1. Promise inventory

### Verdict key

| Verdict | Meaning |
|---|---|
| **MVP** | The web product must deliver this at launch. The free tier or the core loop sells it in the present tense. |
| **V1.1** | Weeks after MVP, before or alongside the mobile app. |
| **LATER** | After the mobile app, or when a Teams customer pays for it. |
| **COPY** | The wording must change, now or at product launch, unless the feature ships first. |

A row can carry two verdicts, for example "LATER + COPY". All copy lives in `web/lib/content.ts` unless another file is named.

### 1.1 Identity, positioning and status

| # | Exact wording | Where | Verdict | Notes |
|---|---|---|---|---|
| P1 | "Talk to an AI so you can talk to people" | `lib/content.ts:8`, H1 `:34` | MVP | The tagline is approved (`web/PRODUCT.md:50`). |
| P2 | "Rehearse the conversation you are dreading, out loud, with an AI that plays the other person and pushes back. Then get told exactly what to do differently. Three minutes a day. Not a companion." | `:9-10` (meta description, OG) | MVP | "Out loud" is the voice promise. "Three minutes a day" implies the session length the product targets (see P50). |
| P3 | "Early access · fall 2026" | `:11` (footer, `components/site/footer.tsx:19`) | MVP + COPY | Update when access opens. |
| P4 | Contact `hello@unmute.app` | `:12`, FAQ `components/sections/faq.tsx:30-33`, footer `:348` | COPY (verify) | **Unverified** that this mailbox or domain exists. PRODUCT.md:49 says the name is "taken across domains and app stores". |
| P5 | Social links to `https://x.com`, `https://tiktok.com`, `https://linkedin.com` | `:13-17` | none | These are placeholders and nothing renders them. Drop or fill before launch. |
| P6 | Hero sub: "Rehearse the conversation you dread. The AI plays the other person, pushes back, and tells you exactly what to change." | `:36` | MVP | |
| P7 | Hero pill: "Conversation practice for real life" | `:33` | none | Owner-pinned copy. |
| P8 | Stats: "65% of Gen Z say calling a stranger makes them uncomfortable…" and "37% of adults 18 to 25…" | `:41-54`, footnotes `:322-326` | none | These are sourced claims about the market, not product promises. |

### 1.2 The rehearsal itself (voice, persona behaviour)

| # | Exact wording | Where | Verdict | Notes |
|---|---|---|---|---|
| P9 | "The AI plays the other person out loud. It interrupts, puts you on hold and pushes back." | step "Rehearse" `:62` | MVP (voice out, pushback) / V1.1 (persona interrupting *you*) + COPY hedge | The persona talking out loud with TTS is the core. The persona barging in on the user is harder than the user barging in on the persona, and depends on the vendor. "Puts you on hold" can be a scripted beat: the persona says "hold one sec", then a pause. |
| P10 | "It interrupts, sighs, puts you on hold and pushes back. You choose the mood: kind, neutral or hostile. Clear, calm asks move it. Rambling and apologizing don't." | FAQ `:302-303` | MVP (moods, reward or punish) / COPY ("sighs") | "Sighs" needs expressive TTS. **Unverified** for ElevenLabs here; another research area should confirm. The reward and punish behaviour is already in the persona prompt (`lib/rehearse.ts:136`). |
| P11 | "Pick a conversation or describe your own." | `:62` | MVP (preset) / see P19 for custom | |
| P12 | Hero window mock: mode "Phone call", persona tagged "AI", the clock, a waveform with a mic icon, "Front desk is talking" or "You're talking" | `:454-476`, `components/sections/rehearsal-window.tsx:263-286` | MVP | This is the in-call UI spec: who is talking, the elapsed clock, the AI label and live levels. |
| P13 | Demo: "Type what you'd actually say, then end it for your debrief." | `liveDemo.sub :604` | MVP (text fallback) | PRODUCT.md:71 makes text mode "the accessible path for people who cannot or will not speak aloud". Keep text input in the product. |
| P14 | Demo toggle "Read lines aloud" (browser `speechSynthesis`) | `:614`, `live-demo.tsx:301-311,611-647` | COPY at launch | Today the demo reads lines with the robotic OS voice, which undersells ElevenLabs. Option: pre-generate ElevenLabs audio for the scripted sample lines once. That is the owner's call because it spends credits. |

### 1.3 Moods and difficulty

| # | Exact wording | Where | Verdict | Notes |
|---|---|---|---|---|
| P15 | Moods: "Kind: Friendly, but they still have their own side." / "Neutral: Polite but distracted. Not making it easy." / "Hostile: Rushed, defensive, wants it over fast." | `:84-88`; model text `lib/rehearse.ts:110-115` | MVP | Each mood should also pick a voice style or setting per persona. |
| P16 | "Hard mode (hostile personas)" listed as Plus/Teams only | comparison `:269`; Plus feature "Hard mode, real mode, calendar reps" `:236` | MVP decision + COPY | **Contradiction:** see C2 in section 1.16. |

### 1.4 Scenarios

| # | Exact wording | Where | Verdict | Notes |
|---|---|---|---|---|
| P17 | "The ones people put off all week." / "Eight to start, from the doctor's office to the friend who owes you $72." | `:570-571` | MVP | Eight presets with `who`, `setup` and `opener` already written (`:101-175`). |
| P18 | Each card: "Rehearse this" | `:574`, `components/sections/scenario-action.tsx` | MVP | In the product this deep-links to `/app/rehearse/[id]`. |
| P19 | "Or describe your own" (prefill: "I need to ask my shift manager for fewer hours during finals…") | `:572,575` | MVP (Plus-gated, per FAQ) | Needs server-side storage, moderation, and a `who` extraction step. Today the client concatenates the text into `setup` (`live-demo.tsx:279-283`). |
| P20 | "Describe it in a sentence or two and the AI plays whoever is on the other end. Custom scenarios come with Plus." | FAQ `:310-311` | MVP + COPY | **Contradiction:** see C1. |
| P21 | Free: "One rehearsal a day, any scenario" | `:223` | MVP | Clarify that "any scenario" means any preset. |
| P22 | Scenario library: Free ✓, Plus ✓, Teams ✓ | `:266` | MVP | |

### 1.5 The debrief

| # | Exact wording | Where | Verdict | Notes |
|---|---|---|---|---|
| P23 | "Time to the ask, every sorry, every filler word and two sentences to say next time. Then your pattern: 'you apologize before every ask.'" | step "Debrief" `:68` | MVP | Needs **timestamped verbatim STT** that keeps "um" and "uh". Many STT systems clean these out, and whether ElevenLabs Scribe keeps them is **unverified** here. It also needs ask detection, which the LLM can do by returning the index of the turn where the ask happens. |
| P24 | Hero debrief: "Got to the ask 0:11 (was 1:05)", "Apologies before the ask 0 (was 3)", "Filler words 1 ('um')", "Asked for the earliest slot: yes", "Next time, say" ×2 | `:483-499` | MVP | "was" means a comparison with your previous attempt at the same scenario, which needs stored sessions. "Before the ask" needs ask detection. Today the demo counts every apology (comment `:647-650`). The scenario-specific success check ("asked for the earliest slot") means each preset needs one or two success criteria. They are implicit in each `setup` today. |
| P25 | How-it-works debrief: "Get a fee waived · 2:41", score "7 / 10", rows with "was", "Held your ask: $35 back", "Pattern: You apologize before every ask." | `:523-536` | MVP (score, duration, held or not, pattern) | "Held your ask" is a new structured field. It is not in `DebriefSchema` today (`lib/rehearse.ts:50-56`). |
| P26 | Demo debrief sections: score, "What worked", "Where you folded", "Say this next time", "Your pattern", counted "Apologies" and "Filler words" | `:639-654`; `live-demo.tsx:915-1046` | MVP | Already built for text. |
| P27 | "Specific beats supportive. The debrief quotes your words and hands you the next sentence" | `web/PRODUCT.md:64` | MVP | The coach prompt already demands quotes (`lib/rehearse.ts:152`). |
| P28 | "Start free. Every plan gets the same debrief." / "Debrief after every rehearsal" ✓✓✓ | `:683`, `:268` | MVP | Free users get the full debrief, not a teaser. Note that the plan doc (`docs/plan/11-unmute.md:58`) wanted "the hard paywall comes after the first debrief". That conflicts with "the same debrief" only if the paywall hides debrief content. |

### 1.6 Patterns and trends

| # | Exact wording | Where | Verdict | Notes |
|---|---|---|---|---|
| P29 | "Your patterns and trends over time" (Plus) / "Patterns and trends" Plus/Teams | `:237`, `:272` | Per-debrief pattern: MVP. Cross-session pattern memory and trend charts: V1.1 | The per-debrief "pattern" sentence is free (P23). "Over time" needs history plus an aggregation job. |

### 1.7 Daily rep, streaks, calendar

| # | Exact wording | Where | Verdict | Notes |
|---|---|---|---|---|
| P30 | "Three minutes, every day." / "A streak and a scenario picked from what you have coming up." | step "Daily rep" `:73-74` | MVP (streak, today's suggested rep) | Streak math needs a per-user timezone. Without a calendar, "picked from what you have coming up" can mean "from what you told us is coming up", for example a one-line "what's this week?" prompt. |
| P31 | "Connect your calendar and 'call the bank Thursday' becomes Tuesday's rep." / mock "From your calendar · call the bank Thursday" | `:74`, `:544` | LATER + COPY | Needs a calendar OAuth integration. **Unverified** here: Google and Microsoft calendar-scope verification requirements. Soften to "Soon:" or drop it from step copy until built. |
| P32 | "Streaks" (Free) | `:223` | MVP | |
| P33 | Mock "12 days", "Last 7 days" dots | `:537-545` | MVP | This is the home or today screen spec. |
| P34 | "Calendar-aware daily rep" Plus/Teams | `:271` | LATER + COPY | |

### 1.8 Real mode

| # | Exact wording | Where | Verdict | Notes |
|---|---|---|---|---|
| P35 | "Warm up, then make the call." / "A 60-second warmup and a cue card before the real call, a debrief after." | step "Real mode" `:79-80` | V1.1 (cheap; can stretch into MVP) | The warmup is a capped 60-second rehearsal of the opener. The cue card is generated from the last debrief's `next` lines plus the scenario. "Make the call" can be a `tel:` link on mobile web. |
| P36 | "Real mode is a warmup before the call and a debrief from your own notes after." | FAQ `:291` | V1.1 | Needs a "how did it go" input after the call, typed or spoken. That is a debrief from self-report, with no call audio. |
| P37 | "Unmute never listens to real calls." / "Never. Phones don't allow it, and you wouldn't want it to." | `:557`, FAQ `:290-291`, manifesto `:396` | MVP (a constraint) | Never request call audio. The mic is used only inside rehearsals. |
| P38 | Mock: ring "0:45 left of 60", 3-line cue card, "Make the call" button | `:546-558` | V1.1 | |
| P39 | "Real mode: warmup + cue card" Plus/Teams | `:270`, `:236` | V1.1 | |

### 1.9 Together: practice rooms, dares, clips

| # | Exact wording | Where | Verdict | Notes |
|---|---|---|---|---|
| P40 | "Practice with people, not just about them." / "Bring a friend into the room. It's less weird than it sounds." | `:180-181` | LATER + COPY | |
| P41 | "Practice rooms: A friend plays your manager while the AI coaches. Or the AI plays the front desk while your friends rate you." | `:183` | LATER + COPY | Needs multi-party realtime audio, invites, roles and rating UI. This is the hardest feature on the site. |
| P42 | "Dares: Small real-world reps, 30 seconds to 5 minutes. Shareable clips, voice-changed if you want." | `:184` | Dares as a daily list: V1.1. Clips and voice change: LATER | Six dares are already written (`:188-195`). "Voice-changed" needs speech-to-speech or a voice changer. **Unverified** here. |
| P43 | "Today's dares" / "New every morning" | `:590-591` | V1.1 + COPY | A daily rotation implies a content pipeline. There are only six dares today. |
| P44 | "The before-and-after: Your first call next to your tenth. Post it if you want. It stays private if you don't." | `:185` | LATER | Implies **storing rehearsal audio**. That must be opt-in under P47, and it raises storage and retention design questions. |
| P45 | "Practice rooms and dares" Plus/Teams | `:238`, `:273` | LATER + COPY | Plus is sold on these today. Remove them from the Plus feature list until they exist, or label them "coming". |

### 1.10 Principles: not a companion, not therapy, privacy, success

| # | Exact wording | Where | Verdict | Notes |
|---|---|---|---|---|
| P46 | "Every persona is clearly synthetic. No romantic roleplay, no endless chat, no 'I missed you.' A rehearsal has an end and a debrief." | `:203`; manifesto `:381-382`; FAQ `:287` | MVP | Needs all of these: <br>• a persistent "AI" label in the call UI (the mock has it at `:466`)<br>• persona voices that never claim to be human<br>• a hard session cap of time or turns<br>• custom-scenario moderation that rejects romantic roleplay<br>• no "chat" surface outside rehearsals<br><br>The internal research notes state chatbot-disclosure laws in Maine, New York, Utah and California (`docs/research/04-consumer-landscape.md:51`, **unverified**, legal review needed). |
| P47 | "Your rehearsals are yours. Private to you, never used to train models, deleted when you say so." | `:205`; FAQ `:294-295`; manifesto `:396`; footer fine print `:361` | MVP | The product has to meet all four parts:<br>• **Private:** row-level access control.<br>• **Never train:** this must also hold for every vendor that sees the audio or text (Anthropic API, ElevenLabs, any analytics). The vendor policies are **unverified** here, and ElevenLabs retention and training settings must be checked by the vendor research area.<br>• **Delete:** a user-initiated delete of one session and of the whole account, cascading to vendor copies such as ElevenLabs conversation history if the agents product stores it (**unverified**).<br>• **Sharing:** "always your explicit choice" (`:295`). |
| P48 | "A coach, not therapy. Crisis language routes to real resources, every time." / manifesto: "If crisis language shows up in a rehearsal, we stop rehearsing and route to real resources, every time." | `:204`, FAQ `:298-299`, manifesto `:389`, Teams `:429` | MVP | Today the persona prompt only tells the model to drop character and say it once (`lib/rehearse.ts:137-139`). The product must detect crisis language in user turns (an LLM tool call, classifier or keyword pre-filter), end the session, and show a resources screen. Do not debrief a crisis turn. The resource list needs owner and legal review (**unverified** here). |
| P49 | "Success is you closing the app. We measure the conversations you go have, not the minutes you spend with us." | `:206`; manifesto `:403-404` | MVP (no time-in-app metrics) / V1.1 (a "did you have the real conversation?" follow-up) | Analytics must track real-world outcomes, which need a follow-up prompt, not session minutes. |
| P50 | "Three minutes, every day, until you don't need us." / "If it works, you will use Unmute less over time. That is the point." | manifesto `:400-404`, pull-quote `:701` | MVP | Target about three minutes of conversation, with a soft cap and a hard cap. Today the demo's only cap is 24 messages (`lib/rehearse.ts:10`). |
| P51 | "Sharing a clip is always your explicit choice, voice-changed if you like." | manifesto `:396`, FAQ `:295` | LATER | Tied to P44. |
| P52 | "Clinicians … can use Teams for exactly that, with the clinician in the loop." | manifesto `:389`; FAQ `:299` | LATER + COPY | See P63. |

### 1.11 Pricing and billing

| # | Exact wording | Where | Verdict | Notes |
|---|---|---|---|---|
| P53 | "One rep a day is free." / "Plus is $14.99 a month, or $99 a year." | `:212-214` | MVP | Enforce the one-a-day quota on the server, with a timezone-aware day boundary. |
| P54 | "Save 45%" / "That's $8.25 a month, billed once a year." | `:215`, `:677` | MVP | The math holds: $99 against $179.88 is 44.96% off, and $99 / 12 = $8.25. |
| P55 | Free "forever", "No card needed." | `:221`, `:674` | MVP | Signup must not ask for a card. |
| P56 | Plus "Billed monthly. Cancel any time." | `:676` | MVP | Needs self-serve cancellation (a billing portal). On iOS later, store-billing rules apply. That belongs to the mobile research area and is **unverified** here. |
| P57 | Plus features: "Unlimited rehearsals and custom scenarios" | `:235` | MVP | "Unlimited" still needs a fair-use ceiling because voice minutes cost money. State it in the terms, not as a hidden cap. |
| P58 | Plus "Hard mode, real mode, calendar reps" | `:236` | Hard mode: MVP. Real mode: V1.1. Calendar: LATER | Rewrite the Plus bullet to list only what ships. |
| P59 | Plus badge "Best for a hard semester" | `:243` | none | |
| P60 | Comparison: "Rehearsals per day: 1 / Unlimited / Unlimited", "Cohorts, admin dashboard, reports" Teams only, "SSO and procurement" Teams only | `:265-275` | MVP for the first row. LATER for the Teams rows | |

### 1.12 Teams

| # | Exact wording | Where | Verdict | Notes |
|---|---|---|---|---|
| P61 | "Interview season for a whole campus." / "Career centers, companies and clinicians run structured practice on Unmute. Seats from $3 to $8 a month, free for career centers this interview season." | `:411-412`; tier `:249-256` | COPY now | Phrased as something happening today. |
| P62 | Career centers: "Every student gets a mock interview a day from September to November, with a debrief the counselor can see. Cohort reports show who is ready and who is stuck on the pay question." Bullets: "Campus-wide seats", "Interview and career-fair scenarios", "Counselor dashboard" | `:415-419` | LATER + COPY | There are **no interview or career-fair scenarios** in the library: all eight are consumer scenarios (`:101-175`). "Counselor can see" conflicts with P47 (see C3). |
| P63 | Companies: "Custom scenarios from your playbook", "Manager and support tracks", "SSO and procurement-ready" | `:420-425` | LATER + COPY ("procurement-ready" in particular) | The research checklist for higher-ed procurement covers SOC 2, VPAT/HECVAT and the SDPC DPA (`docs/research/01-market-research.md:89`). None of these exist. |
| P64 | Clinicians: "Structured social-anxiety practice between sessions, with the clinician setting the ladder and reviewing the debriefs." Bullets: "Exposure ladders you define", "Clinician-visible debriefs", "Clear safety boundaries" | `:426-431` | LATER + COPY | This carries health-data implications. **Unverified** whether HIPAA applies; that needs legal review. |
| P65 | Offer: "Career centers: free for interview season." / "September to November 2026. Bring your students, we bring the interviewers. Tell us your campus and we will set up your cohort." | `:433-437`; meta `:679` | COPY now, or run concierge pilots | The window is open today (2026-10-02). |
| P66 | Pilot steps: "We reply within two business days." / "You pick the scenarios. We set up the cohort." / "Your people rehearse the same week." / "A human reads every request." / "No card, no contract. One reply from a human." | `:713-718`, `:729`, success `:732` | Ops promise; COPY "same week" | Depends on the pilot form reaching a human (see P69). |

### 1.13 Launch, waitlist and email

| # | Exact wording | Where | Verdict | Notes |
|---|---|---|---|---|
| P67 | "Early access opens campus by campus this fall. Join the list and we'll tell you the day it reaches yours." | FAQ `:306-307` | MVP (ops) | The product needs an access gate: invite codes, or an allowlist by email domain or waitlist cohort. The waitlist does not store campus today; only the email and a `source` tag. |
| P68 | "One email when it launches. Nothing else." / "You're on the list. One email when it launches." | `:319`; `components/site/email-capture.tsx:24` | MVP (a constraint) | Waitlist addresses may receive **one** launch email. Product, lifecycle and streak emails need fresh consent when the account is created. |
| P69 | The pilot form posts to the same endpoint with `source: "teams"` | `components/sections/pilot-form.tsx:64-69` | MVP (ops) | See section 3.4 on where the data goes. |

### 1.14 The site demo, fine print and sources

| # | Exact wording | Where | Verdict | Notes |
|---|---|---|---|---|
| P70 | "Try a rehearsal right now." / "Pick who you're talking to and how hard they push…" | `:603-604` | MVP (keep as the no-account taster) | Recommendation: keep it **typed** and **rate-limited**, and add a "Do it out loud: start your free rep" CTA into the product. Anonymous voice would burn ElevenLabs credits. |
| P71 | Sample note: "This is a scripted preview. The replies and the debrief are written ahead of time." / debrief note: "Example debrief, written ahead of time. Only the two counts come from what you typed." | `:638`, `:653` | none | Honest labels. Keep them. |
| P72 | Footer fine print: "Unmute is practice, not therapy or medical care. Rehearsals are private to you, never used to train models, and deleted when you say so. The rehearsal on this site is a typed preview of the app and may use scripted replies." | `:360-361` | COPY at launch | The last sentence changes once the product exists. |
| P73 | "Example rehearsal" / "Example screens" labels on the mocks | `:455`, `:511` | none | PRODUCT.md:59 forbids fabricated users or outcomes. Keep the mocks labelled. |

### 1.15 Promises in the plan doc that are not on the site

Source: `docs/plan/11-unmute.md`. None of these needs copy changes; they are noted for scope control.
- Full-duplex: "it interrupts, sighs, goes quiet" (`:49`).
- "pace", "a replay with highlights", "a confidence trend over weeks", and "the AI remembers your patterns" (`:50`).
- "20 scenarios across calls, asks, conflict, interviews and dates" (`:81`). Note that "dates" and "the breakup" (`:37`) sit uncomfortably with the no-romance principle.
- "hard paywall after first debrief" (`:82`).
- "campus challenges in interview season" (`:53`).
- "Android widgets" (`:86`).
- "a provider abstraction over OpenAI realtime and ElevenLabs" (`:111`). The owner's new instruction narrows the provider to ElevenLabs.
- Unit-cost assumptions: "$0.10–0.25" per three-minute rep (`:58`) and "ElevenLabs Agents $0.08–0.10 per minute plus the model" (`:105`). These were gathered in Sep 2026 and are **unverified** here. Recheck them against current ElevenLabs pricing.

### 1.16 Contradictions to resolve before gating

| ID | Conflict | Where | Suggested resolution (owner decides) |
|---|---|---|---|
| C1 | Custom scenarios: "come with Plus" vs Free's "any scenario" and a free custom box in the demo | `:311` vs `:223`, `live-demo.tsx:550-564` | Product: custom is Plus. Site demo: keep custom as a typed taster with a "Plus" note, or remove it from the demo. |
| C2 | Hostile: "Hard mode (hostile personas)" is Plus-only, but the FAQ promises every user the choice of kind, neutral or hostile, and the demo offers hostile free | `:269` vs `:303`, `:84-88` | Either make hostile free (better first impression; drop the comparison row and the Plus bullet), or keep hostile Plus and reword the FAQ. |
| C3 | Privacy vs Teams visibility | `:205`, `:295` vs `:417`, `:430` | Reword Teams copy to "debriefs you choose to share with your counselor", and build sharing as an explicit per-session or per-cohort consent. |
| C4 | Crisis: "we stop rehearsing" vs a prompt that says one line and continues | `:389` vs `lib/rehearse.ts:137-139` | The product ends the session. The prompt change alone is not enough. |
| C5 | Apologies counted "before the ask" in the mocks vs every apology in the demo | `:489`, `:530` vs `:651`, `live-demo.tsx:943` | The product implements "before the ask" once ask detection exists. |
| C6 | Teams offer is live (Sep–Nov 2026) with no Teams product | `:412`, `:435`, `:679`, `:718` | Change the copy, or run concierge pilots on consumer accounts with manual reports. |
| C7 | Real-mode debrief "from your own notes" vs a mock with no notes UI | `:291` vs `:546-558` | Design the post-call note step in V1.1. |

---

## 2. Reuse map

### 2.1 What becomes product code

| Asset | Location | Reuse as | Changes needed |
|---|---|---|---|
| Scenario data (`id`, `label`, `who`, `setup`, `opener`, `cardTitle`, `cardBody`) | `web/lib/content.ts:101-175` | Seed data for the scenario library, in a shared `packages/core/scenarios`, then a `scenarios` table if it should be editable without deploys | Move it out of marketing copy. `content.ts` should import scenarios from core, not the other way round (`lib/rehearse.ts:8` is the inversion to fix). Add `successCriteria` (for example "asked for the earliest slot", "held $18"), `askDefinition` (what counts as the ask), `voiceId` per mood, `durationTargetSec`, and `tier` (free or plus). `setup` is already model-facing ASCII (comment `:97-99`). |
| Moods (`moods`, `MoodId`) and model mood text (`moodText`) | `content.ts:84-90`; `lib/rehearse.ts:110-115` | Persona engine difficulty plus TTS style | Add voice settings per mood. Expressiveness depends on the vendor (**unverified**). |
| Persona prompt `buildPersonaSystem()` | `lib/rehearse.ts:128-141` | The persona system prompt for every turn: the Claude custom-LLM path, or the ElevenLabs agent prompt if their hosted LLM is used | Add voice-specific rules: no symbols TTS reads badly, spell numbers naturally, very short turns, how to handle being interrupted, an explicit "end the call" signal (a tool call or token) when the goal is reached or the time cap hits, a hold beat, and crisis handling as a **tool call** instead of a spoken line. Keep it byte-stable per session for prompt caching. The minimum cacheable prefix is 512–4096 tokens depending on the model (Claude API skill, `shared/prompt-caching.md`), so this short prompt **may not cache at all** (**unverified** token count). |
| Coach prompt `buildCoachPrompt()` plus `DebriefOutputSchema`, `DebriefSchema` and `normalizeDebrief()` | `lib/rehearse.ts:50-104,144-159` | The debrief pipeline | Extend the schema with: `askTurnIndex` (or null), `heldAsk` (boolean plus a short value such as "$35 back"), `successChecks[]`, and a pattern that also sees the user's previous patterns. Move the counted metrics (time to ask, apologies before the ask, fillers, duration, the "was" deltas) to **deterministic server code** fed by STT word timestamps, not to the LLM. Keep zod plus `zodOutputFormat` (`app/api/rehearse/route.ts:2,147`). |
| Role mapping `toAnthropicMessages()` | `lib/rehearse.ts:165-194` | Needed if Claude stays the persona brain behind our own endpoint | Not needed if the ElevenLabs agent runs its own LLM. Keep it either way for text mode. |
| Scripted sample: `SCRIPTS`, `sampleReply()`, `sampleDebrief()`, `sampleOpeners`, `sampleLines`, `CUSTOM_DEBRIEF` | `lib/rehearse.ts:215-607` | (a) the marketing demo<br>(b) **test fixtures and E2E mocks** for the voice loop<br>(c) an onboarding "watch an example" rep<br>(d) a degraded mode when vendors fail | Decouple the "4 lines per mood" invariant from the UI. `SAMPLE_TURNS = 5` (`live-demo.tsx:52`) silently depends on it. Paying users must never fall back to scripted replies without being told: keep the honest "Sample" badge pattern (`:636-638`). |
| Streaming route pattern | `app/api/rehearse/route.ts:84-133` | Template for the text-mode turn endpoint, and for a custom-LLM endpoint if ElevenLabs calls our server for persona turns (their request format is **unverified** here) | It pulls the first event before answering, so auth errors become JSON (`:103-106`). It aborts upstream on client cancel (`:125-127`). It maps errors to safe messages without echoing keys (`:155-176`). Keep all three. Add auth, quota and rate-limit checks, a `stop_reason` refusal branch, and session persistence. |
| Request guards `MAX_MESSAGES = 24`, `MAX_TEXT = 800`, zod request schemas | `lib/rehearse.ts:10-43` | API contracts in `packages/core` | Add time caps (seconds) for voice sessions. The server must resolve presets by `id` and **stop accepting client-supplied `setup`** for presets. |
| Metric regexes `SORRY_RE`, `FILLER_RE` and `countIn()` | `components/sections/live-demo.tsx:64-66,140-142` | `packages/core/metrics` | Run them on STT text server-side. Review the filler list: "just", "literally", "basically", "kind of" and "sort of" count; "like" is excluded on purpose (`:64`). Add `uh` and `um` variants as the STT emits them, and timestamps for "before the ask". |
| Demo state machine (`Phase`: idle, starting, live, replying, debriefing, debrief), `readStream`, `isDebrief`, abort handling, focus and a11y choreography | `live-demo.tsx:35-147,153-499` | Reference for the in-call state machine (web, then React Native) | Add states: `connecting`, `mic-permission`, `listening`, `user-speaking`, `persona-speaking`, `interrupted`, `ended-by-persona`, `ended-crisis`, `uploading`, `debriefing`. Move it to a framework-free reducer in `packages/core/session` so the mobile app can reuse it. |
| `DebriefView` and `DebriefList` | `live-demo.tsx:915-1080` | The web debrief screen | Add rows for time to ask, the "was" deltas, held ask, success checks, and a replay link if audio is kept (opt-in). |
| `REHEARSE_EVENT` custom event | `live-demo.tsx:39-40`, `scenario-action.tsx`, `rehearsal-window.tsx:136-139` | Marketing only | In the product, cards become links. |
| Hero window and how-it-works mocks | `rehearsal-window.tsx`, `how-it-works.tsx` | **Design specs** for the call screen, debrief, today or streak, and real mode | `BAR_HEIGHTS` and `WAVE_HEIGHTS` are fake levels. Swap in real input and output levels from Web Audio `AnalyserNode` or the vendor SDK (**unverified** which SDK exposes levels). `CallClock` and `CountUp` are reusable as they are. |
| Design tokens | `app/globals.css` (`:root` and `.dark` tokens); spec in `web/DESIGN.md` §2 | `packages/tokens`: CSS variables for web, a TS object for React Native | Brand: amber `#FFB454`, ink `#0B0F1A`, canvas `#F7F8FC`, the radii scale, and the signature ease `[0.23, 1, 0.32, 1]` (`lib/motion.ts:11`). |
| shadcn primitives | `components/ui/*` (button, badge, card, dialog, sheet, tabs, input, textarea, accordion, separator) | The web app UI kit | None. Magic UI (`components/magicui/*`) stays marketing-only. |
| `curly()` typography helper | `lib/utils.ts:13-15` (inside the file) | Transcript display on web and mobile | Move to `packages/core/text`. |
| Waitlist route | `app/api/waitlist/route.ts` | Keep for the marketing site | Write to the database (`waitlist`, `pilot_requests`) instead of console or webhook only. Keep the whitelist-only payload (`:9`) and the no-PII logging. Add rate limiting and campus capture for P67. Add an owner notification for Teams requests (P66). |
| `EmailCapture`, `PilotForm` | `components/site/email-capture.tsx`, `components/sections/pilot-form.tsx` | Keep | |
| `resolveSiteUrl()` | `lib/site-url.ts` | Keep; also needed for OAuth and checkout return URLs | |
| `robots.ts` disallows `/api/` | `app/robots.ts` | Keep | Also disallow `/app/` and mark product routes `noindex`. |
| Old static preview with browser `SpeechRecognition` | `site/unmute/index.html`, `site/unmute/README.md:8` | Prior art only | Not deployed by the Vercel project (root dir `web`). |

### 2.2 What must change

1. **Text in, robotic voice out → real voice both ways, with text kept as a mode.**
   - Mic permission UX, plus echo cancellation and noise suppression from `getUserMedia` constraints.
   - Push-to-talk vs voice-activity detection.
   - Barge-in (the user interrupts the persona).
   - Streaming STT with word timestamps and disfluencies kept, and streaming TTS.
   - A voice per persona and mood, a persistent "AI" label, and headphone guidance (the dorm-cringe risk, `docs/plan/11-unmute.md:75`).
   - Text mode stays as the accessible path (PRODUCT.md:71) and as the fallback when the mic is denied.
2. **Stateless → accounts.**
   - Auth (no card for Free).
   - Entitlements (Free, Plus, Teams), a server-enforced 1-a-day quota in the user's timezone, and streaks.
   - The access gate for "campus by campus" (P67).
   - Separate marketing and product email consent (P68).
3. **Client-held transcript → server-stored sessions.**
   - Tables for sessions, turns (role, text, start and end ms, word timings), debriefs, metrics, patterns and custom scenarios.
   - Per-user access control, a delete flow that cascades to vendor copies, and data export.
   - Audio stays **not stored by default**. Store it only on explicit opt-in for clips or the before-and-after (P44, P47).
4. **Trust the client → trust the server.**
   - Presets resolve by id on the server. Custom setups are stored, moderated, and pass through a fixed template.
   - Every model or voice call is authenticated, quota-checked and rate-limited. Vercel's WAF rate-limit SDK (`checkRateLimit` from `@vercel/firewall`) is one option: https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting-sdk (seen in Vercel docs search, not fetched).
   - Vendor keys never reach the browser. The browser receives short-lived session tokens minted by a route handler.
5. **Client-side regex counts → deterministic server metrics.** Time to ask, apologies before the ask, fillers, duration, "was" deltas and held ask, computed from timestamps and the LLM's ask index.
6. **One-line crisis reply → a crisis flow.** Detect, stop the session, show resources, skip the debrief, and log minimally (P48).
7. **The "sample when no key" switch → explicit modes.**
   - `demo` (marketing, scripted or live text), `product` (always live), `test` (scripted fixtures).
   - The `x-unmute-mode` header (`lib/rehearse.ts:12`) can stay for the demo.
   - Product errors must be explicit: "the other person dropped the call", never a silent script.
8. **Session length.** Add the ~3-minute target and a hard cap (P50). Today there is only the 24-message cap.
9. **Model calls.** Fix the thinking and `max_tokens` interaction, handle refusals, and pick a model for latency. Section 3.2 has the details.

---

## 3. Current technical facts

### 3.1 Stack and versions (installed, from `web/node_modules/*/package.json`)

| Package | Version | Declared in `web/package.json` |
|---|---|---|
| next | 16.3.5 | `"next": "16.3.5"` (pinned) |
| react / react-dom | 19.2.8 | pinned |
| @anthropic-ai/sdk | 0.125.0 | `^0.125.0` |
| zod | 4.6.5 | `^4.6.5` |
| motion | 13.3.0 | `^13.3.0` |
| tailwindcss | 4.3.3 | `^4` |
| radix-ui | 1.6.7 | `^1.6.7` |
| lucide-react | 1.46.0 | `^1.46.0` |
| typescript | 5.9.3 | `^5` |
| eslint | 9.39.5 (flat config, `eslint-config-next` 16.3.5) | `^9` |

Other facts about the repo:
- npm, with `package-lock.json`. No workspaces.
- Local Node is v22.22.2. Next 16 needs Node ≥ 20.9 (`.../01-app/02-guides/upgrading/version-16.md:118-124`).
- No tests, no CI config (no `.github/`) and no `vercel.json`.
- `next.config.ts` is empty (`web/next.config.ts:3-5`).
- No `proxy.ts`. Cache Components is off.
- Fonts are self-hosted with `next/font/local`, pointing into `../node_modules/@fontsource-variable/*` (`app/layout.tsx:9,18,22,32`).

### 3.2 Anthropic usage (`web/app/api/rehearse/route.ts`)

**How the routes call the API today:**
- **Model:** `DEFAULT_MODEL = "claude-opus-5"` (`:22`), overridable with `UNMUTE_MODEL` (`:24-26`).
- **Persona turn:** `client.messages.stream({ model, max_tokens: 300, system: buildPersonaSystem(...), messages, output_config: { effort: "low" } })` (`:92-101`). There is no `thinking` field.
- **Debrief:** `client.messages.parse({ model, max_tokens: 1200, messages: [coach prompt], output_config: { format: zodOutputFormat(DebriefOutputSchema) } })` (`:142-150`). The helper is imported from `@anthropic-ai/sdk/helpers/zod` (`:2`).
- **Runtime:** `export const runtime = "nodejs"` (`:20`). That is the default anyway; `edge` is deprecated, per `.../02-route-segment-config/runtime.md`.

**Vendor facts.** These come from the bundled Claude API skill, whose cache is dated 2026-09-25 and which cites the official pages: models overview https://platform.claude.com/docs/en/about-claude/models/overview.md, pricing https://platform.claude.com/docs/en/about-claude/pricing.md, migration guide https://platform.claude.com/docs/en/about-claude/models/migration-guide.md. None of these pages was fetched live today.
- `claude-opus-5` is a valid model id, priced at $5 input and $25 output per MTok.
- The current Opus is **`claude-opus-5-5`** at $4/$20 per MTok, with 1M context.
  - Thinking cannot be disabled; effort is the only control.
  - Its default effort is `medium`.
  - Forced `tool_choice` `any` or `tool` returns a 400.
- Other current models: **`claude-sonnet-5-5`** at $2/$10 and **`claude-haiku-4-5`** at $1/$5 (200K context).
- **On Opus 5, thinking is on by default** when `thinking` is omitted, and **`max_tokens` caps thinking plus response text together**. The persona route's `max_tokens: 300` can therefore truncate or empty a spoken line. Every voice turn also pays thinking latency, even at `effort: "low"`.
  - Opus 5 accepts `thinking: {type: "disabled"}` at effort `high` or below.
  - On Opus 5.5 you cannot disable thinking; lower the effort instead.
- Opus 5 and 5.5 have **safety classifiers that can decline** with HTTP 200 and `stop_reason: "refusal"`. Neither route checks `stop_reason`. The client shows a mid-stream refusal as an empty reply, "The other person dropped the call." A server-side fallback beta exists (`server-side-fallback-2026-07-01` with `fallbacks: "default"`).
- `output_config.format` is the current structured-output parameter, and `client.messages.parse()` with `zodOutputFormat` matches the documented TypeScript pattern. The debrief code is current.

**Implication for the roadmap (owner decides the model).**
- The persona turn sits on the voice critical path, so measure time-to-first-token on Opus 5.5 at `low` effort against Sonnet 5.5 and Haiku 4.5.
- Keep the strongest model for the debrief, which is not latency-critical.
- Raise `max_tokens` on both routes.
- Add the refusal branch.
- If ElevenLabs' hosted agent runs its own LLM, the Claude persona code becomes text-mode only. That is the vendor research area's call.

### 3.3 Environment variables

| Variable | Used at | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | `route.ts:29` (mode switch); SDK reads it implicitly at `:70` | Its presence switches the demo from `sample` to `live`. |
| `UNMUTE_MODEL` | `route.ts:25` | Model override. |
| `WAITLIST_WEBHOOK_URL` | `app/api/waitlist/route.ts:97` | Optional forward of signups as JSON. |
| `NEXT_PUBLIC_SITE_URL` | `lib/site-url.ts:7` | Canonical origin. |
| `VERCEL_PROJECT_PRODUCTION_URL`, `VERCEL_URL` | `lib/site-url.ts:9` | Vercel system variables used as a fallback origin. |

These are documented in `web/.env.example` and `web/README.md:28-35`. I could **not** read which ones are set on Vercel: `filter_project_envs` returned 403 "You don't have permission to list the project environment variable."

### 3.4 Where waitlist and pilot data goes today

- Both forms POST to `/api/waitlist`: the email capture with `source` set to `hero` or `footer-cta`, and the pilot form with `source: "teams"`. The handler keeps only `email`, `source`, `name`, `org`, `seats` and `notes`, each capped at 500 characters (`route.ts:5,9,14-31`).
- **If `WAITLIST_WEBHOOK_URL` is set,** it POSTs the JSON there with a 5-second timeout. A failure returns 502 to the visitor (`:63-83,97-102`).
- **If it is not set,** it runs `console.log("[waitlist]", payload)` and returns `{ ok: true }` (`:105-107`). In that case the only record is Vercel runtime logs: retention is limited (**unverified**: the period was not found in the docs I could reach), they are not a database, and they contain PII.
- **Observed:** production runtime logs for the last 14 to 30 days, grouped by path, contain only `/`, `/teams`, `/manifesto` and `/pricing` (35 entries, all 200 or 304). There are no `/api/waitlist` or `/api/rehearse` invocations, so there appear to be no signups or demo uses yet. Reasonable causes are low traffic or the deployment protection described in 3.5.

### 3.5 Deployment (Vercel, read-only)

| Fact | Value |
|---|---|
| Team | "Eden's projects" (`team_80th0r5pfHlXnOO7XxCgyemo`). The plan tier was not shown by the API. |
| Project | `web` (`prj_aYmxJrDQW4Saw1GiVRn7WUZ1Xh0y`), framework `nextjs`, Node `24.x`, created 2026-09-14 |
| Git source | GitHub `xAkeshiro/SaaS`, branch `claude/charming-fermi-vwwai8` |
| Root directory | `web`, per `web/PRODUCT.md:45` and `README.md`. The API response I could read did not show the field. |
| Latest production deployment | `dpl_BZjPFbgWFNmZJpUN4RFzRQX2HC3F`, READY 2026-10-01T20:56Z, commit `fb87235`, region `iad1`, type `LAMBDAS` |
| Domains | `web-beta-ivory-95.vercel.app` (the production alias), `web-edens-projects-6c8c63a6.vercel.app`, `web-git-claude-charming-fermi-vwwai8-edens-projects-6c8c63a6.vercel.app`. No custom domain. |
| Deployment protection | `ssoProtection: { enabled: true, deploymentType: "all_except_custom_domains" }`. Password protection is off. |

The SSO setting means Vercel Authentication protects every domain that is not a custom domain. **Unverified** whether that includes the `web-beta-ivory-95.vercel.app` alias: I could not load it through the proxy, and the MCP fetch tool would have created a bypass link, which I avoided. If it does, the public cannot reach the site, which would also explain the empty API logs. Owner action: confirm in Vercel settings, and attach a custom domain before launch.

Two more checks for the owner:
- `docs/research/01-market-research.md:108` says "Vercel Pro (Hobby bans commercial use)". **Unverified** here. Check the team's plan before charging money.
- Production is served from a non-default branch. Consider moving production to `main` before the product build.

### 3.6 Other connected accounts (read-only)

- **Supabase:** one org, "Limo Hunter", with one project, "Limohunter v2 Database" (`jnwgffyzrmmlecrglsjt`, us-west-2, Postgres 17). It is unrelated to Unmute, so I did not list its tables. A new project or org is needed if Supabase is chosen; the internal research recommends it at `docs/research/01-market-research.md:99`.
- **ElevenLabs:** outside this research area. I made no calls.

### 3.7 Next.js 16.3.5 features to lean on

All paths are under `web/node_modules/next/dist/docs/01-app/`. The repo's `web/AGENTS.md` says to read these before writing code, because this version has breaking changes.

| Feature | Doc | Use in Unmute |
|---|---|---|
| **Route handlers**, including streaming responses (`ReadableStream`) | `01-getting-started/15-route-handlers.md`, `03-api-reference/03-file-conventions/route.md:367-440` | Mint short-lived voice-session tokens, text-mode turns, debrief, Stripe and ElevenLabs webhooks, and the waitlist. **WebSockets won't work** on lambda-style hosts: "the connection closes on timeout, or after the response is generated" (`02-guides/backend-for-frontend.md:921-927`). Live audio must therefore go browser to vendor directly, or to a separate long-lived service. |
| **Proxy** (renamed from `middleware` in v16; Node.js runtime only, not configurable) | `01-getting-started/16-proxy.md:15`, `03-api-reference/03-file-conventions/proxy.md:255,806`, `02-guides/upgrading/version-16.md:612-630` | Optimistic redirects: send signed-out visitors from `/app/*` to `/login`, plus the access gate. The docs say Proxy "should not be used as a full session management or authorization solution" (`16-proxy.md:29`). Do real checks in the DAL. |
| **Server Actions / Functions** (1MB body default) | `02-guides/server-actions.md`, `03-api-reference/05-config/01-next-config-js/serverActions.md:59-71` | Settings, deleting a session or account, saving custom scenarios, marking a dare done, post-call notes. Do not use them for audio upload. |
| **`after()`** (runs after the response, inside the route's max duration) | `03-api-reference/04-functions/after.md` | Persist turns and analytics, compute streaks, update pattern memory after the debrief returns. |
| **`maxDuration`** | `03-api-reference/03-file-conventions/02-route-segment-config/maxDuration.md` | Long debrief generation, or post-call processing of a full transcript. |
| **Cache Components** (`cacheComponents: true`; `use cache`, `use cache: private`, `cacheLife`, `cacheTag`, `updateTag`, `refresh`) | `03-api-reference/05-config/01-next-config-js/cacheComponents.md`, `03-api-reference/01-directives/use-cache-private.md`, `02-guides/authentication-with-cache-components.md` | Optional. The marketing pages are static anyway. With Cache Components on, Next keeps the previous route mounted in React `<Activity mode="hidden">` (`cacheComponents.md` "Navigation with Activity"). Effects are cleaned up when a route is hidden, so the mic and audio teardown must live in effect cleanups. Requires the Node runtime. |
| **Data Access Layer + `server-only`**; `taint` is experimental | `02-guides/data-security.md:56-132,219` | The single place that reads `process.env` keys and the database, with authorization checks. |
| **Authentication guide** (recommends an auth library; Proxy for optimistic checks) | `02-guides/authentication.md:25,1126` | Choose a library compatible with Proxy's Node runtime. |
| **PWA guide** (manifest, web push, service worker) | `02-guides/progressive-web-apps.md` | Daily-rep reminders on web before the mobile app ships. Mobile web push support is **unverified** here. |
| `useOffline` (experimental, `v16.x`) | `03-api-reference/04-functions/use-offline.md` | Optional "you're offline" state in the call UI. Avoid depending on experimental flags. |
| `catchError` (stable in 16.3.0) | `03-api-reference/04-functions/catchError.md:353-358` | Error boundaries for the call UI. |
| Async request APIs only (`cookies()`, `headers()`, `params`) | `02-guides/upgrading/version-16.md:281-295` | Breaking change from older patterns. Write new auth code accordingly. |
| `authInterrupts` (`forbidden()` / `unauthorized()`) | `03-api-reference/05-config/01-next-config-js/authInterrupts.md` (marked `version: canary`) | **Avoid for now.** It is canary-only. |
| Edge runtime is deprecated | `.../02-route-segment-config/runtime.md` | Keep everything on `nodejs`. |
| **`transpilePackages`**, and Turbopack auto-transpiling workspace packages | `03-api-reference/05-config/01-next-config-js/transpilePackages.md:20-24`, `.../turbopack.md:99-122` | Lets `apps/web` import TypeScript source from `packages/*` with no build step. |

---

## 4. Recommended repo restructure (web first, then app)

### 4.1 When

Do it as **the first PR of the product build**, before any product code. Reasons:
1. Shared logic (scenarios, prompts, debrief, metrics, session reducer, entitlements, streak math) should be written once as framework-free TypeScript that the Expo app imports later. Writing it inside `web/lib` with `@/` aliases and Next imports, then extracting it, costs more.
2. The move is mechanical while the codebase is about 9k lines with no tests: `git mv web apps/web`, add a workspace root, fix the font paths.
3. Vercel needs one setting changed, Root Directory `web` → `apps/web`. This is an owner action in the dashboard; I did not change it.

Things to fix during the move:
- `app/layout.tsx:9,18,22,32` load fonts from `../node_modules/@fontsource-variable/...`. Workspaces may hoist that folder to the repo root. Copy the four `.woff2` files into `apps/web/app/fonts/`, or resolve them from the package.
- `web/AGENTS.md` warns that "in monorepos the `next` package may not be visible from the repo root". Keep the pointer to `apps/web/node_modules/next/dist/docs/`.
- `lib/rehearse.ts:8` imports scenario data from marketing copy. Invert it during the extraction.

### 4.2 Tooling

- **Workspaces.** pnpm or npm. Expo's Metro config has built-in monorepo support for Bun, npm, pnpm and Yarn, and "From SDK 54, Expo supports isolated dependencies". Source: https://docs.expo.dev/guides/monorepos/, known only from search-result extracts because the page fetch was blocked; **re-verify**. npm workspaces is the least churn from today's npm setup. pnpm is the common choice with Turborepo.
- **Turborepo** (optional, recommended once `apps/mobile` exists). It gives task caching, and Vercel's "Ignored Build Step" with `turbo query affected --base=$VERCEL_GIT_PREVIOUS_SHA --packages <project> --exit-code` skips web deploys when only mobile code changed. Source: https://vercel.com/docs/monorepos/turborepo (Vercel docs search result, not fetched).
- **Next.js** compiles workspace packages from TypeScript source automatically under Turbopack (`transpilePackages.md:20-24`), so shared packages need no build step on the web side.

### 4.3 Proposed tree

```
SaaS/                              (repo root)
├─ package.json                    workspaces: ["apps/*", "packages/*"]
├─ turbo.json                      (add when apps/mobile lands)
├─ apps/
│  ├─ web/                         ← today's web/, moved; Vercel Root Directory = apps/web
│  │  ├─ app/
│  │  │  ├─ (marketing)/           /, /pricing, /manifesto, /teams  (today's pages, unchanged URLs)
│  │  │  ├─ (auth)/                /login, /signup, /auth/callback
│  │  │  ├─ (app)/app/             signed-in product (noindex)
│  │  │  │  ├─ page.tsx            Today: daily rep, streak, suggested scenario
│  │  │  │  ├─ scenarios/          library + custom (Plus)
│  │  │  │  ├─ rehearse/[sessionId]/   live call (voice, or text fallback)
│  │  │  │  ├─ debrief/[sessionId]/
│  │  │  │  ├─ history/  patterns/  real-mode/  dares/
│  │  │  │  └─ settings/           account, billing, privacy (export, delete everything)
│  │  │  ├─ api/
│  │  │  │  ├─ rehearse/route.ts            marketing text demo (rate-limited; sample or live)
│  │  │  │  ├─ waitlist/route.ts            writes to DB, notifies on source=teams
│  │  │  │  ├─ sessions/route.ts            POST: check quota + entitlement, create session, mint vendor token
│  │  │  │  ├─ sessions/[id]/turn/route.ts  text-mode turn (streams)
│  │  │  │  ├─ sessions/[id]/end/route.ts   finalize transcript → metrics → debrief
│  │  │  │  └─ webhooks/{billing,voice}/route.ts
│  │  │  └─ layout.tsx, robots.ts, sitemap.ts, fonts/
│  │  ├─ proxy.ts                  optimistic auth + access-gate redirects for /app/*
│  │  ├─ components/
│  │  │  ├─ sections/ site/ magicui/      marketing (as today)
│  │  │  ├─ ui/                           shadcn primitives (shared by marketing and product)
│  │  │  └─ product/ call/ debrief/ today/ real-mode/
│  │  └─ lib/
│  │     ├─ content.ts             marketing copy only (imports scenarios from @unmute/core)
│  │     ├─ dal/                   server-only: auth, DB, vendor keys (the only process.env reader)
│  │     └─ voice/web.ts           browser adapter for @unmute/voice (getUserMedia, Web Audio levels, vendor SDK)
│  └─ mobile/                      phase 2: Expo app
│     ├─ app/                      expo-router screens mirroring /app/*
│     └─ src/voice/native.ts       React Native adapter for @unmute/voice
├─ packages/
│  ├─ core/                        pure TypeScript: no React, no Next, no Node or DOM APIs
│  │  ├─ scenarios/                the 8 presets (+ successCriteria, askDefinition, tier, voice per mood)
│  │  ├─ moods.ts
│  │  ├─ prompts/                  persona.ts (buildPersonaSystem), coach.ts (buildCoachPrompt)
│  │  ├─ debrief/                  zod schemas, normalizeDebrief, DebriefOutputSchema
│  │  ├─ metrics/                  sorry/filler counters, time-to-ask, "before the ask", deltas vs last attempt
│  │  ├─ session/                  call state machine (reducer + events), caps (3 min, turns)
│  │  ├─ plans/                    Free / Plus / Teams entitlements, daily quota rule
│  │  ├─ streaks/                  timezone-aware day math
│  │  ├─ samples/                  SCRIPTS, sampleReply, sampleDebrief (demo, tests, degraded mode)
│  │  ├─ safety/                   crisis-language handling contract (detect → end → resources)
│  │  └─ api/                      zod request/response contracts shared by web routes and the mobile client
│  ├─ voice/                       VoiceSession interface + event types (no platform code)
│  ├─ tokens/                      colors, radii, type scale, easing → CSS vars (web) + TS object (RN)
│  ├─ db/                          generated DB types + typed queries (server-only consumers)
│  └─ config/                      tsconfig bases, eslint flat configs
├─ supabase/                       (if Supabase is chosen) migrations/, seed from packages/core/scenarios
├─ docs/                           unchanged (research/, plan/)
└─ site/                           static previews (archive; not deployed by the web project)
```

### 4.4 Rules for the shared packages

- `packages/core` must not import from `apps/*`, React, Next, `node:*` or DOM types. That keeps it usable in React Native, route handlers, scripts and tests.
- Marketing copy (`lib/content.ts`) stays in `apps/web`. Only strings both apps render go to core: scenario cards, mood labels, debrief labels.
- Vendor SDKs (Anthropic, ElevenLabs, billing) are imported only by `apps/web/lib/dal` and route handlers, never by `core`. The mobile app talks to the web app's `/api/*` routes, plus direct vendor sockets using short-lived tokens. That makes the Next app the backend for both clients.
- Add a test runner (Vitest or similar) to `packages/core` first. The metrics, debrief normalizer, streak math and quota rules are pure and easy to test. The scripted samples double as fixtures.

### 4.5 Sequence relative to the roadmap

1. **PR 0 (restructure):**
   - Move to `apps/web`, add the workspace root, fix the font paths.
   - Extract `lib/rehearse.ts` and the scenario data into `packages/core`, and invert the `content.ts` import.
   - Owner changes the Vercel Root Directory. The site behaves exactly as before.
2. **Web product phases:**
   - Accounts and the data model.
   - The voice loop.
   - The debrief v2 with server metrics.
   - Quota, streaks and billing.
   - Privacy flows and crisis flow.
   - Copy fixes from section 1.16, in the same release as the gating.
3. **Mobile:**
   - Add `apps/mobile`, and add Turborepo plus the ignored-build step at the same time.
   - Implement the React Native adapter for `packages/voice`, and reuse `packages/core` and `packages/tokens` unchanged.
