/**
 * Shared contract for the live demo and POST /api/rehearse.
 * Schemas, prompt builders, the Anthropic role mapping and the scripted sample
 * used when no API key is configured. Deliberately free of the SDK so the
 * client can import types from here without pulling it into the bundle.
 */
import { z } from "zod";
import { moods, type MoodId } from "@/lib/content";

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
  "I'll say the ask in one sentence, then stop talking.",
  "If they push back, I'll repeat the number and the date.",
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
  neutral: "businesslike, a little distracted, not hostile but not doing the user any favors",
  hostile:
    "impatient, defensive and dismissive; you interrupt, deflect and try to end the conversation early, though you can be moved by a calm, specific, well-evidenced ask",
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

/** A line is plain text, or a pair: `[withRole, withoutRole]` when the persona names its role. */
type Line = string | readonly [(role: string) => string, string];

/** The placeholder the site sends for custom scenarios; lines drop the role reference for it. */
const GENERIC_WHO = /^(the )?other person$/i;

/**
 * "Your former landlord" -> "your former landlord" so it reads mid-sentence.
 * A first word with several capitals (an acronym like "HR lead") is left
 * alone. Returns null for the generic placeholder.
 */
function asRole(who: string): string | null {
  const w = who.trim().replace(/[.!?]+$/, "");
  if (!w || GENERIC_WHO.test(w)) return null;
  const first = w.split(/\s+/)[0] ?? "";
  const capitals = (first.match(/[A-Z]/g) ?? []).length;
  return capitals > 1 ? w : w.charAt(0).toLowerCase() + w.slice(1);
}

function render(line: Line, who: string): string {
  if (typeof line === "string") return line;
  const role = asRole(who);
  return role ? line[0](role) : line[1];
}

export const sampleOpeners: Record<Mood, string> = {
  kind: "Hi. Thanks for coming to me directly. What did you want to talk about?",
  neutral: "Yeah, hi. I've got a few minutes. Go ahead.",
  hostile: "What is it? I'm in the middle of something.",
};

/** Per-mood pushback, in order: resistance first, movement only if the user keeps going. */
export const sampleLines: Record<Mood, readonly Line[]> = {
  kind: [
    "I hear you, and I want to sort this out. Tell me exactly what you're asking for.",
    "That's fair. Put it in writing so I have it in front of me and I'll take a proper look.",
    [
      (role) => `Okay, I can meet you partway. As ${role}, I've got constraints of my own, but I'm not trying to make this hard for you.`,
      "Okay, I can meet you partway. I've got constraints of my own, but I'm not trying to make this hard for you.",
    ],
    "Okay. Let's do it your way. Thanks for being straight with me.",
  ],
  neutral: [
    "Right. And what is it you actually want from me?",
    [
      (role) => `Email me the details. As ${role}, I don't decide this on the spot.`,
      "Email me the details. I don't decide this on the spot.",
    ],
    "Mm. I can look into it. I'm not promising anything today.",
    "Fine. If it's what you say it is, I'll sort it by the end of the week.",
  ],
  hostile: [
    "Look, I've got about thirty seconds. What do you want?",
    [
      (role) => `No. As ${role}, I've heard every version of this, and the answer is still no.`,
      "No. I've heard every version of this, and the answer is still no.",
    ],
    "Send me that in writing. I'm not deciding anything on the spot.",
    "...Fine. Send me what you've got and I'll look at it tonight.",
  ],
};

/**
 * Next scripted persona line. With no transcript this is the opener; after
 * that it walks the mood's list and holds on the last line, which nudges the
 * user to end the rehearsal.
 */
export function sampleReply(mood: Mood, scenario: Scenario, messages: readonly TranscriptMessage[]): string {
  if (messages.length === 0) return sampleOpeners[mood];
  const replies = messages.filter((m, i) => m.role === "persona" && i > 0).length;
  const lines = sampleLines[mood];
  return render(lines[Math.min(replies, lines.length - 1)], scenario.who);
}

/** The canned debrief from the launch landing page. */
export const SAMPLE_DEBRIEF: Debrief = {
  score: 7,
  worked: [
    "You named the number and the deadline in one sentence.",
    "You acknowledged they were busy without apologizing for calling.",
  ],
  folded: [
    "You said 'sorry to bother you' before the ask; it signals the ask is optional.",
    "You explained your side three times; once was enough.",
  ],
  next: [
    "Normal wear is not a deduction. I have move-in photos. I'd like the full $1,200 back within 14 days.",
    "I'll send the photos tonight. What's the best email?",
  ],
  pattern: "You tend to explain again when the other person goes quiet. Silence is theirs to fill.",
};
