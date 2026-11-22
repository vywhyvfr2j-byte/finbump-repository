import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { loadDayAggregates, chicagoDayRange, dateKeyNDaysAgo } from "../../shared/analyticsRollup.ts";
import { PRODUCTS } from "../../shared/familyPackages.ts";

// Returns 14-day daily-active + 30-day feature/event totals and active-user
// counts for the admin Analytics dashboard. Reads pre-aggregated DailyAnalyticsRollup
// rows (one per Chicago day) instead of scanning raw AnalyticsEvent records, so it
// stays under 3s at 15k customers. Today (not yet rolled up) falls back to raw
// events for that single day.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'forbidden', message: 'Admin access required' }, { status: 403 });
    }

    const today = chicagoDayRange(new Date()).dateKey;
    const start30 = dateKeyNDaysAgo(today, 29); // today + 29 prior = 30 calendar days
    const aggs = await loadDayAggregates(
      base44.asServiceRole.entities.DailyAnalyticsRollup,
      base44.asServiceRole.entities.AnalyticsEvent,
      start30,
      today,
    );

    const unionActive = (startKey: string, endKey: string) => {
      const set = new Set<string>();
      for (const [k, a] of aggs) {
        if (k >= startKey && k <= endKey) for (const id of a.activeUserIds) set.add(id);
      }
      return set.size;
    };
    const sumEvents = (startKey: string, endKey: string) => {
      let n = 0;
      for (const [k, a] of aggs) if (k >= startKey && k <= endKey) n += a.totalEvents;
      return n;
    };
    const mergeCounts = (startKey: string, endKey: string, field: 'featureCounts' | 'eventCounts') => {
      const m: Record<string, number> = {};
      for (const [k, a] of aggs) {
        if (k < startKey || k > endKey) continue;
        for (const [key, count] of Object.entries(a[field])) m[key] = (m[key] || 0) + count;
      }
      return m;
    };

    const start7 = dateKeyNDaysAgo(today, 6);
    const activeUsers7d = unionActive(start7, today);
    const activeUsers30d = unionActive(start30, today);
    const activeUsersToday = unionActive(today, today);
    const totalEvents = sumEvents(start30, today);

    const featureCounts = mergeCounts(start30, today, 'featureCounts');
    const eventCounts = mergeCounts(start30, today, 'eventCounts');
    const topFeatures = Object.entries(featureCounts)
      .map(([feature, count]) => ({ feature, count }))
      .sort((a, b) => b.count - a.count);
    const topEvents = Object.entries(eventCounts)
      .map(([eventName, count]) => ({ eventName, count }))
      .sort((a, b) => b.count - a.count);

    const dailyActive = [];
    for (let i = 13; i >= 0; i--) {
      const dk = dateKeyNDaysAgo(today, i);
      const a = aggs.get(dk);
      dailyActive.push({ date: dk, count: a ? a.activeUserIds.size : 0 });
    }

    // Renewal health: a yearly subscriber with auto-renew off is a dated, known
    // non-renewal, so it leads the revenue signal instead of hiding in a payment log.
    const paidPurchases = await base44.asServiceRole.entities.Base44Purchase.filter({ status: 'paid' });
    const liveSubscriptions = (paidPurchases || []).filter(
      (p: any) => p.subscriptionId && p.subscriptionStatus !== 'CANCELED' && p.subscriptionStatus !== 'ENDED',
    );
    const isYearly = (productId: string) => {
      const product = PRODUCTS[productId];
      return !!product && product.frequency === 'YEAR' && !product.lifetime;
    };
    const yearly = liveSubscriptions.filter((p: any) => isYearly(p.productId));
    const lastChecked = liveSubscriptions
      .map((p: any) => p.subscriptionCheckedAt)
      .filter(Boolean)
      .sort()
      .pop() || null;
    const subscriptions = {
      tracked: liveSubscriptions.length,
      yearlyActive: yearly.length,
      yearlyAutoRenewOff: yearly.filter((p: any) => p.autoRenew === false).length,
      yearlyAutoRenewUnknown: yearly.filter((p: any) => p.autoRenew !== true && p.autoRenew !== false).length,
      checkedAt: lastChecked,
    };

    return Response.json({
      totals: { activeUsers7d, activeUsers30d, activeUsersToday, totalEvents, retentionDays: 30 },
      topFeatures,
      topEvents,
      dailyActive,
      subscriptions,
    });
  } catch (err) {
    console.error('get-analytics-summary error:', err);
    return Response.json({ error: 'server_error', message: 'Could not build the analytics summary.' }, { status: 500 });
  }
});