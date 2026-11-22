import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { batchMap, listAll } from "../../shared/batchProcess.ts";
import { isResendConfigured, sendEmailViaResend } from "../../shared/resendEmail.ts";
import { isQuietHours } from "../../shared/quietHours.ts";

// Returns today's weekday (0=Sun..6=Sat), day-of-month, and YYYY-MM-DD date
// string in America/Chicago, so cadence rules (weekly=Mon, monthly=1st) and
// the per-day idempotency check line up with the 8am CT cron.
function chicagoNow() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    weekday: 'short',
    day: '2-digit',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date());
  const weekdayStr = parts.find((p) => p.type === 'weekday').value;
  const day = parts.find((p) => p.type === 'day').value;
  const year = parts.find((p) => p.type === 'year').value;
  const month = parts.find((p) => p.type === 'month').value;
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(weekdayStr);
  return { weekday, day: Number(day), date: `${year}-${month}-${day}` };
}

function sentAlreadyToday(lastSentAt, today) {
  if (!lastSentAt) return false;
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(new Date(lastSentAt));
    const y = parts.find((p) => p.type === 'year').value;
    const m = parts.find((p) => p.type === 'month').value;
    const d = parts.find((p) => p.type === 'day').value;
    return `${y}-${m}-${d}` === today;
  } catch {
    return false;
  }
}

function shouldSend(cadence, weekday, day) {
  if (cadence === 'daily') return true;
  if (cadence === 'weekly') return weekday === 1; // Monday
  if (cadence === 'monthly') return day === 1;
  return false;
}

// Scheduled by the "Daily Digest" workflow (8am CT daily). Runs as service role
// across every user's DigestSnapshot and emails those whose cadence matches
// today. Each user's snapshot is pre-built client-side, so this just sends.
//
// Security: requires an authenticated admin via base44.auth.me(). This blocks
// anonymous attackers who knew the URL from triggering mass email sends. The
// Daily Digest workflow's invoke_backend_function activity runs as the platform
// service role which provides an admin-level auth context.
//
// Per-day idempotency: a snapshot is emailed at most once per Chicago day — a
// lastSentAt timestamp is set after each send and any repeat invocation skips
// already-sent users.
//
// Batching: eligible snapshots are sent in parallel batches of 50 so 10,000
// users finish in seconds rather than hours. Pagination handles >5000 records.
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

    // Optional sharding: when invoked with { shard, totalShards } the function
    // processes only the subset of eligible snapshots whose index mod totalShards
    // === shard. This lets the workflow run N sharded invocations to keep each
    // run well under the 5-minute timeout as the user base grows. Omit the params
    // (the default) to process all eligible snapshots in one run.
    const body = await req.json().catch(() => ({}));
    const shard = Number.isInteger(body?.shard) ? body.shard : 0;
    const totalShards = Number.isInteger(body?.totalShards) && body.totalShards > 0 ? body.totalShards : 1;

    const [snapshots, users, prefs] = await Promise.all([
      listAll(base44.asServiceRole.entities.DigestSnapshot),
      listAll(base44.asServiceRole.entities.User),
      listAll(base44.asServiceRole.entities.UserPreference),
    ]);
    // Quiet hours are stored on the owner's preference record, so index them by
    // user id and check each snapshot against its own owner below.
    const prefByUser = new Map();
    for (const p of prefs) prefByUser.set(p.created_by_id, p);
    // Build a map of user id -> email so we can verify each snapshot's email
    // matches its creator's actual account email (prevents a user from setting
    // someone else's email in their own snapshot to redirect digest emails).
    const userEmails = new Map(users.map((u) => [u.id, u.email]));
    const { weekday, day, date } = chicagoNow();

    // Filter eligible snapshots first, then batch-send in parallel.
    const eligible = snapshots.filter((s) => {
      if (!s.email || !s.subject || !s.body) return false;
      if (s.email !== userEmails.get(s.created_by_id)) return false;
      if (!shouldSend(s.cadence, weekday, day)) return false;
      if (sentAlreadyToday(s.lastSentAt, date)) return false;
      // Quiet hours: hold the digest — it is sent on the next run instead.
      if (isQuietHours(prefByUser.get(s.created_by_id))) return false;
      return true;
    });

    // Use Resend for bulk sending when configured (avoids SendEmail credit
    // depletion and rate limits at scale). Falls back to SendEmail otherwise.
    const useResend = isResendConfigured();

    // Apply shard slice (no-op when totalShards === 1).
    const sharded = totalShards > 1 ? eligible.filter((_, i) => i % totalShards === shard) : eligible;

    const results = await batchMap(sharded, async (s) => {
      if (useResend) {
        const ok = await sendEmailViaResend(s.email, s.subject, s.body);
        if (!ok) throw new Error(`Resend send failed for ${s.email}`);
      } else {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: s.email,
          subject: s.subject,
          body: s.body,
        });
      }
      await base44.asServiceRole.entities.DigestSnapshot.update(s.id, { lastSentAt: new Date().toISOString() });
    }, 50);

    let sent = 0;
    let failed = 0;
    for (const r of results) {
      if (r.ok) sent++;
      else {
        failed++;
        console.error('digest send failed', r.error?.message || r.error);
      }
    }
    const skipped = snapshots.length - eligible.length;
    const shardedOut = eligible.length - sharded.length;

    return Response.json({ ok: true, sent, skipped, failed, weekday, day, shard, totalShards, shardedOut });
  } catch (error) {
    console.error('send-scheduled-digest error', error?.message || error);
    return Response.json({ error: 'Could not send the digest.' }, { status: 500 });
  }
}