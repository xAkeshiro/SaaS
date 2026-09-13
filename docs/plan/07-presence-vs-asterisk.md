# Presence vs Asterisk: an idea built around your campus connections (13 Sep 2026)

**Your assets, taken seriously.** Three different things: (1) students you know at several colleges, (2) the people who run marketing and student engagement at those schools, and (3) access to college events. Asset 2 is the rare one. A school's marketing or student-activities office can put an app in front of an entire student body at orientation, welcome week and in official email, for free, if the app serves the school's own goals. Those goals are retention, belonging, attendance at events, student wellbeing, and, since 2026, being seen to do something about phones. The idea below is designed for exactly that channel.

---

## 1. Presence (working name): the campus "in real life" app

One app that answers "what's happening tonight, who's going, and how do I actually meet people," with a phone-free twist.

- **Tonight feed.** Every campus event in one swipeable feed: official calendars, club Instagrams and GroupMes, the student-activities system, ambassador input. Filters students actually use: free food, first-years welcome, small group, phone-free.
- **Tables.** RSVP as a table of four to six strangers matched by year, major and interests. Walking in alone is the reason people do not go; a table is the belonging mechanic (Timeleft has taken this to 3M users off campus, nobody has built it into campus events).
- **Presence check-in.** Tap a phone to the NFC card or scan the QR at the door. Optional "phone down" mode for the duration, verified by the phone's lock state (not Apple's fragile Screen Time API). Verified presence earns points; streaks; club, dorm and school leaderboards.
- **Rewards that businesses pay for.** Dining, bookstore and local businesses fund rewards because events send them foot traffic and they get verified attendance in return. This is the Pocket Points reward supply with the economics reversed: sponsors pay for presence, not for abstinence.
- **Organizer tools.** Clubs and the student-activities office create events, see RSVPs and check-ins, message attendees, and get attendance and belonging analytics. This is what the marketing office wants, and later what the university pays for.
- **Beyond campus.** Alumni chapters, cities (Timeleft and Pie's market), and workplaces run on the same mechanics, so the product does not end at graduation.

**Why the school will promote it:** 57% of students report loneliness and 12% are always lonely; emotional stress is the top reason a third of students consider dropping out; NYU built a university-wide device-free initiative in 2026 with lockers, lounges and dinners and no software behind it; phone-free events grew 567% in a year. An app that raises event attendance and reports belonging outcomes is a retention story a dean can repeat, and it costs the school nothing.

**Why students will use it:** it solves Friday night, not a policy.

**What exists:** CampusGroups, Anthology Engage and Modern Campus Presence are institutional systems students tolerate, not open. Fizz (700 campuses, $46M raised) and Sidechat are anonymous feeds. Pie (300k users), Timeleft (3M) and 222 are city-based and not campus-native. Partiful, Luma and Posh are invites and tickets. Snapchat added event planning on 10 Sep 2026, which validates the demand and is the biggest threat. Nobody combines campus events, stranger tables, verified phone-free presence and belonging data.

## 2. Head to head

| Criterion | Asterisk (fine-print shield, campus-first) | Presence (campus IRL app) |
|---|---|---|
| Fits your school-marketing contacts | Fits under "financial wellness"; a real but second-tier message for a marketing office | Fits their core job: engagement, belonging, retention, phone-free programming. This is what they already run events for |
| Fits your student contacts and events | Lease clinics and deal watchdog drives at fairs; useful but not the point of the event | The events are the product. Every event your people run is a launch |
| Value to the first user, alone | High: one lease review pays off with zero other users | Low until a campus has density. **The school push solves this**: an orientation push reaches the whole class in a week, which is the cold-start problem no other campus social app gets solved for free |
| Universal, "everyone can relate" | Yes: everyone signs things | Yes: loneliness and phone life are universal; the product generalizes to cities and workplaces |
| Willingness to pay | Students low, everyone else $40/yr; credit unions and an agent API behind it | Students near zero. Money comes from sponsors ($5–20k per campus per year is realistic), organizer tools, and later a university license for engagement analytics ($10–50k per campus, the CampusGroups price band) |
| Scale of the business | Large: ~130M US households, plus bank channels | Medium: 50 campuses at $30–60k combined is $1.5–3M ARR; the upside is the city and workplace expansion, which is unproven |
| Virality and content | Shareable "caught a trap" cards; "read the fine print" TikTok format | Stronger: events are content, tables produce stories, school-vs-school leaderboards give ambassadors a scoreboard |
| Competition | Upload-later tools; Rocket Money after the fact | Snapchat events, Fizz, institutional systems, Pie and Timeleft moving toward campuses |
| Platform risk | Apple could add renewal warnings in Safari | Low if phone-down uses lock state; moderate from Snapchat and Instagram |
| Build risk for me | Low to medium: extension, web, mobile share sheet | Medium to high: a social product plus event ingestion from messy sources plus safety features (verified .edu identity, reporting, host rules) |
| After graduation | Keeps the user | Churns unless the alumni and city expansion works |
| If the campus channel underdelivers | Still a consumer product with TikTok and search distribution | Little else; density is everything |
| Scores (U W B V M T S, plus L = leverage of your connections) | 5 4 4 4 4 5 3 + L3 = **32** | 4 3 3 5 2 4 3 + L5 = **29** |

Unweighted, Asterisk still wins because it is the bigger and safer business. Weight your connections double, because they are the one thing you have that other founders do not, and it is 35 to 34. That is a coin flip, so the decision should turn on a fact you can check, not on my scoring.

## 3. The decision rule

Ask your school-marketing contacts one question: **"Would you put a free app that raises event attendance and reduces first-year loneliness in front of the incoming class at orientation and welcome week, and give us the event calendar feed?"**

- If at least three schools say yes with a name attached, build **Presence**. That commitment is worth more than any feature, because it hands you density on day one, which is the thing that kills every other campus social app. Run Asterisk's lease clinic as a Presence event later if you want the money features.
- If the answer is "maybe, send us a deck," build **Asterisk**. Its campus launch benefits from your student contacts and events, does not depend on the marketing office, and does not die if the office says no. Presence can be the second product once you have a brand on campus.

Either way the first two weeks of build are the same: .edu identity, campus and event data model, the mobile app shell, and the ambassador kit. I will not have to throw work away when you choose.

## 4. Presence in numbers, if you pick it

- **Pricing:** free for students, forever. Sponsors pay for reward inventory and verified attendance; clubs free; the student-activities office gets organizer tools free in year one and an analytics license in year two.
- **First 90 days:** weeks 1–3 mobile app with Tonight feed, tables and NFC or QR check-in; weeks 3–6 seed three campuses with your people, ingest each school's event sources, sign five local sponsors per campus; weeks 6–13 run the first "IRL week" at each school with the marketing office, measure check-ins per event, table fill rate, repeat attendance at two weeks, and self-reported belonging before and after.
- **Kill or scale:** if repeat attendance at two weeks is under 30% or tables fill under half the time, the mechanic is not working and you fall back to Asterisk with the same campus base.
