import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { listAll } from "../../shared/batchProcess.ts";
import { findAdminWithEmail } from "../../shared/adminRecipient.ts";
import { isResendConfigured, sendEmailViaResend } from "../../shared/resendEmail.ts";
import { escapeHtml } from "../../shared/escapeHtml.ts";

// Scheduled by the "Daily Review Digest" workflow (8am CT daily). Emails the
// admin (SUPPORT_EMAIL) a summary of new reviews from the last 24 hours
// across all sources (in-app, Apple App Store, Google Play), including the
// all-time average so the admin can track rating trends.
//
// Security: requires an admin via base44.auth.me(). The workflow's
// invoke_backend_function activity runs as the platform service role which
// provides an admin-level auth context. Direct calls from non-admins return 403.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    // Resolve the recipient: prefer the first admin user's account email
    // (always a registered user, so SendEmail works without a custom domain),
    // falling back to SUPPORT_EMAIL.
    const adminUser = await findAdminWithEmail(base44);
    const adminEmail = adminUser?.email || process.env.SUPPORT_EMAIL;
    if (!adminEmail) {
      console.error('send-review-digest: no admin email or SUPPORT_EMAIL to send to');
      return Response.json({ error: 'No admin recipient configured' }, { status: 500 });
    }

    const reviews = await listAll(base44.asServiceRole.entities.AppReview);
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const recent = reviews
      .filter((r) => new Date(r.created_date).getTime() >= cutoff)
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

    const allAvg = reviews.length
      ? reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / reviews.length
      : 0;

    const sourceLabel = {
      in_app: 'In-app',
      apple: 'Apple App Store',
      google: 'Google Play',
    };

    const lines = recent.map((r) => {
      const who = r.reviewerName || (r.isManual ? r.storeHandle || 'Store review' : 'Anonymous');
      const contact = r.reviewerEmail || (r.isManual ? r.storeHandle : '') || '—';
      return `• ${r.rating}/5 — ${escapeHtml(sourceLabel[r.source] || r.source)} — ${escapeHtml(who)}\n  "${escapeHtml((r.reviewText || '').slice(0, 280))}"\n  contact: ${escapeHtml(contact)}`;
    });

    const subject = `FinBump review digest — ${recent.length} new review${recent.length === 1 ? '' : 's'}`;
    const body = [
      `Daily review digest for ${new Date().toDateString()}`,
      ``,
      `All-time: ${reviews.length} review${reviews.length === 1 ? '' : 's'}, average ${Math.round(allAvg * 10) / 10}/5.`,
      `New in the last 24h: ${recent.length}.`,
      ``,
      recent.length ? lines.join('\n\n') : 'No new reviews in the last 24 hours.',
      ``,
      `View and respond to reviews in the app's Reviews page (admin).`,
    ].join('\n');

    let sentVia = 'none';
    if (isResendConfigured()) {
      const ok = await sendEmailViaResend(adminEmail, subject, body);
      if (ok) sentVia = 'resend';
    }
    if (sentVia === 'none') {
      // Fall back to the built-in SendEmail if Resend is unconfigured or the
      // recipient isn't verified on Resend's free tier.
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: adminEmail,
        subject,
        body,
      });
      sentVia = 'sendemail';
    }

    return Response.json({ ok: true, newReviews: recent.length, total: reviews.length, sentVia });
  } catch (error) {
    console.error('send-review-digest error', error?.message || error);
    return Response.json({ error: 'Could not send the review digest.' }, { status: 500 });
  }
}