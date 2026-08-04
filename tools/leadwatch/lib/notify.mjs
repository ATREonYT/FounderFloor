/**
 * Delivering the digest.
 *
 * Reuses the same three environment variables the floor server already
 * reads, so on the VPS this needs no new configuration at all: drop the
 * timer in and it starts mailing you.
 *
 *   RESEND_API_KEY   without it, sending is a no-op and the run says so
 *   EMAIL_FROM       must be a verified sender on your Resend domain
 *   OPERATOR_EMAIL   where the digest goes — you
 *
 * The digest is written to disk either way. Email is a convenience, not the
 * record.
 */

const API = "https://api.resend.com/emails";

export async function emailDigest({ subject, html, text }) {
  const key = process.env.RESEND_API_KEY || "";
  const to = process.env.OPERATOR_EMAIL || "";
  const from = process.env.EMAIL_FROM || "FounderFloor <noreply@founderfloor.net>";

  if (!key) return { sent: false, reason: "RESEND_API_KEY not set" };
  if (!to) return { sent: false, reason: "OPERATOR_EMAIL not set" };

  const res = await fetch(API, {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      text,
      ...(process.env.EMAIL_REPLY_TO ? { reply_to: process.env.EMAIL_REPLY_TO } : {}),
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return { sent: false, reason: `resend ${res.status}: ${detail.slice(0, 200)}` };
  }
  return { sent: true, reason: `delivered to ${to}` };
}
