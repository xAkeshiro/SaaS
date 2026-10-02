# ElevenLabs as Unmute's voice layer: research report

Research date: 2026-10-02. Read-only: nothing was created, changed, generated or spent on any account.

## 0. How this was researched (read first)

- **Owner's account:** read through the ElevenLabs MCP using list and get tools only.
- **Vendor docs:** this sandbox's egress proxy blocks `elevenlabs.io`, `help.elevenlabs.io` and `api.elevenlabs.io`, so I could not open those pages directly. Vendor facts come from two places:
  1. ElevenLabs' own GitHub repos, downloaded raw on 2026-10-02:
     - [elevenlabs/skills](https://github.com/elevenlabs/skills), the official agent-skill docs, which are kept in sync with the changelog
     - [elevenlabs/packages](https://github.com/elevenlabs/packages), the SDKs
     - [elevenlabs-swift-sdk](https://github.com/elevenlabs/elevenlabs-swift-sdk)
     - [elevenlabs-android](https://github.com/elevenlabs/elevenlabs-android)
  2. Search-engine extracts of official elevenlabs.io pages. The URLs are cited, but I read the extract, not the live page.
- **Reliability:** extracts can be stale or garbled. Where two extracts disagree, I say so. **Re-check every price on the live [Agents pricing](https://elevenlabs.io/pricing/agents) and [API pricing](https://elevenlabs.io/pricing/api) pages before committing to a plan.**
- **Claude prices** come from the claude-api skill's model table, cached 2026-09-25; the source is [platform.claude.com pricing](https://platform.claude.com/docs/en/about-claude/pricing).

---

## 1. The owner's ElevenLabs account (read-only inventory)

| Item | Finding | How |
|---|---|---|
| Plan tier, credit balance, reset date | **Not visible.** The MCP has no subscription or usage read tool. `get_more_tools` replied "No additional tool exists for this yet." | `mcp__ElevenLabs__get_more_tools` |
| Agents | **0** (none, including archived=false) | `agents_list` |
| Conversations | **0** | `agents_list_conversations` |
| Phone numbers | **0** | `agents_list_phone_numbers` |
| Knowledge base docs | **0** | `agents_list_knowledge_base` |
| Agent tools (webhook/client) | **0** | `agents_list_tools` |
| Workspace secrets | **0** | `agents_list_secrets` |
| Voices | At least **22 workspace voices** (details below). The MCP voice search mixes workspace voices with Voice Library results and caps at 25 per call, so the exact count is not available. | `creative_list_voices` (3 filtered calls) |

**Workspace voices seen:**
- **Premade (14):** Bella, Roger, Sarah, Laura, Charlie, George, Callum, River, Harry, Will, Jessica, Alice, Matilda, Lily.
- **Saved "professional" voices (7):**
  - Adam: deep US radio
  - Alex: Australian, relaxed
  - Alex – Warm Storyteller: Polish narration
  - David – Texan: gruff, deep
  - Hale: confident US commercial
  - **Juniper:** "grounded female professional, great for podcasts or ConvoAI"
  - Lauren: calm British, young
- **Voice Design (1):** "Mall Tycoon Dad", a warm, gravelly, playful middle-aged US dad. This shows Voice Design has been used on this account before.

**What this means:** the account is a clean slate for agents. Nothing will collide, and there are no prior conversations or retention settings to clean up.

**The owner needs to tell us the plan tier.** The tier sets:
- included agent minutes and concurrency
- whether output formats like `pcm_44100` are allowed (Pro+)
- the commercial-use licence on generated content (paid plans)

They can check it under Settings → Subscription. Alternatively, a read-only `GET /v1/user/subscription` with their key would show it; I did not do that.

**Casting from voices already in the workspace** (a starting shortlist; test each one with the model you pick, because audio tags behave differently per voice):

| Scenario persona | Candidates already in workspace |
|---|---|
| Bank rep ($35 overdraft) | Juniper, Sarah, Matilda |
| Doctor's office receptionist | Jessica, Matilda, Bella |
| Manager ($18/hr), kind→hostile | Roger (kind), Hale (neutral), David – Texan or Callum (hostile) |
| Professor (extension) | George, Alice, Lily |
| Group-project ghost / friend owing $72 / $140 trip | Will, Charlie, Laura, Jessica |
| Mom (Thanksgiving) | Bella, Matilda, or a new Voice Design voice |

---

## 2. ElevenAgents (formerly Conversational AI / "Agents Platform")

**Naming changed recently.**
- Docs now live under `/docs/eleven-agents/`, with older pages still at `/docs/agents-platform/` and `/docs/conversational-ai/` ([overview](https://elevenlabs.io/docs/eleven-agents/overview)).
- Server SDK namespaces still say `conversational_ai` / `conversationalAi` ([skills/agents](https://github.com/elevenlabs/skills/blob/main/agents/SKILL.md)).

### 2.1 How a realtime conversation works
- **Orchestration:** ElevenLabs coordinates four parts: a fine-tuned STT model, the LLM, a low-latency TTS model and a proprietary turn-taking model ([overview](https://elevenlabs.io/docs/eleven-agents/overview); search extract).
- **Transport:** voice sessions use **WebRTC** (LiveKit under the hood in the SDKs). Text-only sessions use **WebSocket** ([authentication](https://elevenlabs.io/docs/eleven-agents/customization/authentication)).
  - `@elevenlabs/client` depends on `livekit-client` ([client package.json](https://github.com/elevenlabs/packages/blob/main/packages/client/package.json)).
- **Default STT:** `asr.provider: "scribe_realtime"`. It takes `keywords` for recognition boosting ([agent-configuration](https://github.com/elevenlabs/skills/blob/main/agents/references/agent-configuration.md)).

### 2.2 Turn-taking and barge-in
- **User interruptions** can be switched on or off ([conversation flow](https://elevenlabs.io/docs/eleven-agents/customization/conversation-flow)).
- **Turn eagerness:**
  - `patient`: waits longer before taking its turn
  - `normal`: waits for natural conversation breaks
  - `eager`: jumps in at the earliest opportunity
- **"Take turn after silence"** is 1–30 s (same page).
- **Config fields** (from [agent-configuration](https://github.com/elevenlabs/skills/blob/main/agents/references/agent-configuration.md)):
  - `turn_model`: `turn_v2` or `turn_v3`; default `turn_v3`
  - `speculative_turn`
  - `turn_timeout`: default 7 s
  - `silence_end_call_timeout`
  - `initial_wait_time`
  - `interruption_ignore_terms` plus curated per-language lists. Use these so backchannels like "mm-hmm" don't cut the persona off.
  - `transcribe_on_disabled_interruptions`
  - `soft_timeout_config`: plays a filler such as "Hhmmmm...yeah." while the LLM is slow. Up to 8 fillers per generation; can be generated by the LLM.
  - `disable_first_message_interruptions`
- **System tools:**
  - `end_call`
  - `skip_turn` ("silent listening")
  - `transfer_to_agent`
  - `language_detection`
  - and others ([skills/agents](https://github.com/elevenlabs/skills/blob/main/agents/SKILL.md))
- **Not verified:** whether the *agent* can talk over the *user* (agent-initiated barge-in). The docs only describe users interrupting the agent. "The persona interrupts you" will have to be approximated:
  - `turn_eagerness: "eager"`
  - `speculative_turn`
  - a short silence timeout
  - persona lines written as cut-ins with `[interrupting]` / `[cuts in]` tags

  True overlapping speech should be treated as unsupported until tested.

### 2.3 Latency
- Marketing claims "sub-500 ms end-to-end" ([agents product page](https://elevenlabs.io/agents); search extract).
- An ElevenLabs latency post gives a **~680 ms median time-to-first-audio** budget ([voice-agent latency optimization](https://elevenlabs.io/blog/voice-agent-latency-optimization); search extract, so attribution to this exact post is uncertain):

  | Step | Time |
  |---|---|
  | Capture + endpointing | 120 ms |
  | STT finalize | 60 ms |
  | Network | 60 ms |
  | LLM time to first token | 250 ms |
  | TTS first audio | 110 ms |
  | Player buffer | 80 ms |

- **The LLM is the largest controllable slice.** That drives the Claude model choice in §6.
- **Live latency readout:** the SDK exposes `onPing` with `ping_ms` for live latency display ([skills/agents](https://github.com/elevenlabs/skills/blob/main/agents/SKILL.md)).

### 2.4 TTS models usable inside agents

| Model ID | Languages | Latency | Notes |
|---|---|---|---|
| `eleven_v4_turbo` | 90+ | ~100 ms median; ~150 ms to first speech | **New 2026-09-28.** Supports audio tags. `style` and `speed` settings are not available on v4. |
| `eleven_v3_conversational` | 70+ | "ultra-low-latency v3" | Powers **Expressive mode**, which is on by default when this model is selected. Tags like `[laughs]`, `[whispers]`, `[sighs]`, `[slow]`, `[excited]` each affect roughly the next 4–5 words. |
| `eleven_flash_v2_5` / `eleven_flash_v2` | 32 / EN | ~75 ms | Cheapest and fastest; not expressive. |
| `eleven_turbo_v2_5` / `_v2` | 32 / EN | ~250–300 ms | |
| `eleven_multilingual_v2` | 29 | standard | |

Sources for the table:
- Model list and latencies: [agent-configuration](https://github.com/elevenlabs/skills/blob/main/agents/references/agent-configuration.md)
- `eleven_v4_turbo` row: [changelog 2026-09-28](https://elevenlabs.io/docs/changelog/2026/9/28), [Eleven v4 Turbo in ElevenAgents](https://elevenlabs.io/blog/eleven-v4-turbo-in-elevenagents), [v4 page](https://elevenlabs.io/v4), [voice-settings](https://github.com/elevenlabs/skills/blob/main/text-to-speech/references/voice-settings.md)
- `eleven_v3_conversational` row: [Expressive mode](https://elevenlabs.io/docs/eleven-agents/customization/voice/expressive-mode), [blog](https://elevenlabs.io/blog/introducing-expressive-mode)

**For Unmute:** test `eleven_v3_conversational` (expressive mode) against `eleven_v4_turbo`. v4 Turbo shipped 4 days ago, so expect rough edges.

**Agent TTS settings:**
- `stability` (lower is more expressive)
- `similarity_boost`
- `speed` (0.7–1.2 in agents)
- `expressive_mode`
- pronunciation dictionaries

([agent-configuration](https://github.com/elevenlabs/skills/blob/main/agents/references/agent-configuration.md))

### 2.5 LLM options
- **Hosted Anthropic models in agents:**
  - `claude-opus-5-5`, `claude-opus-5`, `claude-opus-4-7`
  - `claude-sonnet-4-6`, `claude-sonnet-4-5`, `claude-sonnet-4`
  - `claude-haiku-4-5`
  - `claude-3-7-sonnet`, `claude-3-5-sonnet`, `claude-3-haiku`

  **Claude Sonnet 5 / 5.5 are not in the hosted list** ([agent-configuration](https://github.com/elevenlabs/skills/blob/main/agents/references/agent-configuration.md)).
  - `claude-opus-5` and `claude-opus-5-5` were **added 2026-09-28** ([changelog](https://elevenlabs.io/docs/changelog/2026/9/28)).
- **Other hosted models:** OpenAI GPT-6/5.x/4.x, Google Gemini 2.0–3.8 Flash and Pro, and ElevenLabs-hosted open models (GLM-52, Qwen, gpt-oss-120b).
- **Live catalogue:** `GET /v1/convai/llm/list` returns it, with deprecation state and limits.
- **Hosted LLM billing:** passed through, "billed separately on top, based on the model you choose" ([pricing/agents](https://elevenlabs.io/pricing/agents), [help](https://help.elevenlabs.io/hc/en-us/articles/29298065878929-How-much-does-ElevenAgents-cost)).
  - **I could not verify ElevenLabs' per-token rates for Claude.** The dashboard's "Detailed costs" button in the LLM selector shows per-agent estimates.
- **Reliability options:**
  - `backup_llm_config` plus `cascade_timeout_seconds` (2–15, default 4) fall back to a second LLM when the first is slow.
  - `reasoning_effort` and `max_tokens` are also settable.
- **Custom LLM** ([custom LLM docs](https://elevenlabs.io/docs/eleven-agents/customization/llm/custom-llm); [agent-configuration](https://github.com/elevenlabs/skills/blob/main/agents/references/agent-configuration.md)):
  - Set `llm: "custom-llm"` and `custom_llm: {url, model_id, api_key: {secret_id}, api_type}`.
  - `api_type` is `chat_completions`, `responses` or `websocket`.
  - The endpoint must be **OpenAI-compatible** (`/v1/chat/completions` or `/v1/responses`).
  - It must stream **SSE** (`Content-Type: text/event-stream`, `data: {json}\n\n`, ending `data: [DONE]\n\n`).
  - It must emit OpenAI-format function calls if system tools such as `end_call` are used.
  - **What this means for us:** a small Next.js route handler that translates OpenAI chat requests into Anthropic SDK streaming calls and back.
  - **Not verified:** a dedicated mechanism for passing per-session metadata to the custom LLM. A dynamic variable such as `{{session_id}}` in the system prompt works by construction.

### 2.6 Per-conversation customisation
- **Dynamic variables:** `{{var}}` in the system prompt, first message and tool params. ElevenLabs recommends these as the preferred way to personalise ([dynamic variables](https://elevenlabs.io/docs/eleven-agents/customization/personalization/dynamic-variables)).
- **Overrides** are **off by default** and enabled field by field in the agent's Security tab ([overrides](https://elevenlabs.io/docs/eleven-agents/customization/personalization/overrides)). Overridable fields:
  - system prompt, first message, language
  - **voice_id**, LLM, tools, knowledge base, text-only mode
  - **stability, speed, similarity boost**
  - ASR keywords
- **What this means for us:** one agent per persona *archetype*, with scenario facts ("$35", "$18/hr", "Thanksgiving") as dynamic variables. Mood (kind / neutral / hostile) maps to:
  - a `{{mood}}` variable
  - voice_id, stability and speed overrides

### 2.7 Tools
- **Client tools** run in the browser or app. "Wait for response" or `expects_response` returns data to the agent ([client tools](https://elevenlabs.io/docs/eleven-agents/customization/tools/client-tools)).
  - Use them for "put you on hold" (play hold audio locally, then resume) and for showing a crisis-resources sheet.
- **Server (webhook) tools** call our APIs. `response_timeout_secs` is 5–120 s, default 20 ([client-tools reference](https://github.com/elevenlabs/skills/blob/main/agents/references/client-tools.md)).
- **MCP servers** can also be attached.
- **Background sound presets** exist, including `office1/2`, `elevator1-4`, `typing` and `city` ([agent-configuration](https://github.com/elevenlabs/skills/blob/main/agents/references/agent-configuration.md)). Good for "on hold" and office ambience.

### 2.8 Auth for private agents
- **Signed URL** (WebSocket): valid **15 min** to *start*; the session can run longer.
- **Conversation token** (WebRTC): valid **10 min**.
- Both must be minted server-side with the API key ([authentication](https://elevenlabs.io/docs/eleven-agents/customization/authentication)).
- **Hardening:** set `platform_settings.auth.enable_auth` and a hostname `allowlist` ([agent-configuration](https://github.com/elevenlabs/skills/blob/main/agents/references/agent-configuration.md)).
- **Mobile:** the Kotlin SDK takes `conversationToken` for private voice and `signedUrl` for private text-only ([android README](https://github.com/elevenlabs/elevenlabs-android)).

### 2.9 After the call: transcripts, audio, webhooks, analysis
- **`GET /v1/convai/conversations/{id}`** returns:
  - the transcript, with **`time_in_call_secs` on each message**
  - metadata
  - `has_audio`, `has_user_audio`, `has_response_audio` flags

  A separate endpoint returns the conversation audio ([get conversation](https://elevenlabs.io/docs/api-reference/conversations/get)).
- **`DELETE /v1/convai/conversations/{id}`** exists ([delete](https://elevenlabs.io/docs/eleven-agents/api-reference/conversations/delete)).
- **Post-call webhooks** ([post-call webhooks](https://elevenlabs.io/docs/eleven-agents/workflows/post-call-webhooks)):
  - `post_call_transcription`: transcript, analysis, metadata
  - `post_call_audio`: base64 full audio
  - Both are **HMAC-signed** via the `ElevenLabs-Signature` header, with SDK helpers to verify.
- **Built-in analysis** ([analysis](https://elevenlabs.io/docs/agents-platform/customization/agent-analysis); [data collection](https://elevenlabs.io/docs/eleven-agents/customization/agent-analysis/data-collection)):
  - Evaluation criteria return success / failure / unknown plus a rationale. Numeric scoring is supported ([skills/agents](https://github.com/elevenlabs/skills/blob/main/agents/SKILL.md)).
  - Data collection extracts typed fields: string / boolean / integer / number.
  - Both run an LLM over the finished transcript. `analysis_llm` defaults to `gemini-2.5-flash`, with per-item override.
- **Can the built-in analysis produce our debrief?** Partly. Good fits:
  - "did they state the number" (boolean)
  - "did they fold" (boolean)
  - "ask turn index" (integer)

  It is **not precise enough** for:
  - **counts** (fillers, apologies), because an LLM counting over a possibly cleaned-up transcript is unreliable
  - **time-to-ask to the second**, because per-message times are turn-level, not word-level

  It is also **not verified whether the agent's realtime ASR keeps "um/uh" verbatim**. The recommended pipeline in §6.1 measures these ourselves.

### 2.10 Limits
- **Max conversation duration:** 60–7,200 s, default 600 s, with an optional closing message ([conversation flow](https://elevenlabs.io/docs/eleven-agents/customization/conversation-flow)). For us that means a hard rehearsal end, which matches "a rehearsal has an end".
- **Concurrency by plan:**

  | Plan | Concurrent calls |
  |---|---|
  | Free | 4 |
  | Starter | 6 |
  | Creator | 10 |
  | Pro | 20 |
  | Scale | 30 |
  | Business | 40 |

  Source: [pricing/agents](https://elevenlabs.io/pricing/agents).
  - **Burst** lets you exceed this up to **3× your limit or 300, whichever is lower**, billed at **2×** ([burst pricing](https://elevenlabs.io/docs/eleven-agents/guides/burst-pricing)).
  - **Call queueing** for agents at their limit was added 2026-09-14 ([changelog](https://elevenlabs.io/docs/changelog/2026/9/14)).
- **Per-agent caps:** `agent_concurrency_limit` and `daily_limit` can be set on each agent.

### 2.11 Pricing (agents)

| Plan | $/month | Included agent minutes | Concurrency |
|---|---|---|---|
| Free | 0 | 15 | 4 |
| Starter | 6 | 75 | 6 |
| Creator | 22 ($11 first month) | 275 | 10 |
| Pro | 99 | 1,238 | 20 |
| Scale | 299 | 3,738 | 30 |
| Business | 990 | 12,375 | 40 |

Source: [pricing/agents](https://elevenlabs.io/pricing/agents); search extracts.

- **Overage:** $0.08/min on every self-serve tier; burst minutes $0.16/min; text messages $0.003 each.
  - Included minutes equal plan price ÷ $0.08 on every tier, so the unit price is effectively **flat at $0.08/min**.
- **Silence:** periods longer than 10 s are billed at a 95% discount ([help](https://help.elevenlabs.io/hc/en-us/articles/29298065878929-How-much-does-ElevenAgents-cost)).
- **LLM:** extra (pass-through).
- **Recent change:** a price cut and pay-as-you-go took Starter agents from $0.10 to $0.08/min ([blog](https://elevenlabs.io/blog/weve-lowered-api-agents-pricing-and-introduced-pay-as-you-go)).
- **Conflicting extract:** one extract of the API pricing page lists **Scale $330 and Business $1,320** (and Starter $5). These look like the pre-cut 2025 prices. **Confirm on the live page.**
- **Not verified:** how agent minutes relate to the shared monthly **credit** pool. Credits per plan, which one extract gives as Free 10k, Starter 30k, Creator 121k, Pro 600k and Scale 1.8M ([pricing](https://elevenlabs.io/pricing)), may be a separate allowance.
- **Startup grants:** ElevenLabs runs a programme ("12 months and over 680 hours of conversational AI audio") ([blog](https://elevenlabs.io/blog/elevenlabs-startup-grants-just-got-bigger-now-12-months-and-over-680-hours-of-conversational-ai-audio)). Current eligibility is not verified. **Worth applying.**

### 2.12 Privacy and retention (affects Unmute's promises)
- **Retention:** conversation data is kept **2 years by default**. You can set any number of days, `-1` for unlimited, or `0` for deletion ([retention](https://elevenlabs.io/docs/eleven-agents/customization/privacy/retention)).
- **Audio saving:** can be turned off per agent ([audio saving](https://elevenlabs.io/docs/agents-platform/customization/privacy/audio-saving)).
- **Redaction:** entity redaction exists for transcripts, audio and analysis ([redaction](https://elevenlabs.io/docs/eleven-agents/customization/privacy/conversation-history-redaction)).
- **Zero Retention Mode** is **enterprise-only** ("select enterprise customers"). It can be enabled per agent and applies to API traffic ([ZRM](https://elevenlabs.io/docs/eleven-api/resources/zero-retention-mode), [per-agent ZRM](https://elevenlabs.io/docs/eleven-agents/customization/privacy/zrm)).
- **⚠ Model training — conflicts with "never used to train models":**
  - On **Free through Business** accounts, ElevenLabs **uses submitted data to improve its models by default**.
  - Opt out at profile → Terms and privacy → Data use → disable "Improve the models for everyone". This applies to *new* data.
  - Enterprise accounts are not trained on by default.

  Source: [help: Is my data used…](https://help.elevenlabs.io/hc/en-us/articles/29952728805393-Is-my-data-used-to-improve-ElevenLabs-AI-models), [privacy policy](https://elevenlabs.io/privacy-policy).

  **The owner must flip this toggle before the first real user rehearses.** For Teams (career centres), negotiate Enterprise and ZRM.

### 2.13 SDKs (versions on GitHub `main`, 2026-10-02)

**Web — `@elevenlabs/react` 1.16.0 / `@elevenlabs/client` 1.26.0** ([react README](https://github.com/elevenlabs/packages/tree/main/packages/react), [React SDK docs](https://elevenlabs.io/docs/eleven-agents/libraries/react))
- **API:**
  - `ConversationProvider`, `useConversationControls` (`startSession` / `endSession`), `useConversationStatus`
  - the all-in-one `useConversation` (`isMuted`, `setMuted`, `isListening`, `mode`, `message`)
  - `useScribe` for realtime STT
- **Session options:** `startSession` takes `agentId`, `signedUrl` or `conversationToken`, `overrides`, `dynamicVariables`, `clientTools`, and callbacks:
  - `onMessage`
  - `onUserTranscript`
  - `onPing`
  - `onContextUsage`
  - `onAgentResponseCorrection`
- **Breaking change in 1.0:** `useConversation` now needs a `ConversationProvider` ancestor ([CHANGELOG](https://github.com/elevenlabs/packages/blob/main/packages/react/CHANGELOG.md)).
- **Strict CSP:** self-host the AudioWorklets from `@elevenlabs/client/worklets/*` ([client README](https://github.com/elevenlabs/packages/tree/main/packages/client)).

**React Native — `@elevenlabs/react-native` 1.2.28** ([RN README](https://github.com/elevenlabs/packages/tree/main/packages/react-native), [RN docs](https://elevenlabs.io/docs/eleven-agents/libraries/react-native))
- **Requires Expo development builds; Expo Go is not supported.**
- **Install:** `npm install @elevenlabs/react-native @livekit/react-native @livekit/react-native-webrtc`.
  - Peer deps: `@livekit/react-native ^2.12.0`, `@livekit/react-native-webrtc ^144.1.2`, `react-native >=0.70`.
  - On RN < 0.79, enable Metro package exports.
- **Shared API with web:** the package was **rewritten to re-export `@elevenlabs/react`**, adding WebRTC polyfills and native AudioSession setup. The web hooks and components therefore carry over to the app almost unchanged. Older tutorials using `ElevenLabsProvider` are stale ([RN CHANGELOG](https://github.com/elevenlabs/packages/blob/main/packages/react-native/CHANGELOG.md)).

**Swift** ([README](https://github.com/elevenlabs/elevenlabs-swift-sdk))
- SPM `from: "3.4.0"`.
- iOS 13+ / macOS 10.15+, Xcode 15+, Swift 5.9.
- Built on LiveKit WebRTC; supports client tools and MCP.
- Needs `NSMicrophoneUsageDescription`.

**Kotlin / Android** ([README](https://github.com/elevenlabs/elevenlabs-android), [docs](https://elevenlabs.io/docs/eleven-agents/libraries/kotlin))
- Package `io.elevenlabs:elevenlabs-android`, on LiveKit.
- Request `RECORD_AUDIO` yourself.

**Other SDKs:** Flutter and Unity SDKs also exist ([elevenlabs GitHub org](https://github.com/elevenlabs)).

---

## 3. Speech Engine: the middle option (new 2026-05-25)

- **What it is:** "Add real-time voice to your own chat agent." ElevenLabs handles mic audio, STT, **turn-taking, interruption detection**, TTS and browser playback. **Our server owns the LLM logic**: ElevenLabs connects to our `wss://…/ws` endpoint, sends transcripts, and we stream text back with `sendResponse()`, which accepts a string or an async iterable ([skills/speech-engine](https://github.com/elevenlabs/skills/blob/main/speech-engine/SKILL.md), [Speech Engine docs](https://elevenlabs.io/docs/overview/capabilities/speech-engine), [changelog 2026-05-25](https://elevenlabs.io/docs/changelog/2026/5/25)).
- **Claude support:** the SDK auto-extracts text from **Anthropic**, OpenAI and Gemini stream formats.
- **Interruptions:** when the user interrupts, it cancels our in-flight LLM request (`AbortSignal` in TypeScript) ([Speech Engine docs](https://elevenlabs.io/docs/overview/capabilities/speech-engine)).
- **Resource config:** `tts` (voice, model), `asr` (keywords), `turn` (eagerness, `speculativeTurn`), `privacy.recordVoice: false`, `overrides.firstMessage` ([JS SDK reference](https://github.com/elevenlabs/skills/blob/main/speech-engine/references/javascript-sdk-reference.md)).
  - `cascade_timeout_seconds` was added 2026-09-21 ([changelog](https://elevenlabs.io/docs/changelog/2026/9/21)).
- **Client side:** the same `@elevenlabs/react` client with a server-minted `conversationToken`.
- **Server auth:** the server verifies an ElevenLabs JWT by default; do not disable it.
- **Conversation history:** conversations appear with `conversation_product_type: "speech_engine"` (seen in the MCP's list-conversations schema).
- **Price:** **$0.08/min**, LLM not included, so we pay Anthropic directly ([speech-engine page](https://elevenlabs.io/speech-engine); search extract).
- **Not verified:**
  - whether Speech Engine accepts `eleven_v3_conversational` or `eleven_v4_turbo` with audio tags
  - whether it offers post-call webhooks or analysis
  - whether it works from the React Native and Swift SDKs. Likely, since it uses the same token flow.
- **Hosting catch:** it needs a **persistent WebSocket server** that ElevenLabs dials in to. That is a separate service next to the Vercel app (for example Fly.io, Railway or Render), unless the Vercel research confirms inbound WebSocket support.

---

## 4. Build-it-yourself pipeline (Scribe + streaming TTS)

### 4.1 Speech-to-text: Scribe v2
- **Models:**
  - `scribe_v2`: batch, 90+ languages
  - `scribe_v2_realtime`: about 150 ms latency over WebSocket
  - `_realtime_turbo` / `_realtime_lite` variants
  - `scribe_v2_medical`

  Source: [skills/speech-to-text](https://github.com/elevenlabs/skills/blob/main/speech-to-text/SKILL.md), [realtime page](https://elevenlabs.io/realtime-speech-to-text).
- **Disfluencies:** `no_verbatim` **defaults to false**, so by default fillers, false starts and disfluencies are *kept*. Setting it to true removes "um/uh", repeats and stutters. It works on Scribe v2, v2 Medical and **v2 Realtime** ([transcription capability](https://elevenlabs.io/docs/overview/capabilities/speech-to-text), [transcription-options](https://github.com/elevenlabs/skills/blob/main/speech-to-text/references/transcription-options.md)). **This makes filler counts reliable if we transcribe ourselves.**
- **Timestamps:** word-level (`timestamps_granularity: word`, or `character`). Each word carries `type`: `word`, `spacing` or `audio_event`. Realtime has `committed_transcript_with_timestamps` ([realtime-events](https://github.com/elevenlabs/skills/blob/main/speech-to-text/references/realtime-events.md)).
- **Audio events:** `tag_audio_events` defaults to true (laughter and similar) in batch.
- **Diarization:** up to 32 speakers; optional `detect_speaker_roles` (agent/customer).
- **Multichannel:** up to 5 channels, `combined` output style ([multichannel](https://elevenlabs.io/docs/eleven-api/guides/how-to/speech-to-text/batch/multichannel-transcription)).
- **Keyterms:** up to 100 in batch, 50 in realtime.
- **Transcript editing** (new 2026-09-28) carries a 30% surcharge. Not needed here.
- **Realtime commits:** manual or **VAD** auto-commit (`vadSilenceThresholdSecs`, `vadThreshold`). Auto-commit fires at 90 s ([commit strategies](https://github.com/elevenlabs/skills/blob/main/speech-to-text/references/realtime-commit-strategies.md)).
- **Browser:** `useScribe` with a single-use token from our backend.
- **Price:**
  - batch: **$0.22/hour**
  - realtime: **$0.39/hour**
  - keyterms: +$0.05/hour
  - entity detection: +$0.07/hour

  Source: [pricing/api](https://elevenlabs.io/pricing/api); search extract, plan tier unstated.

### 4.2 Streaming TTS
- **WebSocket input streaming:** `wss://api.elevenlabs.io/v1/text-to-speech/{voice}/stream-input` ([streaming reference](https://github.com/elevenlabs/skills/blob/main/text-to-speech/references/streaming.md)).
  - `chunk_length_schedule` and `flush` tune when audio starts.
  - Optional alignment timestamps.
  - Closes after 20 s of inactivity.
- **⚠ WebSockets are unavailable for `eleven_v3`.**
- **Expressive realtime path:** `eleven_v4_turbo` through the **Text to Dialogue WebSocket** (`/v1/text-to-dialogue/stream-input`), with one voice per connection ([realtime TTD guide](https://elevenlabs.io/docs/eleven-api/guides/how-to/websockets/realtime-tdd), [changelog 2026-09-28](https://elevenlabs.io/docs/changelog/2026/9/28)).
- **Latency:** Flash v2.5 about 75 ms; Turbo v2.5 250–300 ms; v4 Turbo about 100 ms ([skills/text-to-speech](https://github.com/elevenlabs/skills/blob/main/text-to-speech/SKILL.md)).
- **Price per 1,000 characters:**
  - **Flash/Turbo $0.05, Multilingual v2/v3 $0.10** in one extract.
  - $0.04 and $0.08 in another; probably different plan tiers ([pricing/api](https://elevenlabs.io/pricing/api)).
  - In credits: Flash = 0.5 credit/char; Multilingual v2 / v3 = 1 credit/char ([help: models](https://help.elevenlabs.io/hc/en-us/articles/17883183930129-What-models-do-you-offer-and-what-is-the-difference-between-them)).
  - **v4 / v4 Turbo pricing: not verified** (the extract was garbled).
- **API concurrency:**

  | Plan | Flash/Turbo | Other models |
  |---|---|---|
  | Free | 4 | 2 |
  | Starter | 6 | 3 |
  | Creator | 10 | 5 |
  | Pro | 20 | 10 |
  | Scale | 30 | 15 |
  | Business | 30 | 15 |

  Source: [help: TTS limits](https://help.elevenlabs.io/hc/en-us/articles/14312733311761-How-many-Text-to-Speech-requests-can-I-make-and-can-I-increase-it).

### 4.3 What DIY would make us build
1. **Mic capture:** echo cancellation, noise suppression, and the mobile audio session (iOS AVAudioSession categories, Android focus).
2. **VAD:** Scribe realtime VAD only commits transcripts. It does not decide turns.
3. **Endpointing / turn detection:** semantic end-of-turn, not just silence, to avoid cutting off a nervous user mid-thought.
4. **Barge-in:**
   - detect user speech during playback
   - stop the audio player instantly
   - cancel the LLM stream and the TTS socket
   - truncate the persona's "heard" transcript to what was actually played
5. **Playback:** jitter buffer, sentence chunking into TTS, and reconnection handling.
6. **Mobile:** WebRTC or WebSocket on mobile networks, background interruptions (phone calls, AirPods).
7. **Per-session tokens and abuse limits.**

ElevenAgents and Speech Engine ship all of this, plus web, RN, Swift and Kotlin SDKs.

---

## 5. Voices: casting, mood, clips

- **Voice Library:**
  - Voices carry a **free commercial-use licence**.
  - Paid plans include a commercial licence for generated content.
  - Content from **Beta Services** may not be used commercially.

  Source: [help: publishing](https://help.elevenlabs.io/hc/en-us/articles/13313564601361-Can-I-publish-the-content-I-generate-on-the-platform), [Voice Library Addendum](https://elevenlabs.io/vla).
  - **Check whether `eleven_v4*` or `eleven_v3_conversational` are labelled beta before launch** (not verified).
  - **Risk:** a library voice can be removed by its owner. Prefer designed voices we own for core personas (not verified how removal affects existing users of a voice).
- **Voice Design:** `POST /v1/text-to-voice/design` takes a 20–1,000 character description and returns previews ([design a voice](https://elevenlabs.io/docs/api-reference/text-to-voice/design), [Voice Design guide](https://elevenlabs.io/docs/eleven-creative/voices/voice-design)).
  - `eleven_ttv_v3` adds reference audio and `prompt_strength`.
  - Save a preview to get a permanent voice_id.
  - **Recommendation:** design one owned voice per core persona, for example "tired bank call-centre rep, late 30s, flat Midwestern" or "busy professor, 60s, dry".
- **Mood delivery:**
  - **Audio tags** (v3 / v4 / v4 Turbo):
    - reactions: `[sighs]`, `[laughs]`, `[gasps]`
    - emotions: `[frustrated]`, `[nervous]`, `[calm]`
    - timing: `[pauses]`, `[hesitates]`
    - turn-taking: `[interrupting]`, `[cuts in]`, `[overlapping]`
    - tone: `[flatly]`, `[deadpan]`

    Tags depend on the voice and context ([Audio Tags 101](https://elevenlabs.io/blog/v3-audiotags), [expressive mode](https://elevenlabs.io/docs/eleven-agents/customization/voice/expressive-mode)).
  - **Settings by mood:**

    | Mood | Stability | Speed | Tags |
    |---|---|---|---|
    | Kind | about 0.5 | about 1.0 | few |
    | Neutral | about 0.65 | — | — |
    | Hostile | about 0.3–0.4 | about 1.1 | `[sighs]`, `[frustrated]`, `[cuts in]`; patient → eager turn eagerness |

    Speed is ignored on v4 ([voice-settings](https://github.com/elevenlabs/skills/blob/main/text-to-speech/references/voice-settings.md)).
  - The prompt must tell Claude which tags are allowed. Strip tags from on-screen transcripts (the widget's `strip_audio_tags` defaults to true).
- **"Shareable clips, voice-changed if you want":** Voice Changer (the speech-to-speech endpoint).
  - Keeps emotion and timing.
  - Max 5 minutes and 50 MB per request.
  - Use `eleven_multilingual_sts_v2`.
  - **No low-latency tier:** run it as an async post-process.
  - **Price:** 1,000 credits per minute, or **$0.12/min** via API.

  Source: [skills/voice-changer](https://github.com/elevenlabs/skills/blob/main/voice-changer/SKILL.md), [help: Voice Changer cost](https://help.elevenlabs.io/hc/en-us/articles/24938328105873-How-much-does-Voice-Changer-cost).
  - **For privacy:** record the user's own side locally (MediaRecorder or the app) and upload only when they tap "make a clip", rather than pulling audio from ElevenLabs' stored conversation.

---

## 6. Recommendation

### 6.1 Agents vs Speech Engine vs DIY

| Need | ElevenAgents + custom LLM (recommended) | Speech Engine | DIY |
|---|---|---|---|
| Persona pushes back, sighs, puts you on hold | Expressive v3 / v4 Turbo tags; client tool for hold; elevator background presets | Expressive TTS not verified; hold must be built | v3 has no WebSocket; v4 Turbo dialogue WS needs integration work |
| Persona "interrupts" | Approximate (eager + speculative turn + cut-in lines) | Same | Full control, but we build it |
| Barge-in, turn-taking, AEC, mobile audio | Built in (web, RN, Swift, Kotlin) | Built in | We build all of it |
| Claude in the loop | Hosted Claude (Haiku 4.5 … Opus 5.5) or **custom-LLM SSE route on Vercel** | Our WS server streams Claude directly | Ours |
| Precise debrief | Post-call webhook + audio → our metrics | We hold the transcript stream | Ours |
| Infra fit with Next.js on Vercel | Custom-LLM endpoint is a normal streaming route handler | Needs a persistent inbound-WebSocket host | Needs WS/TURN infra |
| Voice cost per minute | $0.08 | $0.08 | about $0.02–0.04 (Scribe RT $0.0065/min + about 330 TTS chars/min at $0.05–0.10 per 1k) |

**Build on ElevenAgents with a custom-LLM endpoint in the existing Next.js app.**
- **Step 1, a no-code first prototype:**
  - Create the agent with hosted `claude-haiku-4-5` or `claude-sonnet-4-6`.
  - Use dynamic variables for scenario facts and overrides for voice and stability by mood.
  - Set `max_duration_seconds` of about 420.
  - Turn on `enable_auth` with an allowlist.
  - This proves feel and latency in days.
- **Step 2, a custom LLM** (`/api/voice/llm/v1/chat/completions`):
  - Translate OpenAI chat requests into Anthropic SDK streaming calls.
  - Use **`claude-sonnet-5-5`** with thinking turned off via `thinking: {type: "between_tools"}`, effort `low`. Alternative: `claude-haiku-4-5` for the lowest latency.
  - Run the deterministic **crisis-language check before Claude** and route to a client tool that shows real resources, then `end_call`.
  - Add a mood director and hold logic.
  - Set `backup_llm_config` to hosted `claude-haiku-4-5`, with `cascade_timeout_seconds` about 3.
  - Do **not** use Opus 5.5 for live turns: its thinking cannot be disabled (claude-api skill), which adds time-to-first-token.
- **Step 3, the debrief pipeline** (our code, not the built-in analysis):
  1. Receive the `post_call_transcription` and `post_call_audio` webhooks and verify the HMAC.
  2. Run **Scribe v2 batch with `no_verbatim: false`, word timestamps and `tag_audio_events`** on the audio. Use diarization or roles to isolate the user. Alternatively, upload the user track recorded on the client.
  3. Compute metrics in code:
     - **time-to-ask:** the timestamp of the first word of the ask span, which Claude identifies
     - **filler counts:** a lexicon over `type: word` tokens ("um", "uh", "like", "you know", "sorry")
     - **apologies before the ask**
     - **talk ratio and longest pause**
  4. Hand the metrics, transcript and the user's past patterns to **`claude-opus-5-5`** to write the debrief: what worked, where you folded, two lines for next time, your pattern.
  5. Optionally keep 2–3 cheap built-in data-collection booleans as a cross-check.
  6. Then `DELETE` the ElevenLabs conversation.
- **Privacy settings:**
  - Agent retention: a few days.
  - Audio saving: off once our own pipeline has the audio.
  - **Training opt-out toggle switched off on the owner's account.**
  - For Teams/Enterprise: ZRM.
- **Speech Engine is the fallback** if custom-LLM limits bite (metadata passing, tool-call format, latency). Revisit DIY only at large volume (§6.3).

### 6.2 Cost per rehearsal minute and per typical 3-minute rehearsal

**Assumptions for a 3-minute rehearsal:**
- **Persona turns:** 10, about one every 18 s.
- **Input tokens per turn:** a 1,800-token system prompt plus about 700 tokens of history on average, so about 2,500. That is **25,000 input tokens per rehearsal**.
- **Output:** about 45 tokens per turn, so **450 output tokens**.
- **Persona speech:** about 72 s, roughly 1,000 characters.
- **Prices:**
  - Claude (per million tokens, input / output):

    | Model | Input | Output | Cache read |
    |---|---|---|---|
    | Haiku 4.5 | $1 | $5 | — |
    | Sonnet 5.5 | $2 | $10 | $0.20 |
    | Opus 5.5 | $4 | $20 | $0.20 |

  - Haiku 4.5 needs a prefix of at least 4,096 tokens to cache, so this prompt won't cache (claude-api skill).
  - ElevenLabs: as in §2.11 and §4.

**Line items per 3-minute rehearsal:**
- **Voice (Agents or Speech Engine):** 3 × $0.08 = **$0.24**. Burst minutes: 3 × $0.16 = $0.48. The silence discount is negligible.
- **Persona LLM:**
  - **Haiku 4.5:** 25,000 × $1/1M + 450 × $5/1M = $0.025 + $0.00225 = **$0.027**, about $0.009/min.
  - **Sonnet 5.5, uncached:** 25,000 × $2/1M + 450 × $10/1M = $0.050 + $0.0045 = **$0.055**.
  - **Sonnet 5.5, with prefix caching:**
    - cache writes ≈ (1,800 + 3,000) × $2.50/1M = $0.012
    - cache reads ≈ 19,000 × $0.20/1M = $0.004
    - uncached ≈ 3,000 × $2/1M = $0.006
    - output = $0.0045
    - total ≈ **$0.027**
  - **Opus 5.5:** assume about 150 thinking tokens per turn (thinking can't be turned off). 25,000 × $4/1M + (450 + 1,500) × $20/1M = $0.10 + $0.039 = **$0.139** uncached, about **$0.09** cached.
  - **Hosted Claude through ElevenLabs:** pass-through; **rate not verified**.
- **Scribe v2 batch re-transcription** for verbatim metrics: 0.05 h × $0.22 = **$0.011**.
- **Debrief:**
  - Opus 5.5, about 4,000 tokens in and about 2,700 out including thinking: $0.016 + $0.054 = **$0.07**.
  - Sonnet 5.5 for the same job: $0.008 + $0.027 = **$0.035**.
- **Optional clip** (30 s voice-changed): 0.5 × $0.12 = **$0.06**, charged only when a clip is made.

| Stack | Voice | Persona LLM | Scribe | Debrief | **Per 3-min rehearsal** | **Per minute** |
|---|---|---|---|---|---|---|
| Budget: Agents + Haiku 4.5 + Sonnet 5.5 debrief | $0.24 | $0.027 | $0.011 | $0.035 | **≈ $0.31** | ≈ $0.104 |
| **Recommended: Agents + Sonnet 5.5 (cached) + Opus 5.5 debrief** | $0.24 | $0.027–0.055 | $0.011 | $0.07 | **≈ $0.35–0.38** | ≈ $0.12–0.13 |
| Premium: Agents + Opus 5.5 persona + Opus 5.5 debrief | $0.24 | $0.09–0.14 | $0.011 | $0.07 | **≈ $0.41–0.46** | ≈ $0.14–0.15 |
| Same as recommended, but in burst | $0.48 | $0.027–0.055 | $0.011 | $0.07 | ≈ $0.59–0.62 | ≈ $0.20 |
| DIY reference (Scribe RT $0.0195 + Flash TTS ~$0.05) | ≈ $0.07 | $0.027–0.055 | (included) | $0.07 | ≈ $0.17–0.20 | ≈ $0.06 |

**By plan:** the agent minute price is flat at $0.08, so the per-rehearsal cost is the same on every self-serve plan. What changes is how many rehearsals are prepaid and how many can run at once.

| Plan | Included minutes | ≈ 3-min rehearsals included | Concurrency (burst max) |
|---|---|---|---|
| Creator | 275 | 91 | 10 (30) |
| Pro | 1,238 | 412 | 20 (60) |
| Scale | 3,738 | 1,246 | 30 (90) |
| Business | 12,375 | 4,125 | 40 (120) |

**Sizing example:**
- 1,000 daily active users doing one rep each in a 3-hour evening peak averages 1,000 × 3 min ÷ 180 min ≈ 17 concurrent sessions. With a 2–3× spike, that is 35–50, which means **Scale or Business, or Pro plus burst**.
- One rep a day for 30 days is 90,000 min/month, or **≈ $7,200** in agent minutes at $0.08. A free user who reps every day costs about $0.31–0.38 × 30 ≈ **$9–11/month**.
- **This is consistent with the plan doc's "$2–10/month per daily free user".** It argues for Enterprise volume pricing or DIY after product-market fit.

### 6.3 When to revisit DIY
At about 50k rehearsals a month (≈ 150k minutes), DIY saves roughly $0.15–0.18 per rehearsal, ≈ $7.5k–9k/month. That justifies building barge-in, endpointing and mobile audio, but only after the persona and debrief loop is proven. **Ask ElevenLabs for Enterprise pricing first.**

---

## 7. Open items to verify (not guessed)
1. The owner's plan tier, credit balance, reset date and data-use toggle state.
2. ElevenLabs' per-token rates for hosted Claude models.
3. Whether agent realtime ASR transcripts keep "um/uh" verbatim.
4. Whether the agent can actually talk over the user (agent-initiated interruption).
5. Speech Engine:
   - support for `eleven_v3_conversational` / `eleven_v4_turbo` and audio tags
   - post-call webhooks
   - React Native support
6. v4 / v4 Turbo per-character price; whether v4 or v3-conversational is labelled "beta" (that would affect the commercial-use licence).
7. The Scale and Business price conflict ($299/$990 vs $330/$1,320); how agent minutes relate to the credit pool.
8. How to pass per-session metadata to a custom LLM beyond dynamic variables in the prompt.
9. Practice rooms (several humans plus the AI in one call): agents are 1:1 client sessions in the docs I could see. A multi-party room is not documented; it needs our own LiveKit room or a host-device design.
10. Startup Grants eligibility and current terms.
