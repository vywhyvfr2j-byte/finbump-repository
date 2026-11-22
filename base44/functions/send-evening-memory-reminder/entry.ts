import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { batchMap, listAll } from "../../shared/batchProcess.ts";
import { isQuietHours } from "../../shared/quietHours.ts";
import { resolveShard, shardSlice } from "../../shared/shard.ts";

// Evening check-in reminder: nudges each user to capture today's memory moment.
// Scheduled by the "Evening Memory Reminder" workflow at 6pm and 9pm America/
// Chicago:
//   - 6pm → everyone who hasn't answered yet today.
//   - 9pm → a follow-up to whoever STILL hasn't answered, so a moment missed at
//           the first nudge gets a second chance and anyone who has already
//           written theirs is left alone.
// Skipped for anyone who turned the reminder off or opted out of push
// notifications.
//
// Security: requires an authenticated admin, like the other scheduled jobs. The
// workflow's invoke_backend_function activity runs as the platform service role,
// which provides an admin-level auth context.
//
// Testing: an admin may pass { hour, dryRun } to exercise either reminder without
// pinging real devices — `hour` overrides the current Central hour, `dryRun`
// reports who would be notified without sending.
//
// Note: SendPushNotification only reaches a native iOS/Android build with push
// credentials configured. Users without a registered device token fail silently
// (counted as `failed`) — the in-app evening prompt carries the same reminder for
// everyone else.

const FIRST_HOUR = 18;
const FOLLOW_UP_HOUR = 21;
const PROBE_SIZE = 5;

// The reminder is scheduled on Central Time (like every other scheduled job in
// this app), so both the hour it fires on and the "answered today" day key are
// read in that timezone.
function centralNow() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Chicago',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', hour12: false,
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value || '';
  return {
    // Some locales render midnight as 24 — normalize it back to 0.
    hour: Number(get('hour')) % 24,
    dayKey: `${get('year')}-${get('month')}-${get('day')}`,
  };
}

// The 9pm nudge is a second chance, so it asks again in different words.
function copyFor(hour: number) {
  return hour >= FOLLOW_UP_HOUR
    ? {
      title: 'Still time for today\u2019s moment',
      content: 'A minute is enough \u2014 what\u2019s one moment from today you\u2019d want to keep?',
    }
    : {
      title: 'A moment to remember',
      content: 'What\u2019s one moment today you\u2019d want to remember? Tap to answer it in your own words.',
    };
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const hourOverride = Number.isInteger(body?.hour) ? body.hour : null;
    const dryRun = body?.dryRun === true;
    const { shard, totalShards } = resolveShard(body);

    const { hour: centralHour, dayKey } = centralNow();
    const hour = hourOverride ?? centralHour;

    // The workflow runs several sharded invocations in sequence, so a later
    // shard can start after the hour has ticked over. Accept the reminder's own
    // hour plus one hour of drift, otherwise that shard silently skips its users.
    const isFirstNudge = hour >= FIRST_HOUR && hour < FIRST_HOUR + 2;
    const isFollowUp = hour >= FOLLOW_UP_HOUR && hour < FOLLOW_UP_HOUR + 2;

    if (!isFirstNudge && !isFollowUp) {
      return Response.json({
        ok: true, hour, reason: 'outside_reminder_hours',
        sent: 0, failed: 0, skipped: 0, answeredToday: 0, due: 0,
      });
    }

    const [users, prefs] = await Promise.all([
      listAll(base44.asServiceRole.entities.User),
      listAll(base44.asServiceRole.entities.UserPreference),
    ]);

    const prefByUser = new Map();
    for (const p of prefs) {
      prefByUser.set(p.created_by_id, p);
    }

    // Slice to this invocation's users before any per-user work.
    const shardUsers = shardSlice(users, shard, totalShards);

    let skipped = 0;
    let answeredToday = 0;
    const due = [];
    for (const u of shardUsers) {
      const pref = prefByUser.get(u.id);
      if (pref?.pushNotifications === false || pref?.memoryReminderEnabled === false) {
        skipped++;
        continue;
      }
      // Quiet hours: no nudge now — a moment still unanswered is picked up by
      // the next reminder run once the window closes.
      if (isQuietHours(pref)) {
        skipped++;
        continue;
      }
      // Answered today — nothing more to nudge them about.
      if (pref?.lastMemoryDate === dayKey) {
        answeredToday++;
        continue;
      }
      due.push(u);
    }

    // A dry run reports the same eligible set without touching any device.
    if (dryRun) {
      return Response.json({
        ok: true, dryRun: true, hour, followUp: hour >= FOLLOW_UP_HOUR,
        wouldNotify: due.length, skipped, answeredToday,
      });
    }

    if (due.length === 0) {
      return Response.json({ ok: true, hour, sent: 0, failed: 0, skipped, answeredToday, due: 0 });
    }

    const copy = copyFor(hour);
    const sendOne = (u: any) => base44.asServiceRole.integrations.Core.SendPushNotification({
      user_id: u.id,
      title: copy.title,
      content: copy.content,
      action_label: 'Answer',
      action_url: '/memory',
    });

    // Probe a small slice first: if every probe push fails, push credentials or
    // the native build are missing — stop rather than churning through every user
    // on each reminder run.
    const probeSize = Math.min(PROBE_SIZE, due.length);
    const probe = await batchMap(due.slice(0, probeSize), sendOne, PROBE_SIZE);
    const probeFailed = probe.filter((r) => !r.ok).length;
    if (probeFailed === probeSize) {
      for (const r of probe) {
        console.error('evening reminder probe failed', r.error?.message || r.error);
      }
      return Response.json({
        ok: false,
        aborted: true,
        reason: 'push_not_configured',
        message: 'All probe pushes failed — push credentials (APNs/FCM) or a native mobile build may not be configured. The in-app evening prompt remains active for these users.',
        hour,
        sent: 0,
        failed: probeSize,
        skipped,
        answeredToday,
        due: due.length,
      });
    }

    // Push is live — send the remaining users in parallel batches.
    const rest = await batchMap(due.slice(probeSize), sendOne, 200);

    let sent = 0;
    let failed = probeFailed;
    for (const r of probe) if (r.ok) sent++;
    for (const r of rest) {
      if (r.ok) sent++;
      else {
        failed++;
        console.error('evening reminder push failed', r.error?.message || r.error);
      }
    }

    return Response.json({ ok: true, hour, sent, failed, skipped, answeredToday, due: due.length, shard, totalShards });
  } catch (error) {
    console.error('send-evening-memory-reminder error', error?.message || error);
    return Response.json({ error: 'Could not send the evening reminder.' }, { status: 500 });
  }
}