import { z } from "zod";

export const runtime = "nodejs";

const MAX_FIELD = 500;
const WEBHOOK_TIMEOUT_MS = 5_000;

/** The only keys that leave this handler. Everything else in the body is dropped. */
const ALLOWED = ["email", "source", "name", "org", "seats", "notes"] as const;
type Allowed = (typeof ALLOWED)[number];

const EMAIL_ERROR = "Enter a valid email address.";

const Text = z
  .string({ error: "Send text fields as plain text." })
  .trim()
  .max(MAX_FIELD, `Keep it under ${MAX_FIELD} characters.`);

const WaitlistSchema = z.object({
  email: z
    .string({ error: EMAIL_ERROR })
    .trim()
    .toLowerCase()
    .max(254, EMAIL_ERROR)
    .pipe(z.email({ error: EMAIL_ERROR })),
  source: Text.optional(),
  name: Text.optional(),
  org: Text.optional(),
  seats: Text.optional(),
  notes: Text.optional(),
});

type Payload = Partial<Record<Allowed, string>> & { email: string; source: string };

const NO_STORE: HeadersInit = { "cache-control": "no-store" };

function ok(): Response {
  return Response.json({ ok: true }, { headers: NO_STORE });
}

function fail(status: number, error: string): Response {
  return Response.json({ ok: false, error }, { status, headers: NO_STORE });
}

function firstIssue(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "Invalid request.";
  return issue.path.length === 0 ? "Send a JSON object." : issue.message;
}

/** Keeps only whitelisted, non-empty strings so nothing unexpected is forwarded or logged. */
function toPayload(data: z.infer<typeof WaitlistSchema>): Payload {
  const payload: Payload = { email: data.email, source: data.source || "web" };
  for (const key of ALLOWED) {
    if (key === "email" || key === "source") continue;
    const value = data[key];
    if (value) payload[key] = value;
  }
  return payload;
}

/** POSTs the payload to the webhook with a hard timeout. True on a 2xx. */
async function forward(url: string, payload: Payload): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) console.error("[waitlist] webhook responded", res.status);
    return res.ok;
  } catch (err) {
    // Reason only: never log the webhook URL or the payload here.
    const reason = err instanceof Error ? err.name : "unknown";
    console.error("[waitlist] webhook failed", reason);
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail(400, "Send a JSON body.");
  }

  const parsed = WaitlistSchema.safeParse(body);
  if (!parsed.success) return fail(400, firstIssue(parsed.error));

  const payload = toPayload(parsed.data);
  const webhook = process.env.WAITLIST_WEBHOOK_URL?.trim();

  if (webhook) {
    const delivered = await forward(webhook, payload);
    if (!delivered) return fail(502, "Could not save your request right now. Try again in a minute.");
    return ok();
  }

  // No webhook configured: log and accept. Nothing is written to disk.
  console.log("[waitlist]", payload);
  return ok();
}
