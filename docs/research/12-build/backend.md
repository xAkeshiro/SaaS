# Unmute: backend, data, payments, safety, privacy and operations

Research report for the web-app build (site first), designed so the Expo app reuses the same backend.
Date: 2026-10-02. Every vendor fact carries a source link. Where I could not verify something it is marked **UNVERIFIED**.

**How this was researched.** The sandbox blocked direct page fetches for supabase.com, vercel.com, stripe.com, elevenlabs.io, privacy.claude.com, revenuecat.com, leginfo.legislature.ca.gov, ilga.gov, atg.wa.gov and 988lifeline.org. For those I used (a) the Supabase MCP `search_docs` tool, which returns the official docs text, (b) web-search summaries of the official pages (each is cited by the official URL the summary came from), and (c) direct fetches where allowed (anthropic.com, platform.claude.com, support.claude.com, developer.apple.com). Facts that came only from third-party sites are labelled as such.

---

## 0. Decisions at a glance

| Area | Recommendation | Why, in one line |
|---|---|---|
| Hosting | Vercel **Pro** (upgrade before taking money) | Hobby is non-commercial only; Pro gives 800 s functions, minute-level cron, 40 WAF rules |
| Auth | **Supabase Auth**: email code + magic link, Google, Sign in with Apple, anonymous first rep | One user table for web and Expo, RLS uses the same JWT, native Apple sign-in on iOS |
| Database | **Supabase Postgres** (new org on Pro) with RLS on every exposed table | Same identity as auth, RLS is the security boundary for direct client reads |
| Audio storage | **Store no raw audio by default**; Supabase Storage private bucket only for clips a user explicitly saves | Smallest privacy and biometric surface |
| Durable jobs | **Vercel Workflows** (GA) for the post-rehearsal pipeline and webhook processing; Vercel Cron and Supabase Cron for schedules | Lives in the same Next.js codebase, survives retries and deploys |
| Rate limiting | Vercel WAF rule (edge, per IP) + BotID on expensive routes + Upstash Ratelimit (per user) + quota check in Postgres (authoritative) | Each layer stops a different abuse |
| Email | **Resend** (also as Supabase Auth custom SMTP) | Cheap, simple, free tier covers early access |
| Analytics | Vercel Web Analytics on marketing pages; **PostHog** for product events and feature flags | Cookieless marketing analytics; one product-analytics and flags tool shared by web and app |
| Errors | **Sentry** with transcript scrubbing | Standard; free tier to start |
| Payments (web) | **Stripe** Checkout + Billing + Customer Portal + Entitlements; decide Stripe Tax vs Managed Payments (merchant of record) | Self-serve subscriptions with a hosted portal |
| Payments (app, later) | **RevenueCat** as the entitlement aggregator; Stripe purchases imported into it | One entitlement answer across Stripe, App Store, Play |
| Minimum age | **18+ at launch** | ElevenLabs terms bar under-18 use without parental consent; Anthropic requires extra safeguards for minors; COPPA, CA SB 243 and Texas SB 2420 add duties |
| Geography | **US only at launch**; block EU/UK sign-ups until a GDPR and EU AI Act review | Health-adjacent data plus voice; EU rules add duties |
| Training | Anthropic API (contractually no training) + **turn off ElevenLabs "Improve the models" toggle before any user audio flows** | ElevenLabs trains on non-enterprise data by default |

---

## 1. What the owner's accounts look like today (read-only check)

All calls below were reads. Nothing was created or changed.

### Supabase (via `list_organizations`, `list_projects`, `get_organization`, `get_project`, `get_cost`)

- One organization: **"Limo Hunter"** (`psjfypylqksgltubsnqo`), plan **free**.
- One project: **"Limohunter v2 Database"** (`jnwgffyzrmmlecrglsjt`), region us-west-2, Postgres 17.6, status ACTIVE_HEALTHY, created 2026-09-29. It belongs to a different product.
- **There is no Unmute project.** `get_cost` reports $0/month for another project in this free org.
- Implication: create a **separate organization for Unmute** (own billing, own DPA, own access list) and put it on Pro before launch. Free projects are paused after a week of low activity, and only paid projects are exempt ([Supabase, Project Pausing](https://supabase.com/docs/guides/platform/free-project-pausing)). Free-plan backups are not downloadable ([Supabase, Production Checklist](https://supabase.com/docs/guides/deployment/going-into-prod)).

### Vercel (via `list_teams`, `get_team`, `list_projects`, `get_project`)

- Team **"Eden's projects"** (`team_80th0r5pfHlXnOO7XxCgyemo`, slug `edens-projects-6c8c63a6`) with 25+ projects (other products share it).
- Project **`web`** (`prj_aYmxJrDQW4Saw1GiVRn7WUZ1Xh0y`): Next.js, Node 24.x, latest production deployment `dpl_BZjPFbgWFNmZJpUN4RFzRQX2HC3F` READY; domains `web-beta-ivory-95.vercel.app`, `web-edens-projects-6c8c63a6.vercel.app` and the branch alias. **No custom domain yet.** Deployment protection: SSO on all deployments except custom domains (previews are private, which is what we want).
- **Plan: UNVERIFIED.** `get_team` returned no billing field and `list_billing_charges` answered 404 "Plan not found"; that pattern suggests Hobby but I could not confirm it. Listing env vars and integrations returned 403 for the MCP token, so I could not see whether `ANTHROPIC_API_KEY` is set in production (which decides whether the public demo is spending real tokens).
- Implication: **Hobby is restricted to non-commercial personal use; commercial use (taking payments, advertising products) requires Pro** ([Vercel, Fair Use Guidelines](https://vercel.com/docs/limits/fair-use-guidelines)). Upgrade the team (or move `web` into a dedicated Unmute team on Pro) before Stripe goes live. Pro is $20/month with $20 of usage credit and $20 per additional deploying seat ([Vercel, Pro plan](https://vercel.com/docs/plans/pro-plan)).

### ElevenLabs (via `agents_list`)

- **Zero agents** in the workspace. The MCP server exposes no subscription or credit read, so the plan tier and remaining credits are **UNVERIFIED**; check them in the dashboard.
- Before any user audio is sent: open **Profile, Terms and privacy, Data use** and disable **"Improve the models for everyone"**. For non-enterprise accounts this is on by default and the opt-out only applies going forward ([ElevenLabs help, Is my data used to improve ElevenLabs' AI models?](https://elevenlabs.io/docs/help-center/legal/is-my-data-used-to-improve-eleven-labs-ai-models)).

### Two issues in the current code worth fixing early

1. **`/api/rehearse` is unauthenticated and unthrottled**, and it accepts `scenario.who` and `scenario.setup` from the request body and places them in the **system prompt** (`buildPersonaSystem` in `web/lib/rehearse.ts`). Anyone can post arbitrary "scenario" text and use the route as a free Claude proxy (cost risk) or inject instructions (safety risk). Fix: look built-in scenarios up by id on the server; put any user-written setup in a delimited user-content block, not in `system`; add the rate limits in section 3.5.
2. **`/api/waitlist` logs the email payload to the console** when no webhook is configured, which puts email addresses in Vercel logs. Write to a `waitlist` table instead and log nothing personal.

---

## 2. Architecture

```
 Browser (Next.js app)            Expo app (later)
        |  Supabase JWT (cookie)        |  Supabase JWT (bearer)
        v                               v
 +-------------------------------------------------------------+
 | Next.js on Vercel  /api/v1/*  (route handlers, Node runtime) |
 |  - auth check, quota check, safety precheck                  |
 |  - mints short-lived voice session tokens                    |
 |  - Stripe / ElevenLabs / RevenueCat webhooks                 |
 |  - Vercel Workflows: post-rehearsal pipeline, deletion fan-out|
 +-----+--------------+---------------+--------------+----------+
       |              |               |              |
       v              v               v              v
  Supabase       ElevenLabs       Anthropic       Stripe (web)
  Postgres+RLS   STT/TTS/Agents   persona +       RevenueCat (app)
  Auth, Storage  (voice in/out)   debrief +       Resend, PostHog,
  Cron, Queues                    safety classif. Sentry, Upstash
```

Rules that make the mobile app a reuse, not a rewrite:

- **API-first.** Every capability is a versioned route under `/api/v1`. The web UI calls the same routes the app will. Accept the Supabase access token from either the cookie (web) or an `Authorization: Bearer` header (app).
- **Direct-from-client reads only where RLS fully covers them** (history, debriefs, streaks). **All writes that cost money or affect quotas go through the server** (start rehearsal, end rehearsal, debrief, purchases).
- **Provider keys never reach a client.** For voice, the server mints a short-lived credential: ElevenLabs signed URLs expire after 15 minutes and WebRTC conversation tokens after 10 minutes, and ElevenLabs says never to expose the API key client-side ([ElevenLabs, Agent authentication](https://elevenlabs.io/docs/eleven-agents/customization/authentication)).
- **Co-locate** the Vercel function region with the Supabase region (pick one US region for both).

---

## 3. Stack recommendation with reasons

### 3.1 Auth: Supabase Auth

| Option | For | Against | Verdict |
|---|---|---|---|
| **Supabase Auth** | Same Postgres as the data, RLS reads `auth.uid()` directly; 50,000 MAU free, 100,000 on Pro then $0.00325/MAU ([Supabase, MAU usage](https://supabase.com/docs/guides/platform/manage-your-usage/monthly-active-users)); native Sign in with Apple on iOS and Expo ([Supabase, Login with Apple](https://supabase.com/docs/guides/auth/social-login/auth-apple)); anonymous users that convert by linking an identity ([Supabase, Anonymous Sign-Ins](https://supabase.com/docs/guides/auth/auth-anonymous)) | Fewer prebuilt UI components; you build the screens | **Pick** |
| Clerk | Excellent prebuilt UI; free up to 50,000 monthly retained users since 2026-02-05; Pro $25/month or $20 billed annually ([Clerk pricing](https://clerk.com/pricing), [Clerk changelog 2026-02-05](https://clerk.com/changelog/2026-02-05-new-plans-more-value)) | A second user store; JWTs must be bridged into Supabase RLS; one more vendor holding personal data | Good, but unnecessary here |
| Auth.js | Free, self-hosted | Maintenance moved to the Better Auth team on 2025-09-22 and the library is now security-fixes-only ([nextauthjs discussion #13252](https://github.com/nextauthjs/next-auth/discussions/13252)) | **No** for a new build |

Methods to enable:

- **Email one-time code plus magic link.** Offer the 6-digit code alongside the link: Supabase notes that email security scanners can "click" single-use links before the user does ([Supabase, Production Checklist](https://supabase.com/docs/guides/deployment/going-into-prod)). Codes also work better inside a mobile app.
- **Google.**
- **Sign in with Apple.** Apple guideline 4.8 requires apps that use Google (or another social login) to also offer an equivalent privacy-preserving login; Sign in with Apple qualifies ([Apple, App Review Guidelines 4.8](https://developer.apple.com/app-store/review/guidelines/)). Turn it on for web too so accounts match across platforms. If you use the web OAuth flow, **Apple requires a new client secret every 6 months**; put a recurring reminder in the calendar ([Supabase, Login with Apple](https://supabase.com/docs/guides/auth/social-login/auth-apple)). On deletion, revoke the Apple token through Apple's REST API ([Apple, account deletion requirement](https://developer.apple.com/news/?id=12m75xbj)).
- **Anonymous sign-in for the first rep** (try before you give an email), converted with `linkIdentity` after the first debrief. Anonymous users use the `authenticated` role, so RLS must check the `is_anonymous` claim, and Supabase recommends CAPTCHA because the endpoint can be abused (default limit 30 per hour per IP) ([Supabase, Anonymous Sign-Ins](https://supabase.com/docs/guides/auth/auth-anonymous)). Schedule a purge of stale anonymous users (no automatic cleanup exists).
- **Custom SMTP through Resend** so auth emails come from your domain. With custom SMTP the default auth-email limit is **30 new users per hour**; raise it before any launch push ([Supabase, Production Checklist](https://supabase.com/docs/guides/deployment/going-into-prod)).
- Store authorization data (plan, org role) in tables or `app_metadata`, never `user_metadata`, which users can edit ([Supabase, RLS helper functions](https://supabase.com/docs/guides/database/postgres/row-level-security)).

### 3.2 Database: Supabase Postgres with RLS

- RLS **must** be on for every table in an exposed schema; tables created in raw SQL do not get it automatically ([Supabase, Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)). Install the documented event trigger that auto-enables RLS on new tables.
- Follow the documented performance rules: wrap `auth.uid()` as `(select auth.uid())`, index every column used in policies, add `to authenticated`, and put helper functions in a non-exposed `private` schema as `security definer` ([same page](https://supabase.com/docs/guides/database/postgres/row-level-security)).
- Views bypass RLS unless created `with (security_invoker = true)` ([same page](https://supabase.com/docs/guides/database/postgres/row-level-security)). This matters for Teams dashboards.
- Plan: Pro at $25/month plus compute; the docs' billing example shows a small instance at $15/month less a $10 compute credit ([Supabase, MAU usage billing examples](https://supabase.com/docs/guides/platform/manage-your-usage/monthly-active-users)). Enable PITR once the database passes about 4 GB, as the checklist recommends ([Supabase, Production Checklist](https://supabase.com/docs/guides/deployment/going-into-prod)).
- Compliance: Supabase offers a SOC 2 environment, a DPA for GDPR, and a BAA on Team plan and up ([Supabase, Shared Responsibility Model](https://supabase.com/docs/guides/deployment/shared-responsibility-model), [Supabase, GDPR compliance](https://supabase.com/docs/guides/security/gdpr-compliance)). Unmute is not a HIPAA covered entity, so no BAA is needed, but sign the DPA.

### 3.3 Storage: audio clips

- Default: **no raw audio is stored anywhere** (ours or the voice vendor's). Transcripts plus timing are enough for every debrief metric (time to the ask, apologies, filler words, hedges, pace).
- Clips (the shareable before-and-after) are created only by an explicit user action, stored in a **private** Supabase Storage bucket, served through short-lived signed URLs, voice-changed if the user chooses, and expire after 30 days unless the user pins them ([Supabase, Storage Buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals)).

### 3.4 Background jobs and queues

Work that must not run inside the user's request: the post-rehearsal pipeline (store transcript, compute metrics, write the Claude debrief, update streak and patterns, meter usage, delete the vendor's copy), Stripe and ElevenLabs webhook processing, deletion fan-out, nightly pattern recompute.

| Option | Facts | Fit |
|---|---|---|
| **Vercel Workflows** | GA since April 16; `"use workflow"` / `"use step"` make steps durable, retried, resumable across deploys; $0.02 per 1K events, 50,000 events/month included on Hobby ([Vercel, Workflows](https://vercel.com/docs/workflows), [Workflows pricing](https://vercel.com/docs/workflows/pricing)) | **Pick** for the pipeline and webhook handling |
| Vercel Queues | **Public beta**; 1M operations/month included, then $0.60 per 1M ([Vercel, Queues pricing](https://vercel.com/docs/queues/pricing)) | Wait for GA |
| Supabase Queues (pgmq) | Postgres-native, guaranteed delivery, exactly-once within a visibility window, RLS-controllable ([Supabase, Queues](https://supabase.com/docs/guides/queues)) | Good fallback; also good for in-database work |
| Inngest / Trigger.dev | Inngest free tier about 50,000 executions/month, Pro $99; Trigger.dev free with a $5 monthly credit (third-party summaries, **UNVERIFIED** on vendor pages) | Fine alternatives; one more vendor |

Limits to design around: with Fluid compute, Hobby functions run up to 300 s; Pro up to 800 s, with 1,800 s in beta ([Vercel, Functions limits](https://vercel.com/docs/functions/limitations)). Vercel Cron on Hobby runs at most once a day with an hour of jitter; Pro allows per-minute schedules ([Vercel, Cron usage and pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing)). Use **Supabase Cron** (pg_cron) for retention purges that are pure SQL ([Supabase, Cron](https://supabase.com/docs/guides/cron)).

### 3.5 Rate limiting and abuse

Four layers, each catching something different:

1. **Vercel WAF rate-limit rule** on `/api/*` per IP: first 1M allowed requests included, then $0.50 per 1M; Hobby gets 1 rule per project, Pro 40 ([Vercel, WAF rate limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting)).
2. **Vercel BotID** on sign-up, anonymous sign-in and "start rehearsal": Basic is free on all plans; Deep Analysis is $1 per 1,000 `checkBotId()` calls on Pro ([Vercel, BotID](https://vercel.com/docs/botid)).
3. **Upstash Ratelimit** per user id (token bucket) for start/turn/debrief calls: free 500K commands/month, then $0.20 per 100K ([Upstash, Redis pricing](https://upstash.com/pricing/redis)).
4. **Quota in Postgres** (the authoritative check): one rep per local day on Free, monthly voice-minute caps on paid plans (section 5.3). Rate limits stop floods; quotas protect margin.

### 3.6 Email: Resend

Free 3,000 emails/month with a 100/day cap; Pro $20/month for 50,000 with no daily cap ([Resend pricing](https://resend.com/pricing)). The daily cap matters for auth emails on launch day, so move to Pro before any campaign. Uses: auth codes, receipts (Stripe sends its own), streak nudges (opt-in only), deletion confirmations, Teams invites.

### 3.7 Analytics: Vercel Web Analytics plus PostHog

- **Marketing pages: Vercel Web Analytics.** No third-party cookies; visitors are identified by a request hash that resets daily ([Vercel, Web Analytics privacy](https://vercel.com/docs/analytics/privacy-policy)). Pro pricing is $0.03 per 1K events ([Vercel, Web Analytics pricing](https://vercel.com/docs/analytics/limits-and-pricing)).
- **Product analytics and flags: PostHog.** Free monthly allowance of 1M events, 5K session replays, 1M feature-flag requests and 100K exceptions ([PostHog pricing](https://posthog.com/pricing)).
- Hard rules: **send no transcript text, scenario text or audio to analytics**; events carry ids and numbers (`rehearsal_completed`, `duration_s`, `mood`, `score`). **Disable session replay on every rehearsal and debrief screen.** Identify users by an internal id, never email.

### 3.8 Error tracking: Sentry

Free Developer plan: one user, 5,000 errors/month; Team $26/month billed annually ([Sentry pricing](https://sentry.io/pricing/)). Add a `beforeSend` hook that drops request bodies and any field named like `text`, `transcript`, `setup`. The existing route already logs only error class names, which is the right habit.

### 3.9 Feature flags

PostHog flags (already in the stack) for product experiments and **kill switches**: `voice_enabled`, `signups_open`, `custom_scenarios_enabled`, `rooms_enabled`, `free_voice_seconds`. Vercel Flags is an alternative at $0.03 per 1K flag requests on Pro, 10K on Hobby ([Vercel, Flags pricing](https://vercel.com/docs/flags/vercel-flags/limits-and-pricing)).

### 3.10 LLM choice (cost note, owner's call)

The route defaults to `claude-opus-5`. Per Anthropic's model table (cached 2026-09-25), Claude Opus 5 is $5/$25 per million input/output tokens, **Claude Opus 5.5 is $4/$20** (newer and cheaper), Claude Sonnet 5.5 is $2/$10 and Claude Haiku 4.5 is $1/$5 ([Anthropic, Models overview](https://platform.claude.com/docs/en/about-claude/models/overview)). A debrief of about 4K input and 800 output tokens is roughly $0.03 on Opus 5.5 (my arithmetic). Moving to Opus 5.5 is a straight saving; whether to use a cheaper model for the in-call persona is a quality decision to test, not assume. Haiku 4.5 is a reasonable choice for the safety classifier (section 6).

---

## 4. Data model

Conventions: `public` schema is exposed with RLS on everything; `private` holds `security definer` helpers; `billing` and `ops` are **not exposed** (service role only). All timestamps `timestamptz`. All user-owned rows carry `user_id` (denormalized onto child tables so policies never join). Every policy is written `to authenticated using ((select auth.uid()) = user_id)` unless noted.

```sql
-- ===== Enums =====
create type mood            as enum ('kind','neutral','hostile');
create type rehearsal_mode  as enum ('text','voice','warmup');          -- warmup = real-mode 60 s
create type rehearsal_status as enum ('created','live','ended','debriefing','debriefed',
                                      'abandoned','stopped_safety','failed');
create type speaker         as enum ('user','persona','system');
create type plan_id         as enum ('free','plus','teams');
create type sub_source      as enum ('stripe','app_store','play_store','promo','team');
create type org_role        as enum ('owner','admin','coach','member');
create type safety_category as enum ('self_harm','suicide','harm_to_others','sexual','romance',
                                     'minor_signal','harassment','real_person_impersonation',
                                     'prompt_injection','illegal','other');

-- ===== People =====
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  timezone text not null default 'America/New_York',   -- defines the "day" for daily reps
  age_attested_at timestamptz,                          -- 18+ attestation (no DOB stored)
  age_method text,                                      -- 'self_attest' | 'app_store_signal' | ...
  region text,                                          -- US state, for state-law handling
  onboarding jsonb not null default '{}',
  created_at timestamptz default now(),
  deleted_at timestamptz                                -- soft-delete marker during fan-out
);
-- RLS: owner select/update. Insert by trigger on auth.users.

create table public.consents (
  id bigserial primary key,
  user_id uuid not null references auth.users on delete cascade,
  kind text not null,          -- 'terms','privacy','voice_processing','consumer_health_data',
                               -- 'marketing_email','calendar','share_with_org','clip_public'
  version text not null,       -- policy version the user saw
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  source text not null         -- 'web','ios','android'
);
-- RLS: owner select/insert; no update/delete from clients (append-only; revocation = new row).

-- ===== Content =====
create table public.scenarios (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users on delete cascade,  -- null = built-in
  slug text unique,                                       -- built-ins only
  title text not null,
  counterpart text not null,         -- "the receptionist", "my manager"
  setup text not null,               -- user text for custom scenarios (untrusted)
  goal text,                         -- "book the earliest slot", "$18/hr"
  category text,
  difficulty smallint default 2,
  moderation_status text not null default 'approved', -- 'pending','approved','rejected','crisis'
  moderation_notes text,
  created_at timestamptz default now()
);
-- RLS: select where owner_id is null (built-ins) OR owner_id = auth.uid();
--      insert/update/delete only own rows and only when entitlement allows custom scenarios
--      (check via (select private.has_entitlement('custom_scenarios'))).
--      Server sets moderation_status; clients cannot.

create table public.personas (            -- built-in voice/character presets
  id text primary key,                    -- 'receptionist_neutral'
  voice_id text not null,                 -- ElevenLabs voice id (library voice, never a clone)
  traits jsonb not null,
  active boolean default true
);
-- RLS: select to authenticated; writes service role only.

-- ===== Rehearsals =====
create table public.rehearsals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  scenario_id uuid references public.scenarios on delete set null,
  scenario_snapshot jsonb not null,       -- frozen copy so later edits don't rewrite history
  mood mood not null,
  mode rehearsal_mode not null,
  status rehearsal_status not null default 'created',
  room_id uuid,                           -- set for practice rooms
  max_seconds int not null,               -- cap decided at start from plan
  started_at timestamptz, ended_at timestamptz,
  duration_ms int, user_talk_ms int,
  ended_reason text,                      -- 'user','cap','safety','network'
  provider text,                          -- 'elevenlabs_agents' | 'pipeline' | 'text'
  provider_conversation_id text unique,   -- ElevenLabs conversation_id
  llm_model text, prompt_version text,
  client text,                            -- 'web','ios','android'
  counts_as_rep boolean default false,    -- set when it reaches a debrief
  transcript_expires_at timestamptz,      -- retention (section 7)
  created_at timestamptz default now()
);
create index on public.rehearsals (user_id, created_at desc);
-- RLS: owner select only. Insert/update via server (start/end endpoints) to protect quota fields.

create table public.turns (
  id bigserial primary key,
  rehearsal_id uuid not null references public.rehearsals on delete cascade,
  user_id uuid not null,                  -- denormalized for RLS without joins
  seq int not null,
  speaker speaker not null,
  text text not null,
  start_ms int, end_ms int,               -- offsets from rehearsal start
  interrupted boolean default false,
  stt_confidence real,
  unique (rehearsal_id, seq)
);
create index on public.turns (user_id);
-- RLS: owner select. Writes: server only (from provider transcript), so metrics can't be spoofed.

create table public.debriefs (
  rehearsal_id uuid primary key references public.rehearsals on delete cascade,
  user_id uuid not null,
  score smallint check (score between 0 and 10),
  worked jsonb not null, folded jsonb not null,
  next_lines text[] not null check (array_length(next_lines,1) = 2),
  pattern text,
  metrics jsonb not null,  -- {time_to_ask_ms, apologies, fillers, hedges, wpm,
                           --  talk_ratio, held_number, interruptions}
  model text, prompt_version text,
  created_at timestamptz default now()
);
-- RLS: owner select. Writes: server only.

create table public.patterns (           -- "you apologize before every ask"
  user_id uuid not null references auth.users on delete cascade,
  key text not null,                     -- 'apology_before_ask'
  label text not null,
  occurrences int not null default 0,
  first_seen timestamptz, last_seen timestamptz,
  evidence uuid[] not null default '{}', -- rehearsal ids
  status text not null default 'active', -- 'active','improving','resolved'
  primary key (user_id, key)
);
-- RLS: owner select. Recomputed by nightly job from debriefs.metrics.

-- ===== Habit =====
create table public.rep_days (
  user_id uuid not null references auth.users on delete cascade,
  local_date date not null,              -- in profiles.timezone
  rehearsal_id uuid not null references public.rehearsals on delete cascade,
  primary key (user_id, local_date)      -- also enforces "one counted rep per day" for Free
);
create table public.streaks (
  user_id uuid primary key references auth.users on delete cascade,
  current int not null default 0, longest int not null default 0,
  last_rep_date date, freezes_left smallint not null default 0
);
-- RLS: owner select. Written by the post-rehearsal workflow.

create table public.cue_cards (           -- real mode
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  rehearsal_id uuid references public.rehearsals on delete set null,
  lines text[] not null, created_at timestamptz default now()
);
create table public.real_call_notes (     -- user's own notes after a real call; never audio
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  cue_card_id uuid references public.cue_cards on delete set null,
  outcome text, notes text, created_at timestamptz default now()
);
-- RLS: owner full CRUD.

create table public.calendar_links (      -- optional, read-only calendar scope
  user_id uuid primary key references auth.users on delete cascade,
  provider text not null, scopes text[] not null,
  vault_secret_id uuid,                   -- refresh token kept in Supabase Vault, not a column
  last_synced_at timestamptz
);
create table public.upcoming_moments (    -- only events the user confirmed, minimal fields
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  label text not null, occurs_at timestamptz not null,
  suggested_scenario_id uuid references public.scenarios on delete set null
);
-- RLS: owner; calendar_links readable by owner but vault id never exposed to the client.

-- ===== Together =====
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references auth.users on delete cascade,
  scenario_id uuid references public.scenarios,
  join_code text unique not null,
  status text not null default 'open',   -- 'open','live','closed'
  expires_at timestamptz not null
);
create table public.room_members (
  room_id uuid references public.rooms on delete cascade,
  user_id uuid references auth.users on delete cascade,
  role text not null,                    -- 'host','player','watcher'
  joined_at timestamptz default now(),
  primary key (room_id, user_id)
);
create table public.room_ratings (
  room_id uuid, rater_id uuid, rehearsal_id uuid,
  clarity smallint, confidence smallint, comment text,
  primary key (room_id, rater_id, rehearsal_id)
);
-- RLS: members can read their room (policy uses private.is_room_member(room_id), security definer).
--      Ratings readable by the rated user and the rater. Comments run through moderation.

create table public.dares (
  id uuid primary key default gen_random_uuid(),
  slug text unique, title text not null, body text not null,
  active_from date, active_to date
);
create table public.dare_completions (
  user_id uuid references auth.users on delete cascade,
  dare_id uuid references public.dares on delete cascade,
  rehearsal_id uuid references public.rehearsals on delete set null,
  clip_id uuid,
  completed_at timestamptz default now(),
  primary key (user_id, dare_id)
);
create table public.clips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  rehearsal_id uuid references public.rehearsals on delete set null,
  storage_path text not null,            -- private bucket
  voice_changed boolean not null default true,
  visibility text not null default 'private', -- 'private','link'
  share_token text unique,
  pinned boolean default false,
  expires_at timestamptz,
  created_at timestamptz default now()
);
-- RLS: owner CRUD. Public playback goes through a server route that checks share_token,
--      returns a short-lived signed URL, and honours a report/block flag.

-- ===== Billing (schema billing: not exposed) =====
create table billing.customers (
  subject_type text not null,            -- 'user' | 'org'
  subject_id uuid not null,
  stripe_customer_id text unique,
  revenuecat_app_user_id text unique,    -- = Supabase user id
  primary key (subject_type, subject_id)
);
create table billing.subscriptions (
  id text primary key,                   -- provider subscription id
  source sub_source not null,
  subject_type text not null, subject_id uuid not null,
  product text not null, plan plan_id not null,
  status text not null,                  -- provider status, normalized
  quantity int default 1,                -- seats for Teams
  current_period_start timestamptz, current_period_end timestamptz,
  cancel_at_period_end boolean,
  provider_updated_at timestamptz not null, -- guards against out-of-order events
  raw jsonb not null
);
create table billing.entitlements (       -- the ONE table the app reads (via a view)
  subject_type text not null, subject_id uuid not null,
  entitlement text not null,             -- 'plus','custom_scenarios','rooms','teams_seat'
  source sub_source not null,
  active_until timestamptz,              -- null = open-ended (e.g. team seat)
  updated_at timestamptz default now(),
  primary key (subject_type, subject_id, entitlement, source)
);
create table billing.plans (              -- limits live in data, so they can be tuned without deploys
  id plan_id primary key,
  limits jsonb not null   -- {"counted_reps_per_day":1,"max_rep_seconds":240,
                          --  "monthly_voice_seconds":7200,"custom_scenarios":false,"rooms":false}
);
create table billing.webhook_events (
  provider text not null,                -- 'stripe','revenuecat','elevenlabs'
  event_id text not null,
  type text not null,
  received_at timestamptz default now(),
  processed_at timestamptz,
  status text not null default 'received', -- 'received','processed','failed','ignored'
  attempts int default 0, error text,
  payload jsonb not null,
  primary key (provider, event_id)
);
-- Client access: a security_invoker view public.my_entitlements filtered to auth.uid()
-- (plus org seats via private.my_org_ids()). Nothing else in billing is readable by clients.

-- ===== Usage metering (schema ops: not exposed) =====
create table ops.usage_events (
  id bigserial primary key,
  idempotency_key text unique not null,  -- e.g. 'el:<conversation_id>' or 'anth:<message_id>'
  user_id uuid, org_id uuid, rehearsal_id uuid,
  provider text not null,                -- 'elevenlabs','anthropic'
  meter text not null,                   -- 'agent_seconds','stt_seconds','tts_chars',
                                         -- 'llm_input_tokens','llm_output_tokens','llm_cache_read_tokens'
  quantity numeric not null,
  est_cost_usd numeric(12,6),            -- from a price table, for margin dashboards
  occurred_at timestamptz not null
);
create table ops.usage_monthly (          -- rollup used by the quota check
  user_id uuid not null, month date not null,
  voice_seconds int not null default 0, counted_reps int not null default 0,
  est_cost_usd numeric(12,4) not null default 0,
  primary key (user_id, month)
);
-- Client access: a view public.my_usage (current month seconds used / cap) only.

-- ===== Teams =====
create table public.orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null,                    -- 'career_center','company','clinic'
  email_domains text[] default '{}',     -- for join-by-domain
  seats int not null default 0,
  pilot_ends_at timestamptz,
  reporting_level text not null default 'aggregate', -- 'aggregate' | 'opt_in_individual'
  dpa_signed_at timestamptz,
  ferpa_school_official boolean default false,
  crisis_resources jsonb,                -- campus counseling numbers shown in crisis cards
  created_at timestamptz default now()
);
create table public.org_members (
  org_id uuid references public.orgs on delete cascade,
  user_id uuid references auth.users on delete cascade,
  role org_role not null default 'member',
  status text not null default 'invited', -- 'invited','active','removed'
  invited_email text,
  joined_at timestamptz,
  primary key (org_id, user_id)
);
create table public.cohorts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs on delete cascade,
  name text not null, starts_on date, ends_on date,
  assigned_scenario_ids uuid[] default '{}'
);
create table public.cohort_members (
  cohort_id uuid references public.cohorts on delete cascade,
  user_id uuid references auth.users on delete cascade,
  primary key (cohort_id, user_id)
);
-- RLS: members read their org/cohort rows; admins manage membership via private.is_org_admin(org_id).
-- Staff NEVER get a policy on rehearsals/turns/debriefs. Org dashboards read from
-- private.org_cohort_stats(org_id) (security definer) which returns aggregates only
-- (reps, minutes, median time-to-ask), suppresses groups smaller than 5, and includes
-- individual rows only for students with an active 'share_with_org' consent.

-- ===== Privacy and safety (schema ops) =====
create table ops.deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,                 -- no FK: must outlive the user row
  email_hash text,                       -- to answer "was it done?" without keeping the email
  requested_at timestamptz default now(),
  source text not null,                  -- 'app','web','email'
  due_by timestamptz not null,           -- requested_at + 30 days (public promise)
  status text not null default 'pending',
  vendor_receipts jsonb default '{}',    -- {"elevenlabs":"...", "stripe":"...", "posthog":"..."}
  completed_at timestamptz
);
create table ops.safety_events (
  id bigserial primary key,
  user_id uuid, rehearsal_id uuid, scenario_id uuid,
  source text not null,                  -- 'user_turn','custom_scenario','persona_output','report'
  category safety_category not null,
  severity smallint not null,            -- 1 low .. 4 imminent
  action text not null,                  -- 'resources_shown','session_stopped','scenario_blocked',
                                         -- 'rate_limited','human_review'
  classifier text, excerpt_redacted text, -- short, redacted; never the full transcript
  created_at timestamptz default now()
);
create table ops.content_reports (        -- App Store 1.2: report mechanism for clips/rooms
  id bigserial primary key,
  reporter_id uuid, target_type text, target_id uuid,
  reason text, status text default 'open', created_at timestamptz default now()
);
create table ops.staff_access_log (       -- every time a human looks at user content
  id bigserial primary key, staff_id uuid, subject_user_id uuid,
  reason text, at timestamptz default now()
);
-- No client policies on ops.*; access by service role and a small staff role.

create table public.waitlist (            -- replaces console logging in /api/waitlist
  email citext primary key, source text, created_at timestamptz default now()
);
-- RLS: no select for anyone but service role; inserts go through the API route.
```

Key server functions (all `security definer` in `private`, all called by the API with the user's JWT):

- `private.start_rehearsal(scenario_id, mood, mode, client)`: locks the user's `usage_monthly` row, reads entitlements and `billing.plans.limits`, checks today's counted rep (in the user's timezone) and the monthly voice-seconds cap, checks the scenario's `moderation_status`, then inserts the `rehearsals` row with `max_seconds` and returns its id. The API mints the ElevenLabs credential **only after** this returns OK.
- `private.has_entitlement(name)`, `private.my_org_ids()`, `private.is_org_admin(org_id)`, `private.is_room_member(room_id)`: used inside policies as `(select private.fn(...))`.
- A rep **counts** when the rehearsal reaches a debrief (abandoned attempts under 30 s do not), so a dropped connection does not burn the Free user's day; a separate per-day start limit (Upstash) prevents farming.

---

## 5. Billing

### 5.1 Plus on the web (Stripe)

- **Products and prices:** `Plus monthly $14.99`, `Plus yearly $99`. Attach Stripe **Entitlements features** (`plus`, `custom_scenarios`, `rooms`, `trends`) to the Plus product; Stripe then fires `entitlements.active_entitlement_summary.updated` whenever a customer gains or loses features ([Stripe, Entitlements](https://docs.stripe.com/billing/entitlements)).
- **Checkout** in subscription mode for purchase; **Customer Portal** for card changes, plan switch, cancel and invoices ([Stripe, customer portal](https://docs.stripe.com/customer-management)).
- **Fees:** cards 2.9% + 30¢ ([Stripe pricing](https://stripe.com/pricing)); Billing pay-as-you-go 0.7% of billing volume ([Stripe Billing pricing](https://stripe.com/billing/pricing)); Stripe Tax 0.5% where you are registered ([Stripe Tax pricing](https://stripe.com/tax/pricing)).
- **Sales tax decision:** either Stripe Tax (you register and file) or **Stripe Managed Payments**, Stripe's merchant-of-record product launched February 2026 and added to Checkout on 2026-04-22, which takes on indirect-tax compliance, fraud and disputes for **3.5% on top of processing** ([Stripe, Managed Payments](https://docs.stripe.com/payments/managed-payments), [changelog 2026-04-22](https://docs.stripe.com/changelog/dahlia/2026-04-22/managed-payments), [Managed Payments pricing](https://support.stripe.com/questions/managed-payments-pricing)). For a two-person team, Managed Payments buys back a lot of admin time; it is the simpler start. Whether SaaS is taxable in a given state was **not researched** here.

### 5.2 Webhooks and idempotency (Stripe, RevenueCat, ElevenLabs alike)

Stripe's own guidance: live-mode deliveries are retried for up to **three days** with backoff; **event order is not guaranteed**; the same event can arrive more than once, so log processed event ids and return 2xx for duplicates ([Stripe, webhooks](https://docs.stripe.com/webhooks)). Undelivered events can be replayed ([Stripe, process undelivered events](https://docs.stripe.com/webhooks/process-undelivered-events)).

Handler pattern:

1. Verify the signature on the raw body (Stripe signature; ElevenLabs `ElevenLabs-Signature` HMAC with timestamp check, per [ElevenLabs, post-call webhooks](https://elevenlabs.io/docs/eleven-agents/workflows/post-call-webhooks); RevenueCat authorization header).
2. `insert into billing.webhook_events (provider, event_id, ...) on conflict do nothing returning 1`. No row returned means already seen: answer 200.
3. Answer 200 immediately; hand the event id to a Vercel Workflow.
4. In the workflow, **re-fetch the current object from the provider** (subscription, customer) rather than trusting the event body, then upsert `billing.subscriptions` only if `provider_updated_at` is newer than what is stored. Recompute `billing.entitlements` from all active subscriptions for that subject (Stripe, store, team seat, promo) so the sources cannot overwrite each other.
5. For outgoing Stripe writes, send an **Idempotency-Key** ([Stripe, idempotent requests](https://docs.stripe.com/api/idempotent_requests)).

Stripe events to handle: `checkout.session.completed`, `customer.subscription.created|updated|deleted`, `invoice.paid`, `invoice.payment_failed`, `entitlements.active_entitlement_summary.updated`.

### 5.3 Free tier and minute caps (protecting margin)

Cost inputs: ElevenLabs Agents charges **$0.08 per additional minute** (double that in burst above the concurrency limit), **with LLM usage billed separately** ([ElevenLabs, Agents pricing](https://elevenlabs.io/pricing/agents)). The voice research stream should refine this; the table below uses $0.10/minute all-in as a working assumption.

| Plan | Net revenue per month after Stripe (my arithmetic) | Voice minutes that cost 50% of net at $0.10/min |
|---|---|---|
| Plus monthly $14.99 | about $14.16 (minus 2.9% + 30¢, minus 0.7%) | about 70 min |
| Plus yearly $99 | about $7.93/month ($99 less fees, over 12) | about 40 min |
| Free, one 3-min rep every day | $0 | costs about $9/month per daily user |

What this means:

- "Unlimited reps" on Plus needs a **fair-use voice cap**, stated plainly: e.g. **60 voice minutes a month** (about 20 three-minute reps), then unlimited **text** reps. At $0.10/min a user who hits the cap costs $6: a 58% margin on the monthly plan and about 24% on the yearly plan; typical users will use less. Keep the number in `billing.plans.limits` so it can be tuned from real `usage_events` data once the true cost per minute is measured.
- The **annual price carries the tighter budget**; set the cap from the yearly plan, not the monthly one. If 60 minutes feels stingy in testing, the lever is a cheaper voice pipeline or a higher yearly price, not a looser cap.
- Free: **one counted rep a day, capped at 3 voice minutes** (`max_rep_seconds = 180`), with text mode always available. A daily Free user at the cap costs about $9/month at $0.10/min; that is the number to watch on the cost dashboard.
- Enforcement: the server sets `max_seconds` at start; the client shows a countdown and ends the session; the post-call webhook records the actual seconds, which are charged against the monthly cap even if a client overran. ElevenLabs agents may also have a server-side maximum conversation duration setting (**UNVERIFIED**; confirm in the agent config).
- Contain worst cases at the vendor: give each environment its own ElevenLabs **service-account API key with a credit quota**; requests fail once the quota is reached ([ElevenLabs, API keys](https://elevenlabs.io/docs/overview/administration/workspaces/api-keys)).

### 5.4 Teams (career centers, companies, clinics)

- **Pilot season (free):** no Stripe at all; create the `orgs` row with `pilot_ends_at` and seat count; entitlement source `team`.
- **Paid:** one Stripe subscription per org with **per-seat quantity** ([Stripe, quantities](https://docs.stripe.com/billing/subscriptions/quantities)); the Customer Portal can let admins change quantity ([Stripe, configure the portal](https://docs.stripe.com/customer-management/configure-portal)). Universities usually pay by invoice and PO: use `collection_method = send_invoice` with net-30 terms. Stripe Invoicing has its own fee ([Stripe Invoicing pricing](https://support.stripe.com/questions/stripe-invoicing-pricing), **not checked** in this session).
- Seats are assigned in `org_members`; an active member gets entitlement `teams_seat` while the org subscription (or pilot) is active.
- The $3 to $8 per seat range should carry its own voice cap per seat per month; career-center usage is seasonal, so pooled minutes per org are a reasonable variant.

### 5.5 Mobile later: RevenueCat

- RevenueCat is free to $2,500 monthly tracked revenue, then 1% (third-party summary; **revenuecat.com was blocked**, so UNVERIFIED on the vendor page).
- It can **import Stripe subscriptions** made on the web, keyed by `app_user_id`; the app must configure the Purchases SDK with the **same App User ID**, so use the Supabase user id everywhere ([RevenueCat, Track External Purchases](https://www.revenuecat.com/docs/web/integrations/stripe/track-external-purchases)).
- RevenueCat webhooks feed the same `billing.webhook_events` and recompute the same `billing.entitlements`. The app never decides entitlement locally.
- Apple rules: content bought on the web may be unlocked in the iOS app **provided it is also offered as an in-app purchase** (3.1.3(b)); on the **US storefront** apps may include buttons and links to web purchase (3.1.1(a)) ([Apple, App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)). Whether Apple may later charge a commission on linked purchases is still before the courts (secondary sources report the Ninth Circuit allowed a cost-based commission, amount undecided; **UNVERIFIED**). Small Business Program: 15% commission, and 15% on subscription renewals after a subscriber's first year ([Apple, Small Business Program](https://developer.apple.com/app-store/small-business-program/)).

---

## 6. Safety and trust

### 6.1 Layers

1. **Gate custom scenario text before it is used.** A classifier call (Claude Haiku 4.5 with structured output) labels each new custom scenario: allow, allow with rewrite, block, or crisis. Block: sexual or romantic roleplay, scenarios about minors, harassment or intimidation of a real person, impersonating a real named person (public figure or private individual), planning violence or illegal acts. Crisis: the description itself signals self-harm or suicide ("practice telling my sister goodbye before I end it") and routes to the crisis card instead of a rehearsal. Write the result to `scenarios.moderation_status` and `ops.safety_events`.
2. **Watch the live conversation.** Each final user transcript turn goes to a fast keyword screen plus the classifier, **asynchronously** so it adds no latency to the persona. On a crisis signal: the persona stops, the app shows the crisis card, the rehearsal status becomes `stopped_safety`, and no debrief score is shown. For the most severe level the session cannot be resumed.
3. **Constrain the persona.** Fixed system rules (no sexual content, no threats or slurs, never claim to be human, drop character on harm signals, which `buildPersonaSystem` already does), user text kept out of the system prompt (section 1), structured outputs for the debrief with schema validation (already done in `normalizeDebrief`).
4. **Structural anti-companion design.** Every rehearsal has a cap and ends in a debrief; there is no free-chat mode; the persona never "remembers" the user across sessions (only the coach's pattern summary does); no pet names, no unprompted emotional check-ins; a daily cap on reps. This is both the product principle and the best defence under the companion-chatbot laws below.
5. **Humans in the loop.** A review queue for blocked custom scenarios and user reports; App Store guideline 1.2 requires filtering, a report mechanism, blocking abusive users and published contact details for apps with user-generated content ([Apple, App Review Guidelines 1.2](https://developer.apple.com/app-store/review/guidelines/)). Clips, room comments and dares are user-generated content.

### 6.2 Crisis card content (US)

- **988 Suicide & Crisis Lifeline:** call or text 988, or chat at 988lifeline.org; free, confidential, 24/7 ([SAMHSA, 988](https://www.samhsa.gov/mental-health/988)). **Recent change:** the LGBTQ+ youth "Press 3" option, discontinued in July 2025, was **restored on 2026-09-30** (news reports, e.g. [Washington Blade, 2026-10-01](https://www.washingtonblade.com/2026/10/01/988-restores-crisis-services-for-lgbtq-youth/); not yet confirmed on 988lifeline.org, which was blocked).
- **Crisis Text Line:** text HOME to 741741, free, 24/7, English and Spanish ([Crisis Text Line](https://www.crisistextline.org/)).
- **911** for immediate danger.
- **Campus counseling** from `orgs.crisis_resources` when the user belongs to a career-center org, or a lookup by the user's school email domain.
- Have a clinician review the copy and the escalation thresholds before launch.

### 6.3 Laws and vendor policies that apply

| Rule | What it requires | Does it reach Unmute? |
|---|---|---|
| **Anthropic Usage Policy** (effective 2025-09-15) | Consumer-facing chatbots must disclose that users are talking to AI; no erotic chat; no impersonating a human or coordinating harassment ([Anthropic, Usage Policy](https://www.anthropic.com/legal/aup)) | Yes. Disclose at the start of every rehearsal ("You're talking to an AI playing the receptionist") |
| **Anthropic guidelines for products serving minors** (updated 2026-03-16) | Age verification, content filtering, monitoring and reporting, education for minors, COPPA compliance, AI disclosure ([Anthropic support](https://support.claude.com/en/articles/9307344-responsible-use-of-anthropic-s-models-guidelines-for-organizations-serving-minors)) | Only if under-18s are allowed; another reason for 18+ |
| **ElevenLabs terms** | Under 18 may not use the services; the use policy prohibits making services available to anyone under 13, or 13 to 18 without parental consent; no voice data from children under 18; end users of a customer's agent must accept an end-user agreement at least as restrictive as ElevenLabs' terms ([ElevenLabs Terms](https://elevenlabs.io/terms-of-use), [Prohibited Use Policy](https://elevenlabs.io/use-policy), [Agents terms](https://elevenlabs.io/agents-terms), [Privacy Policy](https://elevenlabs.io/privacy-policy); from search summaries) | Yes. Our Terms must flow down ElevenLabs' restrictions; 18+ avoids the parental-consent problem |
| **California SB 243** (companion chatbots, effective 2026-01-01) | AI disclosure where a person could be misled; a published protocol to prevent suicidal-ideation content and refer to crisis services; extra duties for known minors (3-hour break reminders, no sexual content); annual report to the Office of Suicide Prevention from 2027-07-01; private right of action, the greater of actual damages or $1,000 per violation. Exclusion applies only to bots used **only** for customer service, operational purposes, productivity, internal research or technical assistance ([SB 243 bill page](https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202520260SB243), [Skadden summary](https://www.skadden.com/insights/publications/2025/10/new-california-companion-chatbot-law), [Crowell summary](https://www.crowell.com/en/insights/client-alerts/californias-chatbot-bill-may-impose-substantial-compliance-burdens-on-many-companies-deploying-ai-assistants)) | Unclear: a rehearsal partner is not built for social needs, but coaching is not a listed exclusion. **Comply anyway**: disclosure, published crisis protocol page, and be ready to file the 2027 report |
| **New York GBL Article 47** (AI companions, effective 2025-11-05) | Detect and respond to suicidal ideation with crisis referral; notice at session start and every 3 hours of continued use; AG penalties up to $15,000 per day ([Morrison Foerster summary](https://www.mofo.com/resources/insights/251120-new-york-and-california-enact-landmark-ai)) | Its test includes asking unprompted emotion-based questions and sustaining dialogue about personal matters; avoid the first by design, and implement crisis referral regardless |
| **FTC 6(b) inquiry** (Sept 2025) | Study of companion chatbots' effects on children and teens, monetization of engagement, disclosures ([FTC press release](https://www.ftc.gov/news-events/news/press-releases/2025/09/ftc-launches-inquiry-ai-chatbots-acting-companions)) | Not a rule, but signals what regulators will ask; "success is the user closing the app" is the right answer |
| **COPPA** (amended rule published 2025, one-year compliance window) ([FTC, COPPA final rule amendments](https://www.ftc.gov/legal-library/browse/federal-register-notices/16-cfr-part-312-coppa-final-rule-amendments)) | Parental consent etc. for under-13 users | Out of scope with an 18+ gate, as long as we act on actual knowledge of a minor (delete and close) |
| **Texas App Store Accountability Act (SB 2420)** | Age verification and parental consent through app stores; developers must use the store's age signals. Enforceable after the Supreme Court declined to block it on 2026-07-06 ([InfoLawGroup, 2026-07-07](https://www.infolawgroup.com/insights/2026/7/7/supreme-court-clears-the-way-texass-app-store-accountability-act-is-now-enforceable); third-party). Utah's core enforcement reportedly moved to 2027-05-06 ([Loeb & Loeb](https://www.loeb.com/en/insights/passle/2026/05/update-on-utah-app-store-law--another-waiting-game); third-party) | Mobile phase: read the store age signal at sign-in and refuse under-18 accounts |
| **EU AI Act** | Article 50 chatbot disclosure applies from 2026-08-02; Article 5(1)(f) bans inferring emotions from **biometric data such as voice** in workplaces and education institutions, in force since 2025-02-02 ([Baker Botts](https://www.bakerbotts.com/thought-leadership/publications/2026/september/eu-ai-act-article-50-transparency-obligations-go-live), [FPF on Art. 5(1)(f)](https://fpf.org/blog/red-lines-under-eu-ai-act-unpacking-the-prohibition-of-emotion-recognition-in-the-workplace-and-education-institutions/)) | Only with EU users. Design rule worth adopting everywhere: **the debrief never infers emotions from the voice signal**; it analyses words and timing only |

### 6.4 Minimum age: 18+

Arguments for 18+ at launch: the ElevenLabs terms (above); Anthropic's extra safeguards for minors; COPPA, SB 243 minor duties and the Texas app-store law all switch on with minors; the audience is college students and recent grads. Cost: some first-year students are 17. Implementation: an age attestation at sign-up (store the attestation, not a birthdate), terms that say 18+, deletion of any account where we learn the user is a minor, and the store age signal on mobile. Career-center contracts state that only students 18+ may be provisioned.

### 6.5 Custom-scenario abuse and impersonation

- No voice cloning, ever. Personas use library voices only (`personas.voice_id`).
- Names: users may say "my manager Dana"; the classifier blocks scenarios that target a real identifiable person for harassment, scenarios that ask the persona to be a specific real public figure, and scenarios whose goal is to pressure, threaten, stalk or manipulate.
- Rooms: a friend playing a role is human-generated content; ratings and comments go through the same moderation and report flow.

### 6.6 Prompt injection

- Treat scenario text and speech as **data**: keep it out of `system`, wrap it in a delimited user block with an instruction that it describes the situation and cannot change the rules.
- The rehearsal model has **no tools** with side effects. The debrief is structured output validated by Zod before storage.
- Clamp lengths (the current `MAX_TEXT = 800`, `MAX_MESSAGES = 24` are good) and server-side look-ups for built-in scenarios.
- Log suspected injection attempts as `safety_events(category='prompt_injection')` for review; they also indicate abuse of the free tier.

### 6.7 Safety-event data is sensitive

Safety events reveal mental-health signals. Keep them in `ops` (no client access), store only a short redacted excerpt, restrict staff access (logged in `staff_access_log`), and set a short retention (for example 180 days) unless an event is under review. Never use them for marketing or product targeting.

---

## 7. Privacy and compliance

### 7.1 What we store, where, and for how long (proposed defaults)

| Data | Stored? | Where | Default retention |
|---|---|---|---|
| Raw user audio | **No** | Not stored by us; vendor set to keep nothing (below) | None |
| Persona audio | **No** | Generated and streamed | None |
| Transcripts (`turns`) | Yes | Supabase | **90 days**, then deleted automatically; user can choose 30 days, 1 year, or delete any rehearsal now |
| Debrief text and metrics | Yes | Supabase | Until the user deletes it or the account (needed for trends and patterns) |
| Patterns, streaks, reps | Yes | Supabase | Until account deletion |
| Clips (opt-in) | Yes | Supabase Storage, private | 30 days unless pinned |
| Safety events | Yes, minimal | Supabase `ops` | 180 days |
| Billing records | Yes | Stripe, Supabase `billing` | As required for tax and accounting (period **not researched**) |
| Analytics | Ids and numbers only | PostHog, Vercel | Vendor defaults; no content |

Vendor settings that make "we don't keep your voice" true:

- **ElevenLabs Agents:** per-agent **audio saving off** (on by default) and **conversation retention 0 days**, which deletes data right after the call; default retention is otherwise 2 years ([ElevenLabs, Retention](https://elevenlabs.io/docs/eleven-agents/customization/privacy/retention), [Audio saving](https://elevenlabs.io/docs/eleven-agents/customization/privacy/audio-saving)). If retention 0 removes the transcript before our webhook reads it, set a short window (for example 1 day) and delete through the API once our copy is stored. This interaction is **UNVERIFIED**; test it in staging.
- **ElevenLabs Zero Retention Mode** (enterprise only): `enable_logging=false` on TTS and STT requests, or a per-agent toggle; covers TTS, STT and Agents input/output ([ElevenLabs, Zero Retention Mode](https://elevenlabs.io/docs/eleven-api/resources/zero-retention-mode)). Worth asking for once volume justifies an enterprise contract.
- **Anthropic:** "Anthropic may not train models on Customer Content from Services" ([Anthropic, Commercial Terms](https://www.anthropic.com/legal/commercial-terms), effective 2025-06-17). Zero data retention is available by arrangement with sales; even under ZDR, content **flagged by trust and safety systems may be kept up to 2 years**; Claude Fable 5/5.1 and Mythos models require 30-day retention and are not available under ZDR ([Anthropic, API and data retention](https://platform.claude.com/docs/en/manage-claude/api-and-data-retention)). The standard API retention period lives on privacy.claude.com, which was blocked here; secondary sources say 30 days (**UNVERIFIED**).

### 7.2 Can we say "never used to train models"?

Yes, if all of these hold, and the privacy policy should list them:

1. Anthropic: contractually no training on API content (above).
2. ElevenLabs: the data-use toggle is **off before the first user call** (the opt-out does not reach back), or an enterprise agreement is in place ([ElevenLabs help](https://elevenlabs.io/docs/help-center/legal/is-my-data-used-to-improve-eleven-labs-ai-models)).
3. Unmute itself never fine-tunes or evaluates models on user rehearsals without a separate opt-in. (If you later want an opt-in research program, make it a distinct consent row.)
4. Analytics, logs and error tools never receive content.

Disclose the exceptions plainly: vendors may keep flagged content for abuse review (Anthropic up to 2 years even under ZDR), and ElevenLabs keeps data for security and fraud even with training off (per the help-center summary).

### 7.3 Deletion "within N days"

- In-app **Delete account** (required in-app by Apple 5.1.1(v); Google Play also requires an in-app path **and** a web link for deletion requests ([Apple guidelines](https://developer.apple.com/app-store/review/guidelines/), [Google Play, account deletion](https://support.google.com/googleplay/android-developer/answer/13327111))).
- Flow: create `ops.deletion_requests` with `due_by = now() + 30 days`; immediately hard-delete the user's rows (cascades from `auth.users`); a Vercel Workflow then deletes vendor copies (ElevenLabs conversations by id, PostHog person, Sentry user data if any, Resend contacts, Stripe customer where not needed for tax records), revokes the Apple token, records each receipt, and emails a confirmation. Backups roll off on their own schedule; state that in the policy.
- **Public promise: deleted within 30 days, typically within 7.** (The CCPA's response deadline was **not re-verified** here.)

### 7.4 Laws by topic

**CCPA/CPRA.** Applies to for-profit businesses above $26,625,000 in annual revenue (2025 adjustment) or meeting the other thresholds ([CPPA, monetary thresholds](https://cppa.ca.gov/regulations/cpi_adjustment.html); the 100,000-consumer threshold was not re-checked). Unmute will likely be below the thresholds at launch, but honouring access and deletion for everyone is cheap and expected. New CPPA rules on risk assessments, cybersecurity audits and automated decision-making took effect 2026-01-01 with phased deadlines ([CPPA announcement](https://cppa.ca.gov/announcements/2025/20250923.html)); relevant once covered, because rehearsal content can be health-related sensitive information.

**Washington My Health My Data Act.** Covers any business handling data that identifies or can lead to an inference about a person's physical or mental health ([Washington AG](https://www.atg.wa.gov/protecting-washingtonians-personal-health-data-and-privacy), via search summary). Anxiety-related rehearsal content and safety events plausibly qualify. Needs: a separate **Consumer Health Data Privacy Policy** linked from the homepage, consent before collecting consumer health data, a separate consent before sharing it, no sale, and deletion rights. The act has a private right of action. Treat this as **in scope**.

**Biometric laws.**
- **Illinois BIPA** covers "voiceprints". In February 2026 an Illinois state court certified a class over Siri, accepting that its speech-recognition process generates feature vectors capable of identifying a speaker ([Duane Morris class action blog, 2026-02-10](https://blogs.duanemorris.com/classactiondefense/2026/02/10/illinois-state-court-grants-certification-of-bipa-class-comprised-of-customers-who-used-apples-siri-function/), via search summary). Speech-to-text is now a litigated theory, not a safe assumption.
- **Texas CUBI**: TRAIGA (HB 149, effective 2026-01-01) exempts biometric processing used to develop or offer AI systems unless they are used to identify a person ([Covington, Inside Privacy](https://www.insideprivacy.com/artificial-intelligence/texas-enacts-ai-consumer-protection-law/)).
- **Colorado** (HB 24-1130, effective 2025-07-01): any controller collecting biometric identifiers needs a written policy with a retention schedule and breach protocol, plus notice and consent, with no volume threshold ([Paul Hastings](https://www.paulhastings.com/insights/ph-privacy/colorado-imposes-new-privacy-requirements-on-organizations-collecting-biometric-identifiers-and-data)).
- **Our use is designed not to create voiceprints**: no speaker identification, no diarization embeddings retained, no voice cloning, no stored audio. Because the Illinois theory reaches speech recognition itself, take the cheap insurance for **all US users**: a public **Voice Data Policy** (purpose, retention schedule, destruction rule), and an explicit **voice-processing consent** screen before the first voice rep (a `consents` row of kind `voice_processing`). Text mode remains for anyone who declines. This is legal-risk triage, not legal advice; have counsel confirm.

**FERPA (Teams for career centers).** If a school provides student information or receives student-level reports, we act for the school and must sit under the **school official exception**: perform an institutional function, have a legitimate educational interest, and be under the school's **direct control** over use and maintenance, typically through a contract that bars other uses and redisclosure ([Dept. of Education, vendor FAQ](https://studentprivacy.ed.gov/sites/default/files/resource_document/file/Vendor%20FAQ.pdf)). Design: students' rehearsals stay private by default; career centers see aggregates; student-level data only with the student's opt-in; a FERPA addendum in the Teams contract; deletion of org-provided data at contract end. Expect a security questionnaire from universities (EDUCAUSE's HECVAT is common; **not researched** here).

**GDPR and the EU.** Recommend **US-only at launch**. Rehearsal content can reveal health data (special category under GDPR), and the EU AI Act adds disclosure and the emotion-recognition ban above. If the EU opens later: an EU Supabase region (choose a specific EU region, not the "Europe" group that includes London and Zurich), the DPA, a DPIA, and transfer terms ([Supabase, GDPR compliance](https://supabase.com/docs/guides/security/gdpr-compliance)).

### 7.5 Policy and contract checklist

- [ ] **Terms of Service**: 18+; AI disclosure; not therapy, not for emergencies; acceptable use (no sexual or romantic roleplay, no harassment rehearsal, no impersonation); flow-down of ElevenLabs end-user restrictions; subscription, cancellation and fair-use voice cap; clip sharing licence; Teams terms.
- [ ] **Privacy Policy**: data inventory (table 7.1); vendors and what each receives; "never used to train models" with the conditions in 7.2; retention; deletion within 30 days; rights requests; US-only; contact `privacy@`.
- [ ] **Consumer Health Data Privacy Policy** (Washington MHMDA), separate page, linked from the homepage.
- [ ] **Voice Data Policy** (BIPA/Colorado style): purpose, retention schedule, destruction, no voiceprints, no cloning.
- [ ] **Safety and crisis protocol page** (SB 243 asks for the protocol to be published): what triggers it, what we show, what we log.
- [ ] **Subprocessor list**: Vercel, Supabase, ElevenLabs, Anthropic, Stripe, RevenueCat (later), Resend, PostHog, Sentry, Upstash.
- [ ] **Cookie and tracking notice** (marketing analytics is cookieless; PostHog in-app).
- [ ] **Teams DPA** (we are the processor): purpose limits, no training, confidentiality, security measures, subprocessor notice, breach notice timeline, assistance with rights requests, return or deletion at end, audit by questionnaire, FERPA school-official addendum, aggregate-only reporting default, 18+ provisioning.
- [ ] Vendor DPAs signed: Supabase ([DPA](https://supabase.com/docs/guides/security/gdpr-compliance)), Anthropic (incorporated in the Commercial Terms), ElevenLabs (incorporated by reference in its terms, per search summary), Stripe, PostHog, Sentry, Resend.
- [ ] App store disclosures (mobile phase): Apple privacy label, Google Play Data safety form including the deletion questions ([Google Play, account deletion](https://support.google.com/googleplay/android-developer/answer/13327111)).
- [ ] Counsel review of all of the above before paid launch.

---

## 8. Operations

### 8.1 Environments

| Env | Web | Database | Vendors |
|---|---|---|---|
| Local | `next dev` | Supabase CLI local stack | ElevenLabs dev key with a small credit quota; Anthropic dev key; Stripe test mode |
| Preview (every PR) | Vercel preview, SSO-protected (already on) | Supabase branch (Pro) or one shared `staging` project | Same as local, separate keys |
| Production | Vercel production on a custom domain | Supabase production project (Pro, PITR when > 4 GB) | Production keys, quotas, live Stripe |

Migrations live in the repo (`supabase/migrations`) and deploy through the Supabase GitHub integration rather than by hand, as Supabase recommends ([Supabase, Production Checklist](https://supabase.com/docs/guides/deployment/going-into-prod)). Run Supabase's Security and Performance Advisors before each release.

### 8.2 Secrets

- Vercel environment variables scoped per environment; nothing secret behind `NEXT_PUBLIC_`.
- Separate keys per environment for Anthropic, ElevenLabs (service accounts with scopes, credit quota and optional IP allowlist ([ElevenLabs, API keys](https://elevenlabs.io/docs/overview/administration/workspaces/api-keys))), Stripe, RevenueCat, Resend, Upstash, PostHog, Sentry.
- Webhook secrets per environment. Supabase service-role key only on the server.
- Calendar refresh tokens in Supabase Vault, never in plain columns.
- Calendar reminders: Apple client secret every 6 months; rotate other keys quarterly; MFA on every vendor account (Supabase recommends org-level MFA enforcement ([Production Checklist](https://supabase.com/docs/guides/deployment/going-into-prod))).

### 8.3 Observability

- **Sentry** for web and API errors and traces, later the app.
- **Vercel runtime logs** with a request id on every API call; log ids and numbers, never content.
- **Supabase logs and advisors.**
- **A cost dashboard** built from `ops.usage_events`: voice minutes and estimated cost per day, per plan, per user percentile; cost per daily active Free user; cost per Plus subscriber versus net revenue.

### 8.4 Cost alerts and kill switches

- **Vercel Spend Management** (Pro): default on-demand budget $200, notifications at 50/75/100%, optional webhook, optional pause of production ([Vercel, Spend Management](https://vercel.com/docs/spend-management)). Use the alert and the webhook; **do not enable auto-pause** (it takes the site down).
- **ElevenLabs** per-key credit quotas (above) as the hard ceiling.
- **Anthropic**: set workspace spend limits in the Console (exact controls **not re-verified** in this session).
- **Supabase**: keep the Spend Cap on at first. With it on, going over a quota is not billed; you get an email and a grace period under the Fair Use Policy, after which requests can be restricted (HTTP 402) ([Supabase, MAU usage, Exceeding Quotas](https://supabase.com/docs/guides/platform/manage-your-usage/monthly-active-users), [Supabase, HTTP status codes](https://supabase.com/docs/guides/troubleshooting/http-status-codes)). Turn it off once revenue is steady, so a good day does not trigger restrictions.
- **Internal alarms** (cron every 15 minutes on Pro): estimated voice spend today above X; any user above N voice minutes today; Free-tier cost per DAU above $Y.
- **Kill switches** (PostHog flags): `voice_enabled` (fall back to text rehearsals), `signups_open`, `custom_scenarios_enabled`, `rooms_enabled`.

### 8.5 Uptime and status

- A `/api/health` route that checks Postgres and makes cheap authenticated read calls to each vendor.
- An external uptime check on the homepage, `/api/health` and the webhook endpoints (Sentry Team includes one uptime monitor ([Sentry pricing](https://sentry.io/pricing/)); any uptime service works).
- A simple public status page; the app shows a "voice is down, practice in text" banner driven by the `voice_enabled` flag.

### 8.6 Support

- Addresses: `support@`, `privacy@` (rights and deletion requests), `safety@` (reports), `teams@`.
- Saved replies for deletion, refund, cancellation, "the AI said something wrong", and crisis-adjacent messages (always include 988).
- Targets: safety reports reviewed within 24 hours; privacy requests acknowledged within 2 business days.

### 8.7 Incident checklist

1. **Declare** (who is on point) and set severity: S1 safety failure or data exposure; S2 voice or payments down; S3 degraded.
2. **Contain**: flip the relevant kill switch; rotate the key if a credential leaked; pause the affected route via WAF rule.
3. **Specific runbooks:**
   - *Crisis routing failed* (a user disclosed risk and no card appeared): disable voice if needed, fix, review all `stopped_safety` and missed events in the window, document; consider whether any outreach is appropriate (with counsel).
   - *Cost runaway*: flip `voice_enabled` off, lower `billing.plans.limits`, check top users in `usage_events`, block abusive accounts.
   - *Vendor outage* (ElevenLabs or Anthropic): text-mode fallback; status banner.
   - *Stripe or RevenueCat webhook backlog*: confirm `webhook_events` failures; replay from the provider ([Stripe, undelivered events](https://docs.stripe.com/webhooks/process-undelivered-events)); recompute entitlements for affected subjects.
   - *Data exposure*: preserve logs, scope who and what, notify counsel; breach-notification duties vary by state (**not researched**).
4. **Communicate**: status page, email to affected users, and for Teams, the org contact named in the DPA.
5. **Review** within 5 business days: timeline, cause, fixes, owner for each.

---

## 9. Build order for this area (web first, mobile reuse)

**Phase 0: accounts and prerequisites (days)**
- [ ] Decide the name and domain; attach the custom domain in Vercel.
- [ ] Move `web` to Vercel Pro (or a dedicated Unmute team on Pro).
- [ ] New Supabase organization "Unmute" on Pro; one production project, one staging project or branching.
- [ ] ElevenLabs: turn off model-training data use; create per-environment service-account keys with credit quotas.
- [ ] Anthropic: per-environment keys and spend limits; ask sales about ZDR.
- [ ] Stripe account; choose Stripe Tax or Managed Payments.
- [ ] Lock `/api/rehearse` now: server-side scenario look-up, user text out of `system`, WAF rule, BotID; move the waitlist to a table.

**Phase 1: accounts and saved text rehearsals**
- [ ] Supabase Auth (email code + link, Google, Apple, anonymous first rep), Resend SMTP.
- [ ] Schema from section 4 with RLS and the auto-enable trigger; `/api/v1` routes accepting cookie or bearer tokens.
- [ ] Text rehearsals saved with turns, debriefs, streaks, patterns; history and debrief pages.
- [ ] Age attestation, terms, privacy policy, consent rows; in-app delete account with the deletion workflow.
- [ ] PostHog (no content, no replay on rehearsal screens), Sentry, Vercel Analytics on marketing pages.

**Phase 2: voice and metering**
- [ ] Voice session start through `private.start_rehearsal`, server-minted ElevenLabs credentials, audio saving off, short retention.
- [ ] ElevenLabs post-call webhook (HMAC) into a Vercel Workflow: store transcript, metrics, Claude debrief, usage events, delete the vendor copy.
- [ ] Quotas: Free one counted rep a day at 3 voice minutes; voice-processing consent; cost dashboard and alarms.

**Phase 3: payments**
- [ ] Stripe Checkout, Customer Portal, Entitlements, idempotent webhooks, `billing.entitlements`.
- [ ] Paywall after the first debrief; Plus fair-use voice cap shown in settings.

**Phase 4: safety and privacy hardening (before public launch)**
- [ ] Custom-scenario classifier and review queue; live-turn monitor and crisis card; safety events.
- [ ] Published crisis protocol page, Consumer Health Data policy, Voice Data policy, subprocessor list; counsel review.
- [ ] Incident runbooks rehearsed once.

**Phase 5: Together and Teams**
- [ ] Rooms, dares, clips with report and block.
- [ ] Orgs, cohorts, seats, aggregate dashboards through security-definer functions; Teams DPA with FERPA addendum; per-seat Stripe invoicing.

**Phase 6: the Expo app (reuses everything above)**
- [ ] Same Supabase Auth with native Sign in with Apple; same `/api/v1`.
- [ ] RevenueCat with the Supabase user id as App User ID; Stripe purchases imported; IAP offered in-app (3.1.3(b)); optional US web-checkout link (3.1.1(a)).
- [ ] Store age signals (Texas SB 2420); Apple privacy label; Play Data safety and deletion web link; in-app deletion with Apple token revocation.

---

## 10. Open items and things I could not verify

- Vercel plan of team "Eden's projects" (likely Hobby; check Settings, Billing). Whether `ANTHROPIC_API_KEY` is set in production (the MCP token could not list env vars).
- ElevenLabs plan tier and remaining credits (no MCP read for subscriptions).
- Anthropic's standard API retention period (privacy.claude.com blocked; secondary sources say 30 days).
- Whether ElevenLabs agent retention of 0 days deletes the transcript before the post-call webhook can be read; whether agents support a server-enforced maximum duration.
- RevenueCat pricing on the vendor page; Inngest and Trigger.dev pricing on vendor pages.
- CCPA response deadline and the 100,000-consumer threshold; state breach-notification timelines; sales-tax treatment of SaaS by state; Stripe Invoicing fee.
- Apple's eventual commission on US link-outs (still in litigation per secondary sources).
- 988 "Press 3" restoration (2026-09-30) confirmed only by news coverage so far.
- None of this is legal advice; the biometric, health-data and companion-chatbot calls in particular need counsel.

---

## 11. Sources

Accounts (read-only MCP calls, 2026-10-02): Supabase `list_organizations`, `list_projects`, `get_organization`, `get_project`, `get_cost`; Vercel `list_teams`, `get_team`, `list_projects`, `get_project`, `list_billing_charges` (404), `filter_project_envs` (403), `list_integration_configurations` (403); ElevenLabs `agents_list`.

Anthropic
- Commercial Terms: https://www.anthropic.com/legal/commercial-terms
- Usage Policy: https://www.anthropic.com/legal/aup
- API and data retention: https://platform.claude.com/docs/en/manage-claude/api-and-data-retention
- Guidelines for organizations serving minors: https://support.claude.com/en/articles/9307344-responsible-use-of-anthropic-s-models-guidelines-for-organizations-serving-minors
- User well-being safeguards (2025-12-18): https://www.anthropic.com/news/protecting-well-being-of-users
- Models overview (prices from the cached table dated 2026-09-25): https://platform.claude.com/docs/en/about-claude/models/overview

ElevenLabs (site blocked; from search summaries of these official pages)
- Zero Retention Mode: https://elevenlabs.io/docs/eleven-api/resources/zero-retention-mode
- Agents retention: https://elevenlabs.io/docs/eleven-agents/customization/privacy/retention
- Agents audio saving: https://elevenlabs.io/docs/eleven-agents/customization/privacy/audio-saving
- Data use for training: https://elevenlabs.io/docs/help-center/legal/is-my-data-used-to-improve-eleven-labs-ai-models
- Terms of Service: https://elevenlabs.io/terms-of-use ; Prohibited Use Policy: https://elevenlabs.io/use-policy ; Agents terms: https://elevenlabs.io/agents-terms ; Privacy Policy: https://elevenlabs.io/privacy-policy
- Agents pricing: https://elevenlabs.io/pricing/agents
- Agent authentication: https://elevenlabs.io/docs/eleven-agents/customization/authentication
- Post-call webhooks: https://elevenlabs.io/docs/eleven-agents/workflows/post-call-webhooks
- API keys: https://elevenlabs.io/docs/overview/administration/workspaces/api-keys

Supabase (via the Supabase MCP docs search)
- Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Production Checklist: https://supabase.com/docs/guides/deployment/going-into-prod
- Project Pausing: https://supabase.com/docs/guides/platform/free-project-pausing
- MAU usage and pricing: https://supabase.com/docs/guides/platform/manage-your-usage/monthly-active-users
- Login with Apple: https://supabase.com/docs/guides/auth/social-login/auth-apple
- Anonymous Sign-Ins: https://supabase.com/docs/guides/auth/auth-anonymous
- Queues: https://supabase.com/docs/guides/queues ; Cron: https://supabase.com/docs/guides/cron ; Storage buckets: https://supabase.com/docs/guides/storage/buckets/fundamentals
- Shared Responsibility Model: https://supabase.com/docs/guides/deployment/shared-responsibility-model ; GDPR: https://supabase.com/docs/guides/security/gdpr-compliance

Vercel (site blocked; from search summaries of these official pages)
- Fair Use Guidelines: https://vercel.com/docs/limits/fair-use-guidelines ; Pro plan: https://vercel.com/docs/plans/pro-plan
- Functions limits: https://vercel.com/docs/functions/limitations
- Workflows: https://vercel.com/docs/workflows ; pricing: https://vercel.com/docs/workflows/pricing
- Queues pricing: https://vercel.com/docs/queues/pricing
- Cron usage and pricing: https://vercel.com/docs/cron-jobs/usage-and-pricing
- WAF rate limiting: https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting ; BotID: https://vercel.com/docs/botid
- Spend Management: https://vercel.com/docs/spend-management
- Web Analytics privacy: https://vercel.com/docs/analytics/privacy-policy ; pricing: https://vercel.com/docs/analytics/limits-and-pricing
- Flags pricing: https://vercel.com/docs/flags/vercel-flags/limits-and-pricing

Other vendors
- Clerk pricing: https://clerk.com/pricing ; changelog: https://clerk.com/changelog/2026-02-05-new-plans-more-value
- Auth.js to Better Auth: https://github.com/nextauthjs/next-auth/discussions/13252
- Upstash pricing: https://upstash.com/pricing/redis
- Resend pricing: https://resend.com/pricing
- PostHog pricing: https://posthog.com/pricing
- Sentry pricing: https://sentry.io/pricing/
- Stripe: webhooks https://docs.stripe.com/webhooks ; undelivered events https://docs.stripe.com/webhooks/process-undelivered-events ; idempotent requests https://docs.stripe.com/api/idempotent_requests ; Entitlements https://docs.stripe.com/billing/entitlements ; quantities https://docs.stripe.com/billing/subscriptions/quantities ; customer portal https://docs.stripe.com/customer-management and https://docs.stripe.com/customer-management/configure-portal ; pricing https://stripe.com/pricing ; Billing pricing https://stripe.com/billing/pricing ; Tax pricing https://stripe.com/tax/pricing ; Managed Payments https://docs.stripe.com/payments/managed-payments , https://docs.stripe.com/changelog/dahlia/2026-04-22/managed-payments , https://support.stripe.com/questions/managed-payments-pricing ; Invoicing pricing https://support.stripe.com/questions/stripe-invoicing-pricing
- RevenueCat Track External Purchases: https://www.revenuecat.com/docs/web/integrations/stripe/track-external-purchases
- Apple App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/ ; account deletion: https://developer.apple.com/news/?id=12m75xbj ; Small Business Program: https://developer.apple.com/app-store/small-business-program/
- Google Play account deletion: https://support.google.com/googleplay/android-developer/answer/13327111

Law, policy and crisis resources
- California SB 243: https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202520260SB243 ; https://www.skadden.com/insights/publications/2025/10/new-california-companion-chatbot-law ; https://www.crowell.com/en/insights/client-alerts/californias-chatbot-bill-may-impose-substantial-compliance-burdens-on-many-companies-deploying-ai-assistants
- New York GBL Art. 47: https://www.mofo.com/resources/insights/251120-new-york-and-california-enact-landmark-ai
- FTC 6(b) companion chatbots: https://www.ftc.gov/news-events/news/press-releases/2025/09/ftc-launches-inquiry-ai-chatbots-acting-companions
- COPPA amendments: https://www.ftc.gov/legal-library/browse/federal-register-notices/16-cfr-part-312-coppa-final-rule-amendments
- Texas SB 2420: https://www.infolawgroup.com/insights/2026/7/7/supreme-court-clears-the-way-texass-app-store-accountability-act-is-now-enforceable ; Utah: https://www.loeb.com/en/insights/passle/2026/05/update-on-utah-app-store-law--another-waiting-game
- BIPA and Siri ASR: https://blogs.duanemorris.com/classactiondefense/2026/02/10/illinois-state-court-grants-certification-of-bipa-class-comprised-of-customers-who-used-apples-siri-function/
- Texas TRAIGA and CUBI: https://www.insideprivacy.com/artificial-intelligence/texas-enacts-ai-consumer-protection-law/
- Colorado HB 24-1130: https://www.paulhastings.com/insights/ph-privacy/colorado-imposes-new-privacy-requirements-on-organizations-collecting-biometric-identifiers-and-data
- Washington MHMDA: https://www.atg.wa.gov/protecting-washingtonians-personal-health-data-and-privacy
- CCPA thresholds: https://cppa.ca.gov/regulations/cpi_adjustment.html ; new regulations: https://cppa.ca.gov/announcements/2025/20250923.html
- FERPA vendor FAQ: https://studentprivacy.ed.gov/sites/default/files/resource_document/file/Vendor%20FAQ.pdf
- EU AI Act Art. 50: https://www.bakerbotts.com/thought-leadership/publications/2026/september/eu-ai-act-article-50-transparency-obligations-go-live ; Art. 5(1)(f): https://fpf.org/blog/red-lines-under-eu-ai-act-unpacking-the-prohibition-of-emotion-recognition-in-the-workplace-and-education-institutions/
- 988: https://www.samhsa.gov/mental-health/988 ; Press 3 restored: https://www.washingtonblade.com/2026/10/01/988-restores-crisis-services-for-lgbtq-youth/
- Crisis Text Line: https://www.crisistextline.org/
