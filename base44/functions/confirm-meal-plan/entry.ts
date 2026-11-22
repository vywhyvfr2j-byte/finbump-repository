import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { waitUntil } from 'base44:runtime';
import { confirmedEmail, inviteLink, resolveAppUrl, sendMealEmail } from '../../shared/mealEmails.ts';
import { checkAndRecordAttempt } from '../../shared/codeAttemptLimit.ts';
import { canEmailInvite, inviteTrustForCaller } from '../../shared/inviteRecipients.ts';

// Locks in the agreed plan and emails everyone the details plus their own link
// back to the plan page. Host-only (or admin).

// Every confirmation emails the whole guest list through the app's own mail
// provider (up to 12 addresses per gathering), so cap how many a host can send
// per day — repeated calls must not turn this endpoint into a bulk-mail tool.
const MAX_CONFIRMS_PER_DAY = 20;

function clean(value: unknown, max: number): string {
  return String(value ?? '').trim().slice(0, max);
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Rate limit: caps the confirmation emails (and recipient addresses) a single
    // account can send per day, before any work or sending happens.
    const attempt = await checkAndRecordAttempt(base44, user.id, 'confirm-meal-plan', MAX_CONFIRMS_PER_DAY, 1440);
    if (!attempt.allowed) {
      return Response.json(
        { error: 'You have confirmed a lot of gatherings today. Please try again tomorrow.' },
        { status: 429, headers: { 'Retry-After': String(attempt.retryAfterSeconds) } },
      );
    }

    const body = await req.json().catch(() => ({}));
    const mealId = clean(body.mealId, 64);
    if (!mealId) return Response.json({ error: 'A meal is required' }, { status: 400 });

    const meal = await base44.entities.Meal.get(mealId).catch(() => null);
    if (!meal) return Response.json({ error: 'Meal not found' }, { status: 404 });
    if (meal.created_by_id !== user.id && user.role !== 'admin') {
      return Response.json({ error: 'Only the host can confirm this meal' }, { status: 403 });
    }

    const dateRaw = clean(body.dateTime, 40);
    if (!dateRaw) return Response.json({ error: 'Pick a date and time first' }, { status: 400 });
    const when = new Date(dateRaw);
    if (Number.isNaN(when.getTime())) {
      return Response.json({ error: 'That date and time could not be read' }, { status: 400 });
    }

    const patch: any = {
      status: 'confirmed',
      confirmedDate: when.toISOString(),
      venueName: clean(body.venueName, 160),
      venueAddress: clean(body.venueAddress, 240),
    };
    // Only overwrite the host's original suggestions when a new value is given.
    const cuisine = clean(body.cuisine, 120);
    const area = clean(body.area, 120);
    if (cuisine) patch.cuisine = cuisine;
    if (area) patch.area = area;

    const updated = await base44.entities.Meal.update(mealId, patch);

    // Re-confirming the plan that is already stored changes nothing, so it must not
    // re-send the batch: without this, replaying the call would email every guest
    // again on every request.
    const samePlan =
      meal.status === 'confirmed' &&
      !!meal.confirmedDate &&
      new Date(meal.confirmedDate).getTime() === when.getTime() &&
      (meal.venueName || '') === patch.venueName &&
      (meal.venueAddress || '') === patch.venueAddress &&
      (!patch.cuisine || (meal.cuisine || '') === patch.cuisine) &&
      (!patch.area || (meal.area || '') === patch.area);

    // Same trust boundary as the invitations: the guest list was supplied by the
    // host, so only addresses confirmed to belong to someone connected to them are
    // emailed. Everyone else reaches the plan through the private link the host
    // already has for them.
    const trust = await inviteTrustForCaller(base44, user);

    const recipients: any[] = [];
    for (const p of updated.participants || []) {
      if (!p.email || !p.token) continue;
      if (await canEmailInvite(trust, p.email)) recipients.push(p);
    }

    const appUrl = resolveAppUrl(req);
    if (appUrl && !samePlan) {
      waitUntil(
        (async () => {
          for (const p of recipients) {
            const linkUrl = inviteLink(appUrl, updated.id, p.token);
            const { subject, html, text } = confirmedEmail({ meal: updated, participantName: p.name, linkUrl });
            await sendMealEmail(base44, p.email, subject, html, text);
            await new Promise((r) => setTimeout(r, 400));
          }
        })(),
      );
    } else if (!appUrl) {
      console.error('confirm-meal-plan: no app URL configured — confirmation emails skipped');
    }

    return Response.json({
      meal: updated,
      notifiedCount: appUrl && !samePlan ? recipients.length : 0,
    });
  } catch (error: any) {
    console.error('confirm-meal-plan failed:', error?.message || error);
    return Response.json({ error: 'Could not confirm this meal' }, { status: 500 });
  }
}