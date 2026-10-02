# Unmute: web product to mobile app (iOS first, then Android)

Research report for the mobile half of the roadmap. Research date: 2026-10-02. Scope: what to build the app with, how two-way voice works on phones, how the monorepo and design system are shared with the Next.js 16 web app, payments, store review risk, native-only features, testing and release, a phased plan, risks and open questions. The app is built after the web app ships.

---

## 0. How this was researched (read this before trusting a number)

- **Sources read directly (full text):** Apple's App Review Guidelines (page says "Last Updated: June 8, 2026"), Apple Developer News RSS (every item from Oct 2024 to Oct 1 2026), Apple developer documentation JSON (AVAudioSession, ActivityKit, WidgetKit, StoreKit External Purchase, NSMicrophoneUsageDescription), Apple's privacy-label, account-deletion, TestFlight, Small Business Program and subscription pages, Android developer docs (audio focus, foreground service types, Play target API level, alternative billing APIs, Live Updates, Play Age Signals release notes, the March 4 2026 Android blog post), the Expo docs **source files** in the `expo/expo` GitHub repo (the rendered docs site `docs.expo.dev` was blocked by this sandbox's network proxy, so I read the same `.mdx` files from `raw.githubusercontent.com`), Expo's machine-readable SDK compatibility table, the npm registry (current versions, publish dates, peer dependencies), and the **published source code** of `@elevenlabs/react-native` 1.2.28 and `@elevenlabs/client` 1.26.0 (downloaded from npm).
- **Sources only seen as search-result summaries** (their sites were blocked by the proxy: `elevenlabs.io`, `expo.dev` changelog pages, `revenuecat.com`, `support.google.com`, `docs.sentry.io`, `posthog.com`, `stripe.com`, news sites): these are marked **(search summary)**. Treat them as likely but re-check on the page before committing money or a launch date to them.
- **Read-only account checks (nothing created, changed or spent):** ElevenLabs `agents_list` returned **0 agents** in the owner's workspace. Supabase `list_projects` returned one project, "Limohunter v2 Database" (us-west-2), unrelated to Unmute, so no Unmute backend exists yet. Vercel: project `web` (`prj_aYmxJrDQW4Saw1GiVRn7WUZ1Xh0y`, Node 24.x, framework nextjs) has SSO protection set to `all_except_custom_domains`.
- Nothing in `/home/user/SaaS` was edited.

---

## 1. Recommendation in one screen

1. **Build the app with Expo (React Native) and EAS.** Not Capacitor, not separate Swift and Kotlin apps. Expo is the only option that (a) uses the official ElevenLabs mobile voice SDK, (b) shares TypeScript, zod schemas, content and API client with the Next.js app, (c) gives real native features (widgets, Live Activities, notifications, calendar) without writing Swift for each, and (d) clearly clears Apple's "not a repackaged website" rule.
2. **Start on the latest stable Expo SDK at kickoff.** Today that is **SDK 57** (React Native 0.86). **SDK 58** went to beta on Sep 29 2026, is built for iOS 27, and will almost certainly be stable before the mobile work starts. Apple requires the iOS 27 SDK for uploads from **April 2027**, so the app must be on SDK 58 or later by then.
3. **Voice:** `@elevenlabs/react-native` talking to **the same ElevenLabs agents and the same server token endpoint** the web app will use. The phone streams the user's voice in (speech to text happens inside the agent) and plays the persona's voice out (text to speech), over WebRTC. The API key never ships in the app.
4. **Monorepo:** pnpm workspaces + Turborepo, `apps/web` (the current `web/`) + `apps/mobile` (Expo) + shared `packages/*`. Prompts and debrief scoring stay server-only so they never ship inside the app binary.
5. **Styling:** **Uniwind** (Tailwind v4 for React Native) so the app uses the same token file and the same class vocabulary as the web's Tailwind 4 setup; **Reanimated 4** for motion, fed by the same easing and duration constants as the web's `lib/motion.ts`.
6. **Payments:** **RevenueCat** for App Store and Google Play subscriptions, wired to the web's **Stripe** purchases through one entitlement ("plus") keyed by the same user ID. On the **US App Store**, also show a "subscribe on the web" link (Apple currently takes no commission on it), behind a remote flag because the Epic v. Apple case is still moving.
7. **Order:** monorepo and shared backend pieces during the web build (so mobile is cheap later), then roughly **10 to 13 weeks** for the app: device voice spike first (go/no-go), core rehearsal loop, payments, native extras, TestFlight, App Store, then Google Play (start Play's closed test early because new personal accounts must run it for 14 days with 12 testers).

---

## 2. Framework: Expo vs Capacitor vs fully native

### 2.1 Current facts

| Fact | Value | Source |
|---|---|---|
| Latest stable Expo SDK | **57** (`expo@57.0.0` published 2026-06-30; latest patch `57.0.26` on 2026-09-29) | [npm registry: expo](https://registry.npmjs.org/expo) |
| SDK 57 platform floor | React Native 0.86, React 19.2.3, iOS 16.4+, Android 7+, `compileSdk`/`targetSdk` 36, Xcode 26.4+, Node 22.13+ | [Expo SDK compatibility data](https://raw.githubusercontent.com/expo/expo/main/packages/@expo/sdk-compatibility/src/sdk-compatibility.json) |
| Next SDK | **58 beta**: `expo@58.0.0` published 2026-09-29 under the `next` tag; React Native 0.88, React 19.3.0, targetSdk 36, Xcode 26.4+ | same compatibility data; [npm registry: expo](https://registry.npmjs.org/expo) |
| SDK 58 beta notes | Built for iOS 27; React Native 0.88 RC; beta lasts 3 to 4 weeks; iOS 27 requires the UIKit scene life cycle and makes iPhone apps resizable; adds `expo-app-intents` (alpha) | [Expo SDK 58 beta changelog](https://expo.dev/changelog/sdk-58-beta) (search summary); [expo-app-intents docs source](https://raw.githubusercontent.com/expo/expo/main/docs/pages/versions/v58.0.0/sdk/app-intents.mdx) (read: marked `isAlpha: true`) |
| SDK cadence | "New Expo SDK versions are released three times each year" | [Expo SDK reference source](https://raw.githubusercontent.com/expo/expo/main/docs/pages/versions/v57.0.0/index.mdx) |
| New Architecture | "SDK 55 and later run entirely on the New Architecture... cannot be disabled" | [Expo New Architecture guide source](https://raw.githubusercontent.com/expo/expo/main/docs/pages/guides/new-architecture.mdx) |
| Expo Go vs development builds | A development build is "your own version of Expo Go" with any native library; "recommended when you want to create your own app and release to app stores" | [Expo dev builds intro source](https://raw.githubusercontent.com/expo/expo/main/docs/pages/develop/development-builds/introduction.mdx) |
| Expo Router | File-based routing for Android, iOS and web; every screen is deep linkable; native navigation on React Native Screens | [Expo Router intro source](https://raw.githubusercontent.com/expo/expo/main/docs/pages/router/introduction.mdx) |
| EAS Build / Submit | Hosted builds and signing; `eas submit` "works on macOS, Linux, and Windows, so you don't need a Mac to ship iOS builds"; first Android submission lands on the internal testing track | [EAS Build source](https://raw.githubusercontent.com/expo/expo/main/docs/pages/build/introduction.mdx), [EAS Submit iOS source](https://raw.githubusercontent.com/expo/expo/main/docs/pages/submit/ios.mdx), [EAS Submit Android source](https://raw.githubusercontent.com/expo/expo/main/docs/pages/submit/android.mdx) |
| EAS Update | Over-the-air updates to JS, styling and images; not for native changes; "your updates need to follow the App Store and Play Store guidelines"; runtime versions keep updates matched to compatible binaries | [EAS Update intro source](https://raw.githubusercontent.com/expo/expo/main/docs/pages/eas-update/introduction.mdx) |
| EAS pricing | Free plan: limited low-priority builds and free updates; Starter **$19/month** with $45 build credit (read). Production $199/month with $225 credit and 50,000 update MAUs; free plan about 15 iOS + 15 Android builds and 1,000 MAUs (search summary) | [Expo plans doc source](https://raw.githubusercontent.com/expo/expo/main/docs/pages/billing/plans.mdx); [expo.dev/pricing](https://expo.dev/pricing) (search summary) |
| Capacitor | Latest `@capacitor/core` **8.5.2** (8.0.0 shipped 2025-12-08; 9.0 in alpha) | [npm registry: @capacitor/core](https://registry.npmjs.org/@capacitor/core) |
| Capacitor remote URL | `server.url`: "Load an external URL in the Web View. This is intended for use with live-reload servers. **This is not intended for use in production.**" | [Capacitor config reference source](https://raw.githubusercontent.com/ionic-team/capacitor-docs/main/docs/main/reference/config.md) |
| Native SDKs | ElevenLabs ships a Swift SDK (iOS 14+) and a Kotlin SDK (API 21+) for agents | [ElevenLabs Swift SDK](https://elevenlabs.io/docs/eleven-agents/libraries/swift), [Kotlin SDK](https://elevenlabs.io/docs/agents-platform/libraries/kotlin) (search summary) |
| Apple minimum functionality | "Your app should include features, content, and UI that elevate it beyond a repackaged website" (4.2); apps shouldn't primarily be "web clippings" (4.2.2) | [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) |

### 2.2 Comparison for this product

| | **Expo / React Native** | **Capacitor (wrap the web app)** | **Fully native (Swift + Kotlin)** |
|---|---|---|---|
| Two-way voice | Official `@elevenlabs/react-native` (WebRTC through LiveKit's native modules, native audio session) | ElevenLabs web SDK inside WKWebView/WebView; the web view owns the audio session; less control over routing, interruptions, background | Best control; official ElevenLabs Swift and Kotlin SDKs |
| Code shared with Next.js | TypeScript logic, zod schemas, content, API client, tokens; UI is rebuilt | Nearly all UI | None (different languages) |
| Next.js fit | Next stays the web; app is a second client of the same API | Needs a static export (`output: 'export'`), so route handlers and server rendering do not run inside the app; `server.url` is not for production | Separate clients |
| Widgets, Live Activities, calendar, notifications | `expo-widgets`, `expo-calendar`, `expo-notifications` from TypeScript | Plugins or custom native code per feature | Native, but written twice |
| Apple 4.2 risk | Low | Highest of the three (a wrapped marketing-site codebase is the pattern 4.2 targets) | Low |
| Team cost for a solo founder | One language, one codebase for iOS + Android | Lowest at first, highest later | Two extra codebases |
| Ship updates without review | EAS Update for JS fixes | Live web content (and the same review rules) | No |

**Verdict: Expo.** Capacitor only wins on day-one effort and loses on the things that matter for a voice-first app (audio control, native surfaces, review risk). Fully native would be the choice only if the Expo device spike (Phase M1) shows audio problems that cannot be fixed with a small Expo native module; the ElevenLabs Swift and Kotlin SDKs exist as that escape hatch.

**Do not try to render the React Native app on the web through Next.js.** Expo's own guide says "Using Next.js is not an official part of Expo's universal app development workflow" ([source](https://raw.githubusercontent.com/expo/expo/main/docs/pages/guides/using-nextjs.mdx)). Keep two UI layers (Next.js + Tailwind on the web, Expo + Uniwind on phones) over shared logic. If a web-only piece must appear in the app (the manifesto, legal pages), Expo's `'use dom'` DOM components can embed it (SDK 56+ uses `@expo/dom-webview` by default) ([source](https://raw.githubusercontent.com/expo/expo/main/docs/pages/guides/dom-components.mdx)); never for the rehearsal screen.

---

## 3. Voice on mobile (both directions)

### 3.1 The ElevenLabs React Native SDK: what it is and what it requires

| Fact | Detail | Source |
|---|---|---|
| Package and version | `@elevenlabs/react-native` **1.2.28** (2026-09-29); 1.0.0 shipped 2026-03-27 as a full API rewrite | [npm registry](https://registry.npmjs.org/@elevenlabs/react-native) |
| API shape | Same as the web React SDK: `ConversationProvider`, `useConversationControls()` (`startSession`, `endSession`), `useConversationStatus()`; "re-exports the full conversation API and automatically configures the platform... (WebRTC polyfills and native AudioSession setup)" | [package README](https://raw.githubusercontent.com/elevenlabs/packages/main/packages/react-native/README.md) |
| Peer dependencies | `@livekit/react-native` **^2.12.0**, `@livekit/react-native-webrtc` ^144.1.2, react, react-native | npm metadata for 1.2.28 |
| Version trap | `@livekit/react-native` **3.0.0** shipped 2026-09-11 and is **outside** the SDK's `^2.12.0` range. Pin 2.12.x until ElevenLabs widens the range. | [npm registry: @livekit/react-native](https://registry.npmjs.org/@livekit/react-native) |
| Expo | "This SDK requires Expo development builds. Expo Go is not supported." Config plugins: `@livekit/react-native-expo-plugin` and `@config-plugins/react-native-webrtc` | README; [ElevenLabs official Expo example app.json](https://raw.githubusercontent.com/elevenlabs/packages/main/examples/react-native-expo/app.json) |
| Known-good versions | The official example runs Expo `~57.0.15`, React Native `0.86.2`, React `19.2.3`, `@livekit/react-native ^2.12.0` | [example package.json](https://raw.githubusercontent.com/elevenlabs/packages/main/examples/react-native-expo/package.json) |
| Transport | **WebRTC only.** The React Native setup code throws if `connectionType: "websocket"` or a `signedUrl` is passed: "WebSocket connections require Web Audio APIs (AudioContext, AudioWorkletNode) that are not available in React Native." | `src/index.react-native.ts` in the [published package](https://registry.npmjs.org/@elevenlabs/react-native/-/react-native-1.2.28.tgz) |
| Private agents | The server calls `GET /v1/convai/conversation/token?agent_id=...` with the `xi-api-key` header and returns a **conversation token**; the app passes `conversationToken`. Token reported as valid for 10 minutes. Never expose the API key to the client. | [Get conversation token API](https://elevenlabs.io/docs/api-reference/conversations/get-webrtc-token), [React SDK docs](https://elevenlabs.io/docs/eleven-agents/libraries/react) (search summary); the `PrivateWebRTCSessionConfig` type in `@elevenlabs/client` 1.26.0 (read) |
| Per-session options | `overrides` for `agent.prompt`, `agent.firstMessage`, `agent.language`, `tts.voiceId/speed/stability/similarityBoost`, `asr.keywords`, `conversation.textOnly`; `dynamicVariables`; `userId`; methods `sendUserMessage`, `sendContextualUpdate`, `setMicMuted`, `setVolume`; callbacks incl. `onMessage`, `onModeChange` | `dist/utils/BaseConnection.d.ts`, `dist/BaseConversation.d.ts` in [@elevenlabs/client 1.26.0](https://registry.npmjs.org/@elevenlabs/client/-/client-1.26.0.tgz) |
| Waveform data | The RN package wires LiveKit's native RMS and multiband (FFT) processors into `getVolume()` / `getByteFrequencyData()`, enough for a live waveform without extra libraries | `src/nativeVolume.ts` in the published package |
| Owner's account today | 0 agents in the ElevenLabs workspace (read-only `agents_list`). The web phase creates them; the app reuses them unchanged. | ElevenLabs MCP, 2026-10-02 |

**How "voice on both sides" maps to this SDK.** One ElevenLabs agent session does both directions: the app streams microphone audio up, the agent transcribes it (speech to text), the LLM answers in character, and the agent streams the persona's voice back (text to speech). Transcripts arrive through `onMessage`, which is what the live counters (time to the ask, apologies, filler words) and the debrief need. The mobile app should not run a separate speech-to-text pipeline during the rehearsal.

**Separate speech-to-text (Scribe) on the phone is not a drop-in.** The `@elevenlabs/client` README shows `Scribe.connect(...)` with AudioWorklet processors (web APIs), and the RN package's own comment says those Web Audio APIs are not available in React Native ([client README](https://registry.npmjs.org/@elevenlabs/client)). If the debrief needs word-level timing or a verbatim transcript with every "um" (I could not verify whether the agent's live transcript keeps disfluencies), run batch transcription **server-side** on the post-call recording, which keeps the app thin and identical across web and mobile.

**Security point that affects mobile as much as web.** Whatever the client sends in `overrides` reaches the agent. If prompt overrides are enabled on the agent, a modified app could turn Unmute's agent into a free general chatbot on the owner's ElevenLabs bill. Keep prompt overrides off, pass scenario fields as `dynamicVariables` into a server-defined prompt (or use one agent per persona family), and make the **token endpoint the gate**: it checks the signed-in user, the plan, the daily free-rep quota and a maximum session length before minting a token. (The agent-side "allow overrides" setting is documented by ElevenLabs; I could not open that page to quote it.)

**Text-first on-ramp.** The SDK exposes `textOnly` (and a `TextConversation` class), which matches the "text first, then voice" plan for people who cannot talk out loud yet. Verify on a device that text-only sessions start on React Native without the WebRTC audio setup.

### 3.2 iOS audio session (the part most likely to go wrong)

What the SDK does today: on every voice session it calls LiveKit's `AudioSession.configureAudio({ ios: { defaultOutput: "speaker" }, android: { preferredOutputList: ["speaker"], audioTypeOptions: AndroidAudioTypePresets.communication } })`, starts the audio session, and stops it when the session ends (`src/index.react-native.ts`, read). That hardcoded speaker preference is fine for a phone on a desk, but Unmute's plan to reduce the "cringe" of talking to a phone in a dorm relies on **headphones and AirPods**, so routing must be tested first.

| Topic | What Apple's docs say | What Unmute should do |
|---|---|---|
| Category | `playAndRecord` is for VoIP-style record + playback; audio "continues with the Silent switch set to silent and with the screen locked"; to keep playing in the background add the `audio` UIBackgroundMode; nonmixable by default ([doc](https://developer.apple.com/documentation/avfaudio/avaudiosession/category-swift.struct/playandrecord)) | This is what WebRTC uses; good: the silent switch will not mute the persona. |
| Echo cancellation | `voiceChat` mode optimizes for two-way voice, limits routes to voice-suitable ones and automatically applies `allowBluetoothHFP`; echo cancellation and gain control come from the voice-processing I/O unit, and without it "the system... doesn't apply voice-specific processing, like echo cancellation" ([doc](https://developer.apple.com/documentation/avfaudio/avaudiosession/mode-swift.struct/voicechat)) | Verify on device that the persona does not hear itself on speakerphone (the agent interrupting itself is the classic symptom). |
| Speaker vs receiver | `defaultToSpeaker` routes to the speaker instead of the receiver; with it "plugging in a headset doesn't cause the route to change" ([doc](https://developer.apple.com/documentation/avfaudio/avaudiosession/categoryoptions-swift.struct/defaulttospeaker)) | **P0 test:** with the SDK's `defaultOutput: "speaker"`, do wired headphones and AirPods still get the audio? If not, override the route after the session starts or replace the setup strategy (see risks). |
| Bluetooth / AirPods | `allowBluetooth` is renamed `allowBluetoothHFP` (hands-free profile, input + output); `allowBluetoothA2DP` is output-only stereo and HFP wins when both are set ([HFP](https://developer.apple.com/documentation/avfaudio/avaudiosession/categoryoptions-swift.struct/allowbluetoothhfp), [A2DP](https://developer.apple.com/documentation/avfaudio/avaudiosession/categoryoptions-swift.struct/allowbluetootha2dp)). iOS 26 added `bluetoothHighQualityRecording` for AirPods, but only in the default mode and it "may increase input latency... isn't recommended for real-time communication" ([doc](https://developer.apple.com/documentation/avfaudio/avaudiosession/categoryoptions-swift.struct/bluetoothhighqualityrecording)) | Accept HFP quality on AirPods during a rehearsal; do not chase high-quality recording. |
| Interruptions (incoming call, Siri, alarm) | `interruptionNotification` began/ended; in iOS 27 Apple adds `didBecomeActive/Inactive` and `resumptionRecommendation` notifications that "don't get out of sync when the system can't deliver an end event"; `setPrefersNoInterruptionsFromSystemAlerts(_:)` exists ([Handling audio interruptions](https://developer.apple.com/documentation/avfaudio/handling-audio-interruptions), [didBecomeInactive](https://developer.apple.com/documentation/avfaudio/avaudiosession/didbecomeinactivenotification)) | Treat any interruption as "rehearsal paused": end the ElevenLabs session cleanly, keep the transcript so far, and offer "resume" (new session with context) or "debrief what I have". Never fight a real phone call. |
| Background | LiveKit: `audio` + `voip` background modes keep the app alive while a mic or audio track is active; CallKit for more robust background ([LiveKit RN README](https://registry.npmjs.org/@livekit/react-native)). Apple 2.5.4: background services only for their intended purposes ([guidelines](https://developer.apple.com/app-store/review/guidelines/)) | Recommended v1: **no background rehearsals.** A rehearsal has an end; if the user leaves the app, pause and end. Skip VoIP mode and CallKit (they invite review questions and are not needed). Revisit only if testers lock their screens mid-rep. |
| Microphone permission | `NSMicrophoneUsageDescription` "is required if your app uses APIs that access the device's microphone" ([doc](https://developer.apple.com/documentation/bundleresources/information-property-list/nsmicrophoneusagedescription)); purpose strings must "clearly and completely describe" the use (5.1.1(ii)); apps must get consent and "provide a clear visual and/or audible indication when recording" (2.5.14) | Purpose string draft: "Unmute uses your microphone only during a rehearsal so the practice character can hear you. Real phone calls are never recorded." Show a visible live indicator on the rehearsal screen. Ask for the mic on the first "Start rehearsal" tap, after a one-screen explainer, not at launch. |
| Haptics during a live session | `allowHapticsAndSystemSoundsDuringRecording` **defaults to false** ([doc](https://developer.apple.com/documentation/avfaudio/avaudiosession/allowhapticsandsystemsoundsduringrecording)); `expo-haptics` also does nothing in Low Power Mode or with the Taptic Engine disabled ([expo-haptics source](https://raw.githubusercontent.com/expo/expo/main/docs/pages/versions/v57.0.0/sdk/haptics.mdx)) | Put haptics before and after the live audio (countdown, "rehearsal over", debrief reveals). Haptic cues during the call (for example "you've talked 30 seconds without asking") need a tiny Expo native module that sets that flag; test it with WebRTC running. |
| Simulator | LiveKit: "You will not be able to publish camera or microphone tracks on iOS Simulator" ([README](https://registry.npmjs.org/@livekit/react-native)) | All voice QA on physical iPhones. |

### 3.3 Android audio

| Topic | Source fact | What Unmute should do |
|---|---|---|
| Communication mode | LiveKit's default Android session is for two-way communication: "Echo cancellation is available and is enabled by default", volume cannot go to 0, a mic indicator may show ([README](https://registry.npmjs.org/@livekit/react-native)); the Expo plugin's `audioType` defaults to `"communication"` ([plugin README](https://registry.npmjs.org/@livekit/react-native-expo-plugin)) | Keep the communication preset. |
| Audio focus | Apps targeting Android 15+ "cannot request audio focus unless it's the top app or running a foreground service"; on incoming calls the system mutes `USAGE_MEDIA`/`USAGE_GAME` apps ([audio focus](https://developer.android.com/media/optimize/audio-focus)) | Same rule as iOS: foreground only; end or pause on call. |
| Background mic | A microphone foreground service needs `FOREGROUND_SERVICE_MICROPHONE` and `RECORD_AUDIO`, which is "subject to while-in-use restrictions... you cannot create a microphone foreground service while your app is in the background" ([FGS types](https://developer.android.com/develop/background-work/services/fgs/service-types)) | No background rehearsals in v1; no foreground service needed. |
| Permissions | The ElevenLabs example declares `RECORD_AUDIO`, `MODIFY_AUDIO_SETTINGS`, `BLUETOOTH`, `INTERNET`, `ACCESS_NETWORK_STATE`, `WAKE_LOCK`, but also `CAMERA` and `SYSTEM_ALERT_WINDOW` ([example app.json](https://raw.githubusercontent.com/elevenlabs/packages/main/examples/react-native-expo/app.json)) | Strip `CAMERA` and `SYSTEM_ALERT_WINDOW`; every extra permission shows up in the Data safety form and invites questions. |
| Target API | From Aug 31 2026 new apps and updates must target **Android 16 (API 36)** ([Play target API](https://developer.android.com/google/play/requirements/target-sdk)) | Expo SDK 57 and 58 already target 36. |

---

## 4. Monorepo and design system

### 4.1 Layout

```
unmute/
  pnpm-workspace.yaml        packages: apps/*, packages/*
  turbo.json
  apps/
    web/                     today's /web (Next.js 16.3.5, React 19.2.8) - deployed by Vercel
    mobile/                  Expo SDK 57/58, Expo Router, Uniwind, Reanimated
  packages/
    content/                 scenarios, persona cards, moods, cue-card copy, pricing copy (plain TS data)
    schemas/                 zod 4: Scenario, RehearsalSession, TranscriptTurn, Debrief, Pattern, API request/response
    api-client/              typed fetch for /api/* (token, rehearsals, debriefs, entitlements), validates with schemas
    scoring/                 pure TS live metrics from transcript turns: time to the ask, apologies, filler words
    tokens/                  colors, radii, type scale, easing and durations -> emits tokens.css (both apps) + tokens.ts
    voice/                   thin wrapper over @elevenlabs/react (web) and @elevenlabs/react-native (index.native.ts)
    config/                  tsconfig, eslint presets
  server-only packages (imported by apps/web route handlers, never by apps/mobile):
    prompts/                 persona prompts, difficulty ladders, crisis-language rules
    debrief/                 debrief generation (Claude), pattern memory
```

Why prompts and the debrief stay server-only: anything imported by `apps/mobile` ships inside the app binary (readable by anyone), and changing it would need an app release or an EAS Update. Keeping them on the server keeps them private, editable without review, and identical for web and mobile.

### 4.2 Facts that shape the setup

- Expo detects monorepos and configures Metro automatically (SDK 52+); pnpm isolated installs are supported **from SDK 54**; if a library breaks, set `nodeLinker: hoisted` in `pnpm-workspace.yaml`; from **SDK 55** autolinking module resolution is on automatically in monorepos ([Expo monorepo guide source](https://raw.githubusercontent.com/expo/expo/main/docs/pages/guides/monorepos.mdx)).
- The same guide: "Duplicate React Native versions in a single monorepo are not supported" and "Duplicate React versions in a single app will cause runtime errors." Today the web runs React **19.2.8**; Expo SDK 57 pins React **19.2.3** and SDK 58 pins **19.3.0** (compatibility data above). So: each app pins its own React, shared packages list `react` only as a `peerDependency`, and CI runs `pnpm why react` / `expo-doctor` to catch duplicates.
- Turborepo "Just-in-Time" internal packages export TypeScript directly and let each app's bundler compile them (Next.js via `transpilePackages`, Metro natively); the trade-off is that Turborepo cannot cache a build for them ([Turborepo internal packages source](https://raw.githubusercontent.com/vercel/turborepo/main/apps/docs/content/docs/core-concepts/internal-packages.mdx)). That is the right trade for a solo project.
- Migration cost on the web side: move `web/` to `apps/web`, switch from npm (`package-lock.json`) to pnpm, and change the Vercel project's root directory. The Vercel project currently has SSO protection on all deployments except custom domains (read-only API check), so the app must call a **custom API domain** (for example `api.<domain>`), and development builds pointed at preview deployments need a protection-bypass token.

### 4.3 Styling, tokens and motion

| Option | Status today | Fit |
|---|---|---|
| **Uniwind** | `uniwind` 1.12.1 (2026-10-01); peer `tailwindcss >=4`, `react-native >=0.81`; build-time styles, themes, CSS variables ([npm](https://registry.npmjs.org/uniwind)); named by Expo's Tailwind guide as a universal option ([source](https://raw.githubusercontent.com/expo/expo/main/docs/pages/guides/tailwind.mdx)) | **Recommended.** The web already defines tokens in `app/globals.css` under Tailwind 4 `@theme inline` (`--color-amber`, `--color-ink`, `--radius`...). Move them to `packages/tokens/tokens.css` and import it in both apps, so `bg-accent text-amber-ink rounded-2xl` means the same thing on both. Check what its paid "Pro" tier gates before relying on it. |
| NativeWind | Stable `nativewind` 4.2.7 is the Tailwind v3 line; **v5 for Tailwind v4 is only `5.0.0-rc.0`** (2026-09-13) ([npm](https://registry.npmjs.org/nativewind)) | Second choice once v5 is stable. |
| Tamagui | `tamagui` 2.7.7; v3 in beta ([npm](https://registry.npmjs.org/tamagui)) | Strong, but a separate styling system the web does not use. |
| StyleSheet / Unistyles 3 | `react-native-unistyles` 3.4.0 ([npm](https://registry.npmjs.org/react-native-unistyles)) | Fine, but no class sharing with the web. |

- **Motion:** the web uses `motion` v13 with one signature easing `[0.23, 1, 0.32, 1]` and durations `0.16 / 0.4 / 0.6 s` in `web/lib/motion.ts`. Move those constants into `packages/tokens` and use them in **Reanimated 4** on mobile (`Easing.bezier(0.23, 1, 0.32, 1)`). `react-native-reanimated` 4.7.1 (2026-10-02) peers on React Native 0.86 to 0.88 and `react-native-worklets` 0.13 ([npm](https://registry.npmjs.org/react-native-reanimated)). Respect "reduce motion" on both platforms.
- **Fonts:** load the same Outfit and Inter files on mobile (via `expo-font`); the web self-hosts them through Fontsource.
- **What cannot be shared:** every DOM component (shadcn/Radix, Magic UI, rough-notation, the app-window mock), `motion` components, CSS-only effects (backdrop blur "glass", the lavender/peach mesh, dot grid: rebuild with `expo-blur`, gradients or Skia), SEO/marketing pages, Stripe Checkout, cookie-based sessions, Next.js server code, and the platform audio layer (web SDK vs RN SDK; they share the hook API, so `packages/voice` can hide most of the difference). Shared: the product's words, data shapes, rules, metrics and look.

---

## 5. Payments

### 5.1 Rules as of today

**Apple**
- 3.1.1: "If you want to unlock features or functionality within your app... you must use in-app purchase." The US exception covers links and calls to action, not removing IAP: "These entitlements are not required for developers to include buttons, external links, or other calls to action in their United States storefront apps" (3.1.1(a)); same carve-out in 3.1.3 ([guidelines](https://developer.apple.com/app-store/review/guidelines/), updated for the US court decision on May 1 2025 per [Apple news](https://developer.apple.com/news/?id=9txfddzf)).
- 3.1.3(b) Multiplatform Services: users may access subscriptions bought on your website "provided those items are also available as in-app purchases within the app." So Plus must also be sold through IAP inside the app.
- 3.1.3(c) Enterprise Services: apps sold "directly by you to organizations or groups for their employees or students" may unlock without IAP; "consumer, single user, or family sales must use in-app purchase." This is the path for **Teams** (career centers).
- 3.1.2(a): subscriptions "must work on all of the user's devices where the app is available."
- Commission: App Store Small Business Program **15%** for developers under USD 1M proceeds ([program page](https://developer.apple.com/app-store/small-business-program/)); subscribers in the program pay out 85% from day one ([subscriptions page](https://developer.apple.com/app-store/subscriptions/)).
- New: monthly subscriptions with a 12-month commitment are available worldwide **except the United States and Singapore** ([Apple news, Apr 27 2026](https://developer.apple.com/news/?id=agq42lxe)), so not usable for a US launch. iOS 27 adds Bundles/Suites and multiseat purchasing (Volume Purchasing from Oct 22 2026) ([Apple news, Sep 16 2026](https://developer.apple.com/news/?id=likeohx4)); multiseat is worth a look later for Teams.

**Epic v. Apple, where it stands (US link-outs)**
- April 2025: the district court held Apple in contempt; Apple must allow links and buttons without commission; Apple updated the guidelines May 1 2025 (above).
- **Dec 11 2025:** the Ninth Circuit affirmed the contempt finding but held the total ban on commissions was punitive; Apple may charge a commission on linked-out purchases limited to costs "genuinely and reasonably necessary" for coordinating external links, and remanded ([opinion PDF](https://cdn.ca9.uscourts.gov/datastore/opinions/2025/12/11/25-2935.pdf), could not open; [Fenwick summary](https://www.fenwick.com/insights/publications/ninth-circuit-largely-upholds-ruling-in-epic-v-apple)) (search summary).
- Mar 30 2026 rehearing denied ([9to5Mac](https://9to5mac.com/2026/03/30/ninth-circuit-unanimously-denies-apples-rehearing-requests-in-epic-games-case/)); May 6 2026 the Supreme Court declined to pause the order ([CNBC](https://www.cnbc.com/2026/05/06/supreme-court-declines-to-pause-order-holding-apple-in-contempt-in-epic-games-lawsuit.html)); **Jun 30 2026 the Supreme Court agreed to hear Apple's appeal, only on the civil contempt standard**, argument expected in the term starting October 2026 ([MacRumors](https://www.macrumors.com/2026/06/30/apple-epic-games-supreme-court/), [US News/Reuters](https://www.usnews.com/news/top-news/articles/2026-06-30/us-supreme-court-to-hear-apple-appeal-of-contempt-in-epic-games-lawsuit)); Apple's 10-Q confirms the petition and grant ([10-Q for quarter ended Jun 27 2026](https://www.sec.gov/Archives/edgar/data/0000320193/000032019326000020/aapl-20260627.htm)) (all search summary).
- Aug to Sep 2026: remand proceedings on what commission is allowed are ongoing; Apple reportedly asked for up to 15% on web purchases ([tech-insider summary](https://tech-insider.org/apple-scotus-27-percent-app-store-fee-2026/), secondary, low confidence).
- **Practical reading today:** on the US storefront you may show a "subscribe on the web" button, and Apple currently collects no commission on those purchases; that can change after the remand or the Supreme Court ruling. Build the link behind a server-controlled flag and keep IAP as the default path.

**Google Play**
- Mar 4 2026 Android blog: a new model that separates a **billing fee (5% in the EEA, UK and US)** from the service fee; **recurring subscriptions service fee 10%**; IAP service fee 20% for new installs; US/EEA/UK rollout "by June 30" ([Android Developers blog](https://developer.android.com/blog/posts/a-new-era-for-choice-and-openness), read). So a Play-billed subscription in the US should cost about 15% in total. I could not see the live rate in a Play Console, so confirm it on the Service fees page ([Play Console Help](https://support.google.com/googleplay/android-developer/answer/112622)).
- US external content links and alternative billing programs: subscriptions 10%; Google gave notice on Jul 22 2026 that enrolled US developers must report transactions and pay fees **starting Oct 1 2026** ([Play Console Help: US policies](https://support.google.com/googleplay/android-developer/answer/15582165), [external content links program](https://support.google.com/googleplay/android-developer/answer/16470497)) (search summary).
- Play Billing Library **8+** is required for new apps and updates from Aug 31 2026 (extension to Nov 1 2026 on request) ([alternative billing page banner](https://developer.android.com/google/play/billing/alternative)); RevenueCat SDK v9+ supports Billing Library 8 ([RevenueCat blog](https://www.revenuecat.com/blog/engineering/google-play-billing-v8), search summary); `react-native-purchases` is at 10.11.0 ([npm](https://registry.npmjs.org/react-native-purchases)).

**RevenueCat**
- Free up to $2,500 monthly tracked revenue, then 1% ([pricing](https://www.revenuecat.com/pricing), search summary).
- Stripe integration: Stripe subscriptions unlock RevenueCat entitlements when the app is configured with the same App User ID; Stripe product IDs map to products in an Offering; external Stripe purchases can be posted to RevenueCat ([Stripe integration](https://www.revenuecat.com/integrations/stripe), [track external purchases](https://www.revenuecat.com/docs/web/integrations/stripe/track-external-purchases)) (search summary).
- "App-to-web" Web Purchase button on RevenueCat paywalls opens a web checkout (browser or in-app sheet); for the **US storefront, checkout proceeds without Apple's notice sheet or external purchase token**, handled by the SDK ([Web Purchase button docs](https://www.revenuecat.com/docs/tools/paywalls/creating-paywalls/web-purchase-button)) (search summary).
- Expo lists `react-native-purchases` (RevenueCat) and `expo-iap` as supported IAP libraries; both need a development build ([Expo IAP guide source](https://raw.githubusercontent.com/expo/expo/main/docs/pages/guides/in-app-purchases.mdx)).

### 5.2 What each channel nets on Plus (before taxes and RevenueCat's 1%)

Stripe card fee 2.9% + 30 cents and Stripe Billing 0.7% ([Stripe pricing](https://stripe.com/pricing), [Stripe Billing pricing](https://stripe.com/billing/pricing), search summary). Apple and Google collect and remit sales tax on store purchases; web sales need Stripe Tax or similar (not priced here).

| Channel | $14.99 / month nets | $99 / year nets |
|---|---|---|
| App Store IAP (Small Business Program, 15%) | $12.74 | $84.15 |
| US iOS link-out to Stripe (no Apple commission today) | about $14.15 | about $95.14 |
| Google Play billing (10% service + 5% billing, if live) | $12.74 | $84.15 |
| Google Play US external link (10%) + Stripe | about $12.65 | about $85.24 |

Takeaways: on Android just use Play Billing (the external link costs slightly more and adds friction). On iOS the web link saves about $1.40 a month per subscriber; test whether the extra step costs more than that in conversion. Check in App Store Connect that a $99.00 annual price point exists (I did not verify Apple's current price-point list).

### 5.3 Recommended architecture

1. One user identity (the web's auth user ID, Supabase or otherwise) is also the RevenueCat App User ID; the app calls `Purchases.logIn(userId)` right after sign-in.
2. One entitlement, `plus`, attached to: the App Store monthly + annual products, the Play monthly + annual base plans, and the Stripe prices the website already sells.
3. RevenueCat webhooks (which also cover Stripe through the integration) update a server-side `entitlements` row. **The voice token endpoint reads that row** (plus the free-tier one-rep-a-day counter) before it mints an ElevenLabs conversation token. That one check controls cost on every platform.
4. Paywall after the first debrief (the plan's conversion point), with a clear description of what Plus includes (3.1.2(c)), a restore button, and on the US storefront an optional "or subscribe on the web" button controlled by a remote flag.
5. Teams: sold to institutions by invoice/Stripe; seats grant `plus` through org membership on the server; no IAP, per 3.1.3(c). Explain this in the App Review notes.
6. Account deletion with an active store subscription: tell the user billing continues through Apple/Google and link to manage subscriptions before deleting (Apple's account-deletion guidance, below).

---

## 6. App Store and Google Play review risks

### 6.1 Apple

| Area | Rule (source) | Risk for Unmute | Mitigation |
|---|---|---|---|
| Third-party AI | 5.1.2(i): "You must clearly disclose where personal data will be shared with third parties, **including with third-party AI**, and obtain explicit permission before doing so" (added Nov 13 2025, [Apple news](https://developer.apple.com/news/?id=ey6d8onl)) | High: voice goes to ElevenLabs, transcripts to an LLM vendor | A consent screen before the first rep that names each vendor and what it receives; the same in the privacy policy; "never used to train models" only if the vendor contracts say so. |
| Age rating | New tiers 4+, 9+, 13+, 16+, 18+; new questions on in-app controls, capabilities, medical/wellness, violence; "you must consider how all app features, including AI assistants and chatbot functionality, impact the frequency of sensitive content"; you may set a higher rating for your minimum age ([Apple news, Jul 24 2025](https://developer.apple.com/news/?id=ks775ehf); [values and definitions](https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions/)). Social-media capability questions required for submissions from **September 2026** ([Apple news, Jul 9 2026](https://developer.apple.com/news/?id=tlur8uvi)) | Medium: hostile personas, conflict scenarios, custom scenarios | Answer honestly (UGC: yes; messaging and chat: yes once rooms exist; social media: no, unless clips get a feed). Given the 18 to 25 audience, AI roleplay and minors laws, **set 18+ at launch** and revisit teens later with clinical advisors (16+ is the alternative if the owner wants older teens). |
| State age laws | Texas SB 2420 in effect for new Texas accounts from Jun 4 2026 ([Apple news](https://developer.apple.com/news/?id=sg176nne)); Utah (new accounts from May 6 2026) and Louisiana (Jul 1 2026) age categories via the Declared Age Range API; Significant Change API under PermissionKit ([Apple news, Feb 24 2026](https://developer.apple.com/news/?id=f5zj08ey)) | Medium | Call the Declared Age Range API at onboarding; block under-18 if rated 18+; ask counsel which developer obligations apply. |
| Account deletion | 5.1.1(v): "If your app supports account creation, you must also offer account deletion within the app"; deletion must remove the record and associated data, cannot require a phone call or email for non-regulated apps, guest accounts too, Sign in with Apple tokens must be revoked ([Apple guidance](https://developer.apple.com/support/offering-account-deletion-in-your-app/)) | Low if built in | Settings > Delete account: deletes rehearsals, transcripts, audio, clips at the vendors too; shows subscription warning. |
| Login | 4.8: if a third-party social login (Google, etc.) creates the primary account, offer an equivalent privacy-preserving login | Low | Offer Sign in with Apple + email; Supabase documents native Sign in with Apple with `expo-apple-authentication` ([Supabase docs](https://supabase.com/docs/guides/auth/social-login/auth-apple)). |
| Recording indicator | 2.5.14: explicit consent + clear indication when recording via the microphone | Low | Visible "live" indicator + mic level meter during rehearsals. |
| UGC | 1.2: filter objectionable material, report mechanism with timely response, block abusive users, published contact info; random/anonymous chat falls under 1.2 ([Apple news, Feb 6 2026](https://developer.apple.com/news/?id=d75yllv4)) | Medium: custom scenarios, practice rooms, shared clips, dares | Moderate custom-scenario text server-side; in-app "report this" on any AI turn, room and clip; block in rooms; rooms by invite only, no random matching. |
| Minimum functionality | 4.2 / 4.2.2 (above) | Low with Expo | Native voice, widgets, notifications, Live Activity. |
| Medical | 1.4.1: apps that could be used for diagnosing or treating patients get more scrutiny | Low if worded carefully | Keep "not therapy" positioning; no clinical claims in metadata; crisis routing. |
| Notifications / Live Activities | 4.5.3: no spam via Push or Live Activities (clarified Jun 8 2026, [Apple news](https://developer.apple.com/news/?id=a233fmpw)); 4.5.4: push not required to function; marketing pushes need explicit opt-in | Low | Reminders only for reps the user scheduled; no promo pushes without opt-in. |
| Privacy label | "Collect" means data leaves the device and is kept longer than needed to serve the request in real time; third-party SDKs count; data types include **Audio Data** ("voice or sound recordings"), Other User Content, Customer Support, Product Interaction, Crash Data ([App privacy details](https://developer.apple.com/app-store/app-privacy-details/)) | Medium | Declare: Audio Data, Other User Content (transcripts, custom scenarios), Contact Info (email), Identifiers (user ID), Purchases, Product Interaction (analytics), Crash Data; all "app functionality", none "tracking". |
| SDK deadlines | iOS 26 SDK required from Apr 28 2026 ([Apple news](https://developer.apple.com/news/?id=ueeok6yw)); **iOS 27 SDK required from April 2027** ([Apple news](https://developer.apple.com/news/?id=k1mtkt1k)) | Planning | Ship on Expo SDK 58+ before April 2027. |
| Layout | iOS 27 makes iPhone apps resizable (SDK 58 beta notes, search summary); Apple is preparing developers for an "iPhone Duo" ([Apple news, Sep 9 2026](https://developer.apple.com/news/?id=vn8abkxx)) | Low | Flexible layouts; no fixed-width screens. |

### 6.2 Google Play

| Area | Rule (source) | Mitigation |
|---|---|---|
| AI-generated content | Generative AI apps must not generate prohibited content and **must include in-app reporting or flagging of offensive AI output without leaving the app** ([AI-Generated Content policy](https://support.google.com/googleplay/android-developer/answer/14094294), search summary) | The same "report this" control as iOS. |
| Account deletion | If accounts can be created in-app: an in-app deletion path **and** a web link to request deletion, declared in the Data safety form ([Play Console Help](https://support.google.com/googleplay/android-developer/answer/13327111), search summary) | Build `/delete-account` on the website in the web phase. |
| Data safety | Declare voice recordings, user content, identifiers, purchases, analytics ([Play Console Help](https://support.google.com/googleplay/android-developer/answer/10787469), search summary) | Same inventory as Apple's label. |
| New personal accounts | Personal developer accounts created after Nov 13 2023 must run a closed test with **12 testers opted in for 14 consecutive days** before production ([Play Console Help](https://support.google.com/googleplay/android-developer/answer/14151465), search summary) | Start the Android closed test weeks before the planned Play launch, or register an organization account. |
| Developer verification | Identity verification and app registration; user-side enforcement started Sep 30 2026 in Brazil, Indonesia, Singapore, Thailand, global in 2027 ([Android Developers blog](https://android-developers.googleblog.com/2026/03/android-developer-verification-rolling-out-to-all-developers.html), search summary) | Complete verification when creating the Play account. |
| Minors / age | Play Age Signals API (library 0.0.4, July 2026; Texas signals for accounts created after May 28 2026) ([release notes](https://developer.android.com/google/play/age-signals/release-notes)); July 15 2026 policy targets anonymous and random chat apps ([policy announcement](https://support.google.com/googleplay/android-developer/answer/17134731), search summary) | Same 18+ policy; no random chat. |
| Target API / billing library | API 36 from Aug 31 2026; Play Billing Library 8 (above) | Expo SDK 57+ and RevenueCat SDK 9+. |

### 6.3 Beyond the stores (flag for counsel)

California SB 243 (in effect Jan 1 2026) regulates "companion chatbots": AI disclosure, a published suicide and self-harm protocol with crisis referrals, extra duties for known minors, and a private right of action ([Future of Privacy Forum analysis](https://fpf.org/blog/understanding-the-new-wave-of-chatbot-legislation-california-sb-243-and-beyond/), search summary; I could not open the statute). Unmute's anti-companion design (bounded rehearsals, no romance, a debrief) is likely outside the definition, but the protocol and disclosure are cheap and already in the product principles; publish the crisis protocol on the website anyway.

---

## 7. Native-only features worth building

| Feature | How | Source facts | Priority |
|---|---|---|---|
| **Daily rep reminders** | `expo-notifications` local scheduled notifications (no server needed); server push (Expo push service) only for room invites and dares | Android 13+ users must opt in to notifications; iOS supports provisional authorization; push needs a development build on Android ([expo-notifications source](https://raw.githubusercontent.com/expo/expo/main/docs/pages/versions/v57.0.0/sdk/notifications.mdx)) | v1 |
| **Real-mode cue card as a Live Activity** | `expo-widgets` `createLiveActivity`: start locally when the user taps "I'm about to call", show the cue card and a 60-second warmup timer on the Lock Screen and Dynamic Island while they're in the real Phone app; end it with a `staleDate` | Live Activities show "on the Lock Screen, in the Dynamic Island"; UI via WidgetKit/SwiftUI ([ActivityKit](https://developer.apple.com/documentation/activitykit)); `expo-widgets` builds widgets and Live Activities from TypeScript with `@expo/ui`, needs a dev build; push updates optional ([expo-widgets SDK 57 source](https://raw.githubusercontent.com/expo/expo/main/docs/pages/versions/v57.0.0/sdk/widgets.mdx)) | v1 (it is the most "app-like" feature and a strong 4.2 answer) |
| **Home-screen widget** | Streak + "today's rep" with a deep link; interactive button (iOS 17+) | Widget code runs in an isolated runtime with only `@expo/ui/swift-ui` components and no hooks or async work (same source) | v1.1 |
| **Android equivalents** | Ongoing notification for the cue card; Android 16 "Live Updates" are for activities that are "ongoing, user-initiated, and time-sensitive" and need `POST_PROMOTED_NOTIFICATIONS` ([Live Updates](https://developer.android.com/develop/ui/views/notifications/live-update)). Android widgets: `expo-widgets` 58.0.0 changelog adds Android widgets (Glance) but the SDK 58 docs still list iOS only ([changelog](https://raw.githubusercontent.com/expo/expo/main/packages/expo-widgets/CHANGELOG.md)) | Treat Android widgets as experimental until documented | v1.2 |
| **Calendar reps** | Phase 1: "add a warmup to my calendar" with **write-only** access (iOS 17+) or the system event UI (no permission). Phase 2: opt-in full access, scan upcoming events on-device for words like "interview", "call", "dentist", and suggest a rep; send only the event title the user confirms | Write-only access is enough to create events; reading needs full access; the system calendar UI needs no permission ([expo-calendar source](https://raw.githubusercontent.com/expo/expo/main/docs/pages/versions/v57.0.0/sdk/calendar.mdx)); 5.1.1(iii) data minimization | v1 (phase 1), v1.2 (phase 2) |
| **Share clips** | Server renders a short clip (voice-changed by default, captions) and the app opens the share sheet with `expo-sharing` | A clip of the user's voice is sensitive: explicit per-clip consent | v1.1 |
| **Haptics** | `expo-haptics` around (not during) live audio | See the iOS caveat in 3.2 | v1 |
| **Siri / Shortcuts ("start my daily rep")** | `expo-app-intents` | Alpha in SDK 58, "will frequently experience breaking changes" ([source](https://raw.githubusercontent.com/expo/expo/main/docs/pages/versions/v58.0.0/sdk/app-intents.mdx)) | Later |
| **Offline** | Cache scenarios, cue cards, past debriefs and the streak locally; queue analytics; rehearsals need a network, so show "offline: here's your cue card" instead of an error. Real-mode's cue card must work with no signal. | Expo Router apps "are cached and run offline-first" ([Router intro source](https://raw.githubusercontent.com/expo/expo/main/docs/pages/router/introduction.mdx)) | v1 |
| **Universal links** | Mirror web routes in Expo Router (`/r/[scenario]`, `/room/[code]`, `/dare/[id]`) so links shared from the site or a friend open the app | Every Expo Router screen is deep linkable (same source) | v1 |

---

## 8. Testing and release

- **Builds:** EAS profiles `development` (dev client on physical devices), `preview` (internal distribution to the founder and friends), `production`. EAS Workflows can build on every push to main and submit to TestFlight ([EAS Submit iOS source](https://raw.githubusercontent.com/expo/expo/main/docs/pages/submit/ios.mdx)).
- **TestFlight:** up to 100 internal testers; **up to 10,000 external testers** via email or **public links** (good for the website waitlist); the first external build needs Beta App Review ([TestFlight](https://developer.apple.com/testflight/)).
- **Google Play:** first `eas submit` creates an internal-testing release; then closed testing (12 testers x 14 days for new personal accounts); then production.
- **Crash reporting:** Sentry. `@sentry/react-native` 8.29.0 ([npm](https://registry.npmjs.org/@sentry/react-native)); setup via `npx @sentry/wizard -i reactNative`; source maps upload automatically on EAS Build with `SENTRY_AUTH_TOKEN`, and after `eas update` with an upload script; free tier "up to 5,000 events per month" ([Expo Sentry guide source](https://raw.githubusercontent.com/expo/expo/main/docs/pages/guides/using-sentry.mdx)). Mobile session replay masks all text, images and webviews by default ([Sentry docs](https://docs.sentry.io/platforms/react-native/session-replay/privacy/), search summary): **keep masking on**, because transcripts and debriefs are private.
- **Analytics:** PostHog on both web and mobile so the funnel (site visit, first rep, first debrief, paywall, day-7 rep) is one project; RN SDK has feature flags (useful for the US link-out flag) and masked session replay ([PostHog RN docs](https://posthog.com/docs/libraries/react-native), search summary); `posthog-react-native` 4.78.4 ([npm](https://registry.npmjs.org/posthog-react-native)). Never send transcript text to analytics; no cross-app tracking, so no App Tracking Transparency prompt.
- **OTA updates:** EAS Update for JS-only fixes, with runtime versions so an update never reaches a binary with different native code; behavior changes still go through review.
- **Voice QA matrix (physical devices, before every release):** iPhone speaker, wired headphones, AirPods, another Bluetooth headset; incoming call mid-rep; Siri mid-rep; screen lock; Low Power Mode; Wi-Fi to LTE handoff mid-rep; airplane mode at start; a Pixel and a Samsung on Android 15/16 with a Bluetooth headset. Measure: time to first persona audio, barge-in (user interrupts persona) success, echo on speakerphone, session end and debrief arrival rate.

---

## 9. Phased plan for the app

Week numbers count from the day mobile work starts (after the web app ships). The plan in `docs/plan/11-unmute.md` assumed mobile first; this follows the owner's new order (web first).

**Phase M0: during the web build (no separate weeks, prevents a rewrite later)**
- Monorepo: move `web/` to `apps/web`, pnpm + Turborepo, create `packages/{content,schemas,api-client,scoring,tokens,voice,config}`; server-only `prompts`, `debrief`.
- Backend pieces the app will reuse: auth, the ElevenLabs conversation-token endpoint with entitlement + quota checks, rehearsal/debrief storage, account deletion endpoint and web page, crisis-routing copy.
- RevenueCat project with the Stripe integration live on the web from day one, so web subscribers already exist as RevenueCat customers.
- A custom API domain (the Vercel project protects non-custom domains).
- Accounts: Apple Developer Program (99 USD/year, [Apple](https://developer.apple.com/programs/whats-included/)), Google Play Console (decide personal vs organization; organization avoids the 12-tester rule but needs company verification), reserve the app name and bundle IDs once the name is final.
- Exit: the website's rehearsal flow uses only the shared packages and the public API, nothing the app can't call.

**Phase M1: weeks 1 to 2, skeleton and the voice go/no-go spike**
- Expo app on the latest stable SDK (likely 58), Expo Router, Uniwind with shared tokens, fonts, dark/light, Sentry.
- Sign-in (Sign in with Apple + email; Google optional), session storage in `expo-secure-store`.
- One scenario end to end on physical devices with `@elevenlabs/react-native` (LiveKit 2.12.x pinned): speaker, wired, AirPods, interruption by a real call, echo on speaker.
- **Exit (go/no-go):** a 3-minute rep works on 3 iPhones and 2 Androids with headphones routing correctly and no self-interruption from echo. If routing cannot be fixed in JS, budget one week for an Expo native module that owns the audio session (or drop to the ElevenLabs Swift SDK for iOS only).

**Phase M2: weeks 3 to 5, the core loop**
- Scenario library from `packages/content`, persona/mood picker, the rehearsal screen (live waveform from native volume, timer, mute, end, text-first mode), interruption/pause handling, the debrief screen from the API, history, patterns, streaks.
- Onboarding consent (third-party AI disclosure), mic explainer and permission, 18+ gate with Declared Age Range / Play Age Signals, crisis-language routing UI, "report this" on AI turns, account deletion, privacy policy link.
- Local daily-rep reminders.
- **Exit:** ten friends complete five reps each on TestFlight internal; 8 of 10 call the debrief useful (the plan's original bar).

**Phase M3: weeks 6 to 8, money and beta**
- RevenueCat: products in App Store Connect and Play Console, paywall after the first debrief, restore, entitlement sync with web purchases, server webhooks; US web-purchase button behind a flag.
- PostHog funnel; Sentry release health.
- TestFlight external beta via public link to the waitlist. **Start the Google Play closed test now** (14-day clock).
- **Exit:** a sandbox purchase on iOS and Android and a Stripe purchase on the web all unlock Plus on all three; free-tier quota enforced by the token endpoint.

**Phase M4: weeks 8 to 10, native extras and App Store launch**
- Real-mode Live Activity cue card + 60-second warmup; streak widget; calendar reps phase 1 (write-only); share clips.
- App Store metadata, privacy label, age rating questionnaire (incl. social-media question), review notes explaining AI vendors, Teams (3.1.3(c)) and the web purchase link.
- **Exit:** App Store approval; crash-free sessions above 99.5% in the beta.

**Phase M5: weeks 10 to 13, Android launch and growth features**
- Android polish (audio focus, Bluetooth, notification channels, cue-card ongoing notification), Data safety, Play production.
- Practice rooms and dares on mobile (UGC controls from 6.1), calendar reps phase 2, Android widgets if `expo-widgets` documents them by then.
- **Exit:** Play approval; week-4 retention and paid conversion tracked per platform.

Rough running cost added by mobile (excluding voice minutes, which are the same per rep on any platform): Apple Developer 99 USD/year; EAS Starter $19/month or the free plan at first; RevenueCat free under $2,500 MTR; Sentry and PostHog free tiers at beta scale.

---

## 10. Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | The RN SDK hardcodes `defaultOutput: "speaker"`, which may override headphones/AirPods (Apple: with `defaultToSpeaker`, plugging in a headset doesn't change the route) | Medium | High (headphones are the cringe fix) | P0 device test in M1; override after start with LiveKit's AudioSession, or replace the setup via `setSetupStrategy` (exported from `@elevenlabs/client/internal`, "no semver guarantees"), or an Expo native module |
| 2 | LiveKit 3.0 vs the SDK's `^2.12.0` peer range | High (already true) | Medium | Pin 2.12.x; upgrade with ElevenLabs |
| 3 | Echo on speakerphone makes the persona interrupt itself | Medium | High | Verify echo cancellation per device; prompt "headphones recommended" before the first rep |
| 4 | Expo SDK churn (3 a year) and Apple's iOS 27 SDK requirement in April 2027 | Certain | Medium | Upgrade each SDK within ~6 weeks; CI on `expo-doctor` |
| 5 | Epic v. Apple remand or Supreme Court reinstates a US link-out commission | Medium | Low to medium | Link-out behind a remote flag; IAP always available |
| 6 | Google's US fees changed Oct 1 2026; the live Play billing rate not confirmed | Medium | Low | Use Play Billing; re-check the Service fees page at launch |
| 7 | App Review pushback on AI disclosure, age rating, UGC or "therapy-like" wording | Medium | Medium | Section 6 checklist; detailed review notes; 18+ |
| 8 | Cost abuse: tampered clients changing prompts or starting unlimited sessions | Medium | High | Prompt overrides off; quota and session caps in the token endpoint; short-lived tokens |
| 9 | Interruptions (calls, Siri) leave sessions in a bad state | High | Medium | Pause/end on interruption; partial debrief; iOS 27 life-cycle notifications |
| 10 | Haptics silent during live audio on iOS | Certain | Low | Design haptics around the session; optional native flag |
| 11 | Duplicate React versions across apps in the monorepo | Medium | Medium | `peerDependencies` in shared packages; `pnpm why react` in CI |
| 12 | Play closed-test rule delays Android by 2+ weeks | High for personal accounts | Low | Start the closed test in M3 or use an organization account |
| 13 | State age-assurance and chatbot laws (Texas, Utah, Louisiana, California SB 243) | Medium | Medium | 18+ gate, age APIs, published crisis protocol, counsel review |
| 14 | Privacy promise ("never used to train models, deleted on request") must hold at every vendor (ElevenLabs, LLM, Sentry, PostHog) | Medium | High (trust is the product) | Vendor terms and retention settings checked in the web phase; deletion fans out to vendors |

---

## 11. Open questions for the owner

1. Apple and Google developer accounts: personal or company? (A company account avoids Play's 12-tester rule and puts a business name on the store page; it needs company verification.)
2. Minimum age: 18+ at launch (recommended) or 16+?
3. Should rehearsals continue with the screen locked, or always pause when the app leaves the foreground (recommended for v1)?
4. US iOS: test the "subscribe on the web" link from day one, or launch IAP-only and add it later?
5. Final product name (needed for bundle IDs, the App Store name reservation and the API domain).
6. Android in the first launch, or iOS-only for the first month (recommended: iOS first, Android 2 to 3 weeks later)?

---

## 12. Source index

Apple (read): [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) · [Developer News RSS](https://developer.apple.com/news/rss/news.rss) incl. [age ratings Jul 2025](https://developer.apple.com/news/?id=ks775ehf), [guidelines Nov 2025](https://developer.apple.com/news/?id=ey6d8onl), [Feb 2026](https://developer.apple.com/news/?id=d75yllv4), [Jun 2026](https://developer.apple.com/news/?id=a233fmpw), [US link-out May 2025](https://developer.apple.com/news/?id=9txfddzf), [Texas Jun 2026](https://developer.apple.com/news/?id=sg176nne), [age laws Feb 2026](https://developer.apple.com/news/?id=f5zj08ey), [Time Allowances](https://developer.apple.com/news/?id=0d2gpmml), [social media questions](https://developer.apple.com/news/?id=tlur8uvi), [SDK minimums Feb 2026](https://developer.apple.com/news/?id=ueeok6yw), [iOS 27 submissions](https://developer.apple.com/news/?id=k1mtkt1k), [subscriptions iOS 27](https://developer.apple.com/news/?id=likeohx4), [12-month commitment](https://developer.apple.com/news/?id=agq42lxe) · AVAudioSession: [playAndRecord](https://developer.apple.com/documentation/avfaudio/avaudiosession/category-swift.struct/playandrecord), [voiceChat](https://developer.apple.com/documentation/avfaudio/avaudiosession/mode-swift.struct/voicechat), [defaultToSpeaker](https://developer.apple.com/documentation/avfaudio/avaudiosession/categoryoptions-swift.struct/defaulttospeaker), [allowBluetoothHFP](https://developer.apple.com/documentation/avfaudio/avaudiosession/categoryoptions-swift.struct/allowbluetoothhfp), [allowBluetoothA2DP](https://developer.apple.com/documentation/avfaudio/avaudiosession/categoryoptions-swift.struct/allowbluetootha2dp), [bluetoothHighQualityRecording](https://developer.apple.com/documentation/avfaudio/avaudiosession/categoryoptions-swift.struct/bluetoothhighqualityrecording), [interruptions](https://developer.apple.com/documentation/avfaudio/handling-audio-interruptions), [haptics during recording](https://developer.apple.com/documentation/avfaudio/avaudiosession/allowhapticsandsystemsoundsduringrecording) · [NSMicrophoneUsageDescription](https://developer.apple.com/documentation/bundleresources/information-property-list/nsmicrophoneusagedescription) · [ActivityKit](https://developer.apple.com/documentation/activitykit) · [WidgetKit extension](https://developer.apple.com/documentation/widgetkit/creating-a-widget-extension) · [External Purchase](https://developer.apple.com/documentation/storekit/external-purchase) · [App privacy details](https://developer.apple.com/app-store/app-privacy-details/) · [Account deletion](https://developer.apple.com/support/offering-account-deletion-in-your-app/) · [Age rating values](https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions/) · [TestFlight](https://developer.apple.com/testflight/) · [Small Business Program](https://developer.apple.com/app-store/small-business-program/) · [Subscriptions](https://developer.apple.com/app-store/subscriptions/) · [Program fee](https://developer.apple.com/programs/whats-included/)

Android / Google (read): [Choice and openness, Mar 4 2026](https://developer.android.com/blog/posts/a-new-era-for-choice-and-openness) · [Target API](https://developer.android.com/google/play/requirements/target-sdk) · [Alternative billing APIs + PBL 8 deadline](https://developer.android.com/google/play/billing/alternative) · [Audio focus](https://developer.android.com/media/optimize/audio-focus) · [FGS types](https://developer.android.com/develop/background-work/services/fgs/service-types) · [Live Updates](https://developer.android.com/develop/ui/views/notifications/live-update) · [Play Age Signals release notes](https://developer.android.com/google/play/age-signals/release-notes). Search summary only: [US policies](https://support.google.com/googleplay/android-developer/answer/15582165), [external content links](https://support.google.com/googleplay/android-developer/answer/16470497), [service fees](https://support.google.com/googleplay/android-developer/answer/112622), [AI-generated content](https://support.google.com/googleplay/android-developer/answer/14094294), [account deletion](https://support.google.com/googleplay/android-developer/answer/13327111), [Data safety](https://support.google.com/googleplay/android-developer/answer/10787469), [12 testers](https://support.google.com/googleplay/android-developer/answer/14151465), [developer verification](https://android-developers.googleblog.com/2026/03/android-developer-verification-rolling-out-to-all-developers.html), [Jul 15 2026 policy](https://support.google.com/googleplay/android-developer/answer/17134731).

Expo (read from the docs source in `expo/expo`): [SDK compatibility data](https://raw.githubusercontent.com/expo/expo/main/packages/@expo/sdk-compatibility/src/sdk-compatibility.json) · [SDK reference](https://raw.githubusercontent.com/expo/expo/main/docs/pages/versions/v57.0.0/index.mdx) · [dev builds](https://raw.githubusercontent.com/expo/expo/main/docs/pages/develop/development-builds/introduction.mdx) · [New Architecture](https://raw.githubusercontent.com/expo/expo/main/docs/pages/guides/new-architecture.mdx) · [monorepos](https://raw.githubusercontent.com/expo/expo/main/docs/pages/guides/monorepos.mdx) · [Tailwind](https://raw.githubusercontent.com/expo/expo/main/docs/pages/guides/tailwind.mdx) · [Next.js](https://raw.githubusercontent.com/expo/expo/main/docs/pages/guides/using-nextjs.mdx) · [DOM components](https://raw.githubusercontent.com/expo/expo/main/docs/pages/guides/dom-components.mdx) · [Router](https://raw.githubusercontent.com/expo/expo/main/docs/pages/router/introduction.mdx) · [EAS Build](https://raw.githubusercontent.com/expo/expo/main/docs/pages/build/introduction.mdx) · [EAS Submit iOS](https://raw.githubusercontent.com/expo/expo/main/docs/pages/submit/ios.mdx) / [Android](https://raw.githubusercontent.com/expo/expo/main/docs/pages/submit/android.mdx) · [EAS Update](https://raw.githubusercontent.com/expo/expo/main/docs/pages/eas-update/introduction.mdx) · [plans](https://raw.githubusercontent.com/expo/expo/main/docs/pages/billing/plans.mdx) · [widgets SDK 57](https://raw.githubusercontent.com/expo/expo/main/docs/pages/versions/v57.0.0/sdk/widgets.mdx) · [widgets changelog](https://raw.githubusercontent.com/expo/expo/main/packages/expo-widgets/CHANGELOG.md) · [app-intents SDK 58](https://raw.githubusercontent.com/expo/expo/main/docs/pages/versions/v58.0.0/sdk/app-intents.mdx) · [audio](https://raw.githubusercontent.com/expo/expo/main/docs/pages/versions/v57.0.0/sdk/audio.mdx) · [calendar](https://raw.githubusercontent.com/expo/expo/main/docs/pages/versions/v57.0.0/sdk/calendar.mdx) · [notifications](https://raw.githubusercontent.com/expo/expo/main/docs/pages/versions/v57.0.0/sdk/notifications.mdx) · [haptics](https://raw.githubusercontent.com/expo/expo/main/docs/pages/versions/v57.0.0/sdk/haptics.mdx) · [Sentry](https://raw.githubusercontent.com/expo/expo/main/docs/pages/guides/using-sentry.mdx) · [IAP](https://raw.githubusercontent.com/expo/expo/main/docs/pages/guides/in-app-purchases.mdx) · [analytics](https://raw.githubusercontent.com/expo/expo/main/docs/pages/guides/using-analytics.mdx). Search summary: [SDK 57 changelog](https://expo.dev/changelog/sdk-57), [SDK 58 beta](https://expo.dev/changelog/sdk-58-beta), [pricing](https://expo.dev/pricing).

ElevenLabs / LiveKit (read: npm packages and GitHub): [@elevenlabs/react-native](https://registry.npmjs.org/@elevenlabs/react-native) (source of 1.2.28) · [@elevenlabs/client](https://registry.npmjs.org/@elevenlabs/client) (typings of 1.26.0) · [RN README](https://raw.githubusercontent.com/elevenlabs/packages/main/packages/react-native/README.md) · [Expo example](https://raw.githubusercontent.com/elevenlabs/packages/main/examples/react-native-expo/package.json) · [@livekit/react-native](https://registry.npmjs.org/@livekit/react-native) · [LiveKit Expo plugin](https://registry.npmjs.org/@livekit/react-native-expo-plugin) · [@config-plugins/react-native-webrtc](https://registry.npmjs.org/@config-plugins/react-native-webrtc). Search summary: [RN SDK docs](https://elevenlabs.io/docs/eleven-agents/libraries/react-native), [Expo guide](https://elevenlabs.io/docs/eleven-agents/guides/integrations/expo-react-native), [conversation token API](https://elevenlabs.io/docs/api-reference/conversations/get-webrtc-token), [Swift SDK](https://elevenlabs.io/docs/eleven-agents/libraries/swift), [Kotlin SDK](https://elevenlabs.io/docs/agents-platform/libraries/kotlin), [Scribe React](https://elevenlabs.io/docs/eleven-api/resources/libraries/scribe-stt/react-scribe).

Payments (search summary): [RevenueCat pricing](https://www.revenuecat.com/pricing) · [RevenueCat + Stripe](https://www.revenuecat.com/integrations/stripe) · [Web Purchase button](https://www.revenuecat.com/docs/tools/paywalls/creating-paywalls/web-purchase-button) · [PBL 8 in RevenueCat v9](https://www.revenuecat.com/blog/engineering/google-play-billing-v8) · [Stripe pricing](https://stripe.com/pricing) · [Stripe Billing pricing](https://stripe.com/billing/pricing). Epic v. Apple: [Ninth Circuit opinion](https://cdn.ca9.uscourts.gov/datastore/opinions/2025/12/11/25-2935.pdf) · [Fenwick](https://www.fenwick.com/insights/publications/ninth-circuit-largely-upholds-ruling-in-epic-v-apple) · [9to5Mac](https://9to5mac.com/2026/03/30/ninth-circuit-unanimously-denies-apples-rehearing-requests-in-epic-games-case/) · [CNBC](https://www.cnbc.com/2026/05/06/supreme-court-declines-to-pause-order-holding-apple-in-contempt-in-epic-games-lawsuit.html) · [MacRumors](https://www.macrumors.com/2026/06/30/apple-epic-games-supreme-court/) · [Apple 10-Q](https://www.sec.gov/Archives/edgar/data/0000320193/000032019326000020/aapl-20260627.htm).

Other: [Capacitor config](https://raw.githubusercontent.com/ionic-team/capacitor-docs/main/docs/main/reference/config.md) (read) · [Turborepo internal packages](https://raw.githubusercontent.com/vercel/turborepo/main/apps/docs/content/docs/core-concepts/internal-packages.mdx) (read) · npm registry for [uniwind](https://registry.npmjs.org/uniwind), [nativewind](https://registry.npmjs.org/nativewind), [tamagui](https://registry.npmjs.org/tamagui), [reanimated](https://registry.npmjs.org/react-native-reanimated), [@sentry/react-native](https://registry.npmjs.org/@sentry/react-native), [posthog-react-native](https://registry.npmjs.org/posthog-react-native), [react-native-purchases](https://registry.npmjs.org/react-native-purchases) (read) · [Supabase Sign in with Apple](https://supabase.com/docs/guides/auth/social-login/auth-apple) (Supabase docs search tool) · [Sentry RN replay privacy](https://docs.sentry.io/platforms/react-native/session-replay/privacy/), [PostHog RN](https://posthog.com/docs/libraries/react-native), [FPF on SB 243](https://fpf.org/blog/understanding-the-new-wave-of-chatbot-legislation-california-sb-243-and-beyond/) (search summary).
