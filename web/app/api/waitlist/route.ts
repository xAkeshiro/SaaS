import { z } from "zod";
import { limit } from "@/lib/demo/rate-limit";
import { notifyOwner } from "@/lib/server/notify";
import { serviceClient } from "@/lib/server/supabase";

export const runtime = "nodejs";

const MAX_FIELD = 500;
const WEBHOOK_TIMEOUT_MS = 5_000;

/** The only keys that leave this handler. Everything else in the body is dropped. */
const ALLOWED = ["email", "source", "name", "org", "seats", "notes", "campus"] as const;
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
  source: Text.max(64).optional(),
  name: Text.optional(),
  org: Text.optional(),
  seats: Text.optional(),
  notes: Text.optional(),
  campus: Text.max(120).optional(),
  /** The separate "invite me to the beta" step; the launch email needs no opt-in beyond joining. */
  beta: z.boolean().optional(),
});

type Payload = Partial<Record<Allowed, string>> & { email: string; source: string; beta?: boolean };

const NO_STORE: HeadersInit = { "cache-control": "no-store" };
const SAVE_ERROR = "Could not save your request right now. Try again in a minute.";

function ok(): Response {
  return Response.json({ ok: true }, { headers: NO_STORE });
}

function fail(status: number, error: string, extra: Record<string, string> = {}): Response {
  return Response.json({ ok: false, error }, { status, headers: { ...NO_STORE, ...extra } });
}

function firstIssue(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "Invalid request.";
  return issue.path.length === 0 ? "Send a JSON object." : issue.message;
}

/** Keeps only whitelisted, non-empty fields so nothing unexpected is stored or forwarded. */
function toPayload(data: z.infer<typeof WaitlistSchema>): Payload {
  const payload: Payload = { email: data.email, source: data.source || "web" };
  for (const key of ALLOWED) {
    if (key === "email" || key === "source") continue;
    const value = data[key];
    if (value) payload[key] = value;
  }
  if (data.beta !== undefined) payload.beta = data.beta;
  return payload;
}

/* ------------------------------------------------------------------ */
/* Stores                                                              */
/* ------------------------------------------------------------------ */

/**
 * Supabase: a Teams request is a row in `pilot_requests` and an email to the
 * owner; anything else upserts `waitlist` by email, so the beta step only adds
 * its fields to the row the first signup made.
 */
async function saveToSupabase(payload: Payload): Promise<boolean> {
  const db = serviceClient();
  if (!db) return false;

  if (payload.source === "teams") {
    const { error } = await db.from("pilot_requests").insert({
      email: payload.email,
      name: payload.name ?? null,
      org: payload.org ?? null,
      seats: payload.seats ?? null,
      notes: payload.notes ?? null,
    });
    if (error) {
      console.error("[waitlist] pilot insert failed", error.code);
      return false;
    }
    await notifyOwner(
      `Pilot request${payload.org ? `: ${payload.org}` : ""}`,
      [
        `Name: ${payload.name ?? ""}`,
        `Email: ${payload.email}`,
        `Organization: ${payload.org ?? ""}`,
        `Seats: ${payload.seats ?? ""}`,
        "",
        payload.notes ?? "",
      ].join("\n"),
    );
    return true;
  }

  // Only the fields this request carries, so a beta opt-in never overwrites the original source.
  const row: Record<string, string | boolean> = { email: payload.email };
  if (payload.beta === undefined) row.source = payload.source;
  else row.beta_opt_in = payload.beta;
  if (payload.campus) row.campus = payload.campus;

  const { error } = await db.from("waitlist").upsert(row, { onConflict: "email" });
  if (error) {
    console.error("[waitlist] upsert failed", error.code);
    return false;
  }
  return true;
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

  const limited = await limit("waitlist", req);
  if (!limited.ok) return fail(429, "Too many tries. Give it a few minutes.", { "retry-after": String(limited.retryAfter) });

  const payload = toPayload(parsed.data);

  if (serviceClient()) {
    return (await saveToSupabase(payload)) ? ok() : fail(502, SAVE_ERROR);
  }

  const webhook = process.env.WAITLIST_WEBHOOK_URL?.trim();
  if (webhook) {
    return (await forward(webhook, payload)) ? ok() : fail(502, SAVE_ERROR);
  }

  // No store configured yet: accept, and log only that it happened. Emails never go to logs.
  console.info("[waitlist] accepted without a store", payload.source, payload.beta ? "beta" : "");
  return ok();
}
