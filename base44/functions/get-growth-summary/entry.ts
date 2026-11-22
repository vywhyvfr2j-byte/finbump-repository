import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { loadDayAggregates, chicagoDayRange, dateKeyNDaysAgo } from "../../shared/analyticsRollup.ts";

// Admin-only growth summary: new accounts, daily activity and retention, plus
// subscription state and unfinished checkouts. Reads DailyAnalyticsRollup rows
// (one per Chicago day) instead of raw events, and Base44Purchase records for
// subscription/payment state.
//
// Installs and ad spend are deliberately NOT reported here: the app holds no such
// data (store installs live with Apple/Google, ad campaigns live in Marketing).
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'forbidden', message: 'Admin access required' }, { status: 403 });
    }

    const today = chicagoDayRange(new Date()).dateKey;
    const start30 = dateKeyNDaysAgo(today, 29);
    const start14 = dateKeyNDaysAgo(today, 13);
    const start7 = dateKeyNDaysAgo(today, 6);

    // ---- Purchases: subscription state + unfinished checkouts ----
    const purchases = await base44.asServiceRole.entities.Base44Purchase.list('-created_date', 500);
    const statusCounts: Record<string, number> = { pending: 0, paid: 0, canceled: 0 };
    const subscriptionStatuses: Record<string, number> = {};
    const pendingList: any[] = [];
    let autoRenewOff = 0;
    let paidWithRenewal = 0;
    const now = Date.now();

    for (const p of purchases || []) {
      const status = p.status || 'pending';
      statusCounts[status] = (statusCounts[status] || 0) + 1;

      if (status === 'paid') {
        const sub = p.subscriptionStatus || 'UNKNOWN';
        subscriptionStatuses[sub] = (subscriptionStatuses[sub] || 0) + 1;
        if (typeof p.autoRenew === 'boolean') {
          paidWithRenewal++;
          if (p.autoRenew === false) autoRenewOff++;
        }
      }

      if (status === 'pending' && pendingList.length < 10) {
        const ageHours = p.created_date ? (now - new Date(p.created_date).getTime()) / 3600000 : 0;
        pendingList.push({
          id: p.id,
          productName: p.productName || 'Unknown product',
          amount: p.amount || '',
          currency: p.currency || 'USD',
          createdAt: p.created_date || '',
          email: p.buyerEmail || '',
          stale: ageHours >= 24,
        });
      }
    }

    const stalePending = (purchases || []).filter((p: any) => {
      if ((p.status || '') !== 'pending' || !p.created_date) return false;
      return now - new Date(p.created_date).getTime() >= 24 * 3600000;
    }).length;

    // ---- Daily activity + retention from the rollups ----
    // Rollups are written once a night, so today has no row yet. loadDayAggregates
    // fills any missing Chicago day (today, normally) from that day's raw events,
    // so a day that has already started is never reported as a zero and the
    // "active today" figure reflects the day in progress instead of stopping at
    // yesterday's midnight.
    const aggs = await loadDayAggregates(
      base44.asServiceRole.entities.DailyAnalyticsRollup,
      base44.asServiceRole.entities.AnalyticsEvent,
      start30,
      today,
    );

    const seen = new Set<string>();
    const daily: any[] = [];
    let active14 = 0;
    let returning14 = 0;
    let active7 = 0;
    let returning7 = 0;
    let events30 = 0;

    for (const key of [...aggs.keys()].sort()) {
      const agg = aggs.get(key)!;
      const ids = [...agg.activeUserIds];
      let returning = 0;
      for (const id of ids) if (seen.has(id)) returning++;

      if (key >= start14) {
        active14 += ids.length;
        returning14 += returning;
      }
      if (key >= start7) {
        active7 += ids.length;
        returning7 += returning;
      }
      events30 += agg.totalEvents || 0;

      daily.push({ dateKey: key, active: ids.length, returning, events: agg.totalEvents || 0 });
      for (const id of ids) seen.add(id);
    }

    // ---- New accounts per day ----
    // User records only support list (no filtered queries), so the window is cut here.
    const userRows = await base44.asServiceRole.entities.User.list('-created_date', 3000);
    const windowStart = new Date(Date.now() - 31 * 86400000).getTime();
    const signupCounts: Record<string, number> = {};
    let signups7 = 0;
    let signups30 = 0;
    for (const u of userRows || []) {
      if (!u.created_date) continue;
      if (new Date(u.created_date).getTime() < windowStart) continue;
      const key = chicagoDayRange(new Date(u.created_date)).dateKey;
      if (key < start30) continue;
      signupCounts[key] = (signupCounts[key] || 0) + 1;
      signups30++;
      if (key >= start7) signups7++;
    }
    const signupDaily = Object.entries(signupCounts)
      .map(([dateKey, count]) => ({ dateKey, count }))
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey));

    const rate = (returning: number, active: number) => (active > 0 ? Math.round((returning / active) * 100) : 0);

    return Response.json({
      range: { start: start30, end: today },
      subscriptions: {
        statusCounts,
        subscriptionStatuses,
        autoRenewOff,
        paidWithRenewal,
      },
      failures: {
        pendingCount: statusCounts.pending || 0,
        stalePending,
        canceledCount: statusCounts.canceled || 0,
        pendingList,
      },
      activity: {
        daily: daily.slice(-14),
        activeToday: daily.length ? daily[daily.length - 1].active : 0,
        active7,
        active30: seen.size,
        retention7: rate(returning7, active7),
        retention14: rate(returning14, active14),
        events30,
      },
      signups: {
        signups7,
        signups30,
        daily: signupDaily,
      },
    });
  } catch (error: any) {
    console.error('get-growth-summary error', error?.message || error, error?.response?.status, JSON.stringify(error?.response?.data || {}), error?.stack || '');
    return Response.json({ error: 'server_error', message: 'Could not load the growth summary.' }, { status: 500 });
  }
});