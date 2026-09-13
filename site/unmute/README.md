# Unmute launch page (preview)

`index.html` is the static launch landing page as previewed on 13 Sep 2026. Self-contained (Google Fonts only).

Preview-only pieces to wire before going live on a real domain:

- **Waitlist form.** Stores the email in the visitor's browser and shows a success state. Wire `joinList()` to a real backend (Resend or Loops for the email, Supabase for the list).
- **Rehearsal demo.** Inside the claude.ai artifact it roleplays the other person and writes the debrief through the page runtime. On a public domain, replace `sampleFn` with calls to your own API route using the Claude API with the prompts in `personaPrompt()` and `endRehearsal()`. The product itself is voice-first: the real app uses a realtime voice model (OpenAI realtime or ElevenLabs Agents) rather than the browser's speech synthesis used here.
- **Speech input.** Uses the browser's SpeechRecognition where available; falls back to typing.
