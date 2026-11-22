import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { listAll, batchMap } from "../../shared/batchProcess.ts";
import { isQuietHours } from "../../shared/quietHours.ts";
import { resolveShard, shardSlice } from "../../shared/shard.ts";

// Little Steps — the learning emails for a new user.
//
// Scheduled once a day by the "Little Steps" workflow. For every user it sends
// the next lesson email that is due: the earliest unsent lesson (days 1, 2, 3,
// 5, 7, 14, 30, 45, 60 and 90 after signup) whose day has arrived. That means a missed day
// is picked up by the next run rather than skipped, and nobody gets two lessons
// in one day. Only one email per user per run.
//
// The day numbers and the templates here are the same series defined in
// src/lib/littleSteps.js (the in-app card), so a change to one must be matched
// in the other. Templates live in base44/emails/LittleStepsDay*.html, where the
// buttons already point at the matching screens in the app.
//
// Security: requires an authenticated admin via base44.auth.me(). The workflow's
// invoke_backend_function activity runs as the platform service role, which
// provides an admin-level auth context.
//
// PAUSED (2026-10-23): the lesson emails are turned off for now — the series is
// taught in the app instead, through the lesson card on Home and the reminder in
// the notification feed. Nothing is sent while this flag is true, even if the
// "Little Steps" workflow is started again. To bring the emails back, flip this
// to false and turn that workflow back on (see the FutureUpgrades reminder).

const LESSON_TEMPLATES = {
  1: 'LittleStepsDay1',
  2: 'LittleStepsDay2',
  3: 'LittleStepsDay3',
  5: 'LittleStepsDay5',
  7: 'LittleStepsDay7',
  14: 'LittleStepsDay14',
  30: 'LittleStepsDay30',
  45: 'LittleStepsDay45',
  60: 'LittleStepsDay60',
  90: 'LittleStepsDay90',
};

const LESSON_DAYS = Object.keys(LESSON_TEMPLATES).map(Number).sort((a, b) => a - b);

// How long the series runs. Past this, no lesson email is sent at all.
const WINDOW_DAYS = 91;

// The on/off switch for the lesson emails themselves. True = paused.
const EMAILS_PAUSED = true;

// Which day of the series today is, counted in calendar days from the anchor so
// an evening signup still counts as day 1. The workflow runs mid-morning US
// Central, so the UTC date matches the user's date at that hour.
function calendarDayNumber(anchorDate) {
  const start = anchorDate ? new Date(anchorDate) : null;
  if (!start || Number.isNaN(start.getTime())) return 1;
  const startUTC = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const now = new Date();
  const nowUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.floor((nowUTC - startUTC) / 86400000) + 1;
}

function firstName(fullName) {
  const first = String(fullName || '').trim().split(/\s+/)[0];
  return first || 'friend';
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    if (EMAILS_PAUSED) return Response.json({ ok: true, paused: true, sent: 0, failed: 0, skipped: 0, noLesson: 0, users: 0 });

    // Safety valve for checking the queue: a dry run reports what would be sent
    // and neither emails anyone nor writes any progress.
    const body = await req.json().catch(() => ({}));
    const { shard, totalShards } = resolveShard(body);

    const [users, progressRows, prefs] = await Promise.all([
      listAll(base44.asServiceRole.entities.User),
      listAll(base44.asServiceRole.entities.LittleStepsProgress),
      listAll(base44.asServiceRole.entities.UserPreference),
    ]);

    const prefsByUser = new Map();
    for (const p of prefs) prefsByUser.set(p.created_by_id, p);

    const progressByUser = new Map();
    for (const row of progressRows) {
      if (row?.userId) progressByUser.set(row.userId, row);
    }

    // Slice to this invocation's users before any per-user work.
    const shardUsers = shardSlice(users, shard, totalShards);

    const queued = [];
    let skipped = 0;
    let noLesson = 0;

    for (const u of shardUsers) {
      if (!u?.email) { skipped++; continue; }
      const row = progressByUser.get(u.id);
      if (row?.stopped) { skipped++; continue; }
      if (row && row.emailsEnabled === false) { skipped++; continue; }
      // Quiet hours: the lesson stays queued — it is due again on the next run.
      if (isQuietHours(prefsByUser.get(u.id))) { skipped++; continue; }

      const dayNumber = calendarDayNumber(row?.startedAt || u.created_date);
      if (dayNumber > WINDOW_DAYS) { skipped++; continue; }

      const alreadySent = Array.isArray(row?.emailedDays) ? row.emailedDays : [];
      const nextDay = LESSON_DAYS.find((day) => day <= dayNumber && !alreadySent.includes(day));
      if (!nextDay) { noLesson++; continue; }

      queued.push({ user: u, row, day: nextDay, template: LESSON_TEMPLATES[nextDay] });
    }

    if (body?.dryRun === true) {
      return Response.json({
        ok: true,
        dryRun: true,
        users: users.length,
        skipped,
        noLesson,
        queued: queued.length,
      });
    }

    const sendOne = async ({ user: recipient, row, day, template }) => {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: recipient.email,
        template_name: template,
        variables: { first_name: firstName(recipient.full_name) },
      });
      const emailedDays = [...(Array.isArray(row?.emailedDays) ? row.emailedDays : []), day];
      if (row) {
        await base44.asServiceRole.entities.LittleStepsProgress.update(row.id, { emailedDays });
      } else {
        await base44.asServiceRole.entities.LittleStepsProgress.create({ userId: recipient.id, emailedDays });
      }
    };

    const results = await batchMap(queued, sendOne, 10);
    let sent = 0;
    let failed = 0;
    for (const r of results) {
      if (r.ok) {
        sent++;
      } else {
        failed++;
        console.error('little steps send failed', r.error?.message || r.error);
      }
    }

    return Response.json({ ok: true, sent, failed, skipped, noLesson, users: users.length, shardUsers: shardUsers.length, shard, totalShards });
  } catch (error) {
    console.error('send-little-steps error', error?.message || error);
    return Response.json({ error: 'Could not send Little Steps emails.' }, { status: 500 });
  }
}