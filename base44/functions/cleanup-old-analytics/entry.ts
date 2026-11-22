import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Deletes old records to prevent unbounded table growth. Called daily by the
// "Analytics Cleanup" scheduled workflow. Runs as service role so it can
// delete records across all users. Two phases:
//   1. AnalyticsEvent older than 90 days (admin-only telemetry, no user impact).
//   2. ActCompletion   older than 365 days (user history; a year is preserved so
//      the History page, Progress charts, and Data Export keep a full year).
// Each phase has its own batch/time guards so one phase never starves the other.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'forbidden', message: 'Admin access required' }, { status: 403 });
    }

    const MAX_RUNTIME_MS = 240_000; // 4 min safety margin under the 5-min limit
    const startedAt = Date.now();

    // Batched delete with per-phase guards. At 500 deletes/batch this caps a
    // phase at 20,000 records; if more remain, the next scheduled run picks up
    // the rest. Run the workflow hourly when the backlog is large.
    async function purgeOld(collection, retentionDays, budgetMs) {
      const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();
      const MAX_BATCHES = 40;
      const phaseStart = Date.now();
      let totalDeleted = 0;
      let batchesRun = 0;
      let hasMore = true;

      while (hasMore && batchesRun < MAX_BATCHES && (Date.now() - phaseStart) < budgetMs && (Date.now() - startedAt) < MAX_RUNTIME_MS) {
        const result = await collection.deleteMany({ created_date: { $lt: cutoff } });
        const deleted = typeof result === 'number' ? result : (result?.deleted || result?.count || 0);
        totalDeleted += deleted;
        batchesRun += 1;
        hasMore = deleted >= 500;
      }

      return {
        cutoff,
        deleted: totalDeleted,
        batchesRun,
        retentionDays,
        hasMore,
        stoppedBy: hasMore
          ? (batchesRun >= MAX_BATCHES ? 'max_batches' : 'time_limit')
          : 'complete',
      };
    }

    // Split the time budget evenly between the two phases.
    const perPhaseBudget = MAX_RUNTIME_MS / 2;
    const analytics = await purgeOld(base44.asServiceRole.entities.AnalyticsEvent, 90, perPhaseBudget);
    const completions = await purgeOld(base44.asServiceRole.entities.ActCompletion, 365, perPhaseBudget);

    return Response.json({
      status: 'success',
      analytics,
      completions,
      totalDeleted: analytics.deleted + completions.deleted,
      hasMore: analytics.hasMore || completions.hasMore,
    });
  } catch (err) {
    console.error('[cleanup-old-analytics] Error:', err);
    return Response.json({ error: 'server_error', message: 'Cleanup failed.' }, { status: 500 });
  }
});