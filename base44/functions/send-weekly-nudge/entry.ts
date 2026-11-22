import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { isQuietHours } from "../../shared/quietHours.ts";
import { listAll, filterAll, batchMap } from "../../shared/batchProcess.ts";
import { resolveShard, shardSlice } from "../../shared/shard.ts";

const MICRO_ACTS = [
  'Send a "thinking of you" text to someone you love — right now, three minutes.',
  'Write down one thing you appreciate about your partner and send it to them.',
  'Text a friend a specific compliment you have been holding back.',
  'Send a family member a photo from a happy memory with no explanation.',
  'Reach out to someone you have not checked on in a while — just "how are you?"',
  'Leave a kind note where your loved one will find it today.',
];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me();
    if (!caller) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (caller.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const svc = base44.asServiceRole;

    const body = await req.json().catch(() => ({}));
    const { shard, totalShards } = resolveShard(body);

    const now = new Date();
    const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const weekIdx = Math.floor(now.getTime() / (7 * 24 * 60 * 60 * 1000));
    const microAct = MICRO_ACTS[weekIdx % MICRO_ACTS.length];

    // One paginated load for everyone, plus ONE query for the whole week's
    // events across all users. The old code ran an Event query per user inside a
    // 6-at-a-time loop — thousands of sequential round-trips that timed out long
    // before a large user base was reached.
    const [users, prefs, weekEvents] = await Promise.all([
      listAll(svc.entities.User),
      listAll(svc.entities.UserPreference),
      filterAll(svc.entities.Event, { date: { $gte: now.toISOString(), $lt: weekAhead.toISOString() } }, 'date'),
    ]);

    const prefByUser = new Map();
    for (const p of prefs) prefByUser.set(p.created_by_id, p);

    const eventsByUser = new Map();
    for (const e of weekEvents) {
      const arr = eventsByUser.get(e.created_by_id);
      if (arr) arr.push(e);
      else eventsByUser.set(e.created_by_id, [e]);
    }

    // Shard the user list so each scheduled invocation stays inside the timeout.
    const recipients = shardSlice(users, shard, totalShards);

    let emailed = 0, pushed = 0, skipped = 0;

    const sendOne = async (u: any) => {
        const pref = prefByUser.get(u.id) || {};
        if (pref.pushNotifications === false) { skipped++; return; } // respect opt-out
        if (isQuietHours(pref)) { skipped++; return; } // quiet hours: hold this one
        const items = (eventsByUser.get(u.id) || []).slice(0, 50);
        const lines = items.map((e) => {
          const d = new Date(e.date);
          const dd = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          return `${dd}: ${e.name}`;
        });
        const upcoming = lines.length ? lines.join('\n') : 'No special dates this week — a quiet week is a gift too.';
        const body = `Here is your week ahead in FinBump:\n\n${upcoming}\n\nOne low-effort act for the week:\n${microAct}\n\nHave a gentle, kind week.`;
        if (u.email) {
          try {
            await svc.integrations.Core.SendEmail({ to: u.email, subject: 'Your Sunday nudge from FinBump', body });
            emailed++;
          } catch (e) {}
        }
        try {
          await svc.integrations.Core.SendPushNotification({ user_id: u.id, title: 'Your Sunday nudge', content: microAct });
          pushed++;
        } catch (e) {}
    };

    // Bounded concurrency instead of 6-at-a-time sequential waves.
    const results = await batchMap(recipients, sendOne, 10);
    results.forEach((r) => {
      if (!r.ok) console.error('sunday nudge failed', r.error?.message || r.error);
    });

    return Response.json({
      ok: true, users: users.length, recipients: recipients.length,
      emailed, pushed, skipped, shard, totalShards,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}