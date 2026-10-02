import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/**
 * Persona lines the demo hands back to the browser carry a signature, and the
 * route only accepts persona lines it signed itself. Without this, a request
 * could put any words in the persona's mouth and turn the demo into a free,
 * general-purpose chatbot on our API bill.
 *
 * A signature binds the line's text to the rehearsal (a random nonce the
 * browser makes at Start), the scenario, and the line's position, so lines
 * cannot be moved between rehearsals or scenarios.
 */

const VERSION = "v1";

/**
 * DEMO_SIGNING_SECRET when set. Otherwise one derived from the Anthropic key,
 * which only the server holds, so live mode is always protected without a new
 * env var. With neither (the scripted sample), there is nothing to protect.
 */
export function signingKey(): string | null {
  const explicit = process.env.DEMO_SIGNING_SECRET?.trim();
  if (explicit) return explicit;
  const anthropic = (process.env.ANTHROPIC_DEMO_API_KEY || process.env.ANTHROPIC_API_KEY)?.trim();
  if (!anthropic) return null;
  return createHmac("sha256", anthropic).update("unmute:demo-signing:v1").digest("hex");
}

/** A short stable id for a custom scenario's text, so a line signed for one description fails for another. */
export function scenarioKey(id: string, custom?: string): string {
  if (!custom) return id;
  return `custom:${createHash("sha256").update(custom).digest("base64url").slice(0, 22)}`;
}

function payload(nonce: string, scenario: string, index: number, text: string): string {
  return `${VERSION}|${nonce}|${scenario}|${index}|${text}`;
}

export function signLine(key: string, nonce: string, scenario: string, index: number, text: string): string {
  return createHmac("sha256", key).update(payload(nonce, scenario, index, text)).digest("base64url");
}

export function verifyLine(
  key: string,
  nonce: string,
  scenario: string,
  index: number,
  text: string,
  sig: string | undefined,
): boolean {
  if (!sig) return false;
  const expected = Buffer.from(signLine(key, nonce, scenario, index, text));
  const given = Buffer.from(sig);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
