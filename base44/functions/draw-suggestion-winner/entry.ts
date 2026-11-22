import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { listAll } from '../../shared/batchProcess.ts';
import { isResendConfigured, sendEmailViaResend } from '../../shared/resendEmail.ts';
import { escapeHtml } from '../../shared/escapeHtml.ts';
import { MAX_SUGGESTIONS_PER_MONTH } from '../../shared/suggestionLimits.ts';

// Monthly suggestion drawing. Scheduled by the "Monthly Suggestion Winner"
// workflow on the 1st of each month at 9am CT. Randomly selects one suggestion
// from the previous calendar month (America/Chicago), marks it the winner,
// emails the administrator the winner's details FIRST, then emails the winner
// so the admin is notified before the contributor. The admin arranges the
// winner's chosen award: a $50 gift card or a lifetime membership.
//
// Security: the workflow runs as the platform service role (admin-level), so
// this function requires an admin via base44.auth.me(). Direct calls from
// non-admins return 403.
//
// Trust boundary: a suggestion's userEmail/userName fields come from whoever
// wrote the row (suggestions can also be created straight through the SDK), so
// they are never trusted here. Only suggestions whose contributor is a real
// account whose email matches the stored one are eligible, each account
// contributes at most MAX_SUGGESTIONS_PER_MONTH entries to the draw, and both
// award emails are addressed from the contributor's User record — never from the
// row — so an award email can only ever reach a verified account holder.

function previousMonthKeyChicago() {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
  });
  const parts = fmt.formatToParts(new Date());
  let y = Number(parts.find((p) => p.type === 'year').value);
  let m = Number(parts.find((p) => p.type === 'month').value); // 1-12
  m -= 1;
  if (m === 0) { m = 12; y -= 1; }
  return `${y}-${String(m).padStart(2, '0')}`;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const monthKey = previousMonthKeyChicago();
    const all = await listAll(base44.asServiceRole.entities.AppSuggestion);
    const users = await listAll(base44.asServiceRole.entities.User);
    const usersById = new Map<string, any>(
      users.filter((u: any) => u?.id).map((u: any) => [u.id, u]),
    );

    // Eligible = contributed by a real account, with the row's stored email
    // matching that account. A row pointed at a stranger's address is dropped
    // here, so the drawing can never be scripted into emailing an outsider.
    const eligible = all.filter((s: any) => {
      if (s.monthKey !== monthKey || s.isWinner === true) return false;
      const creator = usersById.get(s.created_by_id);
      if (!creator?.email) return false;
      return String(s.userEmail || '').trim().toLowerCase() === String(creator.email).trim().toLowerCase();
    });

    // Each account contributes at most MAX_SUGGESTIONS_PER_MONTH entries, so a
    // burst of rows created directly through the SDK cannot flood the pool and
    // capture the prize.
    const entriesPerCreator = new Map<string, number>();
    const pool: any[] = [];
    for (const s of eligible) {
      const count = (entriesPerCreator.get(s.created_by_id) || 0) + 1;
      entriesPerCreator.set(s.created_by_id, count);
      if (count <= MAX_SUGGESTIONS_PER_MONTH) pool.push(s);
    }

    if (pool.length === 0) {
      return Response.json({ ok: true, monthKey, winner: null, reason: 'no suggestions' });
    }

    const winner = pool[Math.floor(Math.random() * pool.length)];
    await base44.asServiceRole.entities.AppSuggestion.update(winner.id, {
      isWinner: true,
      drawnAt: new Date().toISOString(),
    });

    // Winner identity comes from the account, not from the suggestion row.
    const winnerUser = usersById.get(winner.created_by_id);
    const winnerName = String(winnerUser?.full_name || '').trim() || 'Anonymous';
    const winnerEmail = String(winnerUser?.email || '').trim();

    // Resolve admin recipient: first admin user's email, fallback to SUPPORT_EMAIL.
    const adminUser = users.find((u: any) => u.role === 'admin' && u.email);
    const adminEmail = adminUser?.email || process.env.SUPPORT_EMAIL;

    // 1) Notify the administrator FIRST.
    if (adminEmail) {
      const subject = `🎉 FinBump suggestion winner — ${monthKey}`;
      const text =
        `Monthly suggestion drawing for ${monthKey}.\n\n` +
        `Winner: ${escapeHtml(winnerName)} (${escapeHtml(winnerEmail || 'no email on file')})\n` +
        `Category: ${escapeHtml(winner.category)}\n` +
        `Suggestion: ${escapeHtml(winner.message)}\n\n` +
        `Please contact the winner to arrange their chosen award — a $50 gift card or a lifetime FinBump membership.`;
      let sent = false;
      if (isResendConfigured()) sent = await sendEmailViaResend(adminEmail, subject, text);
      if (!sent) {
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({ to: adminEmail, subject, body: text });
          sent = true;
        } catch (e) {
          console.error('draw-suggestion-winner: admin SendEmail failed', e?.message || e);
        }
      }
    }

    // 2) Notify the contributor AFTER the admin.
    if (winnerEmail) {
      const wSubject = `🎉 You won the FinBump suggestion drawing!`;
      const wText =
        `Congratulations! Your suggestion was selected in this month's FinBump suggestion drawing.\n\n` +
        `You've won your choice of a $50 gift card or a lifetime FinBump membership. ` +
        `Our team will contact you shortly to ask which one you'd like and arrange it for you.\n\n` +
        `Thank you for helping make FinBump better!\n\n` +
        `— The FinBump Team`;
      let wSent = false;
      if (isResendConfigured()) wSent = await sendEmailViaResend(winnerEmail, wSubject, wText);
      if (!wSent) {
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({ to: winnerEmail, subject: wSubject, body: wText });
          wSent = true;
        } catch (e) {
          console.error('draw-suggestion-winner: winner SendEmail failed', e?.message || e);
        }
      }
    }

    return Response.json({
      ok: true,
      monthKey,
      winner: {
        name: winnerName,
        email: winnerEmail,
        category: winner.category,
      },
    });
  } catch (error) {
    console.error('draw-suggestion-winner error', error?.message || error);
    return Response.json({ error: 'Could not draw a winner.' }, { status: 500 });
  }
}