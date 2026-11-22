// Resend email helper for bulk sending (daily digest).
//
// The built-in SendEmail integration consumes 1 Base44 credit per email and
// has anti-abuse rate limits that choke at 10,000+ daily sends. Resend has its
// own generous sending limits and separate pricing, so routing the digest
// through Resend avoids credit depletion and rate-limit failures at scale.
//
// Requires two secrets: RESEND_API_KEY and RESEND_FROM_EMAIL.
// When either is missing, isResendConfigured() returns false so the caller
// can fall back to SendEmail.

export function isResendConfigured(): boolean {
  return !!process.env.RESEND_API_KEY && !!process.env.RESEND_FROM_EMAIL;
}

// Sends a single email via Resend's REST API. Returns true on success.
export async function sendEmailViaResend(
  to: string,
  subject: string,
  text: string,
): Promise<boolean> {
  return sendEmailViaResendFull(to, subject, text, undefined);
}

// Sends an HTML email via Resend's REST API. Returns true on success.
// `text` is the plain-text fallback shown by email clients that don't render HTML.
export async function sendHtmlEmailViaResend(
  to: string,
  subject: string,
  html: string,
  text: string,
): Promise<boolean> {
  return sendEmailViaResendFull(to, subject, text, html);
}

async function sendEmailViaResendFull(
  to: string,
  subject: string,
  text: string,
  html?: string,
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !fromEmail) return false;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject,
        text,
        ...(html ? { html } : {}),
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error(`Resend send failed (${res.status}) for ${to}:`, errText);
    }
    return res.ok;
  } catch (err) {
    console.error('Resend send error:', err?.message || err);
    return false;
  }
}