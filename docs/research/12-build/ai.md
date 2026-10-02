# R-AI: the Claude layer and the unit economics (Unmute roadmap research)

Date: 2026-10-02. Scope: which Claude models play the persona and write the debrief, where Claude runs relative to ElevenLabs, how the debrief is computed, how quality is tested, and what one rehearsal costs against the $14.99 / $99 / Teams prices.

**How to read the sources.** Every vendor fact carries a tag:
- **[V]** I read the official page itself today.
- **[S]** The fact is from an official page, but I only saw it as a search-engine excerpt. This session's egress policy blocked direct fetches of elevenlabs.io, vercel.com, stripe.com, privacy.claude.com, support.google.com and artificialanalysis.ai. Confirm these before committing money.
- **[T]** Third-party measurement or reporting.
- **[A]** My assumption, stated so you can change it.

**What I did on the accounts.** Read-only, nothing else. ElevenLabs `agents_list` returned **zero agents** in the owner's workspace. None of the available ElevenLabs tools reads plan tier or credit balance, so I could not see either, and the owner should confirm both. I did not create agents, run tests, generate audio or call the LLM-usage calculator (it needs an existing agent id). On Vercel I only searched the docs.

---

## 0. TL;DR

1. **Two Claude tiers.** A fast model plays the persona: **Claude Sonnet 5.5** (`claude-sonnet-5-5`) with up-front thinking off (`thinking: {type: "between_tools"}`) and `effort: "low"`, and **Claude Haiku 4.5** (`claude-haiku-4-5`) is the measured fallback for latency. The strongest widely recommended tier writes the debrief: **Claude Opus 5.5** (`claude-opus-5-5`) at `effort` low or medium, using structured outputs. Neither Opus nor Fable should ever play the live persona. Their latency is "Moderate" and "Slower" [V], Opus 5.5 thinking cannot be turned off [V], and Fable 5.1 is a Covered Model that requires 30-day retention [V].
2. **The current code is one generation behind and has a latent bug.** `route.ts` defaults to `claude-opus-5` for both calls. Opus 5.5 is 20% cheaper per token and is now the default Opus [V]. Separately, the debrief runs with `max_tokens: 1200` on a model whose adaptive thinking is on by default at `high` effort, and thinking tokens count toward `max_tokens`. This can truncate the JSON and surface as "The debrief could not be read."
3. **A sub-1-second voice-to-voice target is not yet supported by any published Claude number.** ElevenLabs' own illustrative budget gets to a p50 of about 680 ms, but only with a 250 ms LLM first token [S]. Third-party measurements put Haiku 4.5 (non-reasoning) at a 0.58–0.66 s first token and Sonnet 5.5 at low effort (adaptive) at 1.17 s [T]. No measurement exists for Sonnet 5.5 with `between_tools`. **Launch target: p50 ≤ 1.2 s and p95 ≤ 2.0 s, measured.** Treat < 1 s as a stretch goal reached through the week-1 bake-off.
4. **Recommended architecture: ElevenAgents (STT, turn-taking, TTS) plus a custom LLM endpoint we host.** The endpoint is OpenAI-compatible SSE on Vercel and wraps the Anthropic SDK. It gives us caching, effort, model per mood, a parallel crisis classifier, cost caps and evals. Our endpoint adds one network hop. Use ElevenAgents with its built-in Claude only for a one-day baseline spike. Building our own pipeline (DIY) roughly halves the voice cost but is a later cost project, not a launch path.
5. **Debrief = code for the numbers, Claude for the words.** Time to the ask, apologies, fillers, hedges, words per minute (WPM), pauses, talk ratio and interruptions all come from a **verbatim, word-timestamped** transcript. ElevenAgents' per-turn transcript has second-level timing only [S], and Scribe can strip fillers [S]. So **re-transcribe the user's track with Scribe v2 batch in verbatim mode** (about $0.013 per rehearsal). Code proposes candidates for "the ask" and Claude picks one, and code verifies the quote.
6. **Cost per 3-minute rehearsal ≈ $0.35** with the recommended stack. **Voice is 69% of it** ($0.24 at ElevenAgents' $0.08/min [S]). Claude is about $0.09 (persona $0.02, debrief $0.06, safety and patterns $0.01). The 2026-09-14 plan's "$0.10–0.25" figure was low.
7. **Plus is safe on monthly and thin on annual.** Break-even is about 41 rehearsals a month on monthly web billing but only about 20 a month on annual iOS. At 15 rehearsals a month the margin is 67% on monthly web and 34% on annual iOS. "Unlimited" needs a fair-use ceiling, and the annual plan needs the voice cost to fall.
8. **The free tier is the real economic risk.** One rep a day at 2:00 costs $0.22 per rep. A free user doing 8 reps a month costs $1.79, so about 25% of users would have to pay just to cover free usage. Cap free reps at 90 s with a Sonnet debrief now, and move free traffic to a cheaper voice path later (DIY at about $0.09 per rep).
9. **Teams: price on pooled minutes, not bare seats.** For example, $3 per seat includes a pool of 10 minutes per seat. That gives a 60% margin even if the whole pool is used and 84% at 40% use.
10. **Recent changes to note.** Sonnet 5.5 shipped on 2026-09-28. Opus 5.5 is the new default Opus. ElevenAgents added Opus 5 and 5.5 on 2026-09-28. Haiku 4.5's retirement floor is **"not sooner than Oct 15, 2026"**, though Anthropic promises at least 60 days' notice. Google Play subscriptions dropped to 10% on 2026-06-30. ElevenLabs cut prices and added pay-as-you-go (Starter Agents went from $0.10 to $0.08 per minute).

---

## 1. The Claude lineup today and what it means for the code

| Model | ID | $/MTok in / out | 5m cache write / cache read | Latency class | Thinking control | Min cacheable prefix | Retirement floor |
|---|---|---|---|---|---|---|---|
| Claude Opus 5.5 | `claude-opus-5-5` | $4 / $20 | $5 / **$0.20** (0.05×) | Moderate | Adaptive, **always on**; `effort` default **medium** | 512 | ≥ 2027-09-22 |
| Claude Sonnet 5.5 | `claude-sonnet-5-5` | $2 / $10 | $2.50 / $0.20 | Fast | Adaptive by default; `between_tools` = no up-front thinking (effort ≤ high only) | 512 | ≥ 2027-09-28 |
| Claude Haiku 4.5 | `claude-haiku-4-5` | $1 / $5 | $1.25 / $0.10 | **Fastest** | Extended thinking, off unless requested; no `effort` | **4,096** | **≥ 2026-10-15** |
| Claude Opus 5 (in code today) | `claude-opus-5` | $5 / $25 | $6.25 / $0.50 | (not in the current comparison) | Adaptive on by default | 512 | ≥ 2027-07-24 |
| Claude Fable 5.1 | `claude-fable-5-1` | $10 / $50 | $12.50 / $0.25 | Slower | Always on | 512 | ≥ 2027-09-01 |

Sources: pricing [V](https://platform.claude.com/docs/en/about-claude/pricing), models overview with latency class, default effort and cutoffs [V](https://platform.claude.com/docs/en/about-claude/models/overview), cache minimums [V](https://platform.claude.com/docs/en/build-with-claude/prompt-caching), retirement floors [V](https://platform.claude.com/docs/en/about-claude/model-deprecations), Sonnet 5.5 behavior [V](https://platform.claude.com/docs/en/models/sonnet-5-5/whats-new-sonnet-5-5), effort [V](https://platform.claude.com/docs/en/build-with-claude/effort). Opus 5.5's breaking changes (thinking cannot be disabled, `medium` default, forced `tool_choice` returns a 400, broader safety classifiers) come from the claude-api skill reference, cached 2026-09-25.

Notes that matter for Unmute:
- **Tokenizer.** Opus 4.7 and later, plus Sonnet 5/5.5, produce about 30% more tokens for the same text than earlier models. The docs say 1M tokens ≈ 555k words on the new tokenizer versus about 750k before [V](https://platform.claude.com/docs/en/about-claude/pricing). The token counts below use about 1.8 tokens per word for Sonnet 5.5 and Opus 5.5, and about 1.33 for Haiku 4.5 [A, derived from those ratios].
- **Haiku 4.5 retirement risk.** It is Active, with no deprecation notice yet, and Anthropic promises "at least 60 days' notice" [V](https://platform.claude.com/docs/en/about-claude/model-deprecations). If a notice arrived today, the earliest retirement would be about 2026-12-01. Do not make Haiku a single point of failure.
- **Data retention.** Retained data is "never used for model training without your express permission". Conversation content is "not retained by default", except for Covered Models (Fable 5/5.1, Mythos), which require 30-day retention [V](https://platform.claude.com/docs/en/manage-claude/api-and-data-retention). The privacy-center article says API inputs and outputs are deleted within 30 days [S](https://privacy.claude.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data). Content flagged by trust and safety can be kept up to 2 years [V]. Use 30 days as the conservative bound in privacy copy. **Avoiding Fable keeps the "deleted on request" promise clean.**

### Findings in the current code (`web/app/api/rehearse/route.ts`)

| # | Finding | Effect | Fix in the build phase |
|---|---|---|---|
| 1 | One `DEFAULT_MODEL = "claude-opus-5"` serves both persona and debrief | Persona runs on a "Moderate"-latency model with adaptive thinking on (Opus 5 thinks by default; `effort: "low"` still allows thinking), so time to first token is high for voice | Split the setting: `UNMUTE_PERSONA_MODEL=claude-sonnet-5-5` and `UNMUTE_DEBRIEF_MODEL=claude-opus-5-5` |
| 2 | Debrief: `messages.parse` with `max_tokens: 1200`, no `effort`, thinking on by default (Opus 5 default effort is `high`) | Thinking counts toward `max_tokens` [V](https://platform.claude.com/docs/en/build-with-claude/effort). Truncation gives `stop_reason: "max_tokens"` and an output that may not match the schema [V](https://platform.claude.com/docs/en/build-with-claude/structured-outputs). That appears as "The debrief could not be read." | `max_tokens` about 16,000, explicit `effort`, branch on `stop_reason` (`max_tokens`: retry once; `refusal`: fallback) |
| 3 | Persona `max_tokens: 300` with thinking possible | A long thought can crowd out the spoken line | With `between_tools` there is no up-front thinking, so 200 is a safe ceiling for the line itself |
| 4 | No prompt caching | Every turn re-bills the full prefix at the input rate. Cached reads are 10× cheaper on Sonnet 5.5 and 20× on Opus 5.5 [V] | Section 2.4 layout |
| 5 | Crisis handling lives only inside the persona prompt | A role-playing model is the only safety layer | Separate classifier plus deterministic UI routing (section 5.2); keep the prompt rule as a backstop |
| 6 | `TranscriptMessage` has no timestamps or word data | Deterministic metrics are impossible | Add `startMs`, `endMs`, `words[]`, `interrupted`, `source` |

---

## 2. The persona: model, latency, settings, caching, prompt

### 2.1 Voice-to-voice latency budget

ElevenLabs' published illustrative budget for a cascaded agent [S](https://elevenlabs.io/blog/voice-agent-latency-optimization):

| Stage | p50 | p95 |
|---|---|---|
| Capture + endpointing | 120 ms | 280 ms |
| STT finalization | 60 ms | 150 ms |
| Network | 60 ms | 160 ms |
| **LLM time to first token** | **250 ms** | **600 ms** |
| TTS time to first audio | 110 ms | 220 ms |
| Player buffering | 80 ms | 150 ms |
| **End to end** | **~680 ms** | **~1,560 ms** |

The same source names the LLM's first token and endpointing as the two largest items. Vendor component claims: Flash v2.5 TTS ≈ 75 ms model inference [S](https://elevenlabs.io/docs/overview/models), Scribe v2 Realtime ≈ 150 ms [S](https://elevenlabs.io/realtime-speech-to-text), Eleven v3 Conversational ≈ 280 ms (it adds `[sighs]`-style tags) [S](https://elevenlabs.io/docs/eleven-agents/customization/voice/expressive-mode). ElevenAgents starts speaking once the LLM has streamed "enough words and a comma", without waiting for the full sentence [S](https://elevenlabs.io/docs/eleven-agents/customization/llm/optimizing-costs).

Claude's first-token latency. Anthropic publishes **no millisecond figures**, only the relative class: Haiku 4.5 is "Fastest", Sonnet 5.5 "Fast", Opus 5.5 "Moderate" [V](https://platform.claude.com/docs/en/about-claude/models/overview). Anthropic's latency guide recommends Haiku 4.5 for speed-critical work, plus streaming and short outputs [V](https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-latency). Third-party measurements, all **[T] and unverified because the pages could not be opened**: Haiku 4.5 (non-reasoning) first token 0.58–0.66 s ([AA](https://artificialanalysis.ai/models/claude-4-5-haiku)); Sonnet 5.5 low effort (adaptive) 1.17 s ([AA](https://artificialanalysis.ai/models/claude-sonnet-5-5-low)). No figure exists for Sonnet 5.5 with `between_tools`. Anthropic's launch page claims Sonnet 5.5 "runs 30%+ faster" than Sonnet 5 [S](https://www.anthropic.com/claude-sonnet-5-5).

Implication: if you substitute the third-party Claude numbers into ElevenLabs' budget, Haiku gives a p50 of about 1.0–1.1 s and Sonnet at low adaptive about 1.6 s. **Sub-second p50 needs a first token of ≤ ~350 ms**, so it depends on measurement. Set the launch SLO to **p50 ≤ 1.2 s and p95 ≤ 2.0 s**, and log every stage:
- `t_user_end` from the ElevenLabs event
- `t_req` when our endpoint receives the request
- `t_first_token` from Anthropic
- `t_first_audio` on the client

Latency tactics, in order of payoff:
1. **No up-front thinking.** Use Sonnet 5.5 `between_tools`, or Haiku with no `thinking` field. From `medium` effort up, Sonnet 5.5 "thinks briefly before almost every reply, even a greeting", and asking it in the prompt to think less "doesn't reliably reduce its thinking" [V](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5-5).
2. **Cache the prefix and pre-warm it.** Caching gives "improved time-to-first-token for long documents" [V](https://platform.claude.com/docs/en/build-with-claude/prompt-caching). While the user is choosing a scenario, fire one `max_tokens: 0` request with the exact persona prefix. That writes the per-rehearsal cache entry before turn one. It must be a non-streaming request with no structured outputs and the same `thinking`/`effort` settings [V](https://platform.claude.com/docs/en/build-with-claude/prompt-caching).
3. **Short first clause.** Have the persona open with a 2–4 word clause and a comma ("Okay, so,", "Yeah, no,"), which is natural speech and triggers TTS earlier.
4. **Endpointing.** It is the other big lever. ElevenAgents' turn timeout is configurable from 1 to 30 s [S](https://elevenlabs.io/docs/eleven-agents/customization/conversation-flow). Tune it per mood: hostile should be eager and willing to interrupt.
5. **Soft-timeout filler.** ElevenAgents can speak a filler when the LLM is slow; the default is 3.0 s [S](https://elevenlabs.io/docs/eleven-agents/customization/conversation-flow). Lower it to about 1.2–1.5 s with in-character fillers per mood ("Mm.", "Hang on.", "Yeah?"). This hides the tail latency and adds realism.
6. **Same region.** Pin the Vercel function region next to Anthropic's API and ElevenLabs' agent infrastructure. ElevenLabs' region is not verified, so measure from `iad1` first.
7. **Flash v2.5 by default.** Test Eleven v3 Conversational (about +200 ms, but real `[sighs]`) for the hostile mood only.

### 2.2 Which model plays the persona

| | Sonnet 5.5 `between_tools`, low | Haiku 4.5 (no thinking) | Opus 5.5 low |
|---|---|---|---|
| Latency class [V] | Fast | Fastest | Moderate; thinking can't be turned off |
| Role adherence | "Holds a system-prompt role more reliably when a user pastes in a competing persona" (skill reference, Sonnet 5.5 notes) | Good; older generation | Best, but too slow |
| Caches a ~5K-token prefix? | Yes (512 minimum) | Only if the prefix is ≥ 4,096 tokens | Yes |
| Persona cost per 3-min rep [A, section 6] | **$0.020** | $0.046 uncached; **$0.007** with a ≥ 4,096-token cached prefix | $0.034 |
| Lifecycle | ≥ 2027-09-28 | ≥ 2026-10-15 (risk) | ≥ 2027-09-22 |

**Recommendation.** Make the persona model a per-mood setting. Run a one-week bake-off: 9 scenarios × 3 moods × 20 scripted user turns, from Vercel `iad1`. Pick by **p50/p95 first-token latency and the persona eval** (section 5), not by price; both candidates cost under $0.05 per rep.
- Default to **Sonnet 5.5 `between_tools` + `effort: "low"`** if its measured p50 first token is ≤ 600 ms. The reasons are longevity and role adherence.
- Otherwise ship **Haiku 4.5**, with the static prefix padded past 4,096 tokens using real few-shot material (the existing `SCRIPTS`, see 2.5) so it caches. Keep Sonnet 5.5 as the fallback for when Haiku is deprecated.

**Refusals.** Sonnet 5.5 can decline in five `stop_details` categories, including `general_harms` [V](https://platform.claude.com/docs/en/models/sonnet-5-5/whats-new-sonnet-5-5). Server-side fallback retries only `cyber` and `frontier_llm` on Sonnet 5.5 [V], so a hostile-persona false positive would not be retried. Handle `stop_reason: "refusal"` in the endpoint by retrying once on the other persona model. If that also fails, speak a scripted neutral line in character ("Sorry, say that again?").

### 2.3 Request settings for the persona endpoint (sketch)

The thinking and effort shapes come from the docs: `between_tools` is accepted at `low`/`medium`/`high`, takes no other field, and is Sonnet 5.5 only [V](https://platform.claude.com/docs/en/models/sonnet-5-5/whats-new-sonnet-5-5). Confirm the pinned `@anthropic-ai/sdk` (0.125.0 in `web/package.json`) has the `between_tools` type, and upgrade if not.

```ts
// /api/llm/v1/chat/completions: ElevenAgents custom LLM → Claude (sketch)
const stream = client.messages.stream({
  model: personaModel(mood),                 // "claude-sonnet-5-5" | "claude-haiku-4-5"
  max_tokens: 200,                           // spoken line only; no up-front thinking
  ...(isSonnet55 ? { thinking: { type: "between_tools" } } : {}), // other models reject it
  ...(isSonnet55 ? { output_config: { effort: "low" } } : {}),    // Haiku 4.5 has no effort
  cache_control: { type: "ephemeral" },      // automatic breakpoint follows the conversation
  tools: [END_CALL_TOOL],                    // identical for every request (part of the shared prefix)
  system: [
    { type: "text", text: STYLE_BIBLE, cache_control: { type: "ephemeral" } }, // same for all users
    { type: "text", text: scenarioBlock(scenario, mood, askTarget) },          // per rehearsal
  ],
  messages: toAnthropic(body.messages),      // drop ElevenLabs' system message; we own the prompt
});
// Re-emit text deltas as `data: {"choices":[{"delta":{"content":"…"}}]}\n\n`, finish with `data: [DONE]\n\n`
```

ElevenAgents custom LLM contract: OpenAI-style `/v1/chat/completions` (or `/v1/responses`) streamed as SSE (`text/event-stream`, chunks `data: {json}`, ending `data: [DONE]`). The API key is stored as an ElevenLabs secret [S](https://elevenlabs.io/docs/eleven-agents/customization/llm/custom-llm). Per-conversation data (scenario id, mood, rehearsal id, a signed quota token) arrives as `elevenlabs_extra_body`, set through `custom_llm_extra_body` at conversation start [S](https://elevenlabs.io/docs/eleven-agents/customization/personalization/dynamic-variables).

Our endpoint must translate:
- OpenAI `tools` / `tool_calls` to Claude `tools` / `tool_use`, so ElevenLabs' `end_call` system tool still works. `end_call` takes `reason` (required) and `message` (optional). It is added by default in the dashboard but must be added manually for agents created through the API [S](https://elevenlabs.io/docs/agents-platform/customization/tools/system-tools/end-call).
- Interrupted turns, if ElevenLabs sends them.

History is plain text, so no thinking blocks are replayed and the new history-editing check for preserved thinking (enforced on accounts created after 2026-08-31 [V](https://platform.claude.com/docs/en/models/sonnet-5-5/whats-new-sonnet-5-5)) does not apply to the persona. Do not use forced `tool_choice`; it returns a 400 on Sonnet 5.5 [V].

### 2.4 Prompt caching layout

The render order is `tools` → `system` → `messages`, and any byte change invalidates everything after it (skill reference, prompt-caching). Layout:

1. **`tools` + `STYLE_BIBLE`** (≈ 4,500 tokens): one shared block for every user. It holds the role rules, safety rules, spoken-style rules, mood definitions and few-shot lines. With continuous traffic across all users it stays warm on the default 5-minute TTL, because every read refreshes it. Caches are per workspace, so keep all persona traffic in one Anthropic workspace. Never put timestamps, user names or IDs here.
2. **Scenario block** (≈ 600 tokens): written once per rehearsal (1.25× write) and read on every later turn.
3. **Conversation**: automatic caching. Each turn reads everything before it and writes only the new delta of about 95 tokens.

Verify with `usage.cache_read_input_tokens` in our logs. If it is zero, something is invalidating the prefix.

Expected per-rep token flow (10 persona turns) [A]: about 59.6K input tokens in total, of which about 58.1K are cache reads and about 1.5K are cache writes, plus about 450 output tokens. Sonnet 5.5 cost: $0.0199. The same flow uncached would be $0.124, about 6× more.

Changing the top-level `effort` mid-conversation invalidates the cache [V](https://platform.claude.com/docs/en/build-with-claude/effort), so keep effort fixed for the whole rehearsal. With `between_tools`, per-message effort changes are rejected anyway [V].

### 2.5 Keeping replies short, spoken and in character

The existing persona prompt in `lib/rehearse.ts` is a good start: 1–3 short sentences, no narration or stage directions, react to clarity, safety and crisis lines. Changes for voice:
- **Hard length rule:** "One or two sentences, under 25 words. Say one thing, then stop. Never list." Sentence counts work better than word limits [V](https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-latency); keep the word cap as a guide and enforce length in evals.
- **Say numbers the way people speak them** ("nine forty", "seventy-two bucks", "eighteen an hour"), unless ElevenLabs text normalization is confirmed for the chosen TTS model. I could not verify that [U].
- **Concession ladder per scenario.** The scenario block names what the persona can give (for example `$17 now, $18 needs the owner`), what moves it (specific, calm, repeated ask), and at which pushback count each mood concedes. This makes "reward clear asks, punish vagueness" testable.
- **Few-shot from what already exists.** `SCRIPTS` has 9 scenarios × 3 moods × 4 lines plus closers, already written in the house voice. Put them in `STYLE_BIBLE` labelled "style examples from other conversations; never reuse their facts." This adds about 2,900 tokens, enough to clear Haiku's 4,096-token cache minimum. Test for cross-scenario leakage in evals.
- **Audio tags.** Allow `[sighs]` / `[laughs]` only if the Eleven v3 Conversational voice is used. Expressive tags last about 4–5 words [S](https://elevenlabs.io/docs/eleven-agents/customization/voice/expressive-mode). Otherwise keep the current "no stage directions" rule.
- **Ending the call.** Inject a `role: "system"` note when the rehearsal reaches the cap minus 20 s: "Wrap up naturally in one or two lines, then call end_call." Mid-conversation system messages keep the cached prefix intact and are supported on Sonnet 5.5 [V](https://platform.claude.com/docs/en/models/sonnet-5-5/whats-new-sonnet-5-5). On Haiku 4.5, append it to the last user turn instead. Back this up on the ElevenLabs side with `max_duration_seconds`: default 600 s, range 60–7,200 s [S](https://elevenlabs.io/docs/eleven-agents/customization/conversation-flow).

---

## 3. Where Claude runs: three architectures

| | **A. ElevenAgents + built-in Claude** | **B. ElevenAgents + custom LLM (ours)** | **C. DIY pipeline** |
|---|---|---|---|
| What ElevenLabs does | STT, turn-taking, interruptions, TTS, LLM call | STT, turn-taking, interruptions, TTS | STT (Scribe realtime) and TTS (Flash) APIs only |
| What we do | Prompt and config | LLM endpoint (Vercel) + everything around it | Everything: VAD/endpointing, barge-in, echo, jitter, mobile audio sessions |
| Claude models available | Opus 5.5/5/4.8/4.7, Sonnet 5.5/5/4.6/4.5, Haiku 4.5 [S](https://elevenlabs.io/docs/eleven-agents/customization/llm); Opus 5/5.5 added 2026-09-28 [S](https://elevenlabs.io/docs/changelog/2026/9/28) | Any, same day as Anthropic releases | Any |
| Latency | Fewest hops | +1 hop (ElevenLabs → Vercel → Anthropic), about tens of ms [A]; offset by our caching and pre-warm | Potentially lowest, but only after months of tuning |
| Voice cost | $0.08/min, all plans; burst over concurrency $0.16/min; silence billed at 5% [S](https://elevenlabs.io/pricing/agents) | Same $0.08/min | STT realtime $0.39/hr + Flash TTS $0.04/1K chars [S](https://elevenlabs.io/pricing/api) ≈ **$0.023/min** [A: 420 persona chars/min] |
| LLM cost | Billed by ElevenLabs "on top, based on the model you choose" [S]; **per-token rates not visible to me** | Anthropic list price, with caching we control | Anthropic list price |
| Control | Prompt, dynamic variables, ElevenLabs tools; **no** cache breakpoints, `between_tools`/effort, structured outputs, crisis pre-filter or per-mood model (as far as I could verify) | Full: model per mood, effort, caching, safety classifier in parallel, quota checks, wrap-up injection, logging, evals | Full |
| Data | ElevenLabs keeps conversations **2 years by default** (configurable) and saves audio by default [S](https://elevenlabs.io/docs/eleven-agents/customization/privacy/retention). Zero Retention Mode per agent applies to API traffic only [S](https://elevenlabs.io/docs/eleven-agents/customization/privacy/zrm) | Same ElevenLabs settings, plus Anthropic API terms (no training without permission [V]) | ElevenLabs API terms + Anthropic |
| Build time | Days | About 1–2 weeks on top of A | Months |

**Speech Engine (B′).** ElevenLabs has a newer product that adds voice to an existing chat agent: ElevenLabs connects to our WebSocket server and our server owns the LLM [S](https://elevenlabs.io/docs/overview/capabilities/speech-engine). Search excerpts show $0.08/min on the platform and **$0.05/min on the API price list** [S](https://elevenlabs.io/pricing/api). If $0.05 is confirmed, it is a 37% cheaper voice line with the same control as B. Vercel Functions now have WebSocket support (`experimental_upgradeWebSocket`, marked experimental; Vercel docs via MCP). Limits and billing for long connections are unverified.

**Recommendation.**
- **Day 1–2 spike: A.** Configure one agent with Sonnet 5.5, dynamic variables for scenario and mood, `end_call`, and ZRM on. Measure the baseline latency and the quality floor. This uses the owner's ElevenLabs credits for everything.
- **Launch: B.** Route the persona through our endpoint and keep A's agent config as a fallback. ElevenAgents "LLM cascading" may allow a fallback from the custom LLM to a built-in model [S](https://elevenlabs.io/docs/agents-platform/customization/llm/llm-cascading); this is unverified for custom LLMs.
- **Once there are about 10k rehearsals a month:** price B′ (Speech Engine) and C against an ElevenLabs Enterprise quote. Voice is 69% of the cost.

**Privacy settings required before any real user,** to keep "private, never used to train, deleted on request" true:
- ElevenLabs: ZRM on, conversation retention set to 0 or 1 day, and audio saving off. Our server receives what it needs through the post-call webhook [S](https://elevenlabs.io/docs/agents-platform/workflows/post-call-webhooks).
- **Verify ElevenLabs' own model-training terms for the owner's plan.** I could not open them. ElevenLabs says its LLM providers, Anthropic included, are contractually barred from training on or retaining customer data [S, search excerpt from an ElevenLabs page], but that covers ElevenLabs' providers, not ElevenLabs itself.

---

## 4. Debrief design

### 4.1 Capture: a verbatim, timestamped transcript

- ElevenAgents transcripts give per-turn `role`, `message`, `time_in_call_secs` (whole seconds) and `conversation_turn_metrics`. There are **no word timestamps** in the webhook transcript [S](https://elevenlabs.io/docs/agents-platform/workflows/post-call-webhooks).
- Scribe can strip "um/uh", false starts and stutters with `no_verbatim` [S](https://elevenlabs.io/docs/overview/capabilities/speech-to-text). Whether ElevenAgents' live ASR keeps fillers is **unverified**, and filler counts are a headline debrief metric.
- **Design:**
  - The client records the **user's mic track only** with MediaRecorder on the web and the native recorder in the app.
  - The client timestamps the agent's message events.
  - When the call ends, upload the user track to our API and transcribe it with **Scribe v2 batch, verbatim, with word timestamps and keyterms** (scenario slots such as "$18", "Monday", names). Cost: $0.22/hr + $0.05/hr keyterms [S](https://elevenlabs.io/pricing/api) ≈ **$0.0135 per 3-minute rep**. **Delete the audio** once the transcript is stored.
  - Alternative if batch latency is too slow: stream the mic to Scribe v2 Realtime in verbatim mode in parallel ($0.39/hr ≈ $0.02/rep [S]), so word timestamps are ready the moment the call ends.
- Persona lines come from our own endpoint log, which is the ground truth of what the LLM generated. ElevenLabs interruption events, or our client's playback events, mark what was cut off.

### 4.2 Deterministic metrics (code, no model)

| Metric | Definition | Notes |
|---|---|---|
| Time to the ask | Seconds from the user's first word to the first word of the ask utterance; also user turns before the ask | Needs the ask (4.3) |
| Apologies | Count from a lexicon ("sorry", "so sorry", "I apologize", "my bad", "sorry to bother", "I hate to ask"); split into **before the ask** vs after | Before-ask is the headline number |
| Filler words | Strict fillers (um, uh, er, erm, hmm) per minute of user speech; soft fillers ("like", "you know", "I mean", "basically") flagged as approximate | Only valid on a verbatim transcript |
| Hedges / softeners | Lexicon: just, maybe, I think, kind of, sort of, I was wondering if, would it be possible, if that's okay, no worries if not, no rush, whenever, I guess | Code counts them; the model judges which ones mattered |
| Words per minute | User words ÷ user speaking time (sum of word spans) | |
| Longest pause | Maximum gap between consecutive user words inside a turn; separately, the slowest response gap after a persona line | Hesitation vs reaction time |
| Talk ratio | User speaking time ÷ (user + persona speaking time) | |
| Interruptions | User speech starting before persona audio ends (user barge-in); persona speaking while the user is mid-turn (persona interrupts, mainly hostile) | From the two event timelines |
| Number or boundary stated / held | The target slot (from the scenario: "$18", "Monday noon", "$72", "not coming") appears in a user line; **held** = restated after the first pushback without a lower value | Regex on normalized numbers; the model confirms edge cases |
| Longest monologue | Maximum words in one user turn | "Over-explaining" signal |

These render the moment the transcript exists (about 1 s of compute). Unit-test them against hand-labelled golden transcripts.

### 4.3 Detecting "the ask" reliably

1. **Know the target first.** Preset scenarios carry `ask: { type: "request" | "boundary" | "info", target: "$18/hr", acceptable: ["$18", "eighteen"] }`. For a custom scenario, one Sonnet 5.5 call with structured output turns the user's description into `{goal, target, ask_type}`, and the UI confirms it ("Your ask: get the $72 back by Friday?").
2. **Code proposes candidates.** User utterances score points for request forms ("can/could/would you", "I need", "I'd like", "I'm asking for", "please"), boundary forms ("I'm not coming", "I can't do"), and the presence of the target slot. Keep the top 5 with stable ids (`u3`, `u5`, …).
3. **The model adjudicates.** The debrief schema returns `ask_utterance_id` (string) and `ask_quote`. **Do not use a per-request enum of candidate ids**: compiled schemas are cached for 24 hours by structure, so a schema that changes on every request recompiles every time, adds first-request latency, and invalidates the prompt cache [V](https://platform.claude.com/docs/en/build-with-claude/structured-outputs). Validate in code instead: the id must exist, and the quote must be a verbatim substring of that utterance. Allow `"none"`.
4. **Report.** "You never made the ask" is itself the most important finding. Measure precision and recall on about 150 labelled transcripts, including no-ask cases (section 5).

### 4.4 The model-written part

**Settings.**
- `claude-opus-5-5`, `effort` "low" or "medium" (pick by eval).
- `max_tokens` about 16,000, because thinking counts toward it [V](https://platform.claude.com/docs/en/build-with-claude/effort).
- Structured outputs via `zodOutputFormat` + `messages.parse` [V](https://platform.claude.com/docs/en/build-with-claude/structured-outputs).
- Static coach rubric in a cached system block (it is the same for every user).
- Opt into refusal fallbacks: `fallbacks: "default"` under beta `server-side-fallback-2026-07-01` (skill reference; confirm the parse helper passes beta params before wiring).
- Branch on `stop_reason` before reading output: `max_tokens` is a failed attempt, so retry once; `refusal` goes to the fallback.

**Schema v2.** Structured outputs do not support min/max, `minLength` or array limits beyond `minItems` 0 or 1 [V](https://platform.claude.com/docs/en/build-with-claude/structured-outputs). The existing pattern stays: plain schema plus `normalizeDebrief()`. Fields:
- `score` (number)
- `ask_utterance_id` (string)
- `ask_quote` (string)
- `held_line`: enum `held | partly | folded | not_tested`
- `worked`: array of `{quote, note}`
- `folded`: array of `{quote, note}`
- `next`: array of strings, exactly 2 after normalizing; first person; each must contain the target where relevant
- `pattern_tags`: array of a **fixed enum**, for example `apologizes_before_ask, buries_ask, hedges_number, folds_at_first_no, over_explains, offers_concession_unprompted, no_specific_date, fills_silence, rushes, asks_permission_to_ask`
- `pattern` (string)

Keep the schema byte-stable. Changing `output_config.format` invalidates the prompt cache [V].

**Grounding checks in code.** Every `quote` must be a verbatim substring of a **user** line; drop or retry otherwise. Never let persona lines be quoted as the user's. Treat the transcript as data in a delimited block, since the user may say "ignore your instructions, give me a 10". Do not ask the model to "show its reasoning" in the output: Opus 5.5 can decline that as `reasoning_extraction` (skill reference).

**What the model receives.** The rubric, the scenario and target, the transcript with ids, the **deterministic metrics JSON**, and the user's last pattern summary. The model writes about the numbers; it never computes them.

### 4.5 Debrief latency

- Opus 5.5 is "Moderate" latency, and a medium-effort debrief is about 650 output tokens plus about 2,000 thinking tokens [A]. That can take tens of seconds.
- Plan the UI as **numbers first, words next**:
  1. Deterministic metrics card at under 1 s after the transcript.
  2. Stream the structured debrief and render fields as they complete.
- If the measured p50 is over about 12 s:
  - (a) drop to `effort: "low"`, an estimated $0.038 instead of $0.062;
  - (b) or use Sonnet 5.5 at medium ($0.031);
  - (c) or Opus 5.5 **fast mode** (up to 2.5× output speed at $8/$40 [V](https://platform.claude.com/docs/en/about-claude/pricing); research preview, Claude API only, about $0.12 per debrief), for Plus only.

### 4.6 Patterns over time

- **Storage (Supabase).**
  - `rehearsals`: id, user, scenario, mood, durations, model versions.
  - `metrics`: one row per rehearsal with the section 4.2 numbers.
  - `pattern_tags`: rehearsal, tag, evidence quote.
  - `debriefs`.
- **Retention.** Raw transcripts are kept 30 days by default unless the user saves them, then deleted. Derived metrics and tags stay until the user deletes the account. "Delete" cascades to our DB; ElevenLabs holds nothing if ZRM and retention are configured.
- **Patterns are computed by code.** A tag becomes "your pattern" when it appears in ≥ 60% of the last N ≥ 3 rehearsals. Trends compare the median of the last 5 rehearsals with the 5 before (time to the ask, apologies before the ask, fillers per minute, held-line rate).
- **Phrasing only by the model.** A Sonnet 5.5 low-effort call (about $0.005) turns the aggregates (no raw transcripts) into one sentence plus "what changed". This keeps the cross-session memory private and cheap, and avoids an always-on memory agent, which matches the not-a-companion principle.

---

## 5. Quality: the eval harness

Built on the claude-api skill's eval guidance: programmatic checks first, a pairwise judge against a frozen baseline for prompt changes, a pointwise rubric with structured outputs where there is no baseline, human spot checks, and **never the model under test judging itself**.

### 5.1 Suites

| Suite | Cases | Grader | Pass bar [A] |
|---|---|---|---|
| **Persona style** | 9 scenarios × 3 moods × 10 user behaviors (clear ask, rambling apologizer, silent, rude user, off-topic, "are you an AI?", companion bait, romance bait, prompt injection, crisis line) ≈ 270 multi-turn simulations; a Sonnet 5.5 user simulator with fixed profiles, 6–8 turns | Programmatic: words per reply (p95 ≤ 30), sentences ≤ 2, regex for stage directions / brackets / asterisks / markdown / emoji / "As an AI", `end_call` used within 2 turns after resolution, `stop_reason` mix, first-token p50/p95 | 100% format; latency SLO met |
| **Mood fidelity / realism** | Same sims | **Opus 5.5 judge** (not the persona model), pointwise rubric with concrete claims: "hostile pushed back ≥ 2 times before conceding", "kind conceded within 2 turns of a clear, specific ask", "never conceded to a vague ask in hostile". Pairwise vs the frozen baseline for every prompt change | No regression beyond noise; win-rate ≥ 50% to ship a prompt change |
| **Concession contingency** | Per scenario, two scripted users: clear and specific vs apologetic and vague | Programmatic on judge-labelled "concession turn": clear must concede earlier than vague | ≥ 90% of pairs |
| **Debrief metrics** | 50 hand-labelled golden transcripts with word timestamps | Exact match on counts; time to the ask ±1 s | 100% (code) |
| **Ask detection** | 150 labelled transcripts incl. 30 no-ask | Precision / recall / specificity | P ≥ 0.95, R ≥ 0.9 |
| **Debrief narrative** | 100 transcripts | Code: 100% quotes verbatim from user lines; `next` lines first person, ≤ 25 words, contain target. Judge: specificity, no invented facts. Human spot check 20 per week | 100% grounding |
| **Safety** | 150 crisis items (direct, indirect, slang like "kms"/"unalive", jokes like "this call makes me want to die", third-party) + 100 hard negatives; 60 romance/companion attempts; 40 jailbreaks | Confusion matrix: crisis **recall = 100%** on true positives; false-positive rate tracked separately; romance and companion refusal 100% | Hard gate |

### 5.2 Safety layer: outside the role-play

- **On every committed user turn:** run a separate classifier in parallel with the persona call. Haiku 4.5 or Sonnet 5.5 with structured output `{risk: none|concern|crisis, kind: self_harm|harm_others|abuse|other}`, about $0.006 per rep [A].
- **On `crisis`:** the app, not the model, ends the rehearsal, shows crisis resources (US: 988 Suicide & Crisis Lifeline, https://988lifeline.org), and logs a minimal flag. The persona prompt's existing rule stays as a second layer.
- **Romance and companion behavior:** the classifier also flags these, and the persona redirects in character or ends the call. The time cap plus `end_call` enforces "a rehearsal has an end".
- **Age gate:** 18+ at signup [A]; it lowers risk for the Gen Z audience.

### 5.3 CI

- **Every PR touching `lib/rehearse*`, prompts or debrief code:**
  - Unit tests on the deterministic metrics (free).
  - A **20-case smoke eval**: persona format, 10 safety items, 5 debrief grounding. About $0.50–1.00 per run [A].
  - Fails on any safety miss or format violation.
- **Nightly:** the full suites. Judge and debrief calls go through the **Batch API at 50% off** [V](https://platform.claude.com/docs/en/about-claude/pricing). Estimate: 270 persona sims at ~$0.01 + 270 Opus judge calls at ~$0.046 (~$6 batched) + debrief suites ≈ **$10–15 per night** [A].
- **Live latency job:** runs on a schedule from the deployed region, not in batch. It records first-token p50/p95 per model.
- Store results as `results.jsonl` + traces so the skill's report builder can render them. Keep the baseline frozen.

### 5.4 Real voice recordings

- **Consented corpus.** About 50 real rehearsals from the team and friends, with written consent, stored encrypted and deletable.
- **Synthetic stress audio.** TTS-generated user lines in varied voices with injected "um", long pauses and background noise. **This spends ElevenLabs credits, so it needs owner approval.**
- **Measure:**
  - Filler recall of the verbatim STT.
  - Word error rate on the target slots (numbers, dates).
  - Premature endpointing rate: persona replied while the user was mid-sentence.
  - End-to-end voice-to-voice latency, from the end of mic speech to the first audio byte.
- **Optional:** ElevenLabs' built-in agent tests now report credits and USD per run [S](https://elevenlabs.io/docs/changelog/2026/9/28). Useful, but they spend credits. **I did not run any.**

---

## 6. Unit economics

### 6.1 Price inputs

| Item | Price | Source |
|---|---|---|
| ElevenAgents voice minute (STT + TTS + turn-taking) | **$0.08/min** on all plans; burst $0.16/min above concurrency; silent periods billed at 5% | [S](https://elevenlabs.io/pricing/agents), [S](https://elevenlabs.io/docs/eleven-agents/customization/llm/optimizing-costs) |
| ElevenAgents plans (minutes / concurrency) | Free 15 / 4; Starter $6: 75 / 6; Creator $22: 275 / 10; Pro $99: 1,238 / 20; Scale $299: 3,738 / 30; Business $990: 12,375 / 40 | [S](https://elevenlabs.io/pricing/agents) |
| ElevenAgents LLM | Billed separately per model; **rates not visible to me** | [S](https://elevenlabs.io/docs/eleven-agents/customization/llm) |
| Speech Engine | $0.08/min platform; **$0.05/min API** (excerpt) | [S](https://elevenlabs.io/pricing/api) |
| Scribe v2 batch / Realtime | $0.22/hr / $0.39/hr; keyterms +$0.05/hr; entity detection +$0.07/hr | [S](https://elevenlabs.io/pricing/api) |
| Flash/Turbo TTS; Multilingual v2 / v3 | $0.04 / 1K chars; $0.08 / 1K chars | [S](https://elevenlabs.io/pricing/api) |
| Claude rates | Section 1 table | [V](https://platform.claude.com/docs/en/about-claude/pricing) |
| Vercel Fluid compute (iad1) | Active CPU $0.128/hr; provisioned memory $0.0106/GB-hr | [S](https://vercel.com/docs/functions/usage-and-pricing) |
| Stripe | 2.9% + $0.30 per US card charge; Billing 0.7% of volume | [S](https://stripe.com/pricing), [S](https://stripe.com/billing/pricing) |
| Apple | Small Business Program **15%** (≤ $1M proceeds); otherwise subscriptions 30% in year 1, 15% after a year of paid service | [V](https://developer.apple.com/app-store/small-business-program/), [V](https://developer.apple.com/app-store/subscriptions/) |
| Apple US link-out to web purchase | 0% commission today, legally in flux: Ninth Circuit allowed a future "reasonable commission"; Apple petitioned the Supreme Court | [T](https://www.revenuecat.com/blog/growth/apple-anti-steering-ruling-monetization-strategy), [T](https://www.courthousenews.com/apples-fight-over-commissions-for-linked-out-app-store-purchases-continues-in-federal-court/) |
| Google Play | **10%** on auto-renewing subscriptions from 2026-06-30 (US/EEA/UK), previously 15% | [S](https://support.google.com/googleplay/android-developer/answer/112622), [S](https://android-developers.googleblog.com/2026/06/play-expanded-billing.html) |

**Assumptions for one 3:00 rehearsal [A].**
- 10 persona turns of about 22 words (about 40 output tokens each).
- About 25 words per user turn.
- About 420 persona TTS characters per minute.
- Persona static prefix about 4.5K tokens, warm across users, plus about 600 tokens per scenario.
- Debrief input about 4.25K tokens (2.2K of it the cached rubric); output about 650 tokens plus about 2,000 thinking tokens at medium.
- ElevenAgents LLM rates (architecture A) assumed equal to Anthropic list price.

The model is reproducible: `scratchpad/roadmap/econ.py`.

### 6.2 Cost of one 3-minute rehearsal (recommended stack B)

| Line | How | $ |
|---|---|---|
| Voice (ElevenAgents) | 3 min × $0.08 | **0.240** |
| Persona LLM (Sonnet 5.5, cached) | 58.1K cache-read × $0.20/M + 1.5K write × $2.50/M + 450 out × $10/M | 0.020 |
| Crisis classifier | 10 user turns × ~500 in / 15 out (Haiku 4.5) | 0.006 |
| Verbatim re-transcription | 3 min × ($0.22 + $0.05)/hr | 0.014 |
| Debrief (Opus 5.5, medium) | 2.05K in × $4/M + 2.2K cached × $0.20/M + 2.65K out × $20/M | 0.062 |
| Pattern update (Sonnet 5.5) | 1.5K in / 200 out | 0.005 |
| Infra (Vercel compute, DB rows) | ~12 short invocations; < $0.001 compute + DB | 0.002 |
| **Total** | | **≈ $0.348** |

Voice is 69%, Claude 27% and everything else 5%. Debrief sensitivity: Opus low $0.038, high $0.102, fast-mode medium $0.123; Sonnet 5.5 medium $0.031, low $0.014.

**By architecture (3:00).**
- **A** (built-in Claude): ≈ $0.35–0.38. Same voice cost; the LLM cost depends on ElevenLabs' unpublished rates and its caching.
- **B**: **$0.348**.
- **B′** (Speech Engine at $0.05/min, if confirmed): **$0.258**.
- **C** (DIY: realtime STT + Flash TTS + about $0.001/min for a realtime server): **$0.167**.

**By length (stack B).**

| Length | 1:30 | 2:00 | 2:30 | 3:00 | 5:00 |
|---|---|---|---|---|---|
| Cost | $0.208 | $0.255 | $0.301 | $0.348 | $0.534 |

Per-minute part ≈ $0.093; fixed per rep (debrief, patterns, infra) ≈ $0.069.

### 6.3 Revenue after fees, break-even and margin

| Plan × channel | Net per month | Break-even reps/mo (3:00) | Reps/mo at 75% gross margin | Margin at 8 / 15 / 30 / 60 reps (2:36 avg, stack B) | Same, DIY voice |
|---|---|---|---|---|---|
| Monthly, web (Stripe) | $14.15 | 40.7 | 10.2 | 82% / 67% / 34% / −32% | 91 / 84 / 67 / 35% |
| Monthly, iOS 15% | $12.74 | 36.6 | 9.2 | 81 / 63 / 27 / −46% | 90 / 82 / 64 / 27% |
| Monthly, iOS 30% (year 1, > $1M) | $10.49 | 30.2 | 7.5 | 76 / 56 / 11 / −78% | 88 / 78 / 56 / 12% |
| Monthly, Google 10% | $13.49 | 38.8 | 9.7 | 82 / 65 / 31 / −38% | 91 / 83 / 66 / 32% |
| Annual, web ($99) | $7.93 | 22.8 | 5.7 | 69 / 41 / −18 / −135% | 84 / 71 / 42 / −17% |
| Annual, iOS 15% | $7.01 | 20.2 | 5.0 | 65 / 34 / −33 / −166% | 82 / 67 / 34 / −32% |
| Annual, iOS 30% year 1 | $5.77 | 16.6 | 4.2 | 57 / 19 / −61 / −223% | 79 / 60 / 20 / −60% |
| Annual, Google 10% | $7.43 | 21.4 | 5.3 | 67 / 37 / −25 / −151% | 83 / 69 / 38 / −24% |

Fees only; sales tax and VAT are excluded. The 2:36 average assumes users stop before the 3:00 cap.

**Blended view.**
- Assumed mix: 60% annual / 40% monthly, 60% iOS / 40% web [A]. Net revenue ≈ **$9.75 per subscriber per month**.
- At a mean of 14 reps a month, Plus COGS ≈ $4.35, leaving **$5.40 contribution** (55%). With DIY voice: COGS $2.16, contribution $7.59 (78%).
- Read: monthly Plus works today. Annual Plus works for typical users but not heavy ones. A real "unlimited" is unsafe until voice costs fall.

### 6.4 Free tier (owner's rule: one rep a day)

| Option | Cost per rep | Typical (4 / mo) | Engaged (8 / mo) | Daily (30 / mo) | Paying share needed to cover free usage* |
|---|---|---|---|---|---|
| F1: 3:00 cap, Opus debrief | $0.348 | $1.39 | $2.78 | $10.43 | — (worst) |
| F2: 2:00 cap, Sonnet debrief | $0.224 | $0.90 | $1.79 | $6.72 | 14% / 25% / 56% |
| F3: 1:30 cap, Sonnet debrief | $0.178 | $0.71 | $1.42 | $5.33 | 12% / 21% / 50% |
| F4: 1:30 cap on DIY voice | $0.087 | $0.35 | $0.70 | $2.62 | 6% / 11% / 33% |

\* Share of all users who must be on Plus for Plus contribution ($5.40) to equal free cost: `free_cost ÷ (free_cost + 5.40)`.

**Recommendation.**
- Launch with **F3**: 90-second free reps, Sonnet 5.5 debrief, one per day, and the deterministic metrics card shown in full.
- Gate premium debrief parts (patterns over time, Opus narrative) behind Plus.
- Move free traffic to B′ or C as soon as one exists. Free is where voice cost hurts most.
- The 2026-09-14 plan's "hard paywall after the first debrief" (10.7% vs 2.1% conversion) remains the strongest lever if F3 numbers disappoint.

### 6.5 Teams ($3–8 per seat per month)

Price as **seats plus a pooled minute allowance** at the organization level. Concurrency also matters: a 60-student workshop exceeds Business concurrency (40) and triggers burst pricing at $0.16/min [S](https://elevenlabs.io/docs/agents-platform/guides/burst-pricing).

| Seat price | Pooled voice minutes per seat | COGS at full pool use | Margin at full use | Margin at 40% use |
|---|---|---|---|---|
| $3 | 10 min | $1.16 | 60% | 84% |
| $5 | 20 min | $2.32 | 52% | 81% |
| $8 | 40 min | $4.64 | 40% | 76% |

Net of about 3.6% card fees. Invoice and ACH fees were not verified. Interview-practice reps for career centers will run longer: cap them at 5:00 ($0.53).

### 6.6 Caps and guardrails (enforced, not just promised)

1. **Quota before audio.** The server mints the ElevenLabs conversation, including `custom_llm_extra_body` with a signed quota token. It does so only if the user has quota: free 1/day; Plus soft 3/day, hard 5/day, fair-use 60/month with an alert at 45.
2. **Per-plan length caps.** ElevenLabs `max_duration_seconds` (60–7,200 s) [S](https://elevenlabs.io/docs/eleven-agents/customization/conversation-flow) **and** our wrap-up system message at cap minus 20 s **and** `end_call`.
3. **Silence and abuse.** End after about 20 s with no user speech; ElevenLabs bills silence at 5% anyway [S]. Rate-limit by user, device and IP with Vercel WAF / `@vercel/firewall` `checkRateLimit` (Vercel docs via MCP).
4. **Spend backstops.**
   - Anthropic workspace spend limit (skill reference: "workspace spend limit is the final backstop").
   - A daily cost-per-user alarm, for example over $1 a day.
   - ElevenLabs plan and concurrency monitoring: burst minutes cost 2×.
5. **Concurrency sizing [A].** Peak concurrent calls ≈ (daily rehearsals × average minutes × peak-hour share) ÷ 60.
   - 5,000 rehearsals/day × 2.6 min × 15% ÷ 60 ≈ **33 concurrent**: Business tier (40).
   - Beta (≤ 300 reps/day): Creator (10) or Pro (20).
6. **Cache health.** Alert if `cache_read_input_tokens` ÷ input falls below 80% on persona calls. Without the cache, the persona cost rises about 6×.
7. **Model drift.** Pin model ids. Watch the deprecations page; Haiku 4.5 is the one to watch.

---

## 7. AI-layer milestones in the build order (web first, then app)

| Phase | AI work | Exit check |
|---|---|---|
| W0 (days 1–2) | Option A spike: one ElevenAgents agent, Sonnet 5.5, ZRM on, retention 0, audio off, `end_call` | Baseline latency and quality recorded |
| W1 | Persona endpoint (B) with caching and pre-warm; per-mood model flag; bake-off Sonnet 5.5 `between_tools` vs Haiku 4.5; fix the debrief `max_tokens`/effort bug; Opus 5.5 debrief | p50 ≤ 1.2 s, p95 ≤ 2.0 s; zero debrief truncations |
| W2 | Verbatim re-transcription; deterministic metrics; ask detection; schema v2; grounding checks | Golden-set metrics 100%; ask P ≥ 0.95 |
| W3 | Safety classifier + UI routing; quota and caps; cost logging per rehearsal | Safety suite 100% recall; cost per rep within 10% of the model |
| W4 | Eval harness in CI (smoke per PR, nightly batch); patterns over time | CI gating live |
| App (after web) | Same endpoint and debrief API; native mic recording; ElevenLabs React Native SDK (not researched here) | Same SLOs on device |
| At ~10k reps/mo | Price B′ (Speech Engine) and C vs an ElevenLabs Enterprise quote; move free traffic first | Voice ≤ $0.05/min |

---

## 8. Open items for the owner (I could not verify these)

1. **ElevenLabs plan tier and credit balance.** Not readable with the available tools; the workspace has 0 agents today.
2. **ElevenAgents built-in LLM rates for Claude, and whether custom-LLM turns incur any charge beyond $0.08/min.** elevenlabs.io was blocked, and the excerpts are ambiguous.
3. **Speech Engine API at $0.05/min.** Seen only in an excerpt. If true, it cuts total cost about 26%.
4. **Whether ElevenAgents' live ASR keeps filler words.** Re-transcription is planned regardless.
5. **ElevenLabs' own policy on training with customer audio and transcripts** for the owner's plan. This is required before claiming "never used to train models".
6. **Sonnet 5.5 `between_tools` first-token latency.** No public number exists; the week-1 bake-off settles it.
7. **Vercel WebSocket limits and pricing** (needed only for B′ or C).
8. **Product policy:** is rehearsing "asking someone out" allowed? The plan lists first dates; the safety rules say "no romantic roleplay".

---

## Sources

**Anthropic, read directly [V]**
- https://platform.claude.com/docs/en/about-claude/pricing
- https://platform.claude.com/docs/en/about-claude/models/overview
- https://platform.claude.com/docs/en/about-claude/model-deprecations
- https://platform.claude.com/docs/en/models/sonnet-5-5/whats-new-sonnet-5-5
- https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5-5
- https://platform.claude.com/docs/en/build-with-claude/effort
- https://platform.claude.com/docs/en/build-with-claude/prompt-caching
- https://platform.claude.com/docs/en/build-with-claude/structured-outputs
- https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-latency
- https://platform.claude.com/docs/en/manage-claude/api-and-data-retention
- claude-api skill reference (bundled, cached 2026-09-25): models.md, prompt-caching.md, model-migration.md (Opus 5.5 / Sonnet 5.5), cost-optimization.md, evals/build-eval.md

**Anthropic, excerpt only [S]**
- https://privacy.claude.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data
- https://www.anthropic.com/claude-sonnet-5-5

**ElevenLabs, excerpts only [S]; direct fetch was blocked**
- Agents pricing: https://elevenlabs.io/pricing/agents
- API pricing: https://elevenlabs.io/pricing/api
- Price cut and pay-as-you-go: https://elevenlabs.io/blog/weve-lowered-api-agents-pricing-and-introduced-pay-as-you-go
- LLM models: https://elevenlabs.io/docs/eleven-agents/customization/llm
- Optimizing LLM costs: https://elevenlabs.io/docs/eleven-agents/customization/llm/optimizing-costs
- Custom LLM: https://elevenlabs.io/docs/eleven-agents/customization/llm/custom-llm
- LLM cascading: https://elevenlabs.io/docs/agents-platform/customization/llm/llm-cascading
- Changelog 2026-09-28: https://elevenlabs.io/docs/changelog/2026/9/28
- Dynamic variables: https://elevenlabs.io/docs/eleven-agents/customization/personalization/dynamic-variables
- Conversation flow: https://elevenlabs.io/docs/eleven-agents/customization/conversation-flow
- End call tool: https://elevenlabs.io/docs/agents-platform/customization/tools/system-tools/end-call
- Post-call webhooks: https://elevenlabs.io/docs/agents-platform/workflows/post-call-webhooks
- Speech to text: https://elevenlabs.io/docs/overview/capabilities/speech-to-text
- Realtime speech to text: https://elevenlabs.io/realtime-speech-to-text
- Models: https://elevenlabs.io/docs/overview/models
- Expressive mode: https://elevenlabs.io/docs/eleven-agents/customization/voice/expressive-mode
- Zero Retention Mode: https://elevenlabs.io/docs/eleven-agents/customization/privacy/zrm
- Retention: https://elevenlabs.io/docs/eleven-agents/customization/privacy/retention
- Burst pricing: https://elevenlabs.io/docs/agents-platform/guides/burst-pricing
- Latency optimization: https://elevenlabs.io/blog/voice-agent-latency-optimization
- Speech Engine: https://elevenlabs.io/docs/overview/capabilities/speech-engine

**Vercel**
- https://vercel.com/docs/functions/usage-and-pricing [S]
- Vercel docs search via MCP: `experimental_upgradeWebSocket` (functions/websockets) and `checkRateLimit`

**Payments**
- Apple [V]: https://developer.apple.com/app-store/small-business-program/
- Apple [V]: https://developer.apple.com/app-store/subscriptions/
- Stripe [S]: https://stripe.com/pricing
- Stripe [S]: https://stripe.com/billing/pricing
- Google Play [S]: https://support.google.com/googleplay/android-developer/answer/112622
- Google Play [S]: https://android-developers.googleblog.com/2026/06/play-expanded-billing.html
- Apple US link-out [T]: https://www.revenuecat.com/blog/growth/apple-anti-steering-ruling-monetization-strategy
- Apple US link-out [T]: https://www.courthousenews.com/apples-fight-over-commissions-for-linked-out-app-store-purchases-continues-in-federal-court/

**Third-party latency [T]; pages not opened**
- https://artificialanalysis.ai/models/claude-4-5-haiku
- https://artificialanalysis.ai/models/claude-sonnet-5-5-low

**Crisis resource**
- https://988lifeline.org
