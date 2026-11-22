// Twice-weekly gentle habit nudge: one push telling a user which acts of
// support are waiting for them. Scheduled by the "Habit Nudge" workflow
// (Tuesday + Friday, 9am America/Chicago).
//
// Runs as the service role across every user and sends at most ONE push per
// user per run, only when at least one act is due today or overdue. Respects,
// in order: the nudge's own `habitNudge` toggle in Settings, the global
// `pushNotifications` opt-out, the user's quiet-hours window, and per-act
// `notify` flags. Acts scheduled for later are never nudged — the point is a
// gentle prompt about what is actually owed now.
//
// Security: admin-only, like the other scheduled senders — the workflow's
// invoke_backend_function activity runs with an admin-level auth context.
//
// Note: SendPushNotification only reaches a native iOS/Android build with push
// credentials configured. Users without a registered device count as `failed`;
// that is a configuration state, not a broken run.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { isQuietHours } from "../../shared/quietHours.ts";
import { listAll, filterAll, batchMap } from "../../shared/batchProcess.ts";
import { resolveShard, shardSlice } from "../../shared/shard.ts";

function daysUntil(dateStr: any) {
  if (!dateStr) return null;
  const d = new Date(dateStr).getTime();
  if (Number.isNaN(d)) return null;
  return Math.ceil((d - Date.now()) / 86400000);
}

function daysSince(dateStr: any) {
  if (!dateStr) return null;
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return null;
  return Math.floor((Date.now() - then) / 86400000);
}

// Server-side mirror of actStatus in src/lib/keepsakeUtils.js, so the nudge and
// the app agree on what "waiting" means: 'overdue' | 'soon' | 'fresh' | 'idle'.
function actStatus(act: any) {
  if (act.nextDue && act.repeat === false) {
    const d = daysUntil(act.nextDue);
    if (d < 0) return 'overdue';
    if (d <= 2) return 'soon';
    return 'fresh';
  }
  if (act.nextDue && !act.lastCompleted) {
    const d = daysUntil(act.nextDue);
    if (d < 0) return 'overdue';
    if (d <= 2) return 'soon';
    return 'fresh';
  }
  const d = daysSince(act.lastCompleted);
  if (d === null) return 'idle';
  if (d >= act.intervalDays) return 'overdue';
  if (d >= Math.max(1, (act.intervalDays || 0) - 2)) return 'soon';
  return 'fresh';
}

// Waiting = overdue or due within two days, plus an act that has never been done
// and carries no date — a habit the user is tracking and would still want a
// gentle prompt about. Acts done recently, or scheduled for later, are left be.
function isWaiting(act: any) {
  const status = actStatus(act);
  return status === 'overdue' || status === 'soon' || status === 'idle';
}

// Warm, short copy — one line the phone can show in full.
function nudgeCopy(acts: any[]) {
  const first = String(acts[0]?.name || 'An act of support').trim();
  if (acts.length === 1) {
    return {
      title: 'A gentle nudge',
      content: `“${first}” is waiting when you have a moment. A few minutes is enough.`,
    };
  }
  return {
    title: 'A gentle nudge',
    content: `${acts.length} acts of support are waiting, starting with “${first}”. A few minutes is enough.`,
  };
}

export default async function (req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth
      .me()
      .catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!caller) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (caller.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const { shard, totalShards } = resolveShard(body);

    const [users, prefs, acts] = await Promise.all([
      listAll<any>(svc.entities.User),
      listAll<any>(svc.entities.UserPreference),
      filterAll<any>(svc.entities.Act, {}),
    ]);

    const prefByUser = new Map();
    for (const p of prefs) prefByUser.set(p.created_by_id, p);

    const waitingByUser = new Map();
    for (const act of acts) {
      if (act.notify === false) continue;
      if (!isWaiting(act)) continue;
      const list = waitingByUser.get(act.created_by_id);
      if (list) list.push(act);
      else waitingByUser.set(act.created_by_id, [act]);
    }

    let skipped = 0;
    let noData = 0;

    const recipients = shardSlice(users, shard, totalShards).filter((u: any) => {
      const pref = prefByUser.get(u.id) || {};
      // The nudge's own toggle comes first: turning it off silences only this.
      if (pref.habitNudge === false) {
        skipped++;
        return false;
      }
      if (pref.pushNotifications === false) {
        skipped++;
        return false;
      }
      if (isQuietHours(pref)) {
        skipped++;
        return false;
      }
      if ((waitingByUser.get(u.id) || []).length === 0) {
        noData++;
        return false;
      }
      return true;
    });

    // Dry run: report who would be nudged and send nothing. Admin-only, and the
    // safe way to check the job before the schedule fires.
    if (body?.dryRun === true) {
      return Response.json({
        ok: true,
        dryRun: true,
        wouldNudge: recipients.length,
        skipped,
        noData,
        usersSeen: users.length,
      });
    }

    const results = await batchMap(
      recipients,
      async (u: any) => {
        const waiting = (waitingByUser.get(u.id) || []).slice(0, 20);
        const { title, content } = nudgeCopy(waiting);
        await svc.integrations.Core.SendPushNotification({
          user_id: u.id,
          title,
          content,
          action_label: 'Open',
          action_url: '/acts',
        });
        return u.id;
      },
      50,
    );

    let sent = 0;
    let failed = 0;
    for (const r of results) {
      if (r.ok) sent++;
      else {
        failed++;
        console.error('habit nudge push failed', (r.error as any)?.message || r.error);
      }
    }

    return Response.json({
      ok: true,
      sent,
      failed,
      skipped,
      noData,
      usersSeen: users.length,
      shard,
      totalShards,
    });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}