/**
 * Emails the owner through Resend when something needs a human (a Teams pilot
 * request). Quietly does nothing until RESEND_API_KEY and OWNER_NOTIFY_EMAIL are
 * set. Failures are logged by reason only: never the message or its recipient.
 */
const TIMEOUT_MS = 5_000;

export async function notifyOwner(subject: string, text: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const to = process.env.OWNER_NOTIFY_EMAIL?.trim();
  if (!apiKey || !to) return false;
  // Resend's shared sender works before the domain is verified; set RESEND_FROM once it is.
  const from = process.env.RESEND_FROM?.trim() || "Unmute <onboarding@resend.dev>";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, text }),
      signal: controller.signal,
    });
    if (!res.ok) console.error("[notify] resend responded", res.status);
    return res.ok;
  } catch (err) {
    console.error("[notify] resend failed", err instanceof Error ? err.name : "unknown");
    return false;
  } finally {
    clearTimeout(timer);
  }
}
