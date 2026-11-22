import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { chicagoDayRange, aggregateRawEvents } from "../../shared/analyticsRollup.ts";

// Aggregates one Chicago-local day of AnalyticsEvent records into a single
// DailyAnalyticsRollup row (distinct active users, total events, per-feature and
// per-event-name counts). Scheduled nightly at 1am CT by the "Daily Analytics
// Rollup" workflow so the analytics functions read ~30 tiny rollup rows instead
// of scanning millions of raw events — keeping them under 3s at 15k customers.
//
// Modes:
//   default            — roll up yesterday (Chicago).
//   { dateKey }        — roll up a specific YYYY-MM-DD Chicago day.
//   { backfillDays: N } — roll up the last N days sequentially (one-time admin op).
//
// Security: admin-only via base44.auth.me(). The workflow's invoke_backend_function
// runs as the platform service role (admin-level auth context).
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));

    const upsert = async (dateKey: string, startUtc: number, endUtc: number) => {
      const agg = await aggregateRawEvents(
        base44.asServiceRole.entities.AnalyticsEvent,
        startUtc,
        endUtc,
        dateKey,
      );
      const payload = {
        dateKey,
        activeUserIds: [...agg.activeUserIds],
        activeUserCount: agg.activeUserIds.size,
        totalEvents: agg.totalEvents,
        featureCounts: agg.featureCounts,
        eventCounts: agg.eventCounts,
        rolledUpAt: new Date().toISOString(),
      };
      const existing = await base44.asServiceRole.entities.DailyAnalyticsRollup.filter(
        { dateKey }, undefined, 1, 0,
      );
      if (existing.length > 0) {
        await base44.asServiceRole.entities.DailyAnalyticsRollup.update(existing[0].id, payload);
      } else {
        await base44.asServiceRole.entities.DailyAnalyticsRollup.create(payload);
      }
      return { dateKey, activeUserCount: agg.activeUserIds.size, totalEvents: agg.totalEvents };
    };

    if (Number.isInteger(body?.backfillDays) && body.backfillDays > 0) {
      const results = [];
      for (let i = body.backfillDays; i >= 1; i--) {
        const ref = chicagoDayRange(new Date(Date.now() - i * 86400000));
        results.push(await upsert(ref.dateKey, ref.startUtc, ref.endUtc));
      }
      return Response.json({ ok: true, backfilled: results.length, results });
    }

    let ref;
    if (body?.dateKey) {
      const [y, m, d] = String(body.dateKey).split('-').map(Number);
      ref = chicagoDayRange(new Date(y, m - 1, d));
    } else {
      ref = chicagoDayRange(new Date(Date.now() - 86400000));
    }
    const result = await upsert(ref.dateKey, ref.startUtc, ref.endUtc);
    return Response.json({ ok: true, ...result });
  } catch (error) {
    console.error('rollup-daily-analytics error', error?.message || error);
    return Response.json({ error: 'Could not roll up analytics.' }, { status: 500 });
  }
}