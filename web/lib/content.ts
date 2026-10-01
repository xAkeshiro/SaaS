/**
 * Single source of truth for Unmute site copy and data.
 * Sections import from here so wording stays consistent across pages.
 */

export const site = {
  name: "Unmute",
  tagline: "Talk to an AI so you can talk to people",
  description:
    "Rehearse the conversation you are dreading, out loud, with an AI that plays the other person and pushes back. Then get told exactly what to do differently. Three minutes a day. Not a companion.",
  status: "Early access · fall 2026",
  contactEmail: "hello@unmute.app",
  social: {
    x: "https://x.com",
    tiktok: "https://tiktok.com",
    linkedin: "https://linkedin.com",
  },
} as const;

export const nav = {
  links: [
    { label: "How it works", href: "/#how-it-works" },
    { label: "Scenarios", href: "/#scenarios" },
    { label: "Pricing", href: "/pricing" },
    { label: "Manifesto", href: "/manifesto" },
    { label: "Teams", href: "/teams" },
  ],
  cta: { label: "Get early access", href: "/#early-access" },
} as const;

export const hero = {
  /** The owner's exact pill line. Nothing gets appended to it. */
  eyebrow: "Conversation practice for real life",
  headline: "Talk to an AI so you can talk to people.",
  headlineEmphasis: "people",
  sub: "Rehearse the conversation you dread. The AI plays the other person, pushes back, and tells you exactly what to change.",
  ctaPrimary: "Get early access",
} as const;

/** Sourced in `footnotes`. Speak's revenue (footnote 3) is cited from the manifesto, not shown as a stat about Unmute. */
export const stats = [
  {
    value: 65,
    suffix: "%",
    label: "of Gen Z say calling a stranger makes them uncomfortable. Only a third are comfortable making calls at all.",
    footnote: 1,
  },
  {
    value: 37,
    suffix: "%",
    label: "of adults 18 to 25 report significant anxiety, the highest of any adult age group.",
    footnote: 2,
  },
] as const;

/** A real sequence, so the step number is derived from the array index where it is shown. */
export const steps = [
  {
    id: "rehearse",
    name: "Rehearse",
    title: "The other person talks back.",
    body: "Pick a conversation or describe your own. The AI plays the other person out loud. It interrupts, puts you on hold and pushes back.",
  },
  {
    id: "debrief",
    name: "Debrief",
    title: "Exactly what to change.",
    body: "Time to the ask, every sorry, every filler word and two sentences to say next time. Then your pattern: “you apologize before every ask.”",
  },
  {
    id: "daily",
    name: "Daily rep",
    title: "Three minutes, every day.",
    body: "A streak and a scenario picked from what you have coming up. Connect your calendar and “call the bank Thursday” becomes Tuesday’s rep.",
  },
  {
    id: "real",
    name: "Real mode",
    title: "Warm up, then make the call.",
    body: "A 60-second warmup and a cue card before the real call, a debrief after.",
  },
] as const;

export const moods = [
  { id: "kind", label: "Kind", hint: "Friendly, but they still have their own side." },
  { id: "neutral", label: "Neutral", hint: "Polite but distracted. Not making it easy." },
  { id: "hostile", label: "Hostile", hint: "Rushed, defensive, wants it over fast." },
] as const;

export type MoodId = (typeof moods)[number]["id"];

/**
 * The one scenario list: demo chips, scenario cards and the scripted sample
 * (`SCRIPTS` in lib/rehearse.ts, keyed by these ids) all read from it.
 * The first entry is the demo's default; the scenario cards set their own
 * order (ORDER in scenarios.tsx). `label` is the chip and the transcript
 * header; `cardTitle`/`cardBody` are the scenario card. `who`, `setup` and
 * `opener` go to the persona prompt and the first bubble. `setup` is
 * model-facing only, so it stays in plain ASCII; the visible strings use ’.
 */
export const demoScenarios = [
  {
    id: "doctor",
    label: "Book a doctor’s appointment",
    who: "Front desk at student health",
    setup: "The user is calling the student health center to book a regular appointment this week. They've put the call off since Monday. They work afternoons, so they want a morning before noon. The front desk person is rushed, with a second line ringing, and asks for name, date of birth and student ID. The first opening they offer is next Wednesday at 3:20pm. A Thursday 9:40am slot is free if the user asks for anything earlier, for a morning, or about a cancellation list. Keep it to scheduling. Do not ask about or discuss symptoms.",
    /** Same line the hero window opens with, so "Try this one" picks up the call the visitor just watched. */
    opener: "Student health, can you hold one sec? Okay, sorry. How can I help?",
    cardTitle: "The appointment call",
    cardBody: "Student health, the dentist, the pharmacy. Say what you need and get the earliest slot.",
  },
  {
    id: "bank-fee",
    label: "Get a fee waived",
    who: "A rep at your bank",
    setup: "The user got a $35 overdraft fee on Tuesday when their $65 phone bill autopay went through two days before payday and took checking $58.12 negative. It's their first overdraft in two years. They're calling to get the fee waived as a one-time courtesy. The rep follows policy: verifies identity first (full name, last four of the debit card), then says the fee is valid under the account agreement. The rep can put in one courtesy refund, or bring in a supervisor, if the user asks directly and calmly instead of apologizing or over-explaining.",
    opener: "Thanks for calling. Can I get your full name and the last four of your card?",
    cardTitle: "The $35 overdraft fee",
    cardBody: "Your phone bill autopay hit two days before payday and the bank took $35. One calm call can get it waived.",
  },
  {
    id: "raise",
    label: "Ask for $18 an hour",
    who: "Your manager",
    setup: "The user has worked part-time at a coffee shop near campus for 11 months. They close three nights a week, train the new hires, and still make $16.50 an hour. New hires start at $16. The user wants $18 an hour starting next pay period. The manager likes them but says raises happen in January with reviews, and anything over $17 has to go through the owner. The manager is short two people and busy. They move toward $18 if the user names the number, gives one concrete reason and asks for a date, and they stall if the user hedges or apologizes.",
    opener: "Hey, you wanted to talk? I’ve got like five minutes before the rush.",
    cardTitle: "The raise, by the hour",
    cardBody: "Eleven months in, training the new hires, still at $16.50. Ask for $18, then stop talking.",
  },
  {
    id: "extension",
    label: "Ask for an extension",
    who: "Your professor",
    setup: "The user is at office hours. They have a 10-page paper due Friday at 11:59pm for a 200-level history class, two exams the same week, and a 20-hour work week. They want an extension to Monday at noon. The syllabus says 10% off per late day. The professor hears this a lot, is fair but busy, and responds to one clear reason and a concrete new date, not a long story. An outline or a draft helps.",
    opener: "Hi, come on in. Which section are you in again?",
    cardTitle: "Office hours for an extension",
    cardBody: "Paper due Friday, two exams the same week. Ask for Monday at noon in under a minute.",
  },
  {
    id: "group-project",
    label: "Group project ghost",
    who: "Your group project partner",
    setup: "The user's group presentation for an intro marketing class is Monday at 9am. One partner owns the four budget slides, hasn't started them, and hasn't answered the group chat since Tuesday. The user called them to get the slides in the shared deck by Saturday at noon. The class has a peer evaluation form, and the user is ready to be honest on it if the slides don't show up. The partner is friendly but vague, a little embarrassed, works Saturdays, and gets defensive if pushed.",
    opener: "Hey. Yeah, I saw the group chat. I’ve had like three exams this week.",
    cardTitle: "The group project ghost",
    cardBody: "Four slides, due Monday, no reply since Tuesday. Get a time, not a “yeah, I got it.”",
  },
  {
    id: "pay-me-back",
    label: "Get your $72 back",
    who: "Your friend",
    setup: "Three weeks ago the user paid $72 for a friend's concert ticket. The friend keeps saying they'll Venmo it, and a Venmo request has sat ignored for a week. They're in the same friend group and see each other every week. The user called instead of texting, which surprises the friend. The user wants the full $72 today, or a specific day if not today, without making it weird. The friend isn't a bad person: they're bad with money, get paid Friday, and are a little embarrassed.",
    opener: "Hey! Wait, why are you calling? Is everything okay?",
    cardTitle: "The friend who owes you",
    cardBody: "$72 for the concert and three weeks of “I’ll send it.” Name the amount and a deadline.",
  },
  {
    id: "thanksgiving",
    label: "Not coming home for break",
    who: "Your mom",
    setup: "The user is calling their mom to say they're not coming home for Thanksgiving. Flights are $380 round trip, and they picked up three shifts that weekend. Their mom assumed they were coming and already told the family. The user wants to say it clearly, offer to FaceTime in for dinner on Thursday, and promise to be home for all of winter break, without getting talked out of it. Mom is loving but uses guilt, offers to help with the flight, and brings up grandma and dad.",
    opener: "Hi, sweetie! Did you book your flight yet? Prices are going up.",
    cardTitle: "Telling your mom",
    cardBody: "You’re not coming home for Thanksgiving. Say it once, then don’t take it back.",
  },
  {
    id: "spring-trip",
    label: "Say no to the trip",
    who: "The friend planning the trip",
    setup: "The user's friend group is planning a spring break beach trip: $420 each for the rental plus gas, with a $140 deposit due Friday. Everyone else already paid. The user hasn't answered the group chat, so the friend organizing it calls to collect. The user can't afford it and wants to say no clearly, without walking through their bank balance and without offering to pay part of it out of guilt. The friend is disappointed, worried about the split, and pushes a little before accepting.",
    opener: "Hey, you didn’t answer the group chat. I need your $140 for the deposit by Friday. You’re in, right?",
    cardTitle: "The trip you can’t afford",
    cardBody: "Everyone sent the $140 deposit. Say you’re out without showing your bank balance.",
  },
] as const;

export type DemoScenario = (typeof demoScenarios)[number];

export const together = {
  title: "Practice with people, not just about them.",
  sub: "Bring a friend into the room. It’s less weird than it sounds.",
  features: [
    { icon: "Users", title: "Practice rooms", body: "A friend plays your manager while the AI coaches. Or the AI plays the front desk while your friends rate you." },
    { icon: "Flame", title: "Dares", body: "Small real-world reps, 30 seconds to 5 minutes. Shareable clips, voice-changed if you want." },
    { icon: "Clapperboard", title: "The before-and-after", body: "Your first call next to your tenth. Post it if you want. It stays private if you don’t." },
  ],
  /** Real spoken reps. The last one lands on top of the animated list. */
  dares: [
    { title: "Call to book your haircut instead of using the app", tag: "2 min" },
    { title: "Ask your TA one question at office hours", tag: "5 min" },
    { title: "Leave a voicemail instead of hanging up", tag: "30 sec" },
    { title: "Ask to split the check by what you ordered", tag: "1 min" },
    { title: "Call a restaurant and ask how long the wait is", tag: "1 min" },
    { title: "Call the pharmacy and ask if your refill’s ready", tag: "1 min" },
  ],
} as const;

export const principles = {
  title: "It exists to make you need it less.",
  intro:
    "AI companions are built to keep you talking to them. Unmute is built to get you talking to people. Every rehearsal ends with a real conversation to go have.",
  items: [
    { title: "Every persona is clearly synthetic.", body: "No romantic roleplay, no endless chat, no “I missed you.” A rehearsal has an end and a debrief." },
    { title: "A coach, not therapy.", body: "Crisis language routes to real resources, every time." },
    { title: "Your rehearsals are yours.", body: "Private to you, never used to train models, deleted when you say so." },
    { title: "Success is you closing the app.", body: "We measure the conversations you go have, not the minutes you spend with us." },
  ],
  cta: { label: "Read the manifesto", href: "/manifesto" },
} as const;

export const pricing = {
  title: "One rep a day is free.",
  /** The title already says Free; the lede only adds the Plus prices. */
  sub: "Plus is $14.99 a month, or $99 a year.",
  yearlyNote: "Save 45%",
  tiers: [
    {
      id: "free",
      name: "Free",
      price: { monthly: 0, yearly: 0 },
      period: "forever",
      blurb: "The daily rep, for everyone.",
      features: ["One rehearsal a day, any scenario", "The debrief", "Streaks"],
      cta: { label: "Get early access", href: "/#early-access" },
      highlight: false,
    },
    {
      id: "plus",
      name: "Plus",
      price: { monthly: 14.99, yearly: 99 },
      period: "a month",
      yearlyPeriod: "a year",
      blurb: "For when one rep a day isn’t enough.",
      features: [
        "Unlimited rehearsals and custom scenarios",
        "Hard mode, real mode, calendar reps",
        "Your patterns and trends over time",
        "Practice rooms and dares",
      ],
      cta: { label: "Get early access", href: "/#early-access" },
      highlight: true,
      /** Consumer copy says fall, not interview season: no scenario here is an interview (that pitch is Teams'). */
      badge: "Best for a hard semester",
    },
    {
      id: "teams",
      name: "Teams",
      price: null,
      priceLabel: "$3 to $8",
      period: "per seat, per month",
      blurb: "Career centers, companies, clinicians.",
      features: [
        "Interview season for a whole campus",
        "Customer-facing and manager practice",
        "Structured practice programs with clinicians",
        "Admin dashboard and cohort reports",
      ],
      cta: { label: "Request a pilot", href: "/teams#pilot" },
      highlight: false,
    },
  ],
  comparison: {
    columns: ["Free", "Plus", "Teams"],
    rows: [
      { feature: "Rehearsals per day", values: ["1", "Unlimited", "Unlimited"] },
      { feature: "Scenario library", values: [true, true, true] },
      { feature: "Custom scenarios", values: [false, true, true] },
      { feature: "Debrief after every rehearsal", values: [true, true, true] },
      { feature: "Hard mode (hostile personas)", values: [false, true, true] },
      { feature: "Real mode: warmup + cue card", values: [false, true, true] },
      { feature: "Calendar-aware daily rep", values: [false, true, true] },
      { feature: "Patterns and trends", values: [false, true, true] },
      { feature: "Practice rooms and dares", values: [false, true, true] },
      { feature: "Cohorts, admin dashboard, reports", values: [false, false, true] },
      { feature: "SSO and procurement", values: [false, false, true] },
    ],
  },
} as const;

/**
 * Full list on /pricing. Home omits the companion, therapy and privacy answers
 * by `q` (the dark band right below says them), so keep those questions verbatim.
 */
export const faq = [
  {
    q: "Is this an AI companion?",
    a: "No. Companions are built to keep you talking to them. Unmute is built to get you talking to people. Every rehearsal ends with a debrief and a real conversation to go have. No romantic roleplay, no endless chat.",
  },
  {
    q: "Does it listen to my real calls?",
    a: "Never. Phones don’t allow it, and you wouldn’t want it to. Real mode is a warmup before the call and a debrief from your own notes after.",
  },
  {
    q: "What happens to my rehearsals?",
    a: "They are private to you, never used to train models, and deleted when you say so. Sharing a clip is always your explicit choice.",
  },
  {
    q: "Is it therapy?",
    a: "No. Unmute is practice, not therapy or medical care. Crisis language routes to real resources, every time. Clinicians can run structured practice programs with clients on Teams.",
  },
  {
    q: "How real is the other person?",
    a: "It interrupts, sighs, puts you on hold and pushes back. You choose the mood: kind, neutral or hostile. Clear, calm asks move it. Rambling and apologizing don’t.",
  },
  {
    q: "When can I use it?",
    a: "Early access opens campus by campus this fall. Join the list and we’ll tell you the day it reaches yours.",
  },
  {
    q: "What if my conversation isn’t one of the eight?",
    a: "Describe it in a sentence or two and the AI plays whoever is on the other end. Custom scenarios come with Plus.",
  },
] as const;

export const finalCta = {
  title: "Say it here first.",
  /** The launch timing is the FAQ's job (it sits right above on home and /pricing), so this line doesn't repeat it. */
  sub: "The conversation you keep putting off is still there. Practice it tonight, then go have it.",
  note: "One email when it launches. Nothing else.",
} as const;

export const footnotes = [
  "YouGov, phone habits by generation: 65% of Gen Z uncomfortable calling a stranger; 33% of Gen Z comfortable making calls versus 49% of Millennials and 67% of Boomers.",
  "Young adult mental health statistics compiled by Compass Health Center, 2026.",
  "Y Combinator on Speak: 15M downloads, $100M+ annualized revenue, users practice speaking 5 to 10 times more than on other apps.",
] as const;

export const footer = {
  /** The timing lives in `site.status` on the next line of the footer, so the blurb does not repeat it. */
  blurb: "Conversation practice for real life.",
  columns: [
    {
      title: "Product",
      links: [
        { label: "How it works", href: "/#how-it-works" },
        { label: "Scenarios", href: "/#scenarios" },
        /* The panel, not the section heading, so Start lands above the fold. */
        { label: "Try a rehearsal", href: "/#try-panel" },
        { label: "Pricing", href: "/pricing" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "Manifesto", href: "/manifesto" },
        { label: "Teams", href: "/teams" },
        { label: "Early access", href: "/#early-access" },
        { label: "Contact", href: `mailto:${site.contactEmail}` },
      ],
    },
    {
      title: "Trust",
      links: [
        { label: "Not a companion", href: "/manifesto#not-a-companion" },
        { label: "Privacy", href: "/manifesto#privacy" },
        { label: "Safety", href: "/manifesto#safety" },
      ],
    },
  ],
  finePrint:
    "Unmute is practice, not therapy or medical care. Rehearsals are private to you, never used to train models, and deleted when you say so. The rehearsal on this site is a typed preview of the app and may use scripted replies.",
} as const;

export const manifesto = {
  title: "It exists to make you need it less.",
  sub: "A short manifesto for a coach that wants you to close the app.",
  sections: [
    {
      id: "the-gap",
      heading: "Everyone has a conversation they are dreading this week.",
      paragraphs: [
        "The call to book a doctor’s appointment. The $35 fee you let the bank keep. Asking for $18 an hour. The extension you never asked for. The group project partner who went quiet. The $72 a friend still owes you. Telling your mom you’re not coming home. Saying no to the trip.",
        "Sixty-five percent of Gen Z say calling a stranger makes them uncomfortable. Only a third are comfortable making calls at all.[1] This is not a character flaw. It is a skill nobody was given a place to practice.",
        "Language apps figured this out years ago: get people to say it out loud, every day, and reward the rep. Speak built a hundred-million-dollar business on that.[3] Nobody built it for the conversations people actually fear, in their own language.",
      ],
    },
    {
      id: "not-a-companion",
      heading: "We are not a companion.",
      paragraphs: [
        "AI companions are built to keep you talking to them. Their success metric is your minutes. Ours is the opposite: the conversation you go have after you close the app.",
        "So there is no romantic roleplay. No endless chat. No “I missed you.” Every persona is clearly synthetic, every rehearsal has an end, and every end has a debrief that points you back at a real person.",
      ],
    },
    {
      id: "safety",
      heading: "A coach, not therapy.",
      paragraphs: [
        "Unmute is practice, not therapy or medical care. If crisis language shows up in a rehearsal, we stop rehearsing and route to real resources, every time. Clinicians who run structured social-anxiety practice with clients can use Teams for exactly that, with the clinician in the loop.",
      ],
    },
    {
      id: "privacy",
      heading: "Your rehearsals are yours.",
      paragraphs: [
        "Rehearsals are private to you, never used to train models, and deleted when you say so. Unmute never listens to real calls. Phones don’t allow it, and you wouldn’t want it to. Sharing a clip is always your explicit choice, voice-changed if you like.",
      ],
    },
    {
      id: "the-rep",
      heading: "Three minutes, every day, until you don’t need us.",
      paragraphs: [
        "The whole product is a rep and a debrief. The other person pushes back. You make the ask and stop talking. You get told exactly what to change and the two sentences to try next time. Then you go say it to a human.",
        "If it works, you will use Unmute less over time. That is the point.",
      ],
    },
  ],
} as const;

export const teams = {
  title: "Interview season for a whole campus.",
  sub: "Career centers, companies and clinicians run structured practice on Unmute. Seats from $3 to $8 a month, free for career centers this interview season.",
  audiences: [
    {
      icon: "GraduationCap",
      title: "Career centers",
      body: "Every student gets a mock interview a day from September to November, with a debrief the counselor can see. Cohort reports show who is ready and who is stuck on the pay question.",
      bullets: ["Campus-wide seats", "Interview and career-fair scenarios", "Counselor dashboard"],
    },
    {
      icon: "Building2",
      title: "Companies",
      body: "Customer-facing teams and new managers rehearse the hard ones: the angry customer, the missed deadline, the performance conversation. Practice before it costs you a customer or a report.",
      bullets: ["Custom scenarios from your playbook", "Manager and support tracks", "SSO and procurement-ready"],
    },
    {
      icon: "Stethoscope",
      title: "Clinicians",
      body: "Structured social-anxiety practice between sessions, with the clinician setting the ladder and reviewing the debriefs. Crisis language routes to real resources, every time.",
      bullets: ["Exposure ladders you define", "Clinician-visible debriefs", "Clear safety boundaries"],
    },
  ],
  offer: {
    title: "Career centers: free for interview season.",
    body: "September to November 2026. Bring your students, we bring the interviewers. Tell us your campus and we will set up your cohort.",
    cta: "Request a pilot",
  },
  form: {
    fields: [
      { id: "name", label: "Your name", placeholder: "Sam Ortiz", type: "text" },
      { id: "email", label: "Work email", placeholder: "you@university.edu", type: "email" },
      { id: "org", label: "Organization", placeholder: "Career center, company or practice", type: "text" },
      { id: "seats", label: "Approximate seats", placeholder: "250", type: "text" },
    ],
  },
} as const;

/* ---------- Hero window, proof and How it works ---------- */

/**
 * Self-playing app-window mock under the hero. Pure UI, no network. It is an
 * example, labeled as one, and plays the same world as the demo's first chip.
 */
export const rehearsalWindow = {
  windowTitle: "Example rehearsal",
  mode: "Phone call",
  /** Opens this scenario in the live demo. */
  tryLabel: "Try this one",
  tryScenarioId: "doctor" satisfies DemoScenario["id"],
  /** Where the window's clock starts each loop, in seconds. The ask lands near 0:11, matching the first debrief row. */
  clockStart: 8,
  persona: {
    /** Same name as the doctor scenario's `who`, which the card and demo chip show. */
    who: "Front desk at student health",
    initial: "F",
    tag: "AI",
    scenario: "Booking the appointment you’ve put off since Monday",
    mood: "rushed, distracted",
  },
  status: {
    persona: "Front desk is talking",
    user: "You’re talking",
    pause: "Front desk is checking",
    idle: "On the line",
    ended: "Call ended",
  },
  transcript: [
    { role: "persona", speaker: "Front desk", text: "Student health, can you hold one sec? Okay, sorry. How can I help?" },
    { role: "user", speaker: "You", text: "Hi, um, I need an appointment this week, whatever’s earliest. I’m free any morning before noon." },
    { role: "persona", speaker: "Front desk", text: "Thursday at 9:40 is my only morning. Want it?" },
  ],
  debrief: {
    title: "Debrief",
    meta: "Example",
    /** Shown in place of `meta` while the call is still playing. */
    pendingMeta: "Listening",
    rows: [
      { label: "Got to the ask", prefix: "0:", value: 11, note: "was 1:05", check: false },
      { label: "Apologies before the ask", prefix: "", value: 0, note: "was 3", check: false },
      { label: "Filler words", prefix: "", value: 1, note: "“um”", check: false },
      { label: "Asked for the earliest slot", prefix: "", value: 1, note: "yes", check: true },
    ],
    nextLabel: "Next time, say",
    /** next[0] matches the demo's doctor debrief (SCRIPTS.doctor in lib/rehearse.ts), so both coach the same line. */
    next: [
      "Hi, I need the earliest morning appointment you have this week.",
      "Can you put me on the cancellation list in case something earlier opens?",
    ],
  },
} as const;

/** Proof strip between the hero and How it works: a heading over the two sourced stats. */
export const proof = {
  title: "You’re not the only one who lets it ring.",
} as const;

/** Sticky "How it works" showcase: heading plus the strings inside the four hand-built UI mocks. */
export const howItWorks = {
  title: "Rehearse. Debrief. Repeat. Then do it for real.",
  /** One caption under the panel, so the mock numbers read as examples. */
  caption: "Example screens",
  /** All four mocks tell one story: the bank fee call, rehearsed, debriefed, then made for real. */
  mocks: {
    rehearse: {
      scenarioId: "bank-fee" satisfies DemoScenario["id"],
      /** M:SS like the hero clock. Just after the ask (0:38 in the debrief mock), so the rep is pushing back. */
      status: "0:52",
      speaking: "Bank rep is talking",
      /** The neutral script's pushback (SCRIPTS["bank-fee"].lines.neutral[1]), matching the mock's selected mood. */
      line: "Those fees are valid under your account agreement. I can’t just take them off.",
      moodLabel: "Mood",
    },
    debrief: {
      title: "Debrief",
      subtitle: "Get a fee waived · 2:41",
      score: 7,
      scoreOf: "/ 10",
      rows: [
        { label: "Got to the ask", value: "0:38", was: "was 1:52" },
        { label: "Apologies before the ask", value: "1", was: "was 4" },
        { label: "Filler words", value: "4", was: "was 9" },
      ],
      held: { label: "Held your ask", value: "$35 back" },
      patternLabel: "Pattern",
      pattern: "You apologize before every ask.",
    },
    daily: {
      streak: 12,
      streakUnit: "days",
      streakLabel: "Streak",
      weekLabel: "Last 7 days",
      days: ["W", "T", "F", "S", "S", "M", "T"],
      todayIndex: 6,
      rep: { title: "Tuesday’s rep: the $35 fee", meta: "From your calendar · call the bank Thursday" },
    },
    real: {
      title: "Real mode",
      phase: "Warmup",
      ring: { seconds: 45, total: 60, caption: "left" },
      cueTitle: "Cue card",
      cues: [
        "Lead with it: “Can you waive the $35 fee?”",
        "Then stop. Let them look it up.",
        "If it’s a no: “Can a supervisor approve it?”",
      ],
      cta: "Make the call",
      note: "Unmute never listens to real calls.",
    },
  },
} as const;

/* ---------- Scenarios, Together and the anti-companion band ---------- */

/**
 * Heading and actions for the scenario cards, which render from `demoScenarios`.
 * Choosing a card loads that scenario into the demo below; `customLabel` opens
 * the demo's custom box with `customPrefill`.
 */
export const scenariosHeading = {
  title: "The ones people put off all week.",
  sub: "Eight to start, from the doctor’s office to the friend who owes you $72.",
  customLabel: "Or describe your own",
  /** Shown on a card when it is pointed at. */
  action: "Rehearse this",
  customPrefill: "I need to ask my shift manager for fewer hours during finals, and the schedule posts Friday.",
  /**
   * The lead card (pay-me-back, first in scenarios.tsx's ORDER) plays a few
   * more turns under its opener on desktop. Not the doctor call: the hero
   * window already plays that one.
   */
  leadPreview: [
    { from: "you", text: "Nothing’s wrong. Just calling about the $72 from the concert." },
    { from: "them", text: "Oh. Yeah, my bad, I keep forgetting. I’ll send it soon, I swear." },
    { from: "you", text: "Can you send it Friday when you get paid?" },
  ],
} as const;

/** Extra strings for the Together section. */
export const togetherExtras = {
  daresTitle: "Today’s dares",
  daresMeta: "New every morning",
} as const;

/** Extra strings for the anti-companion band. app/teams/page.tsx also uses `secondaryCta`. */
export const principlesExtras = {
  secondaryCta: { label: "See pricing", href: "/pricing" },
} as const;

/* ---------- Live demo (live-demo.tsx, /api/rehearse) ---------- */

/** Interactive rehearsal section. Persona and coach prompts live in `lib/rehearse.ts`. */
export const liveDemo = {
  title: "Try a rehearsal right now.",
  sub: "Pick who you’re talking to and how hard they push. Type what you’d actually say, then end it for your debrief.",
  labels: {
    conversation: "Who you’re talking to",
    custom: "Or describe your own",
    customPlaceholder: "e.g. The pharmacy. My refill’s been “processing” for four days and I leave for break Friday.",
    customLabel: "Custom rehearsal",
    customWho: "The other person",
    /** Prefix sent with a custom setup so "I" and "my" read as the user in the prompts. */
    customSetup: "In the user's own words:",
    mood: "How hard they push",
    voice: "Read lines aloud",
    voiceUnavailable: "Not available in this browser",
    start: "Start rehearsal",
    restart: "Restart rehearsal",
    starting: "Starting…",
    inputLabel: "What you say",
    inputPlaceholder: "Say what you would actually say…",
    inputHint: "Enter sends. The other person answers in a moment.",
    send: "Say it",
    end: "End and debrief",
    ending: "Writing your debrief…",
    again: "Rehearse again",
    you: "You",
    idleTitle: "They speak first.",
    idleBody: "Press Start, then type what you’d say.",
    waiting: "The other person is picking up…",
    replying: "The other person is thinking…",
    /** Replaces `replying` when the visitor has typed ahead: Enter waits until the reply lands. */
    replyingHeld: "Hold that line. Send it once they answer.",
    /** Sample mode only: the script has given its closer, so the composer locks and End takes over. */
    scriptEnd: "They wrapped up. End it for your debrief.",
  },
  badges: { sample: "Sample", live: "Live" },
  /** Shown whenever the replies are scripted, so the visitor knows they will not react to exactly what was typed. */
  sampleNote: "This is a scripted preview. The replies and the debrief are written ahead of time.",
  debrief: {
    title: "Debrief",
    scoreOf: "/ 10",
    worked: "What worked",
    folded: "Where you folded",
    none: "Nothing. You held the line.",
    next: "Say this next time",
    pattern: "Your pattern",
    /**
     * Rows counted from the visitor's own typed lines. Every apology counts,
     * not only those before the ask, so the label drops the hero's "before the ask".
     */
    metrics: { sorry: "Apologies", filler: "Filler words" },
    /** Shown on a scripted debrief: its quotes are written ahead of time, so it must not read as a verdict on what was typed. */
    sampleNote: "Example debrief, written ahead of time. Only the two counts come from what you typed.",
  },
  errors: {
    start: "The other person did not pick up. Try again.",
    reply: "The other person dropped the call. Try again.",
    debrief: "The debrief could not be written. Try ending again.",
    network: "Network hiccup. Try again.",
  },
} as const;

/* ---------- Pricing and FAQ (pricing.tsx, pricing-tiers.tsx, faq.tsx, /pricing) ---------- */

/** Extra strings for the pricing tiers, the comparison table and the pricing page. */
export const pricingExtras = {
  billing: {
    label: "Billing period",
    monthly: "Monthly",
    yearly: "Yearly",
  },
  /** One short line under each price. Plus differs by billing period. */
  meta: {
    free: "No card needed.",
    plus: {
      monthly: "Billed monthly. Cancel any time.",
      yearly: "That’s $8.25 a month, billed once a year.",
    },
    teams: "Free for career centers this interview season.",
  },
  comparison: {
    title: "Everything in each plan.",
    sub: "Start free. Every plan gets the same debrief.",
    featureColumn: "Feature",
    included: "Included",
    notIncluded: "Not included",
  },
} as const;

/** Heading for the FAQ section, on home and /pricing. `contact` sits under the questions and links to `site.contactEmail`. */
export const faqHeading = {
  title: "Before you sign up.",
  contact: "Something else? Email us.",
} as const;

/* ---------- Manifesto and Teams (app/manifesto, app/teams, pilot-form.tsx, /api/waitlist) ---------- */

/** Extra strings for the manifesto page. */
export const manifestoExtras = {
  /** Rendered as a pull-quote instead of a paragraph. Must match a paragraph in `manifesto.sections` exactly. */
  pullQuote: "If it works, you will use Unmute less over time. That is the point.",
  signOff: "The Unmute team, September 2026",
} as const;

/** Extra strings for the teams page and the pilot form. */
export const teamsExtras = {
  audiencesHeading: {
    title: "Built for the people who run practice.",
    sub: "Same rehearsal, same debrief. You set the scenarios and see the results.",
  },
  pilot: {
    title: "Tell us about your campus or team.",
    sub: "A few lines is enough. A human reads every request.",
    stepsTitle: "What happens next",
    steps: [
      "We reply within two business days.",
      "You pick the scenarios. We set up the cohort.",
      "Your people rehearse the same week.",
    ],
  },
  form: {
    notes: {
      id: "notes",
      label: "Anything we should know",
      placeholder: "Hiring timeline, the scenarios you want, how many counselors…",
    },
    submit: "Request a pilot",
    submitting: "Sending…",
    note: "No card, no contract. One reply from a human.",
    success: {
      title: "Request received.",
      body: "We will reply within two business days with a plan for your cohort.",
      emailLabel: "We will write to",
    },
    errors: {
      generic: "Something went wrong. Try again.",
      network: "Network hiccup. Try again.",
    },
  },
} as const;
