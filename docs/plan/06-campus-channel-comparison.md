# Using campus connections: Asterisk vs a student-native app (13 Sep 2026)

**The question.** You have people who can market at their own colleges, at college events and at schools. Which product turns that asset into the most growth: Asterisk launched campus-first, or a product built for students from the start?

**Short answer.** Launch Asterisk campus-first, with four campus-native features that give your marketers something to run events around, rather than building a student-only app. The connections are a distribution asset, not a product thesis. The best use of a distribution asset is a product that delivers value to one student on day one, has seasonal campus moments to sell into, produces shareable wins, and keeps the user after graduation.

---

## 1. The three options compared

| Criterion | A. Asterisk, campus-first | B. Student-native focus and IRL app (phone-free study sessions, campus leaderboards, events) | C. Student-native "one inbox" (deadlines from LMS, email, Discord, GroupMe) |
|---|---|---|---|
| Value to the first user, before anyone else joins | High: a lease review or a caught auto-renewal pays off alone | Low until 20–30% of a campus is on it; needs density to feel alive | Medium: useful alone, but only as good as the parsing |
| What your marketers can run at events | Lease clinics at housing fairs, "student deals that secretly convert" at welcome week, textbook auto-billing opt-out drives, graduation "Prime converts to $14.99" campaign | Phone-free study nights, IRL socials, campus-vs-campus challenges: the strongest event fit | A tabling demo; little to run an event around |
| Campus viral loop | Roommate groups for shared leases and subscriptions; a per-school landlord and lease index that gets better as more students scan; school-vs-school savings leaderboard | Strongest: friends, leaderboards, events | Weak: individual utility |
| Willingness to pay | Low for students, so a $19.99/yr student price; real money comes from non-students, credit unions and the agent API | Very low (Pocket Points had 40% of Penn State and could not monetize; Opal's student-heavy base cannot pay $99/yr) | Very low; planners are free |
| After graduation | Keeps the user; leases, subscriptions and contracts get more expensive, not less | Churns at graduation; ceiling is ~19M US students | Churns at graduation |
| Competition | Upload-later tools only; Rocket Money sees subscriptions after the fact; Honey's trust collapse is an opening | Opal (1M+ DAU, two-thirds students), Forest (60M), Fizz (700 campuses, $46M raised), Timeleft (3M), Pie (300k), NYU IRL-style programs; Pocket Points is the graveyard | Coursicle, Notion, Google Calendar, LMS apps; many free planners |
| Platform risk | Apple could add renewal warnings to Safari; nothing else absorbs the vault, execution and index | High: iOS Screen Time API broke for ten months in iOS 26; Apple keeps absorbing features | Canvas and Google could parse announcements natively |
| Build risk for me | Low to medium: extension plus web plus a mobile share sheet | Medium to high: native app plus a fragile API plus a social product that needs density | Low: web plus mobile |
| If the campus push fizzles | The product still sells to everyone else | The product has nothing else | The product has nothing else |

**Verdict:** A wins on everything except event fit and campus virality, and the four features below close most of that gap. B is the more exciting event product but it is a social network with a fragile API, a payer problem that killed its predecessor, and a graduation cliff. C is a feature, not a company.

## 2. Why students are the right first users for Asterisk

Students are the most fine-print-exposed demographic in the country, and the traps are seasonal, which is exactly what a campus marketing calendar needs.

- **Student deals that convert to full price.** Prime Student renews at $7.49/month after six months and converts to regular Prime at $14.99/month or $139/year at graduation or age 25 unless cancelled; Spotify Premium Student rolls to full price after twelve months without re-verification ([Penny Hoarder](https://www.thepennyhoarder.com/save-money/amazon-prime-student-more-affordable/), [Spotify](https://support.spotify.com/us/article/renew-student-discount/)). Apple Music, Hulu, YouTube Premium, Adobe, Notion and every dating app run the same pattern. 57% of students say a lot of their money goes to media and subscriptions ([Direct Textbook 2026](https://www.directtextbook.com/articles/the-true-cost-of-college-life/)).
- **Automatic textbook billing.** Roughly half of campuses now add course materials to the tuition bill unless the student opts out by a buried deadline; 70% of students skipped materials due to cost and 75% took a course requiring an access code ([Student PIRGs, Feb 2026](https://studentpirgs.org/2026/02/10/fixing-the-broken-textbooks-market-fourth-edition/), [PIRG report](https://pirg.org/edfund/resources/automatic-textbook-billing-2/)). The Department of Education has proposed switching this to opt-in. Your marketers can collect each school's opt-out deadline once and every student on that campus gets the alert.
- **First leases.** Only 42% of renters get their full deposit back (Zillow). 15% of students surveyed had contacted a rental scammer and 98% of those lost money ([College Pads](https://blog.rentcollegepads.com/topics/college-life/how-to-avoid-rental-scams/)); the FTC says young adults are three times more likely to be scammed. Joint-and-several liability, automatic renewal clauses, early-termination fees and re-letting charges are standard in student leases. Campus housing offices review leases by appointment; Asterisk does it in the line at the housing fair.
- **Gyms, phone plans, meal plans, parking, tuition payment plans, student loan servicers.** All fine print, all first-time signers.
- **They share.** A screenshot of a caught trap is native content for the "read the fine print" TikTok format, and college accounts are where that format lives.

## 3. Four campus-native features to build into the first release

1. **Lease Clinic mode.** Photograph or upload a lease; get the card (deposit terms, renewal clause, joint liability, early termination, fees, what the state actually allows). Every scan feeds a **per-school landlord and complex index**: the more students at a campus use it, the better the index for that campus. This is the campus network effect, and it is the thing your marketers can table with at every housing fair.
2. **Student deal watchdog.** Track student-priced subscriptions in the vault and warn 14 days before a conversion to full price, with the one-tap cancel path. Graduation season becomes a campaign: "Your Prime Student ends the week you graduate."
3. **Campus deadlines.** Per-school textbook auto-billing opt-out deadlines, tuition payment plan fee deadlines and lease renewal windows, seeded by your marketers, alerting every student who selects that school.
4. **Roommate groups and school leaderboard.** Shared leases, utilities and split subscriptions in a roommate group (the household-level viral loop); a school-vs-school "money saved" leaderboard that gives ambassadors a scoreboard and rival campuses a reason to install.

None of these is a pivot. They are Asterisk's universal features (scan, vault, alerts, index, groups) with campus data layered on top, and every one still works for a 35-year-old renter.

## 4. Campus launch plan

- **Pricing for students:** free tier with unlimited lease and contract scans during the launch semester for .edu emails; Plus at $19.99/year for students (half the general price); no student card required for the first catch. Monetization from students is deliberately small; the campus push exists to create users, data and content.
- **Ambassador economics:** the market rate is about $10 per paid signup with a $500 bonus at 25 signups a semester, and companies like WhatsApp and Adobe run 200-ambassador or 28-campus programs through agencies ([The Campus Agency](https://thecampusagency.com/case-studies/), [Social Ladder](https://www.socialladderapp.com/blog/student-ambassador-programs-examples/)). Pay your marketers on verified installs and scans, not on paid conversions, because scans build the index and the content.
- **Calendar:** housing fairs (Oct–Mar depending on campus), welcome week and add-drop (textbook opt-out deadlines), spring lease-renewal season, graduation (student deal conversions). Each is an event your people can run.
- **Sponsors that fit:** campus-affiliated credit unions and student legal services already pay to reach students with "protect your money" messaging and can sponsor lease clinics; they are also the first B2B2C partners for the general product.
- **Content:** every event produces screenshots; each school's landlord index produces a local story ("the five worst leases near campus"); the national Trap Index produces the press story. Fizz grew to 700 campuses on tabling plus student social accounts; the same motion works here without needing a whole campus to adopt before the app is useful.
- **Measure:** installs per event, scans per install, catches per scan, roommate-group creation rate, share rate, and week-4 retention. If week-4 retention on campus is above 35% and scans per install are above 3, expand to general consumer marketing on the back of the campus data.

## 5. If you still want the student-native app

The one version of option B worth considering is a phone-free study and IRL events app run by your marketers as a campus program (study nights with verified phone-lock, campus leaderboards, event check-ins), monetized by local sponsors and later by the university. It is the most fun to run events for, and the NYU IRL trend gives it timing. But it needs campus density before it is useful, it rides the iOS Screen Time API that broke for most of the last year, its predecessor died with 40% of a campus using it, and it ends at graduation. It would be a better second product for the same team than a first one.

## 6. Doesn't Rocket Money already do this?

Partly, and it is the most important incumbent to be honest about. Rocket Money (formerly Truebill, acquired for $1.275B in 2021, "10M+ members" by its own count) links to your bank through Plaid, finds recurring charges after they post, cancels subscriptions through a concierge (and since August 2026 through its "Rowan" text agent on the top plan), and negotiates bills with human negotiators for 35–60% of first-year *projected* savings, a formula that is a standing source of BBB complaints. Bank apps, Copilot, Monarch and Apple's App Store subscription page all do the "find your recurring charges" part too.

What that means for Asterisk:

- **If Asterisk were a subscription tracker with a cancel button, Rocket Money would defeat it.** That slice is commoditized, and Rocket has ten million users and a fintech's balance sheet.
- **Asterisk's core is the moment before the charge exists.** Rocket sees a subscription after the first debit hits your statement. Asterisk reads the terms while your finger is over the button, when you can still choose a virtual card, opt out of arbitration, or walk away. Nothing in Rocket's product touches a checkout, a trial page or a signature.
- **Bank statements do not contain fine print.** A lease's joint-liability clause, a gym's 30-day notice rule, a hotel's resort fee, a ticket's non-refundable terms, a phone plan's early-termination fee, a textbook auto-billing opt-out deadline: none of it appears as a recurring charge. This is most of the traps students and everyone else actually fall into, and Rocket has no data source for it.
- **Evidence and disputes.** Rocket cancels; it does not keep a timestamped snapshot of the terms you saw, and it does not draft the refund demand, the chargeback statement or the attorney-general complaint from that evidence.
- **No bank link required.** Many students and privacy-conscious people will not connect their bank to an app. Asterisk needs a page, a screenshot or a PDF.
- **Trust positioning.** Rocket's fee model and Honey's affiliate scandal are the two reasons people distrust "money-saving" apps; a flat subscription with no affiliate revenue and no bank access is a clean contrast.

The real risk is that Rocket Money adds a checkout extension later. It could. The defenses are speed, owning the "fine print" brand across leases and contracts rather than only subscriptions, the Trap Index data that compounds with every scan, the campus index your marketers seed, and partnerships with credit unions before Rocket's sales team gets there. The test to apply when you build: any feature that only tracks recurring charges is Rocket's turf and should be a convenience, never the pitch.
