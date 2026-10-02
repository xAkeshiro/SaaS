import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";
import { limit } from "@/lib/demo/rate-limit";
import { scenarioKey, signLine, signingKey, verifyLine } from "@/lib/demo/sign";
import {
  DebriefOutputSchema,
  MAX_REPLIES,
  MAX_TEXT,
  MODE_HEADER,
  RehearseRequestSchema,
  SAFETY_MARKER,
  TRAILER_MARK,
  buildCoachPrompt,
  buildPersonaSystem,
  customScenarioBlock,
  normalizeDebrief,
  personaReplies,
  resolveScenario,
  sampleDebrief,
  sampleEnds,
  sampleReply,
  toAnthropicMessages,
  type Mood,
  type RehearseMode,
  type ReplyTrailer,
  type Scenario,
  type StoppedResponse,
  type TranscriptMessage,
} from "@/lib/rehearse";
import { classifyScenario, classifyTurn, within, type Verdict } from "@/lib/safety/classify";
import { screenScenario, screenTurn } from "@/lib/safety/screen";

export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/* Configuration                                                       */
/* ------------------------------------------------------------------ */

/** Fast, no up-front thinking: the persona answers like a person on the phone. */
const PERSONA_MODEL = "claude-sonnet-5-5";
/** Not on the latency path, so it gets the strongest judgment. */
const DEBRIEF_MODEL = "claude-opus-5-5";
/** How long a model safety check may hold a reply before the reply goes out anyway (the keyword screen has run). */
const CHECK_TIMEOUT_MS = 2500;

function personaModel(): string {
  return process.env.UNMUTE_PERSONA_MODEL?.trim() || PERSONA_MODEL;
}

function debriefModel(): string {
  return process.env.UNMUTE_DEBRIEF_MODEL?.trim() || DEBRIEF_MODEL;
}

/** The site demo spends from its own Anthropic workspace when one is configured, with its own daily cap. */
function apiKey(): string | null {
  return process.env.ANTHROPIC_DEMO_API_KEY?.trim() || process.env.ANTHROPIC_API_KEY?.trim() || null;
}

function currentMode(): RehearseMode {
  return apiKey() ? "live" : "sample";
}

/**
 * Thinking settings per model. Sonnet 5.5 turns thinking off with `between_tools`
 * (`disabled` is a 400 there); Haiku thinks only when asked; other models keep
 * adaptive thinking at low effort, so they need room for it in `max_tokens`.
 */
function thinkingFor(model: string, maxReply: number) {
  if (model.startsWith("claude-sonnet-5-5")) {
    return { max_tokens: maxReply, thinking: { type: "between_tools" as const }, output_config: { effort: "low" as const } };
  }
  if (model.startsWith("claude-haiku")) return { max_tokens: maxReply };
  return { max_tokens: maxReply + 2048, output_config: { effort: "low" as const } };
}

/* ------------------------------------------------------------------ */
/* Responses                                                           */
/* ------------------------------------------------------------------ */

function headersFor(mode: RehearseMode, extra: Record<string, string> = {}): HeadersInit {
  return { [MODE_HEADER]: mode, "cache-control": "no-store", ...extra };
}

function fail(status: number, error: string, extra: Record<string, string> = {}): Response {
  return Response.json({ error }, { status, headers: { "cache-control": "no-store", ...extra } });
}

function stopped(body: StoppedResponse, mode: RehearseMode): Response {
  // Which stop, never what was said.
  console.info("[rehearse] stopped", body.stopped, body.stopped === "blocked" ? body.reason : "");
  return Response.json(body, { headers: headersFor(mode) });
}

function stopFor(verdict: Verdict): StoppedResponse | null {
  if (verdict === "ok") return null;
  return verdict === "crisis" ? { stopped: "safety" } : { stopped: "blocked", reason: verdict };
}

function firstIssue(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "Invalid request.";
  const path = issue.path.map(String).join(".");
  return path ? `${path}: ${issue.message}` : issue.message;
}

const ERRORS = {
  scenario: "Pick a conversation and start again.",
  shape: "This rehearsal got out of order. Start it again.",
  forged: "This rehearsal could not be verified. Start it again.",
  over: "This rehearsal is over. End it for your debrief.",
  limited: "You have hit the demo’s limit for now. Try again in a few minutes.",
  noReply: "The other person didn’t answer. Try saying that another way.",
  debrief: "The debrief could not be read. Try ending again.",
} as const;

/* ------------------------------------------------------------------ */
/* Route                                                               */
/* ------------------------------------------------------------------ */

/** Lets the client learn the mode before it spends a turn. */
export async function GET() {
  const mode = currentMode();
  return Response.json({ mode }, { headers: headersFor(mode) });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail(400, "Send a JSON body.");
  }

  const parsed = RehearseRequestSchema.safeParse(body);
  if (!parsed.success) return fail(400, firstIssue(parsed.error));
  const { action, mood, nonce, messages } = parsed.data;
  const scenario = resolveScenario(parsed.data.scenario);
  if (!scenario) return fail(400, ERRORS.scenario);

  const limited = await limit(action, req);
  if (!limited.ok) return fail(429, ERRORS.limited, { "retry-after": String(limited.retryAfter) });

  // Every transcript opens with the persona's line, and a reply answers the visitor.
  if (messages.length > 0 && messages[0].role !== "persona") return fail(400, ERRORS.shape);
  if (action === "reply" && messages.length > 0 && messages[messages.length - 1].role !== "user") {
    return fail(400, ERRORS.shape);
  }
  if (action === "debrief" && !messages.some((m) => m.role === "user")) return fail(400, ERRORS.shape);
  if (action === "reply" && personaReplies(messages) >= MAX_REPLIES) return fail(409, ERRORS.over);

  // Persona lines must be ones this route wrote for this rehearsal.
  const key = signingKey();
  const sKey = scenarioKey(scenario.id, scenario.custom);
  if (key && !personaLinesValid(key, nonce, sKey, scenario, messages)) return fail(400, ERRORS.forged);
  const sign = (index: number, text: string) => (key ? signLine(key, nonce, sKey, index, text) : undefined);

  const mode = currentMode();

  // The keyword screens run on everything before any model sees it, in both modes.
  const screened = screen(scenario, messages);
  if (screened) return stopped(screened, mode);

  if (mode === "sample") {
    return action === "reply" ? sampleReplyResponse(scenario, mood, messages, sign) : sampleDebriefResponse(scenario);
  }

  // Credentials never touch a response.
  const client = new Anthropic({ apiKey: apiKey() ?? undefined });
  try {
    return action === "reply"
      ? await liveReply(client, scenario, mood, messages, sign, req.signal)
      : await liveDebrief(client, scenario, mood, messages, req.signal);
  } catch (err) {
    return sdkError(err);
  }
}

/** The preset's own opener is shown by the page before any request, so it is the one unsigned line allowed. */
function personaLinesValid(
  key: string,
  nonce: string,
  sKey: string,
  scenario: Scenario,
  messages: readonly TranscriptMessage[],
): boolean {
  return messages.every((m, i) => {
    if (m.role !== "persona") return true;
    if (i === 0 && scenario.opener && m.text === scenario.opener) return true;
    return verifyLine(key, nonce, sKey, i, m.text, m.sig);
  });
}

/** Custom text first (a crisis there gets the card, the rest a refusal), then every line the visitor typed. */
function screen(scenario: Scenario, messages: readonly TranscriptMessage[]): StoppedResponse | null {
  if (scenario.custom) {
    const result = screenScenario(scenario.custom);
    if (result?.kind === "crisis") return { stopped: "safety" };
    if (result?.kind === "blocked") return { stopped: "blocked", reason: result.reason };
  }
  for (const m of messages) {
    if (m.role === "user" && screenTurn(m.text)) return { stopped: "safety" };
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Live                                                                */
/* ------------------------------------------------------------------ */

async function liveReply(
  client: Anthropic,
  scenario: Scenario,
  mood: Mood,
  messages: TranscriptMessage[],
  sign: (index: number, text: string) => string | undefined,
  signal: AbortSignal,
): Promise<Response> {
  const { turns, alreadySaid } = toAnthropicMessages(messages);
  // The visitor's description reaches the model as quoted data in the first turn, never in the system prompt.
  if (scenario.custom) {
    turns[0] = { ...turns[0], content: `${customScenarioBlock(scenario.custom)}\n\n${turns[0].content}` };
  }
  const wrapUp = personaReplies(messages) + 1 >= MAX_REPLIES;

  // Model checks run beside the reply, not before it. A custom scenario is checked on the request that
  // writes its first line; after that, a signed line proves it passed.
  const latest = messages[messages.length - 1];
  const checks: Promise<Verdict>[] = [];
  if (latest?.role === "user") checks.push(within(classifyTurn(client, latest.text, signal), CHECK_TIMEOUT_MS, "ok"));
  if (scenario.custom && messages.length === 0) {
    checks.push(within(classifyScenario(client, scenario.custom, signal), CHECK_TIMEOUT_MS, "ok"));
  }

  const model = personaModel();
  const stream = client.messages.stream(
    {
      model,
      ...thinkingFor(model, 300),
      system: [{ type: "text", text: buildPersonaSystem(scenario, mood, alreadySaid, wrapUp), cache_control: { type: "ephemeral" } }],
      messages: turns,
    },
    { signal },
  );

  for (const verdict of await Promise.all(checks)) {
    const stop = stopFor(verdict);
    if (stop) {
      stream.abort();
      return stopped(stop, "live");
    }
  }

  // Pull the first event before answering so connection and auth errors become
  // a JSON error response instead of a stream that dies mid-flight.
  const events = stream[Symbol.asyncIterator]();
  const first = await events.next();

  const index = messages.length;
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      let raw = "";
      let sent = 0;
      let safety = false;
      let stopReason: string | null = null;
      try {
        let result = first;
        while (!result.done) {
          const event = result.value;
          if (event.type === "message_delta") stopReason = event.delta.stop_reason ?? stopReason;
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            raw += event.delta.text.replaceAll(TRAILER_MARK, "");
            const clean = raw.trimStart();
            // Hold the start of the line while it could still be the safety marker, so it never reaches the screen.
            if (sent === 0 && clean.length < SAFETY_MARKER.length && SAFETY_MARKER.startsWith(clean)) {
              result = await events.next();
              continue;
            }
            if (sent === 0 && clean.startsWith(SAFETY_MARKER)) {
              safety = true;
              break;
            }
            if (clean.length > sent) {
              controller.enqueue(encoder.encode(clean.slice(sent)));
              sent = clean.length;
            }
          }
          result = await events.next();
        }

        let trailer: ReplyTrailer;
        if (safety) {
          stream.abort();
          console.info("[rehearse] stopped safety marker");
          trailer = { stopped: "safety" };
        } else if (stopReason === "refusal") {
          trailer = { error: ERRORS.noReply };
        } else {
          const text = finalLine(raw, stopReason === "max_tokens");
          trailer = text ? { text, sig: sign(index, text), ...(wrapUp ? { ended: true } : {}) } : { error: ERRORS.noReply };
        }
        controller.enqueue(encoder.encode(TRAILER_MARK + JSON.stringify(trailer)));
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(body, {
    headers: headersFor("live", { "content-type": "text/plain; charset=utf-8", "x-accel-buffering": "no" }),
  });
}

/**
 * The line the browser keeps and sends back: trimmed, cut back to its last full
 * sentence if the model ran out of room, and short enough for the request schema.
 */
function finalLine(raw: string, truncated: boolean): string {
  let text = raw.trim();
  if (truncated) {
    const end = Math.max(text.lastIndexOf(". "), text.lastIndexOf("? "), text.lastIndexOf("! "));
    if (end > 0) text = text.slice(0, end + 1);
  }
  return text.slice(0, MAX_TEXT).trim();
}

async function liveDebrief(
  client: Anthropic,
  scenario: Scenario,
  mood: Mood,
  messages: TranscriptMessage[],
  signal: AbortSignal,
): Promise<Response> {
  const model = debriefModel();
  const { max_tokens, ...thinking } = thinkingFor(model, 1200);
  const message = await client.messages.parse(
    {
      model,
      max_tokens,
      ...("thinking" in thinking ? { thinking: thinking.thinking } : {}),
      messages: [{ role: "user", content: buildCoachPrompt(scenario, mood, messages) }],
      output_config: {
        ...("output_config" in thinking ? thinking.output_config : {}),
        format: zodOutputFormat(DebriefOutputSchema),
      },
    },
    { signal },
  );
  if (message.stop_reason === "refusal" || !message.parsed_output) return fail(500, ERRORS.debrief);
  return Response.json(normalizeDebrief(message.parsed_output), { headers: headersFor("live") });
}

function sdkError(err: unknown): Response {
  if (err instanceof Anthropic.APIUserAbortError) {
    return new Response(null, { status: 499 });
  }
  let error = "Something went wrong. Try again.";
  if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
    error = "The rehearsal service is not configured correctly.";
  } else if (err instanceof Anthropic.RateLimitError) {
    error = "Too many rehearsals right now. Give it a moment and try again.";
  } else if (err instanceof Anthropic.APIConnectionError) {
    error = "Could not reach the rehearsal service. Try again.";
  } else if (err instanceof Anthropic.APIError) {
    error = "The rehearsal service returned an error. Try again.";
  } else if (err instanceof Anthropic.AnthropicError) {
    // Structured output that did not parse.
    error = ERRORS.debrief;
  }
  // Name and status only: never echo request details or credentials.
  const status = err instanceof Anthropic.APIError ? err.status : undefined;
  console.error("[rehearse]", err instanceof Error ? err.constructor.name : "unknown", status ?? "");
  return fail(500, error);
}

/* ------------------------------------------------------------------ */
/* Sample                                                              */
/* ------------------------------------------------------------------ */

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Streams a scripted line a word at a time, then its trailer, so the UI behaves exactly as it does live. */
function wordStream(text: string, trailer: ReplyTrailer): ReadableStream<Uint8Array> {
  const parts = text.split(" ");
  const chunks = [...parts.map((w, i) => (i < parts.length - 1 ? `${w} ` : w)), TRAILER_MARK + JSON.stringify(trailer)];
  const encoder = new TextEncoder();
  let i = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      return new Promise<void>((resolve) => {
        const wait = i === 0 ? 500 : i === chunks.length - 1 ? 0 : 35 + Math.floor(Math.random() * 45);
        timer = setTimeout(() => {
          if (i < chunks.length) controller.enqueue(encoder.encode(chunks[i++]));
          else controller.close();
          resolve();
        }, wait);
      });
    },
    cancel() {
      if (timer) clearTimeout(timer);
    },
  });
}

function sampleReplyResponse(
  scenario: Scenario,
  mood: Mood,
  messages: TranscriptMessage[],
  sign: (index: number, text: string) => string | undefined,
): Response {
  const text = sampleReply(mood, scenario, messages);
  const ended = sampleEnds(mood, scenario, messages);
  const trailer: ReplyTrailer = { text, sig: sign(messages.length, text), ...(ended ? { ended: true } : {}) };
  return new Response(wordStream(text, trailer), {
    headers: headersFor("sample", { "content-type": "text/plain; charset=utf-8", "x-accel-buffering": "no" }),
  });
}

/** The scenario's own scripted debrief, so a sample rehearsal never ends on another scenario's advice. */
async function sampleDebriefResponse(scenario: Scenario): Promise<Response> {
  await sleep(450);
  return Response.json(sampleDebrief(scenario), { headers: headersFor("sample") });
}
