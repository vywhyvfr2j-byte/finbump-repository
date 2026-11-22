import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { listAll } from "../../shared/batchProcess.ts";
import { escapeHtml } from "../../shared/escapeHtml.ts";
import { findAdminWithEmail } from "../../shared/adminRecipient.ts";

// Sends a bi-weekly reminder email to the app admin with the current list of
// FutureUpgrade ideas. Scheduled by the "Upgrade Ideas Reminder" workflow.
//
// Reads all FutureUpgrade records, formats the open ones into a plain-text list,
// and emails them to SUPPORT_EMAIL. Uses Resend when configured, otherwise
// falls back to the built-in SendEmail integration.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const upgrades = await listAll(base44.asServiceRole.entities.FutureUpgrade);
    const open = upgrades.filter((u) => u.status !== 'done');

    // Send to the admin user's registered email (SendEmail requires a registered
    // recipient unless a custom domain is connected). Falls back to SUPPORT_EMAIL
    // when set, but that may fail without a custom domain.
    const admin = await findAdminWithEmail(base44);
    const to = admin?.email || process.env.SUPPORT_EMAIL;
    if (!to) {
      return Response.json({ error: 'No admin email found to send reminder to' }, { status: 500 });
    }

    const priorityLabel = { high: 'High', medium: 'Med', low: 'Low' };

    let body;
    if (open.length === 0) {
      body = 'No open upgrade ideas right now. Nice work!\n\nView the full list in the app under Admin → Future Upgrades.';
    } else {
      const lines = open.map((u, i) => {
        const p = priorityLabel[u.priority] || 'Med';
        // Record text is escaped: the SendEmail `body` is treated as HTML, so
        // raw markup from a FutureUpgrade record would render in the admin's
        // inbox (spoofed links, tracking pixels).
        const notes = u.notes ? ` — ${escapeHtml(u.notes)}` : '';
        return `${i + 1}. [${p}] ${escapeHtml(u.title)}${notes}`;
      });
      body = `Here are your ${open.length} open upgrade idea${open.length === 1 ? '' : 's'} for FinBump:\n\n${lines.join('\n')}\n\nReview and update them in the app under Admin → Future Upgrades.`;
    }

    const subject = `FinBump — upgrade ideas reminder (${open.length} open)`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to,
      subject,
      body,
    });

    return Response.json({ ok: true, sent: open.length });
  } catch (error) {
    console.error('send-upgrade-reminder error', error?.message || error);
    return Response.json({ error: 'Could not send the reminder.' }, { status: 500 });
  }
}