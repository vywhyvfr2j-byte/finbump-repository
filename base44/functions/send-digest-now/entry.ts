import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { isResendConfigured, sendEmailViaResend } from "../../shared/resendEmail.ts";
import { checkAndRecordAttempt } from "../../shared/codeAttemptLimit.ts";

// Sends a digest email immediately to the caller's own email address.
// Called by the Settings "Send digest now" button. Auth required so only
// the logged-in user can trigger a send to their own verified email.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // The address is locked to the caller's own account, but without a cap this
    // is an open door to hammer that inbox and burn the app's sending
    // reputation (and its Resend quota) from one signed-in account.
    const attempt = await checkAndRecordAttempt(base44, user.id, 'send-digest-now', 5, 60);
    if (!attempt.allowed) {
      return Response.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(attempt.retryAfterSeconds) } },
      );
    }

    const body = await req.json();
    const { email, subject, body: emailBody } = body;
    if (!email || !subject || !emailBody) {
      return Response.json({ error: 'email, subject, and body are required' }, { status: 400 });
    }

    // Only send to the caller's own account email — prevents redirecting
    // digest emails to arbitrary addresses.
    if (email !== user.email) {
      return Response.json({ error: 'Email must match your account' }, { status: 403 });
    }

    if (isResendConfigured()) {
      const ok = await sendEmailViaResend(email, subject, emailBody);
      if (!ok) return Response.json({ error: 'Failed to send email' }, { status: 500 });
    } else {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        subject,
        body: emailBody,
      });
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error('send-digest-now failed:', error?.message || error);
    return Response.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}