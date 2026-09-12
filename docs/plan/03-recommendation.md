# Recommendation: Facedown (working name)

*A campus attention platform. Students lock their phone during class or a study block, the app verifies it, instructors and the university reward it, and the institution finally gets a signal for the thing every student says is hurting them.*

Working-name alternatives: Lockstep, Heads Up, Stowed. Check trademarks and .com/.app availability before committing.

---

## 1. The verdict

Build the college wedge first, sold as **"free for instructors, licensed by the campus,"** and expand to K-12 policy operations and employer focus programs once the brand exists.

Why this one out of fourteen:

- **Everyone relates.** More than three in four college students say their phone hurts their grades; 54% report five-plus hours a day of recreational screen time. Parents, teachers and employers all recognize the problem from their own lives.
- **The mechanism is proven and the company that proved it is dead.** The RPI study (Aug 2025) showed fewer distractions, better attendance and grade gains from voluntary lock-in-class rewards. Pocket Points reached 40% of Penn State in weeks, then died in 2024 on coupon economics. Distribution was never the problem; the payer was.
- **The payer now exists.** NYU runs a university-wide device-free initiative with lockers, lounges and faculty resources. Faculty are declaring "attention sanctuary" classrooms. Student-success offices pay six figures a year for engagement signals (one EAB Navigate contract: $278k). Opal's million daily users are two-thirds students who cannot pay $99 a year; the campus can.
- **Nobody owns higher ed.** LockedIn is a mandatory K-12 lock with geofencing; Yondr is a pouch; Opal, one sec and Brick are consumer. There is no voluntary, instructor-facing, gradebook-connected product for adult students.
- **It is pledgeable.** "We give it free to every instructor at your university" is a sentence a president can say at convocation, the way NYU IRL was announced.

## 2. What it is

**Student app (Expo, iOS and Android).** One button: *Start focus.* The student locks the phone. The app verifies the phone stayed locked (iOS protected-data and Android screen-off signals, not the fragile Screen Time API), counts the minutes, and ends the session at the scheduled class end or when the student stops. Sessions can start from a class schedule (ICS or Canvas calendar import), an instructor's join code or QR on the first slide, or a study block the student sets. Streaks, weekly focus hours, and an opt-in leaderboard by section, dorm or club.

**Instructor console (web).** Create a course, show a join code, see live anonymized "focus in progress" counts, and export verified focus hours to the gradebook as participation or extra credit. Instructor chooses the reward policy: none (just visibility), participation credit, extra credit capped at N points, or entry into a course raffle. Equity settings: alternative ways to earn the same credit (paper reflection, office-hours visit), accessibility and caregiving exemptions, and no penalties ever.

**Campus admin (web).** Site license dashboard: opt-in rates, verified focus hours by college and first-year cohort, attendance correlation, and anonymized retention signals that can be fed to Navigate or Starfish later. Campus-funded rewards from budgets that already exist: dining dollars, bookstore credit, priority printing, wellness-center swag, IRL-style event tickets. A "phone-free events" mode for NYU-IRL-type programming: lockers and check-ins earn the same currency.

**What it is not.** It never reads which apps a student uses, never tracks location, never blocks anything unless the student opts into shielding later. Post-Canvas-breach, "we store session timestamps and nothing else" is a feature you lead with.

## 3. Why the earlier attempts failed and what is different

| Failure | Pocket Points / Hold | Facedown |
|---|---|---|
| Payer | Local merchants and brands buying coupons | Instructors (free) then the campus (license), the same path Grammarly, Canva and Notion took into universities |
| Reward | Coupons that lose value and are costly to source | Academic credit and campus currency that cost the institution nothing new |
| Verification | App-in-foreground tricks, easy to game | Lock-state detection plus instructor join codes; shielding as an optional add-on |
| Institutional value | None; schools were bystanders | Attendance and engagement signals for student-success teams, evidence for retention funding |
| Timing | 2015: phones were a nuisance | 2026: 39 states ban phones in schools, NYU runs a device-free initiative, faculty ban phones, reading stamina is a documented crisis |

## 4. Business model

- **Free forever for instructors and students** (up to, say, 300 students per instructor).
- **Campus license: $2–4 per enrolled student per year**, i.e. $40–80k for a 20,000-student university, sold to student success, first-year experience, or wellness. Compare: Yondr $25–30 per student, EAB Navigate six figures, Opal $99 per user. Multi-year with a 20% discount over 500 seats is normal in higher ed.
- **Department or program pilot: $5–15k**, payable on a department card in weeks, not an RFP.
- **Later:** K-12 phone-policy operations (per-school SaaS alongside pouches or lockers), and an employer "focus benefit" tier through HR wellness vendors.
- **Rough scale:** ~4,000 US degree-granting institutions, ~19M students. Two hundred campus licenses at $60k is $12M ARR. Pocket Points reached 150 campuses on coupons alone.

## 5. Go-to-market

1. **Instructors first (weeks 1–8).** Target the faculty already writing about attention: teaching and learning centers, first-year seminar directors, large-lecture instructors, and any professor who has announced a device-free classroom. Offer: "Your students opt in, you see live focus, you export credit. Free."
2. **Students spread it.** Every student in a pilot class installs it; the streak and section leaderboard carry it into other classes. Run a verified campus ambassador program (.edu plus enrollment verification, since unverified student programs die to fraud, as Cursor's did in June 2026).
3. **Campus license (months 3–9).** Walk into student success with pilot data: opt-in rate, focus hours, attendance delta, student satisfaction. Frame it as retention infrastructure, not a wellness app. Offer to be the software layer for an NYU-IRL-style initiative.
4. **Pledge program.** Announce "Facedown for Campuses": the first 25 universities that commit to a device-free initiative get the campus license free for a year in exchange for data-sharing and a case study. This is the press and YC narrative.
5. **Research partners.** Offer the RPI, Pitt and UT Austin authors a data partnership; a second peer-reviewed study on your platform is the moat consumer apps cannot buy.
6. **Expansion.** K-12 policy operations for the 28+ bell-to-bell states, then employers.

## 6. Technical plan (what I build)

| Layer | Choice | Notes |
|---|---|---|
| Web (instructor, admin, student portal) | Next.js App Router, TypeScript, Tailwind, shadcn/ui | Vercel Pro or Railway |
| Mobile | Expo (React Native), custom dev client | iOS lock detection via protected-data notifications; Android via screen-off receiver; local session timer with background-safe reconciliation; push via Expo Notifications |
| Data | Supabase Postgres, row-level security per institution | Store: user, institution, course, session (start, end, verified minutes, method). Nothing about apps or location |
| Auth | Clerk with .edu email verification and SSO connections for campus licenses | Google Workspace, Microsoft Entra SSO for licensed campuses |
| Billing | Stripe with PO number and net-30 invoicing for institutions | Card for department pilots |
| Integrations | ICS import, Canvas calendar feed on day one; gradebook CSV export; LTI 1.3 grade passback in phase 2 | Canvas covers ~40% of US institutions |
| Analytics | PostHog with pseudonymized IDs; institution-level dashboards from Postgres views | |
| Email, jobs, errors | Resend, Trigger.dev, Sentry | |
| Compliance | FERPA-minimal data model, SDPC-style DPA template, VPAT and WCAG 2.1 AA from the start, SOC 2 when the first campus asks | |

**What you must do:** an Apple Developer account ($99/yr) and a Google Play developer account ($25) in your name; a company entity and Stripe account; test builds on a real iPhone and Android phone; sign the store listings. Everything else, including store metadata and privacy labels, I can prepare.

## 7. First 90 days

| Weeks | Milestone | Success measure |
|---|---|---|
| 1–3 | Mobile MVP (start, lock verification, session log, streaks) plus instructor console with join codes and CSV export | Works end to end on your own phone in a real lecture |
| 3–5 | Recruit 3–5 instructors for a mid-term pilot (Oct–Nov 2026) or a Spring 2027 pilot; campus ambassador page; landing page and pledge page | 3 signed instructors, 200+ student installs |
| 5–9 | Run pilot; weekly instructor check-ins; add Canvas calendar import and section leaderboard | 40%+ opt-in in pilot sections; 60%+ session completion; instructor keeps using it after week 4 |
| 9–13 | Pilot report; pitch the student-success or first-year office; apply to the next YC batch with the pilot data and the "incentives beat bans" study as the thesis | 1 paid department pilot or a signed campus pilot letter |

Metrics that matter from day one: opt-in rate per section, verified minutes per student per week, week-4 retention, attendance delta versus the prior term, and instructor net promoter score.

## 8. Risks and mitigations

- **Apple or Google change lock-state behavior.** Keep the mechanism API-light; add instructor join codes and class-end auto-stop so a single signal cannot break the product. Shielding via Family Controls is an add-on, never the core.
- **Gaming (second phone, leaving the phone at home).** Accept it: the goal is norms and participation, not surveillance. Cap credit per week; require the session to overlap the class window; instructors can randomly spot-check with a QR on a slide.
- **Equity and coercion objections.** Everything is opt-in, every credit has a non-phone alternative, exemptions are one tap, and no penalties exist. Publish the policy; universities will ask.
- **Universities are slow.** Department cards and instructor freemium bypass procurement for the first year. The campus license is the second sale, made with data.
- **Copycats.** The mechanism is simple; the moat is instructor adoption, gradebook and LMS integration, the research partnership, and the campus contract base. Move fast on integrations.
- **Sherlocking by Apple.** Apple's 2026 school-hour schedules are parental controls for child accounts. They do not verify anything to an institution or connect to a gradebook. Stay institution-facing.

## 9. Runner-ups, if you prefer a different bet

**K-12 phone-policy operations and screen-time compliance (pure web).** Incident logging with clear discipline steps, pouch and locker inventory, parent notifications, an appeal workflow, and, for the 2026 screen-time laws, a Chrome extension that measures per-student instructional screen minutes on school devices and generates state reports. Sell per school through state implementation grants and Title IV-A; pledge it free to the first districts in one bell-to-bell state. Slower sales, but zero mobile risk and a compliance deadline behind you.

**Integrity receipts (proof-of-process writing).** A student writes in a tracked editor and attaches a verifiable process receipt to any submission; institutions adopt it through LTI as the alternative to detectors they are switching off. Strong timing, but Grammarly Authorship and Turnitin Clarity make defensibility hard.

**Insurance appeal autopilot (outside education).** Read a denial letter and EOB, draft and file the appeal, track deadlines; sell as an employer or union benefit. The most universal adult pain we found, with 85% of denials never appealed, but HIPAA-heavy and not pledgeable to schools.

## 10. What I need from you

Pick the bet. If it is Facedown, the next session starts the mobile and web MVP in this repository under the plan in section 6. If it is the K-12 runner-up, I scaffold the district web app instead. Either way, confirm the working name or give me one.
