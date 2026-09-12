# Idea scorecard (12 Sep 2026)

Fourteen candidates distilled from the research. Each scored 1–5 on seven criteria. The two build-related criteria reflect that I (Claude) build everything: a web-first product scores higher than one that depends on fragile native APIs.

**Criteria**

| Code | Criterion | What a 5 means |
|---|---|---|
| U | Universality of the pain | Nearly everyone recognizes it from their own life |
| W | White space | No credible product does this well today |
| B | Buildable by me, solo, in weeks | Web-first, standard stack, no platform-permission risk |
| D | Institutional distribution | A school, university or industry can adopt, sponsor or "pledge" it |
| M | Payer clarity | Someone with a budget line obviously pays |
| T | Why now | A 2025–26 policy, technology or behavior shift opens the window |
| F | Defensibility at 24 months | Data, network, integrations or contracts that a copycat cannot clone quickly |

Total is unweighted out of 35.

## Ranking

| # | Idea | U | W | B | D | M | T | F | Total |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **Campus focus credit** — voluntary, instructor-driven, university-paid class-time focus with verified sessions and academic rewards | 5 | 4 | 3 | 5 | 4 | 5 | 3 | **29** |
| 2 | **Phone-policy ops + screen-time compliance for K-12 districts** — incident log, pouch/locker inventory, parent comms, state reporting, per-student instructional screen minutes | 3 | 4 | 5 | 5 | 4 | 5 | 3 | **29** |
| 3 | **Integrity receipts** — proof-of-process writing that replaces AI detectors | 4 | 3 | 4 | 4 | 3 | 5 | 2 | 25 |
| 4 | **Counseling waitlist bridge** — triage waitlisted students to peer, financial and academic support | 3 | 4 | 4 | 4 | 3 | 4 | 3 | 25 |
| 5 | **Insurance appeal autopilot** — consumer denial appeals, employer perk | 5 | 3 | 4 | 3 | 3 | 4 | 2 | 24 |
| 6 | **Reading-stamina program** — verified deep-reading sessions and campus challenges | 4 | 4 | 4 | 4 | 2 | 4 | 2 | 24 |
| 7 | **Learning receipts (K-12)** — 3-minute oral checks generated from the student's own work | 3 | 3 | 4 | 4 | 3 | 4 | 2 | 23 |
| 8 | **Care circle ops** — sandwich-generation caregiving coordination | 4 | 3 | 4 | 3 | 3 | 4 | 2 | 23 |
| 9 | **One inbox for school** — LMS, email, Discord and syllabus deadlines in one feed | 4 | 3 | 4 | 3 | 2 | 3 | 2 | 21 |
| 10 | **Employer focus benefit** — phone shielding plus calendar focus blocks via HR wellness vendors | 4 | 3 | 3 | 3 | 3 | 3 | 2 | 21 |
| 11 | **Clerk for education** — auth, rostering, LTI 1.3 and district tenancy for edtech developers | 2 | 4 | 4 | 2 | 3 | 3 | 3 | 21 |
| 12 | **Group-project ledger** — contribution tracking from Docs, GitHub and Slack | 3 | 4 | 4 | 3 | 2 | 3 | 2 | 21 |
| 13 | **Bedtime handoff for 18–24s** — night key plus residence-life program | 4 | 3 | 3 | 3 | 2 | 3 | 1 | 19 |
| 14 | **Renewals or life-admin agent** — passports, insurance, subscriptions | 4 | 3 | 3 | 2 | 2 | 2 | 1 | 17 |

## Notes on each

**1. Campus focus credit.** The one idea that is simultaneously universal (phones), validated (RPI 2025 study), unowned (no college product exists; Pocket Points is dead, LockedIn is K-12-only), and institutionally fundable (NYU IRL, student-success budgets, EAB-scale contracts). Loses points on B because it needs a lightweight native app for lock detection, and on F because the mechanism is copyable; the defensibility has to come from instructor adoption, gradebook integration and campus contracts. Kill risks: Apple changes lock-state behavior; universities balk at incentivizing phone abstinence; students game it.

**2. Phone-policy ops and screen-time compliance.** Pure web SaaS, so I can build all of it. Two policy waves converge in 2026–27: bell-to-bell bans in 28+ states with teachers complaining about inconsistent enforcement, and six new state laws capping instructional screen time on school devices. Yondr is hardware, Minga is behavior-ops, GoGuardian filters Chromebooks; none report policy effectiveness to a state. Loses points on U because only educators feel it directly. Kill risks: Minga or Lightspeed ship the feature; 6–18 month sales cycles starve a solo founder.

**3. Integrity receipts.** Strong "why now" (HEPI Aug 2026, Vanderbilt disabling Turnitin's detector) but Grammarly Authorship, Turnitin Clarity and ValidDraft already occupy the writer-side. The institutional side (LTI-integrated, policy-grade receipts) is thinner. Defensibility is weak against Grammarly.

**4. Counseling waitlist bridge.** Attacks the #1 stop-out driver and sells to student affairs, but it is clinically adjacent (liability, licensure), and universities move slowly on anything touching mental health.

**5. Insurance appeal autopilot.** The most universal adult pain we found with the clearest evidence gap (85% never appeal). Not pledgeable to schools, HIPAA-heavy, and several early entrants exist (open-source appeal generators, Claimable-style startups). Worth keeping on the list if you want to leave education.

**6. Reading-stamina program.** Novel framing (attention as a trainable skill with reading as the rep) and fits the campus focus product as a second use case. Weak payer on its own.

**7–14.** Solid but either crowded (teacher copilots, life admin, family calendars), payer-poor (student planners), or too narrow for a first product (edtech infrastructure). The life-admin agent category is an explicit graveyard (Milo, Yohana).

## Decision

Ideas 1 and 2 are two wedges into the same thesis: **attention is now an institutional obligation and nobody sells the software layer for it.** Start with idea 1 because it is the one everyone relates to, it grows bottom-up through instructors and students, and department-level pilots close in weeks rather than fiscal years. Idea 2 is the K-12 expansion once there is a brand and a compliance story, or the fallback if you decide you want zero mobile risk. See `docs/plan/03-recommendation.md`.
