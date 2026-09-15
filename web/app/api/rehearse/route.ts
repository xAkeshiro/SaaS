import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";
import {
  DebriefOutputSchema,
  MODE_HEADER,
  RehearseRequestSchema,
  SAMPLE_DEBRIEF,
  buildCoachPrompt,
  buildPersonaSystem,
  normalizeDebrief,
  sampleReply,
  toAnthropicMessages,
  type Mood,
  type RehearseMode,
  type Scenario,
  type TranscriptMessage,
} from "@/lib/rehearse";

export const runtime = "nodejs";

const DEFAULT_MODEL = "claude-opus-5";

function modelId(): string {
  return process.env.UNMUTE_MODEL?.trim() || DEFAULT_MODEL;
}

function currentMode(): RehearseMode {
  return process.env.ANTHROPIC_API_KEY ? "live" : "sample";
}

function headersFor(mode: RehearseMode, extra: Record<string, string> = {}): HeadersInit {
  return { [MODE_HEADER]: mode, "cache-control": "no-store", ...extra };
}

function fail(status: number, error: string): Response {
  return Response.json({ error }, { status, headers: { "cache-control": "no-store" } });
}

function firstIssue(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "Invalid request.";
  const path = issue.path.map(String).join(".");
  return path ? `${path}: ${issue.message}` : issue.message;
}

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
  const { action, scenario, mood, messages } = parsed.data;

  if (currentMode() === "sample") {
    return action === "reply" ? sampleReplyResponse(scenario, mood, messages) : sampleDebriefResponse();
  }

  // Credentials resolve from ANTHROPIC_API_KEY; the key never touches a response.
  const client = new Anthropic();
  try {
    return action === "reply"
      ? await liveReply(client, scenario, mood, messages, req.signal)
      : await liveDebrief(client, scenario, mood, messages, req.signal);
  } catch (err) {
    return sdkError(err);
  }
}

/* ------------------------------------------------------------------ */
/* Live                                                                */
/* ------------------------------------------------------------------ */

async function liveReply(
  client: Anthropic,
  scenario: Scenario,
  mood: Mood,
  messages: TranscriptMessage[],
  signal: AbortSignal,
): Promise<Response> {
  const { turns, alreadySaid } = toAnthropicMessages(messages);
  const stream = client.messages.stream(
    {
      model: modelId(),
      max_tokens: 300,
      system: buildPersonaSystem(scenario, mood, alreadySaid),
      messages: turns,
      output_config: { effort: "low" },
    },
    { signal },
  );

  // Pull the first event before answering so connection and auth errors become
  // a JSON error response instead of a stream that dies mid-flight.
  const events = stream[Symbol.asyncIterator]();
  const first = await events.next();

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        let result = first;
        while (!result.done) {
          const event = result.value;
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
          result = await events.next();
        }
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

async function liveDebrief(
  client: Anthropic,
  scenario: Scenario,
  mood: Mood,
  messages: TranscriptMessage[],
  signal: AbortSignal,
): Promise<Response> {
  const message = await client.messages.parse(
    {
      model: modelId(),
      max_tokens: 1200,
      messages: [{ role: "user", content: buildCoachPrompt(scenario, mood, messages) }],
      output_config: { format: zodOutputFormat(DebriefOutputSchema) },
    },
    { signal },
  );
  if (!message.parsed_output) return fail(500, "The debrief could not be read. Try ending again.");
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
    error = "The debrief could not be read. Try ending again.";
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

/** Streams a scripted line a word at a time so the UI behaves exactly as it does live. */
function wordStream(text: string): ReadableStream<Uint8Array> {
  const parts = text.split(" ");
  const chunks = parts.map((w, i) => (i < parts.length - 1 ? `${w} ` : w));
  const encoder = new TextEncoder();
  let i = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      return new Promise<void>((resolve) => {
        const wait = i === 0 ? 500 : 35 + Math.floor(Math.random() * 45);
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

function sampleReplyResponse(scenario: Scenario, mood: Mood, messages: TranscriptMessage[]): Response {
  const line = sampleReply(mood, scenario, messages);
  return new Response(wordStream(line), {
    headers: headersFor("sample", { "content-type": "text/plain; charset=utf-8", "x-accel-buffering": "no" }),
  });
}

async function sampleDebriefResponse(): Promise<Response> {
  await sleep(450);
  return Response.json(SAMPLE_DEBRIEF, { headers: headersFor("sample") });
}
