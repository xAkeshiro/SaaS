# Asterisk launch page (preview)

`index.html` is the static launch landing page as previewed on 13 Sep 2026. It is self-contained (Google Fonts only).

Two things are preview-only and need wiring before this goes live on a real domain:

- **Waitlist form.** Currently stores the email in the visitor's own browser and shows a success state. Wire `joinList()` to a real backend (Resend or Loops for the email, Supabase for the list) when deploying.
- **"Paste the fine print" demo.** Inside the claude.ai artifact it asks Claude live through the page runtime. On a public domain, replace `sampleFn` with a call to your own API route that uses the Claude API with the same prompt in `buildPrompt()`. The four samples work without any backend.

Deploy target: Vercel (static) or Next.js when the app is built.
