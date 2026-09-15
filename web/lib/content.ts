/**
 * Single source of truth for Unmute site copy and data.
 * Sections import from here so wording stays consistent across pages.
 */

export const site = {
  name: "Unmute",
  tagline: "Talk to an AI so you can talk to people",
  description:
    "Rehearse the conversation you are dreading, out loud, with an AI that plays the other person and pushes back. Then get told exactly what to do differently. Three minutes a day. Not a companion.",
  status: "Early access · interview season 2026",
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
  eyebrow: "Conversation practice for real life",
  headline: "Talk to an AI so you can talk to people.",
  headlineEmphasis: "people",
  rotating: [
    "the raise",
    "the interview",
    "the roommate talk",
    "the deposit call",
    "saying no",
    "the first date",
    "the breakup",
  ],
  sub: "Rehearse the conversation you are dreading, out loud, with an AI that plays the other person and pushes back. Then get told exactly what to do differently. Three minutes a day.",
  stance: "Not a companion. A coach that wants you to need it less.",
  ctaPrimary: "Get early access",
  ctaSecondary: "Try a rehearsal",
  trust: "Your rehearsals are yours. Never used for training. Never shared.",
} as const;

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
    label: "of adults 18–25 report significant anxiety, the highest of any adult age group.",
    footnote: 2,
  },
  {
    value: 100,
    prefix: "$",
    suffix: "M",
    label: "a year: what a daily “say it out loud” habit is worth when Speak applied it to languages. Unmute applies it to the conversations people actually fear.",
    footnote: 3,
  },
] as const;

export const steps = [
  {
    id: "rehearse",
    index: "01",
    name: "Rehearse",
    title: "The other person talks back.",
    body: "Pick the conversation or describe your own. The AI plays the other side with a voice, a mood and a personality. It interrupts, sighs, goes quiet, pushes back. Kind, neutral or hostile.",
    bullets: ["Voice-first, full-duplex", "Kind → neutral → hostile", "Describe any situation"],
  },
  {
    id: "debrief",
    index: "02",
    name: "Debrief",
    title: "Exactly what to change.",
    body: "What worked, where you folded, how long you took to get to the ask, filler words, and the two sentences to try next time. It remembers your patterns: “you apologize before every ask.”",
    bullets: ["Time-to-ask, filler words, held the number", "Two sentences for next time", "Patterns across weeks"],
  },
  {
    id: "daily",
    index: "03",
    name: "Daily rep",
    title: "Three minutes, every day.",
    body: "A streak and a scenario picked from what you have coming up. Connect your calendar and “interview Thursday” becomes Tuesday’s rep.",
    bullets: ["Streaks that mean something", "Calendar-aware scenarios", "Confidence trend over time"],
  },
  {
    id: "real",
    index: "04",
    name: "Real mode",
    title: "Warm up, then make the call.",
    body: "A 60-second warmup and a cue card before the real thing, a debrief after. Unmute never listens to real calls. Phones do not allow it, and you would not want it to.",
    bullets: ["60-second warmup", "Cue card on screen", "Debrief from your notes"],
  },
] as const;

export const moods = [
  { id: "kind", label: "Kind", hint: "Warm and reasonable, with their own interests." },
  { id: "neutral", label: "Neutral", hint: "Businesslike, a little distracted." },
  { id: "hostile", label: "Hostile", hint: "Impatient, defensive, tries to end it early." },
] as const;

export type MoodId = (typeof moods)[number]["id"];

export const demoScenarios = [
  { id: "deposit", label: "Get my deposit back", who: "Your former landlord", setup: "The user moved out two weeks ago and wants their full $1,200 security deposit returned. The landlord is claiming deductions for painting and cleaning that are arguably normal wear.", opener: "Look, I've got three showings today. The walls needed painting. That's on you." },
  { id: "raise", label: "Ask for a raise", who: "Your manager", setup: "The user has been in the role 14 months, took on extra responsibilities, and wants a raise to $62,000 from $55,000. The manager is under budget pressure.", opener: "Sure, I've got a few minutes. What's on your mind?" },
  { id: "doctor", label: "Call the doctor's office", who: "Receptionist at a busy clinic", setup: "The user needs to get an appointment moved up and a referral sent to a specialist; the office has been slow and the receptionist is rushed.", opener: "Clinic, this is the front desk, can you hold? Actually, go ahead, quickly." },
  { id: "roommate", label: "The roommate talk", who: "Your roommate", setup: "The user's roommate leaves dishes for days and has a partner staying over five nights a week without asking. The user wants it to change without blowing up the friendship.", opener: "Hey, what's up? You said you wanted to talk?" },
  { id: "interview", label: "Job interview", who: "A hiring manager", setup: "A 30-minute first-round interview for an entry-level role. The interviewer asks real questions, including salary expectations, and probes vague answers.", opener: "Thanks for coming in. Let's start simple: tell me about yourself." },
  { id: "extension", label: "Ask a professor for an extension", who: "Your professor", setup: "The user needs a three-day extension on a paper due Friday because of a family situation; the professor has a strict late policy.", opener: "Come in. I have about five minutes before my next meeting." },
  { id: "date", label: "First date small talk", who: "Your date", setup: "A first coffee date. The other person is friendly but a little reserved; the user wants the conversation to go somewhere real.", opener: "Hi! Sorry, the line was long. Have you been here before?" },
  { id: "no", label: "Say no to a friend", who: "A close friend", setup: "A close friend keeps asking the user to cover shifts and lend money. The user wants to say no clearly this time without a paragraph of reasons.", opener: "Heyyy. So, huge favor. Can you cover my Saturday shift? And maybe spot me forty until Friday?" },
] as const;

export type DemoScenario = (typeof demoScenarios)[number];

export const scenarioCards = [
  { icon: "PhoneCall", title: "The call you keep postponing", body: "Doctor’s office, insurance, the bank, customer service. Getting to the point without the apology spiral." },
  { icon: "TrendingUp", title: "The ask", body: "A raise, a deadline extension, a shift change, a favor. Say the number and then stop talking." },
  { icon: "Home", title: "The roommate talk", body: "Dishes, noise, a guest who never leaves. Firm without a fight." },
  { icon: "Briefcase", title: "The interview", body: "“Tell me about yourself,” the salary question, the awkward silence. Panels too." },
  { icon: "Coffee", title: "The first date", body: "Small talk that goes somewhere. Ending it kindly if it doesn’t." },
  { icon: "Receipt", title: "The deposit, the fee, the refund", body: "A landlord, a gym, an airline. Holding your ground when they get busy or rude." },
  { icon: "Hand", title: "Saying no", body: "To a friend, a parent, a boss. Once, clearly, without a paragraph of reasons." },
  { icon: "HeartCrack", title: "The hard one", body: "A breakup, an apology, telling someone the truth. Practiced before it has to be perfect." },
] as const;

export const together = {
  eyebrow: "Together",
  title: "Practice with people, not just about them.",
  sub: "The fastest way to get better at talking to humans is other humans watching you try.",
  features: [
    { icon: "Users", title: "Practice rooms", body: "A friend plays the recruiter while the AI coaches. Or the AI plays the panel while your friends rate you." },
    { icon: "Flame", title: "Dares", body: "“Call the pizza place and negotiate a discount.” Shareable clips, voice-changed if you want." },
    { icon: "Clapperboard", title: "The before-and-after", body: "Your first call next to your tenth. That clip is the whole pitch." },
  ],
  dares: [
    { title: "Negotiate a discount at the pizza place", tag: "Dare · 2 min", tone: "amber" },
    { title: "Ask a stranger for directions you already know", tag: "Dare · 1 min", tone: "lavender" },
    { title: "Return the coffee that came out wrong", tag: "Dare · 90 sec", tone: "peach" },
    { title: "Call the gym and cancel the membership", tag: "Dare · 3 min", tone: "amber" },
    { title: "Tell the group chat you can’t make it", tag: "Dare · 30 sec", tone: "lavender" },
    { title: "Ask the barista their name and use it", tag: "Dare · 1 min", tone: "peach" },
  ],
} as const;

export const principles = {
  eyebrow: "Not a companion",
  title: "It exists to make you need it less.",
  intro:
    "AI companions are built to keep you talking to them. Unmute is built to get you talking to people. Every rehearsal ends with a real conversation to go have.",
  items: [
    { title: "Every persona is clearly synthetic.", body: "No romantic roleplay, no endless chat, no “I missed you.” A rehearsal has an end and a debrief." },
    { title: "A coach, not therapy.", body: "Crisis language routes to real resources, every time. Practice is practice; care is care." },
    { title: "Your rehearsals are yours.", body: "Private to you, never used to train models, deleted when you say so." },
    { title: "Success is you closing the app.", body: "We measure the conversations you go have, not the minutes you spend with us." },
  ],
  cta: { label: "Read the manifesto", href: "/manifesto" },
} as const;

export const pricing = {
  eyebrow: "Pricing",
  title: "One rep a day is free.",
  sub: "The habit costs less than the coffee before the interview.",
  yearlyNote: "Save 45% with yearly",
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
      blurb: "For the season you actually have to get good.",
      features: [
        "Unlimited rehearsals and custom scenarios",
        "Hard mode, real mode, calendar reps",
        "Your patterns and trends over time",
        "Practice rooms and dares",
      ],
      cta: { label: "Start with Plus", href: "/#early-access" },
      highlight: true,
      badge: "Most popular",
    },
    {
      id: "teams",
      name: "Teams",
      price: null,
      priceLabel: "Let’s talk",
      period: "per seat, per month",
      blurb: "Career centers, companies, clinicians.",
      features: [
        "Interview season for a whole campus",
        "Customer-facing and manager practice",
        "Structured practice programs with clinicians",
        "Admin dashboard and cohort reports",
      ],
      cta: { label: "Talk to us", href: "/teams" },
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

export const faq = [
  {
    q: "Is this an AI companion?",
    a: "No. Companions are built to keep you talking to them. Unmute is built to get you talking to people. Every rehearsal ends with a debrief and a real conversation to go have. No romantic roleplay, no endless chat.",
  },
  {
    q: "Does it listen to my real calls?",
    a: "Never. Phones do not allow it and you would not want it to. Real mode is a warmup before the call and a debrief from your own notes after.",
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
    a: "It interrupts, sighs, goes quiet and pushes back. You choose the mood: kind, neutral or hostile. Calm, specific, well-evidenced asks move it. Rambling and apologizing do not.",
  },
  {
    q: "When can I use it?",
    a: "Early access opens campus by campus this interview season. Join the list and we will tell you the day it reaches yours.",
  },
] as const;

export const finalCta = {
  title: "Say it here first.",
  sub: "Early access opens campus by campus this interview season. Get on the list and we will tell you the day it reaches yours.",
  note: "One email when it launches. Nothing else.",
} as const;

export const footnotes = [
  "YouGov, phone habits by generation: 65% of Gen Z uncomfortable calling a stranger; 33% of Gen Z comfortable making calls versus 49% of Millennials and 67% of Boomers.",
  "Young adult mental health statistics compiled by Compass Health Center, 2026.",
  "Y Combinator on Speak: 15M downloads, $100M+ annualized revenue, users practice speaking 5–10x more than on other apps.",
] as const;

export const footer = {
  blurb: "Voice practice for the conversations you are dreading. A working name; the company and the product are in preview.",
  columns: [
    {
      title: "Product",
      links: [
        { label: "How it works", href: "/#how-it-works" },
        { label: "Scenarios", href: "/#scenarios" },
        { label: "Try a rehearsal", href: "/#try" },
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
    "Unmute is practice, not therapy or medical care. Rehearsals are private to you, never used to train models, and deleted when you say so. The preview rehearsal on this site runs through Claude when a key is configured and shows a scripted sample otherwise.",
} as const;

export const manifesto = {
  title: "It exists to make you need it less.",
  sub: "A short manifesto for a coach that wants you to close the app.",
  sections: [
    {
      id: "the-gap",
      heading: "Everyone has a conversation they are dreading this week.",
      paragraphs: [
        "The call to the doctor’s office. The ask for a raise. The roommate talk. The first date. The interview. The customer-service fight. The extension request. The toast. The breakup. Saying no.",
        "Sixty-five percent of Gen Z say calling a stranger makes them uncomfortable. Only a third are comfortable making calls at all. This is not a character flaw. It is a skill nobody was given a place to practice.",
        "Language apps figured this out years ago: get people to say it out loud, every day, and reward the rep. Speak built a hundred-million-dollar business on that. Nobody built it for the conversations people actually fear, in their own language.",
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
        "Rehearsals are private to you, never used to train models, and deleted when you say so. Unmute never listens to real calls. Phones do not allow it and you would not want it to. Sharing a clip is always your explicit choice, voice-changed if you like.",
      ],
    },
    {
      id: "the-rep",
      heading: "Three minutes, every day, until you don’t need us.",
      paragraphs: [
        "The whole product is a rep and a debrief. The other person pushes back. You say the number and stop talking. You get told exactly what to change and the two sentences to try next time. Then you go say it to a human.",
        "If it works, you will use Unmute less over time. That is the point.",
      ],
    },
  ],
} as const;

export const teams = {
  eyebrow: "Teams",
  title: "Interview season for a whole campus.",
  sub: "Career centers, companies and clinicians run structured practice on Unmute. Seats from $3 to $8 a month, free for career centers this interview season.",
  audiences: [
    {
      icon: "GraduationCap",
      title: "Career centers",
      body: "Every student gets a mock interview a day from September to November, with a debrief the counselor can see. Cohort reports show who is ready and who is stuck on the salary question.",
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
    body: "Sep–Nov 2026. Bring your students, we bring the interviewers. Tell us your campus and we will set up your cohort.",
    cta: "Request a campus pilot",
  },
  form: {
    fields: [
      { id: "name", label: "Your name", placeholder: "Jordan Lee", type: "text" },
      { id: "email", label: "Work email", placeholder: "you@university.edu", type: "email" },
      { id: "org", label: "Organization", placeholder: "Career center, company or practice", type: "text" },
      { id: "seats", label: "Approximate seats", placeholder: "250", type: "text" },
    ],
  },
} as const;

/* ---------- Appended for the hero group (hero.tsx, rehearsal-window.tsx) ---------- */

/** Extra hero strings. `hero` above is unchanged. */
export const heroExtras = {
  eyebrowSuffix: "early access",
} as const;

/** Self-playing app-window mock under the hero. Pure UI, no network. */
export const rehearsalWindow = {
  windowTitle: "Rehearsal · 02:41",
  mode: "Hard mode",
  persona: {
    who: "Your landlord",
    initial: "L",
    tag: "AI",
    scenario: "Scenario: get the $1,200 deposit back",
    mood: "busy, defensive",
  },
  status: {
    persona: "Landlord is talking",
    user: "You are talking",
    pause: "Landlord goes quiet",
    idle: "Listening",
  },
  transcript: [
    { role: "persona", speaker: "Landlord", text: "Look, I've got three showings today. The walls needed painting. That's on you." },
    { role: "user", speaker: "You", text: "I get that you're busy. Normal wear isn't a deduction under state law, and I have move-in photos. I'd like the full $1,200 back within 14 days." },
    { role: "persona", speaker: "Landlord", text: "...Send me the photos." },
  ],
  debrief: {
    title: "Debrief",
    meta: "Just now",
    rows: [
      { label: "Got to the ask", prefix: "0:", value: 38, note: "was 1:50", check: false },
      { label: "Apologies before the ask", prefix: "", value: 0, note: "was 3", check: false },
      { label: "Filler words", prefix: "", value: 7, note: "“like”", check: false },
      { label: "Held the number", prefix: "", value: 1, note: "yes", check: true },
    ],
    nextLabel: "Next time, say:",
    next: [
      "Normal wear is not a deduction. I have move-in photos. I'd like the full $1,200 back within 14 days.",
      "I'll send the photos tonight. What's the best email?",
    ],
  },
} as const;

/** Proof strip between the hero and the sticky showcase. */
export const proof = {
  eyebrow: "The problem is loud. The mechanic is proven.",
} as const;

/** Sticky "How it works" showcase: heading plus the strings inside the four hand-built UI mocks. */
export const howItWorks = {
  eyebrow: "How it works",
  title: "Rehearse. Debrief. Repeat. Then do it for real.",
  mocks: {
    rehearse: {
      status: "01:12",
      speaking: "Manager is talking",
      moodLabel: "Mood",
    },
    debrief: {
      title: "Debrief",
      subtitle: "Ask for a raise · 3:04",
      score: 7,
      scoreOf: "/ 10",
      rows: [
        { label: "Got to the ask", value: "0:52", was: "was 2:10", before: 100, now: 40 },
        { label: "Apologies before the ask", value: "1", was: "was 4", before: 100, now: 25 },
        { label: "Filler words", value: "5", was: "“like”, “just”", before: 85, now: 45 },
      ],
      held: { label: "Held the number", value: "$62,000" },
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
      rep: { title: "Tuesday’s rep: interview", meta: "From your calendar · interview Thursday" },
      trend: { label: "Confidence", value: "Up 18% this month" },
    },
    real: {
      title: "Real mode",
      phase: "Warmup",
      ring: { seconds: 45, total: 60, caption: "left" },
      cueTitle: "Cue card",
      cues: ["Say the number: $62,000.", "Then stop talking.", "If they stall: “What would it take?”"],
      cta: "Make the call",
      note: "Unmute never listens to real calls.",
    },
  },
} as const;

/* ---------- Appended for the scenarios / together / anti-companion group ---------- */

/** Heading and footer link for the scenario grid. `scenarioCards` above is unchanged. */
export const scenariosHeading = {
  eyebrow: "Conversations",
  title: "The ones people rehearse in the shower.",
  sub: "Eight to start. Describe your own in a sentence and the AI plays the other side.",
  cta: { label: "Or describe your own", href: "/#try" },
} as const;

/** Extra strings for the Together section. `together` above is unchanged. */
export const togetherExtras = {
  daresTitle: "Today’s dares",
  daresMeta: "New every morning",
} as const;

/** Extra strings for the anti-companion band. `principles` above is unchanged. */
export const principlesExtras = {
  secondaryCta: { label: "See pricing", href: "/pricing" },
} as const;

/* ---------- Appended for the live demo group (live-demo.tsx, /api/rehearse) ---------- */

/** Interactive rehearsal section. Persona and coach prompts live in `lib/rehearse.ts`. */
export const liveDemo = {
  eyebrow: "Try it",
  title: "Try a rehearsal right now.",
  sub: "Pick a conversation and a mood. The AI plays the other person. Say what you would actually say, then end the rehearsal for your debrief. The full app is voice-first; this preview lets you type, and reads the other person's lines aloud where your browser allows it.",
  labels: {
    conversation: "Conversation",
    custom: "Or describe your own",
    customPlaceholder: "e.g. My manager. I need to move my Tuesday shift because of class and she hates schedule changes.",
    customLabel: "Custom rehearsal",
    customWho: "The other person",
    /** Prefix sent with a custom setup so "I" and "my" read as the user in the prompts. */
    customSetup: "In the user's own words:",
    mood: "Mood of the other person",
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
    idleTitle: "No rehearsal yet",
    idleBody: "Pick a conversation, choose a mood and press Start. The other person speaks first.",
    waiting: "The other person is picking up…",
    replying: "The other person is thinking…",
  },
  badges: { sample: "Sample", live: "Live" },
  sampleNote: "Running a scripted sample. Add an API key to go live.",
  debrief: {
    title: "Debrief",
    scoreOf: "/ 10",
    worked: "What worked",
    folded: "Where you folded",
    none: "Nothing. You held the line.",
    next: "Say this next time",
    pattern: "Your pattern",
  },
  errors: {
    start: "The other person did not pick up. Try again.",
    reply: "The other person dropped the call. Try again.",
    debrief: "The debrief could not be written. Try ending again.",
    network: "Network hiccup. Try again.",
  },
} as const;

/* ---------- Appended for the pricing group (pricing.tsx, pricing-tiers.tsx, faq.tsx, /pricing) ---------- */

/** Extra strings for the pricing tiers, the comparison table and the pricing page. `pricing` above is unchanged. */
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
    teams: "Seats from $3 to $8. Free for career centers this interview season.",
  },
  comparison: {
    eyebrow: "Compare plans",
    title: "Everything in each plan.",
    sub: "Start free. Upgrade for the season you actually have to get good.",
    featureColumn: "Feature",
    included: "Included",
    notIncluded: "Not included",
  },
} as const;

/** Heading for the FAQ section. `faq` above is unchanged. */
export const faqHeading = {
  eyebrow: "FAQ",
  title: "Questions people ask before they say yes.",
} as const;

/* ---------- Appended for the manifesto / teams group (app/manifesto, app/teams, pilot-form.tsx, /api/waitlist) ---------- */

/** Extra strings for the manifesto page. `manifesto` above is unchanged. */
export const manifestoExtras = {
  eyebrow: "Manifesto",
  /** Rendered as a pull-quote instead of a paragraph. Must match a paragraph in `manifesto.sections` exactly. */
  pullQuote: "If it works, you will use Unmute less over time. That is the point.",
  signOff: "— the Unmute team, September 2026",
} as const;

/** Extra strings for the teams page and the pilot form. `teams` above is unchanged. */
export const teamsExtras = {
  audiencesHeading: {
    eyebrow: "Who it is for",
    title: "Built for the people who run practice.",
    sub: "Same rehearsal, same debrief. You set the scenarios and see the results.",
  },
  offer: {
    eyebrow: "Interview season",
  },
  pilot: {
    eyebrow: "Campus pilot",
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
