/**
 * Shared contract for the live demo and POST /api/rehearse.
 * Schemas, prompt builders, the Anthropic role mapping and the scripted sample
 * used when no API key is configured. Deliberately free of the SDK so the
 * client can import types from here without pulling it into the bundle.
 */
import { z } from "zod";
import { demoScenarios, moods, type DemoScenario, type MoodId } from "@/lib/content";

export const MAX_MESSAGES = 24;
export const MAX_TEXT = 800;
export const MODE_HEADER = "x-unmute-mode";
export type RehearseMode = "sample" | "live";

/* ------------------------------------------------------------------ */
/* Request                                                             */
/* ------------------------------------------------------------------ */

const MOOD_IDS = moods.map((m) => m.id) as [MoodId, ...MoodId[]];

export const MoodSchema = z.enum(MOOD_IDS);
export type Mood = z.infer<typeof MoodSchema>;

export const ScenarioSchema = z.object({
  id: z.string().trim().min(1).max(64),
  who: z.string().trim().min(1).max(120),
  setup: z.string().trim().min(1).max(MAX_TEXT),
});
export type Scenario = z.infer<typeof ScenarioSchema>;

export const TranscriptMessageSchema = z.object({
  role: z.enum(["persona", "user"]),
  text: z.string().trim().min(1).max(MAX_TEXT),
});
export type TranscriptMessage = z.infer<typeof TranscriptMessageSchema>;

export const RehearseRequestSchema = z.object({
  action: z.enum(["reply", "debrief"]),
  scenario: ScenarioSchema,
  mood: MoodSchema,
  messages: z.array(TranscriptMessageSchema).max(MAX_MESSAGES),
});
export type RehearseRequest = z.infer<typeof RehearseRequestSchema>;

/* ------------------------------------------------------------------ */
/* Debrief                                                             */
/* ------------------------------------------------------------------ */

/** The shape the API returns and the UI renders. */
export const DebriefSchema = z.object({
  score: z.number().int().min(0).max(10),
  worked: z.array(z.string()).max(3),
  folded: z.array(z.string()).max(3),
  next: z.tuple([z.string(), z.string()]),
  pattern: z.string(),
});
export type Debrief = z.infer<typeof DebriefSchema>;

/**
 * The shape asked of the model. Structured outputs accept plain JSON-schema
 * types, so the counts and bounds live in the descriptions and in
 * `normalizeDebrief()`, not in constraints the grammar cannot express.
 */
export const DebriefOutputSchema = z.object({
  score: z
    .number()
    .int()
    .describe("Integer 0-10: how effective the user was at getting what they wanted while staying calm and clear."),
  worked: z
    .array(z.string())
    .describe("Up to 3 short, specific things the user did well, quoting their words."),
  folded: z
    .array(z.string())
    .describe(
      "Up to 3 short, specific moments the user apologized, rambled, hedged, gave ground or buried the ask, quoting them. Empty if none.",
    ),
  next: z
    .array(z.string())
    .describe("Exactly 2 short sentences the user should say next time, first person, ready to say out loud."),
  pattern: z.string().describe("One sentence naming a habit visible in the user's lines."),
});
export type DebriefOutput = z.infer<typeof DebriefOutputSchema>;

const NEXT_FALLBACK = [
  "I’ll say what I need in one sentence, then stop talking.",
  "If they push back, I’ll say it again in the same words.",
] as const;

function tidy(items: readonly string[], max: number): string[] {
  return items.map((s) => s.trim()).filter(Boolean).slice(0, max);
}

/** Clamp and pad a model debrief into the strict `Debrief` shape. */
export function normalizeDebrief(raw: DebriefOutput): Debrief {
  const next = tidy(raw.next, 2);
  while (next.length < 2) next.push(NEXT_FALLBACK[next.length]);
  return {
    score: Math.max(0, Math.min(10, Math.round(Number.isFinite(raw.score) ? raw.score : 0))),
    worked: tidy(raw.worked, 3),
    folded: tidy(raw.folded, 3),
    next: [next[0], next[1]],
    pattern: raw.pattern.trim(),
  };
}

/* ------------------------------------------------------------------ */
/* Prompts                                                             */
/* ------------------------------------------------------------------ */

export const moodText: Record<Mood, string> = {
  kind: "warm, patient and reasonable, but you still have your own interests",
  neutral: "polite but distracted, sticking to your usual routine or rules, not making it easy for the user",
  hostile:
    "rushed, defensive and short with the user; you interrupt, deflect and try to end it early, though a calm, clear, specific ask can move you",
};

/** Ensures a setup ends as a sentence; a closing quote or bracket after the stop still counts. */
function sentence(text: string): string {
  const t = text.trim();
  return /[.!?…]["'”’)\]]*$/.test(t) ? t : `${t}.`;
}

/**
 * System prompt for the persona. `alreadySaid` is the persona's opener when it
 * is the first line of the transcript, folded in so the API conversation can
 * start with a user turn.
 */
export function buildPersonaSystem(scenario: Scenario, mood: Mood, alreadySaid?: string): string {
  const base =
    `You are roleplaying ONE person in a practice conversation so the user can rehearse a real conversation they are dreading. ` +
    `You play: ${scenario.who}. Situation: ${sentence(scenario.setup)} Your mood: ${moodText[mood]}. ` +
    `Rules: Stay in character as this person only. Reply with what this person would actually say next, 1 to 3 short sentences, ` +
    `natural spoken language, no narration, no stage directions, no coaching, no quotation marks, no labels. ` +
    `Talk like a real person out loud: short spoken sentences, contractions, everyday words, no corporate or HR phrasing, and never narrate your feelings. ` +
    `If you are the user's friend, classmate, coworker or manager at a part-time job, sound like someone in your early twenties or a busy shift lead. ` +
    `React realistically to what the user says: reward clear, specific, calm asks with movement; punish rambling, apologizing and vagueness with resistance. ` +
    `Never break character. Keep it safe: no slurs, no sexual content, no threats. ` +
    `If the user expresses intent to harm themselves or others, drop the character and say once, plainly, that this is practice ` +
    `and that they should contact local emergency services or a crisis line.`;
  return alreadySaid ? `${base} You already said: ${alreadySaid.trim()}` : base;
}

/** Prompt for the coach that writes the debrief. Judges only the user's lines. */
export function buildCoachPrompt(scenario: Scenario, mood: Mood, messages: readonly TranscriptMessage[]): string {
  const transcript = messages
    .map((m) => `${m.role === "user" ? "You" : scenario.who}: ${m.text.trim()}`)
    .join("\n");
  return (
    `You are a blunt, kind communication coach. The user just rehearsed this conversation. ` +
    `They played 'You'; the AI played ${scenario.who} (${mood} mood). Situation: ${sentence(scenario.setup)}\n\n` +
    `TRANSCRIPT:\n${transcript}\n\n` +
    `Write a debrief of what the user (You) did. Judge only the user's lines. Be specific and quote their words. ` +
    `score: integer 0-10 for how effective the user was at getting what they wanted while staying calm and clear. ` +
    `worked: up to 3 short specific things the user did well, quoting them. ` +
    `folded: up to 3 short specific moments the user apologized, rambled, hedged, gave ground, or buried the ask, quoting them; empty if none. ` +
    `next: exactly 2 short sentences the user should say next time, written in first person, ready to say out loud. ` +
    `pattern: one sentence naming a habit visible in their lines.`
  );
}

/* ------------------------------------------------------------------ */
/* Role mapping                                                        */
/* ------------------------------------------------------------------ */

export type ChatTurn = { role: "user" | "assistant"; content: string };

const USER_STARTED = "(The user has just started the conversation. Say the first thing you would say.)";
const USER_WAITS = "(The user says nothing and waits for you to continue.)";

/**
 * Map persona/user lines to Anthropic roles. The conversation must open with a
 * user turn, so a leading persona opener is lifted out (`alreadySaid`) for the
 * system prompt, and a trailing persona line gets a silent user turn after it.
 */
export function toAnthropicMessages(messages: readonly TranscriptMessage[]): {
  turns: ChatTurn[];
  alreadySaid?: string;
} {
  let alreadySaid: string | undefined;
  let rest: readonly TranscriptMessage[] = messages;
  if (rest[0]?.role === "persona") {
    alreadySaid = rest[0].text;
    rest = rest.slice(1);
  }
  const turns: ChatTurn[] = rest.map((m) => ({
    role: m.role === "user" ? "user" : "assistant",
    content: m.text.trim(),
  }));
  if (turns.length === 0) turns.push({ role: "user", content: alreadySaid ? USER_WAITS : USER_STARTED });
  // Two persona lines in a row at the top (possible for API clients, not the site UI) would still open with an assistant turn.
  if (turns[0].role === "assistant") turns.unshift({ role: "user", content: alreadySaid ? USER_WAITS : USER_STARTED });
  if (turns[turns.length - 1].role === "assistant") turns.push({ role: "user", content: USER_WAITS });
  return { turns, alreadySaid };
}

/* ------------------------------------------------------------------ */
/* Scripted sample (no API key)                                        */
/* ------------------------------------------------------------------ */

/** Exactly four replies per mood: live-demo.tsx's SAMPLE_TURNS (four lines plus the closer) counts on it. */
type ScriptLines = readonly [string, string, string, string];

/** A scenario's scripted replies per mood, the line that ends the call, and the debrief shown when it ends. */
export type Script = { lines: Record<Mood, ScriptLines>; closer: string; debrief: Debrief };

/**
 * Scripted replies for every preset scenario, keyed by `demoScenarios` id. The
 * opener lives in content.ts; each mood's lines then move from resistance to a
 * believable partial or full yes, so a visitor who keeps asking sees the other
 * side give ground, and `closer` ends the call after that. The moods stay
 * index-aligned (same beat per line), so switching mood mid-run still reads.
 * Everything here is shown to the visitor, so apostrophes are ’.
 * `satisfies` fails the build if a scenario has no script.
 */
export const SCRIPTS: Readonly<Record<string, Script>> = {
  doctor: {
    lines: {
      kind: [
        "Sure, I can help with that. Can I get your name and date of birth?",
        "Okay, got you. First thing I have is next Wednesday at 3:20. Does that work?",
        "This week’s pretty packed. I could put you on the cancellation list, if you want.",
        "Oh, wait, Thursday at 9:40 just opened up. Want me to put you in?",
      ],
      neutral: [
        "Okay. Name, date of birth and student ID?",
        "Earliest I have is next Wednesday at 3:20. Want that one?",
        "This week’s booked. There’s walk-in hours, but the wait’s usually like two hours.",
        "Hang on. Someone just cancelled Thursday at 9:40. I can put you there.",
      ],
      hostile: [
        "Name and date of birth. I’ve got two other lines going.",
        "Next opening’s Wednesday at 3:20. That’s what I’ve got.",
        "I can’t make slots appear. Do you want Wednesday or not?",
        "Hold on. Thursday at 9:40 just freed up. Taking it?",
      ],
    },
    closer: "Okay, you’re all set for Thursday at 9:40. Bring your student ID.",
    debrief: {
      score: 8,
      worked: [
        "You said what you needed in your first sentence.",
        "You asked for something earlier instead of taking Wednesday at 3:20.",
      ],
      folded: [
        "You said “sorry to bug you” before saying why you called. Booking you is their job.",
      ],
      next: [
        "Hi, I need the earliest morning appointment you have this week.",
        "Is there a cancellation list I can get on?",
      ],
      pattern: "You ask for “anything sooner” instead of naming the time you need, like a morning before noon.",
    },
  },
  "bank-fee": {
    lines: {
      // The opener only asks for name and card, so line one verifies and names the fee before anyone argues it.
      kind: [
        "Thanks, you’re verified. I see a $35 overdraft fee from Tuesday. Is that what you’re calling about?",
        "I get it, that’s annoying. Technically the fee’s valid, though. It’s in your account agreement.",
        "Let me see what I can do. You haven’t had one in two years, so that helps.",
        "Okay, I put in a one-time courtesy refund. The $35 should be back in two or three days.",
      ],
      neutral: [
        "Okay, you’re verified. Is this about the overdraft fee from Tuesday?",
        "Those fees are valid under your account agreement. I can’t just take them off.",
        "I’d have to request it as a courtesy, and that’s not guaranteed.",
        "Alright, it went through. One-time courtesy, so $35 back in a few business days.",
      ],
      hostile: [
        "Okay. If this is about the overdraft fee, it’s correct. You went negative, so it charged automatically.",
        "We don’t reverse fees because someone didn’t check their balance.",
        "I mean, I can ask a supervisor, but you’ll be on hold. You want that?",
        "Okay, my supervisor approved it. One time only. Three to five business days.",
      ],
    },
    closer: "Okay, you’re all set. Thanks for calling.",
    debrief: {
      score: 7,
      worked: [
        "You said “waive” instead of hinting at it.",
        "You mentioned it was your first overdraft, once.",
      ],
      folded: [
        "You said “sorry, I know it’s my fault” before asking.",
        "You explained your payday timing three times.",
      ],
      next: [
        "Can you waive the $35 overdraft fee as a one-time courtesy?",
        "If you can’t, can a supervisor take a look?",
      ],
      pattern: "You apologize before every ask.",
    },
  },
  raise: {
    lines: {
      kind: [
        "Okay. Honestly, you’ve been really good with the new people.",
        "The thing is, raises usually go through in January, with reviews.",
        // Anything over $17 needs the owner (the setup's rule), even for the kind manager.
        "I could probably do $17 now. Anything past that, I’d have to ask the owner.",
        "Okay. I’ll ask the owner for $18 this week and tell you by Friday.",
      ],
      neutral: [
        "Okay. Raises are kind of a January thing, though. That’s when we do reviews.",
        "Honestly, I’m hearing this from like three people right now.",
        "I can’t promise $18. Maybe $17 now, and we look again in January?",
        "Fine. Write down what you’ve been doing and I’ll bring $18 to the owner.",
      ],
      hostile: [
        "A raise? Right now? We’re down two people and there’s a line out the door.",
        "You know new people start at $16, right? You’re already above that.",
        "If I give you $18, everybody’s gonna want $18.",
        "Fine. Text me what you’ve been doing. I’ll talk to the owner Friday.",
      ],
    },
    closer: "Okay, I gotta get back on the floor.",
    debrief: {
      score: 6,
      worked: [
        "You said $18 an hour, not “a little more.”",
        "You gave one reason, training the new hires, and stopped there.",
      ],
      folded: [
        "You opened with “sorry, I know you’re busy” before you’d asked anything.",
        "When they pushed back, you said “oh, that’s fine.”",
      ],
      next: [
        "I’ve been here 11 months and I train the new hires. I’m asking for $18 an hour.",
        "If it has to wait, can we agree today that it’s $18 on January 1?",
      ],
      pattern: "You take the first “not now” as a no.",
    },
  },
  extension: {
    lines: {
      kind: [
        "Okay. Is this the paper that’s due Friday?",
        "I get it, it’s a heavy week. Lots of people are asking, though.",
        "How far along are you? I’d want to see an outline or a draft first.",
        "Okay. Monday at noon. Email me so I have it in writing.",
      ],
      neutral: [
        "Mm. And this is the paper due Friday?",
        "The late policy’s in the syllabus. Ten percent a day.",
        "If I do this for you, I kind of have to do it for everybody.",
        "Fine. Monday at noon, no later. Send me a quick email confirming.",
      ],
      hostile: [
        "Is this about the paper? Because I’ve had four of these today.",
        "Everyone has other exams. That’s what the late policy is for.",
        "Why am I hearing about this now and not last week?",
        "Okay. Monday at noon, and I won’t move it again. Email me tonight.",
      ],
    },
    closer: "Okay, I have to get to class. Good luck on the exams.",
    debrief: {
      score: 8,
      worked: [
        "You asked for a specific new deadline: Monday at noon.",
        "You gave one reason and didn’t pile on three more.",
      ],
      folded: [
        "You opened with “I know you’re probably busy, I’m so sorry.”",
        "When they pushed back, you apologized instead of repeating Monday at noon.",
      ],
      next: [
        "I have two exams this week. Can I turn the paper in Monday at noon instead of Friday?",
        "I have the outline done and can send it to you tonight.",
      ],
      pattern: "You apologize for asking before you ask. Lead with the date.",
    },
  },
  "group-project": {
    lines: {
      kind: [
        "No, you’re right, I’ve been ghosting the chat. That’s on me.",
        "Wait, mine are the budget ones, right? The four at the end?",
        "Can I do them Sunday night, though? I work all day Saturday.",
        "Okay. I’ll do them Friday night, so they’re in the deck by Saturday at noon. I’ll post in the chat.",
      ],
      neutral: [
        "I mean, it’s not due till Monday. We still have time.",
        "Can someone else take the budget part? I’m better at presenting.",
        "Okay. I’ll try to get them done this weekend.",
        "Fine. Saturday by noon. I’ll put them in the deck.",
      ],
      hostile: [
        "Wow. You could’ve just texted me instead of making it a whole thing.",
        "Everyone’s busy. You’re not the only one with stuff going on.",
        "Okay, I heard you the first time. You don’t have to keep saying it.",
        "Ugh, fine. Saturday at noon. But I’m not redoing the intro too.",
      ],
    },
    closer: "Okay, I gotta go. I’ll text the chat.",
    debrief: {
      score: 7,
      worked: [
        "You named the exact ask: four budget slides, in the deck, Saturday at noon.",
        "You didn’t let “three exams” move the deadline.",
      ],
      folded: [
        "You opened with “no worries if not,” which handed them a way out.",
        "When they pushed back, you started offering them more time.",
      ],
      next: [
        "I need your four budget slides in the deck by Saturday at noon.",
        "If they’re not in by noon, I’ll do them myself and say so on the peer eval.",
      ],
      pattern: "You negotiate against yourself before they even push back.",
    },
  },
  "pay-me-back": {
    lines: {
      kind: [
        "Oh my god, wait. I thought I sent that. Hold on, let me check.",
        "No, yeah, it’s not there. I’m so bad with this stuff, I’m sorry.",
        "Can I do half now and the rest Friday? I just paid my phone bill.",
        "Okay, you know what, I just sent the whole $72. Sorry it took me so long.",
      ],
      neutral: [
        "Oh, the tickets? Yeah, I know. It’s been kind of a crazy month.",
        "I mean, I wasn’t gonna not pay you. I just keep forgetting.",
        "Can it wait till Friday? That’s when I get paid.",
        "Okay. Friday morning, all $72. Text me if you don’t see it.",
      ],
      hostile: [
        "Wait, you called me for this? It’s been like three weeks, not three months.",
        "I’ve paid for food for you like five times and never said anything.",
        // Not "Fine" here: the next line opens with it, and two in a row read as a template.
        "Look, I don’t have $72 right now. I can do forty.",
        "Fine. Forty now, the other thirty-two Friday. Can we drop it after that?",
      ],
    },
    closer: "Okay, I gotta go. Talk later.",
    debrief: {
      score: 7,
      worked: [
        "You said $72, not “the ticket thing.”",
        "You stopped talking after the ask and let them answer.",
      ],
      folded: [
        "You said “no rush” right after asking, which made it optional.",
        "When they asked to wait, you said “whenever” instead of naming a day.",
      ],
      next: [
        "You still owe me $72 for the concert. Can you send it today?",
        "If today’s bad, what day works? I’ll look for it then.",
      ],
      pattern: "You soften money asks with “no rush.” Give a day instead.",
    },
  },
  thanksgiving: {
    lines: {
      kind: [
        "Oh. Okay. Grandma was really looking forward to seeing you, that’s all.",
        "We could help with the flight, you know. You don’t have to work.",
        "Okay. I get it, I do. I just miss you.",
        // Winter break, not December: finals keep a student on campus for half of it.
        "Okay. Then you FaceTime us at dinner Thursday, and you’re home the whole winter break. Deal?",
      ],
      neutral: [
        "Wait, you’re not coming? Everyone’s going to ask where you are.",
        "Can’t you just ask for those days off? It’s one weekend.",
        "Hm. Well, you’re an adult. I just don’t love you being there alone.",
        "Okay. But you’re FaceTiming in for dinner Thursday, and you’re home for winter break.",
      ],
      hostile: [
        "So you’d rather work than see your family. Okay. Got it.",
        "We pay for a lot of things for you. I’d think you could come home.",
        "Your dad’s going to be upset. You’re telling him, not me.",
        "Fine. But you’re FaceTiming in for dinner, and that part’s not optional.",
      ],
    },
    closer: "Okay, sweetie. I love you. Call me Sunday.",
    debrief: {
      score: 7,
      worked: [
        "You said “I’m not coming home for Thanksgiving” in the first 20 seconds.",
        "You gave one reason, the shifts, not five.",
      ],
      folded: [
        "When the guilt came in, you said “maybe I can figure something out.”",
        "You apologized four times for a decision you’d already made.",
      ],
      next: [
        "I’m not coming home for Thanksgiving. I’m working those shifts, and I’ll be home the whole winter break.",
        "I know it’s hard. I’m still not coming, but I’ll FaceTime in for dinner Thursday.",
      ],
      pattern: "Guilt makes you reopen decisions you already made.",
    },
  },
  "spring-trip": {
    lines: {
      kind: [
        "Wait, really? It’s not gonna be the same without you, though.",
        // Not a smaller share: the other moods say that would raise everyone else's.
        "What if you just send the deposit now and figure out the rest later?",
        "Okay, no, that’s fair. I don’t want you stressing about money over this.",
        "Okay. But you’re coming to dinner before we leave, no excuses.",
      ],
      neutral: [
        "Oh. Everyone already sent theirs, so that kind of messes up the split.",
        "Can you at least think about it till Friday?",
        "Okay. I’ll have to tell the group. They’re gonna ask why.",
        "Fine. I’ll take you off the list. Come to dinner before we leave, though.",
      ],
      hostile: [
        "Are you serious? You said you were in like two weeks ago.",
        "So now the rest of us pay more because you bailed.",
        "You literally went out three times this week, though.",
        "Okay. Whatever. I’ll tell everyone. Just don’t be weird about it.",
      ],
    },
    closer: "Okay, I gotta go tell the group. Bye.",
    debrief: {
      score: 7,
      worked: [
        "You said “I’m out” instead of “I don’t know yet.”",
        "You didn’t walk them through your bank account to prove it.",
      ],
      folded: [
        "When they brought up the money, you offered to pay part of it.",
        "You said “I’m so sorry” three times before the actual no.",
      ],
      next: [
        "I can’t do the trip this time. It’s more than I can spend right now.",
        "Send me pictures, and let’s do something cheap when you’re back.",
      ],
      pattern: "You offer money to make the guilt stop.",
    },
  },
} satisfies Record<DemoScenario["id"], Script>;

/**
 * Openers for a custom scenario, which has no preset opener. Like the lines
 * below, they fit anyone the user needs something from: a friend, a manager,
 * a pharmacy counter (the site's own custom examples).
 */
export const sampleOpeners: Record<Mood, string> = {
  kind: "Hi! Yeah, I’ve got a minute. What can I do for you?",
  neutral: "Hi. What can I help you with?",
  hostile: "Yeah? Make it quick, I’ve got a lot going on.",
};

/** Per-mood pushback for custom scenarios, worded to fit anyone the user needs something from. */
export const sampleLines: Record<Mood, ScriptLines> = {
  kind: [
    "Okay. What do you need, exactly?",
    "Let me see what I can do. Give me a sec.",
    "I can’t do all of it, but I can do part of it.",
    "Okay, that works. I’ll take care of it.",
  ],
  neutral: [
    "Okay. What are you asking for, exactly?",
    "I’d have to check. It’s not totally up to me.",
    "Maybe. I can’t promise anything today, though.",
    "Fine, let’s do that. Follow up if you don’t hear from me.",
  ],
  hostile: [
    "Okay, and? What do you want me to do about it?",
    "That’s not really how it works.",
    "You’re making this a bigger deal than it is.",
    "Fine. I’ll do it. Anything else?",
  ],
};

/** The custom scenario's closer, after `sampleLines` run out. */
export const sampleCloser = "Okay, I’ve got to go. Bye.";

/** The debrief for a custom scenario: habits any ask can show, with no scenario details. */
const CUSTOM_DEBRIEF: Debrief = {
  score: 7,
  worked: ["You got to the point without a long lead-in.", "You stayed calm when they pushed back."],
  folded: ["You softened the ask right after saying it.", "You gave your reasons more than once."],
  // Both custom examples on the site (the pharmacy refill, the shift schedule) hinge on Friday.
  next: ["Can you help me get this taken care of by Friday?", "I get that it’s not ideal. I still need it."],
  pattern: "You fill silence with more reasons. Let them answer.",
};

/** `hasOwn` so an id like "constructor" or "__proto__" falls through to the generic script. */
function scriptFor(id: string): Script | undefined {
  return Object.hasOwn(SCRIPTS, id) ? SCRIPTS[id] : undefined;
}

/**
 * Next scripted persona line. With no transcript this is the opener (the site
 * shows a preset's opener itself, so this path serves custom scenarios and
 * direct API calls). After that it walks the scenario's lines for the mood, or
 * the generic ones for a custom scenario. Once they run out the persona says its
 * closer instead of repeating itself; the site stops sending after it and
 * offers the debrief.
 */
export function sampleReply(mood: Mood, scenario: Scenario, messages: readonly TranscriptMessage[]): string {
  if (messages.length === 0) {
    return demoScenarios.find((s) => s.id === scenario.id)?.opener ?? sampleOpeners[mood];
  }
  // A persona line at index 0 is the opener, not a reply.
  const replies = messages.filter((m, i) => m.role === "persona" && i > 0).length;
  const script = scriptFor(scenario.id);
  const lines = script?.lines[mood] ?? sampleLines[mood];
  return replies < lines.length ? lines[replies] : (script?.closer ?? sampleCloser);
}

/** The scripted debrief for a scenario, or the generic one for a custom scenario. */
export function sampleDebrief(scenario: Pick<Scenario, "id">): Debrief {
  return scriptFor(scenario.id)?.debrief ?? CUSTOM_DEBRIEF;
}
