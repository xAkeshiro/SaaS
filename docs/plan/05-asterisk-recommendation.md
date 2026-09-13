# Recommendation v2: Asterisk (working name)

*The AI that reads the fine print before you commit, remembers exactly what you agreed to, and gets you out when you need out.*

Working-name alternatives: Smallprint, Clause, Fine. "Asterisk" collides with the open-source telephony project of the same name; check trademarks in the consumer-software class before committing.

---

## 1. The verdict

Build **Asterisk**: a consumer app and browser extension that intercepts terms at the moment you are about to pay, sign or subscribe, flags the traps in plain language, saves a dated snapshot of what you agreed to, and later reminds you, cancels for you, or drafts the dispute using your own evidence.

Why this out of everything researched:

- **Everyone does this, weekly.** Every subscription, trial, hotel booking, gym contract, lease, ticket purchase and app sign-up has fine print. Households pay $219 a month for subscriptions while believing it is $86; 42% have forgotten at least one; 76% of adults say cancelling is made deliberately hard; dark patterns sit on three quarters of sites.
- **Nobody does it at the moment that matters.** Every existing tool (FinePrint, Redline, Justee, DocuSign Iris) makes you upload a document afterwards. ToS;DR is crowdsourced and stale. Rocket Money only sees a subscription after it hits your bank. No product intercepts terms at checkout or signature, on mobile or desktop, and none keeps a personal evidence vault of the terms you actually saw.
- **The trust vacuum is fresh.** Honey's affiliate-hijacking scandal is still in litigation and Capital One Shopping settled for ~$4M. The "free extension that helps you shop" category lost its credibility; a paid, no-affiliate, on-your-side product can take it.
- **Regulation is a tailwind either way.** The federal click-to-cancel rule was vacated in July 2025 and the FTC reopened rulemaking in January 2026; state auto-renewal laws keep spreading (Connecticut from July 2026). Consumers are unprotected federally and companies are nervous, which makes both sides want a record of what was agreed.
- **The agent era makes it more necessary.** Google's Universal Cart, Meta Muse and checkout agents will accept terms on people's behalf. A terms-risk layer is the natural guardrail, and it can be sold to agent builders as an API later.
- **It has the Cluely ingredients without the Cluely problem.** An overlay that shows up at the exact moment of need, an adversarial story ("they hide it, we find it"), shareable receipts, a $5–10 a month prosumer price, and a viral data play (a public Trap Index of companies). Unlike Cluely, the product is honest, the job is real and recurring, and retention comes from the vault and the alerts rather than from stunts.

## 2. What it is

**Moment 1: Shield (at commitment).** On a checkout, sign-up, trial or e-signature page, the extension (Chrome, Edge, Safari on Mac and iPhone) reads the page and the linked terms and shows an Asterisk card in under three seconds:

- Auto-renewal and the real price after the trial, with the exact date
- How cancellation actually works (in-app, email, phone only, in person, 30-day notice)
- Junk fees (resort, service, convenience, processing) and the true total
- Early-termination fees, minimum terms and price-increase clauses
- Arbitration and class-action waivers, data-sale and marketing-consent clauses
- A trap score, the two sentences that matter, and a recommended action ("use a virtual card", "set a cancel reminder for 12 Oct")

On mobile without a browser, the share sheet and a screenshot or PDF do the same for leases, gym contracts, warranty cards and app subscription screens.

**Moment 2: Memory (after commitment).** One tap saves the commitment: merchant, price, renewal date, cancellation path, and a timestamped snapshot of the terms as shown. Companies change terms; the snapshot is leverage. The vault becomes the user's registry of every recurring obligation, with alerts before trial ends and renewals.

**Moment 3: Action (when it goes wrong).** "Cancel for me" follows the merchant's known path (email, portal, chat, and later a VoIP call agent) and files proof. "Dispute this" drafts the refund request, chargeback statement or state attorney-general complaint using the saved snapshot, with deadlines tracked. Execution starts as guided steps plus generated letters and adds automated calling in phase 2.

**The public layer: the Trap Index.** Anonymized flags roll up into per-company scorecards and how-to-cancel pages. This is the search-engine and press engine (Pine's Friction Index and Rocket Money's data reports show it works) and it turns every user into a contributor.

**What it is not.** No affiliate links, no coupon injection, no selling of browsing data. It reads pages only when the user is on a commitment page or asks it to.

## 3. Scorecard against the alternatives

1–5 on each: **U** universality, **W** white space, **B** buildable by Claude solo in weeks, **V** virality, **M** payer clarity, **T** why now, **S** resistance to being absorbed by a platform.

| # | Idea | U | W | B | V | M | T | S | Total |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **Asterisk: fine-print shield + agreement memory + cancel/dispute** | 5 | 4 | 4 | 4 | 4 | 5 | 3 | **29** |
| 2 | Medical money stack end to end (bills, EOBs, appeals, calls, external review) | 3 | 4 | 3 | 4 | 5 | 4 | 4 | 27 |
| 3 | Universal "fights for you" caller (a Pine or Muse clone) | 5 | 2 | 3 | 4 | 4 | 4 | 2 | 24 |
| 4 | Family scam shield (code words, verify-before-you-send, family admin) | 4 | 3 | 3 | 3 | 3 | 4 | 3 | 23 |
| 5 | Peer-to-peer negotiation agent (rent renewals, marketplace, contractors) | 4 | 3 | 3 | 4 | 4 | 3 | 2 | 23 |
| 6 | Verified deadline registry + execution (passports, licenses, warranties) | 4 | 3 | 4 | 2 | 3 | 3 | 2 | 21 |
| 7 | Caregiver-centric longitudinal health copilot | 3 | 3 | 3 | 2 | 3 | 4 | 3 | 21 |
| 8 | Group-chat AI planner | 5 | 1 | 4 | 5 | 2 | 2 | 1 | 20 |
| 9 | Generic Cluely-style real-time overlay | 4 | 1 | 3 | 5 | 3 | 2 | 1 | 19 |
| 10 | Slop shield for inboxes and DMs | 4 | 1 | 4 | 2 | 2 | 3 | 1 | 17 |
| 11 | Doctor-visit recorder | 3 | 2 | 4 | 2 | 2 | 3 | 1 | 17 |
| 12 | General life-admin assistant | 5 | 2 | 2 | 3 | 2 | 2 | 1 | 17 |

Idea 6 is folded into Asterisk as the Memory layer. Idea 2 is the best runner-up and could become an Asterisk module later (medical bills are fine print too).

## 4. Business model

| Tier | Price | What you get |
|---|---|---|
| Free | $0 | 5 shield scans a month, the vault, renewal alerts |
| Plus | $4.99/month or $39.99/year | Unlimited scans, mobile share-sheet scanning, cancellation paths, evidence snapshots, family sharing |
| Pro | $9.99/month | "Cancel for me" and "Dispute this" execution, chargeback and complaint drafting, priority call agent when it ships |

Benchmarks: AI apps monetize best with a hard paywall after the first "aha" (10.7% vs 2.1% conversion), weekly plans now carry 55% of subscription revenue, and the median annual price is about $38. Asterisk should show the first trap for free, then paywall the vault.

Second revenue lines, in order: a **B2B2C channel** through credit unions, banks and card issuers (card-linked "purchase protection" is a budget line they already have; Carefull and Rocket Money both sell this way), employers and universities as a benefit (students are the most trial-trapped group, which keeps the "pledge to schools" option open without depending on it), and an **agent API** that gives shopping and checkout agents a terms-risk score before they accept anything (YC's "business-to-agent" thesis).

Rough scale: about 130 million US households; 2% on Plus at $40 a year is about $100M ARR before B2B2C. Rocket Money reached ~$100M ARR in roughly two and a half years on subscription hygiene alone.

## 5. Go-to-market

1. **Launch with the Trap Index, not the app.** Scan the top 500 subscription and travel sites, publish a ranked report of the worst cancellation and junk-fee practices, and give journalists the data. Pine's Friction Index and Rocket Money's reports show this earns coverage on a zero budget.
2. **Hijack the "read the fine print" format on TikTok and Reels.** Screen-recorded Asterisk cards catching a trap on a well-known brand, produced by 20–50 faceless creator accounts on a per-view bounty. This is the Rizz playbook (550M views, ~no paid ads) and the Cal AI playbook (250 creators).
3. **Shareable receipts.** Every catch produces a card ("Asterisk caught a $240/yr auto-renew hidden behind a 7-day trial") with a referral link. Every cancellation success produces another.
4. **Distribution surfaces:** Chrome Web Store and Safari Extension Gallery, Product Hunt, r/personalfinance and r/Frugal, and a how-to-cancel page for every company in the index for search traffic.
5. **Partners in months 6–12:** two credit unions or one neobank for a card-linked pilot; one university or student group as the first "pledged" community.
6. **Keep the attention honest.** Cluely's revenue retraction and Honey's scandal are the cautionary tales; publish methodology, never inflate numbers, and never take merchant money.

## 6. Technical plan (what I build)

| Layer | Choice | Notes |
|---|---|---|
| Extension | Manifest V3, TypeScript; Chrome and Edge from one build; Safari via Xcode wrapper for Mac and iOS | Detects commitment pages (checkout, trial, sign-up, e-signature) by DOM and URL heuristics; extracts visible terms and linked ToS |
| Analysis | Claude with structured outputs; clause taxonomy (renewal, cancellation, fees, term, arbitration, data); confidence and quoted evidence per flag; per-merchant caching keyed by terms hash | Cost per scan in the cents; cached results make repeat merchants free |
| Web app | Next.js App Router, TypeScript, Tailwind, shadcn/ui; the vault, alerts, dispute drafting | Vercel Pro or Railway |
| Mobile | Expo (React Native); share-sheet and screenshot scanning; push alerts | Safari extension covers in-browser cases on iPhone |
| Data | Supabase Postgres; snapshots in object storage with content hashes | Vault data is the user's; export and delete are one tap |
| Merchant database | Seeded crawl of cancellation and terms pages for the top 2,000 merchants; refreshed weekly; user flags feed the Trap Index | The moat over time |
| Execution | Phase 1: guided cancellation paths, generated letters and complaint filings (state AG, FTC, CFPB, DOT). Phase 2: VoIP call agent on our own numbers (Twilio plus a realtime voice model), user bridged for codes | Hold on bare telephony, model joins when a human answers; disclose AI on every call |
| Auth, billing, email, analytics | Clerk, Stripe (with Apple and Google in-app purchase on mobile), Resend, PostHog | Standard 2026 stack |
| Compliance | Clear "not legal advice" framing, no "AI lawyer" claims (the DoNotPay order), no affiliate revenue, minimal data, privacy policy that says what pages are read and when | |

**What you must do:** Apple Developer ($99/yr) and Google Play ($25) accounts, a Chrome Web Store developer account ($5), a company entity and Stripe account, a real iPhone and Mac for Safari extension testing, and the store submissions in your name. Everything else, including listings, privacy labels and the extension review notes, I prepare.

## 7. First 90 days

| Weeks | Milestone | Success measure |
|---|---|---|
| 1–3 | Chrome extension MVP: commitment-page detection, Asterisk card, save to vault; web vault with renewal alerts | Catches auto-renewal and cancellation terms correctly on 50 top subscription sites in a test set |
| 3–5 | Trap Index v1 from the first 500 merchants; landing page; Product Hunt and press kit | Report published; first coverage; 1,000 installs |
| 5–8 | Safari (Mac and iOS) extension; mobile share-sheet scanning; hard paywall after first catch; creator bounty program live | 10,000 installs; 3–5% free-to-paid |
| 8–13 | "Cancel for me" guided paths for the top 300 merchants; dispute drafting; family sharing; credit-union pilot conversations | Week-4 retention above 35%; first 500 paying users; one partner LOI |

Metrics from day one: scans per active user, catch rate (scans that surface at least one flagged clause), save-to-vault rate, alert-to-action rate, cancellation success rate, week-4 retention, and referral share rate.

## 8. Risks and mitigations

- **A platform builds it.** Apple could add renewal warnings to Safari; Chrome is unlikely to (ads and merchants pay Google). Mitigation: cross-platform vault, execution layer, Trap Index and B2B2C partnerships, none of which a browser feature replaces.
- **False positives or missed clauses.** Every flag quotes the clause it is based on, carries a confidence level, and users can dispute a flag; accuracy is measured on a growing labeled set before every release.
- **Extension store policy changes.** Keep the mobile app and web vault first-class so the product survives without any single store.
- **"Is this legal advice?"** It is document summarization and self-help drafting, the zone DoNotPay's FTC order left intact; never claim professional substitution; register in North Carolina if interactive legal-document rules apply.
- **Cost per scan.** Per-merchant caching by terms hash and a small model for page classification keep marginal cost to cents; only novel documents hit the large model.
- **Merchant hostility.** Terms are public documents and the user is reading their own screen; the Honey problem was affiliate hijacking, which Asterisk never does.
- **Churn, the AI-app disease.** Retention comes from the vault and alerts (a reason to keep it installed between purchases), family sharing, and the annual plan; measure week-4 retention above everything else.

## 9. Runner-ups

**Medical money stack (score 27).** Photograph a bill and an EOB; the app reconciles them, audits codes, drafts the appeal or negotiation, calls the billing office over VoIP, files external review, and tracks deadlines, for the $200–5,000 bills nobody else serves end to end. Biggest dollars per case and the strongest emotional energy of anything researched, but US-only and healthcare-shaped. Could become an Asterisk module later.

**Family scam shield (23).** Detection is commoditized and free; the open layer is the family protocol: shared code words, a "verify before you send" hold on transfers, and a family admin who can intervene. Sold through banks. Needs bank integrations, which is heavy for a solo start.

**Peer-to-peer negotiation agent (23).** Rent renewals, marketplace haggling, contractor quotes over email and text on a success fee. Real and viral, but Pine and Meta Muse are closing in on bills, and calling private individuals carries consent risk.

## 10. What I need from you

Confirm Asterisk (or pick the medical runner-up), and give me a name if you dislike the working one. The next session starts the Chrome extension and the web vault in this repository under section 6.
