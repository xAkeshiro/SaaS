/**
 * The demo's wire protocol, shared by POST /api/rehearse and the browser.
 * Kept free of zod and the scripts so the client imports only these few bytes.
 */
import type { BlockReason } from "@/lib/safety/screen";

/** A rehearsal is short: past this many lines the route refuses, and the persona has already wrapped up. */
export const MAX_MESSAGES = 24;
export const MAX_TEXT = 800;
/** A custom scenario is a sentence or two, not a document. */
export const MAX_CUSTOM = 600;
/** Live persona replies (after the opener) before the persona is told to wrap up and the call ends. */
export const MAX_REPLIES = 10;
export const MODE_HEADER = "x-unmute-mode";
export const CUSTOM_ID = "custom";

export type RehearseMode = "sample" | "live";

/**
 * A reply streams as plain text, then this record-separator character, then a
 * JSON `ReplyTrailer`. The trailer's text is the authoritative line (the
 * stream is for show), and its signature is what the browser sends back.
 */
export const TRAILER_MARK = "\u001e";

/** Instead of a stream (or as a reply's trailer), the route answers with this when the rehearsal must stop. */
export type StoppedResponse = { stopped: "safety" } | { stopped: "blocked"; reason: BlockReason };

export type ReplyTrailer =
  | { text: string; sig?: string; ended?: boolean }
  | { error: string }
  | StoppedResponse;

/** What the browser sends to name a scenario: a preset id, or the visitor's own words. */
export type WireScenario = { id: string; custom?: string };
export type WireMessage = { role: "persona" | "user"; text: string; sig?: string };

export function isStopped(x: unknown): x is StoppedResponse {
  if (!x || typeof x !== "object") return false;
  const s = (x as { stopped?: unknown }).stopped;
  return s === "safety" || s === "blocked";
}
