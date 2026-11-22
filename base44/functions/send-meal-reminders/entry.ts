import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { filterAll } from '../../shared/batchProcess.ts';
import { resolveShard, shardSlice } from '../../shared/shard.ts';
import { inviteLink, reminderEmail, resolveAppUrl, sendMealEmail } from '../../shared/mealEmails.ts';
import { canEmailInvite, inviteTrustForOwner } from '../../shared/inviteRecipients.ts';

// Daily reminder pass over every open meal. Runs from the "Meal Reminders"
// workflow, so it authenticates as admin only.
//
// Two jobs:
//  1. Meals still being decided — nudge the people who haven't answered yet.
//  2. Confirmed meals — remind everyone shortly before, then mark the meal done
//     once the date has passed.
//
// Nothing is ever sent for a cancelled meal, and the nudging around a suggested
// date uses the full date AND time the host proposed: once that moment is less
// than a day away, or already gone, there is no room left for answers to change
// the plan, so the follow-ups stop instead of landing late. Meals with no
// suggested date yet stay open, and anyone who already said they can't make it
// is left out of the reminder for a meal that is set.
//
// Each meal is reminded at most once per day (lastReminderAt), and anyone who
// turned reminders off (reminderOptOut) is left alone. A hard per-run cap keeps
// one bad data set from firing a mail storm.

const MAX_EMAILS_PER_RUN = 60;
const THROTTLE_MS = 20 * 60 * 60 * 1000;
const MIN_AGE_BEFORE_NUDGE_MS = 12 * 60 * 60 * 1000;
// How much notice a nudge needs before the suggested time to be worth sending.
// Closer than this, answering can no longer change the plan, so the nudge is
// dropped rather than mailed about an event that is already here.
const MIN_NOTICE_BEFORE_PROPOSED_MS = 24 * 60 * 60 * 1000;
const SEND_PACING_MS = 400;

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const appUrl = resolveAppUrl(req);
    if (!appUrl) {
      console.error('send-meal-reminders: no app URL (header and WIX_CHECKOUT_APP_URL both empty)');
      return Response.json({ error: 'App URL not configured' }, { status: 500 });
    }

    // The workflow runs this function N times in sequence, each owning a slice of
    // the open meals. Without it, one invocation walked every open meal on the
    // whole base and overran the timeout once the app grew past a few thousand
    // gatherings — failing for everyone at once, silently.
    const body = await req.json().catch(() => ({}));
    const { shard, totalShards } = resolveShard(body);

    const now = Date.now();
    const proposed = shardSlice(
      await filterAll(base44.asServiceRole.entities.Meal, { status: 'proposed' }),
      shard, totalShards,
    );
    const confirmed = shardSlice(
      await filterAll(base44.asServiceRole.entities.Meal, { status: 'confirmed' }),
      shard, totalShards,
    );

    let emailsSent = 0;
    let mealsReminded = 0;
    let mealsCompleted = 0;

    // Reminders reuse the invitation trust boundary: a gathering's guest list is
    // supplied by its host, so only addresses saved on that host's own connections
    // are mailed here — otherwise a gathering with invented addresses would keep
    // mailing strangers day after day. Contacts are read once per host.
    const trustCache = new Map<string, any>();
    const isHostContact = async (meal: any, email: string) => {
      const ownerId = meal.created_by_id || '';
      if (!trustCache.has(ownerId)) {
        trustCache.set(ownerId, await inviteTrustForOwner(base44, ownerId));
      }
      return canEmailInvite(trustCache.get(ownerId), email);
    };

    // 1. Still deciding — nudge the people who haven't answered.
    for (const meal of proposed) {
      if (emailsSent >= MAX_EMAILS_PER_RUN) break;

      // Only a meal that is still open for answers is ever nudged, so a meal
      // that was cancelled — or closed out any other way — stops getting
      // follow-ups the moment its status changes.
      if (meal.status !== 'proposed') continue;

      const pending: any[] = [];
      for (const p of meal.participants || []) {
        if (!p.email || !p.token || p.respondedAt || p.reminderOptOut) continue;
        if (await isHostContact(meal, p.email)) pending.push(p);
      }
      if (!pending.length) continue;

      // The nudge exists to collect answers while there is still time to use
      // them, so it counts down to the exact suggested moment — the host's chosen
      // time included. Once that is less than a day away, or already past, the
      // reminder would arrive with no room left to answer and re-plan, so the
      // nudging stops for good. A date we can't read counts as one that has
      // passed, never as a reason to keep going. A meal with no suggested date
      // yet is still open, so it keeps nudging.
      if (meal.proposedDate) {
        const suggestedAt = new Date(meal.proposedDate).getTime();
        if (!(suggestedAt - now > MIN_NOTICE_BEFORE_PROPOSED_MS)) continue;
      }

      const created = meal.created_date ? new Date(meal.created_date).getTime() : 0;
      if (now - created < MIN_AGE_BEFORE_NUDGE_MS) continue;

      const last = meal.lastReminderAt ? new Date(meal.lastReminderAt).getTime() : 0;
      if (now - last < THROTTLE_MS) continue;

      let worked = false;
      for (const p of pending) {
        if (emailsSent >= MAX_EMAILS_PER_RUN) break;
        const linkUrl = inviteLink(appUrl, meal.id, p.token);
        const { subject, html, text } = reminderEmail({
          meal,
          participantName: p.name,
          linkUrl,
          needsResponse: true,
        });
        await sendMealEmail(base44, p.email, subject, html, text);
        emailsSent += 1;
        worked = true;
        await new Promise((r) => setTimeout(r, SEND_PACING_MS));
      }

      if (worked) {
        await base44.asServiceRole.entities.Meal.update(meal.id, {
          lastReminderAt: new Date().toISOString(),
          remindersSent: (meal.remindersSent || 0) + 1,
        });
        mealsReminded += 1;
      }
    }

    // 2. Confirmed — close out past meals, remind upcoming ones.
    for (const meal of confirmed) {
      if (emailsSent >= MAX_EMAILS_PER_RUN) break;

      // A cancelled meal never gets a reminder, confirmed date or not.
      if (meal.status !== 'confirmed') continue;

      const when = meal.confirmedDate ? new Date(meal.confirmedDate).getTime() : 0;
      if (!when) continue;

      // The date has passed: close the meal out and send nothing.
      if (when < now) {
        await base44.asServiceRole.entities.Meal.update(meal.id, { status: 'done' });
        mealsCompleted += 1;
        continue;
      }

      const hoursAway = (when - now) / (60 * 60 * 1000);
      if (hoursAway > 36 || hoursAway < 6) continue;

      const last = meal.lastReminderAt ? new Date(meal.lastReminderAt).getTime() : 0;
      if (now - last < THROTTLE_MS) continue;

      // Anyone who already said they can't make it is left out: a reminder for a
      // meal they aren't coming to is exactly the mail not to send.
      // A guest who already answered proved they received the host's own private
      // link, so they stay reachable even when they are not a saved contact.
      const recipients: any[] = [];
      for (const p of meal.participants || []) {
        if (!p.email || !p.token || p.reminderOptOut || p.response?.coming === 'no') continue;
        if (p.respondedAt || (await isHostContact(meal, p.email))) recipients.push(p);
      }
      if (!recipients.length) continue;

      let worked = false;
      for (const p of recipients) {
        if (emailsSent >= MAX_EMAILS_PER_RUN) break;
        const linkUrl = inviteLink(appUrl, meal.id, p.token);
        const { subject, html, text } = reminderEmail({
          meal,
          participantName: p.name,
          linkUrl,
          needsResponse: false,
        });
        await sendMealEmail(base44, p.email, subject, html, text);
        emailsSent += 1;
        worked = true;
        await new Promise((r) => setTimeout(r, SEND_PACING_MS));
      }

      if (worked) {
        await base44.asServiceRole.entities.Meal.update(meal.id, {
          lastReminderAt: new Date().toISOString(),
          remindersSent: (meal.remindersSent || 0) + 1,
        });
        mealsReminded += 1;
      }
    }

    console.log(`send-meal-reminders[${shard}/${totalShards}]: ${emailsSent} emails, ${mealsReminded} meals reminded, ${mealsCompleted} meals completed`);
    return Response.json({ emailsSent, mealsReminded, mealsCompleted, shard, totalShards });
  } catch (error: any) {
    console.error('send-meal-reminders failed:', error?.message || error);
    return Response.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}