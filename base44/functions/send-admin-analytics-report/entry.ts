import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { listAll, filterAll } from "../../shared/batchProcess.ts";
import { loadDayAggregates, chicagoDayRange, dateKeyNDaysAgo } from "../../shared/analyticsRollup.ts";
import { findAdminWithEmail } from "../../shared/adminRecipient.ts";
import { isResendConfigured, sendHtmlEmailViaResend } from "../../shared/resendEmail.ts";
import { buildAnalyticsHtml, buildAnalyticsText } from "./htmlBuilder.ts";

// Scheduled by the "Daily Analytics Report" workflow (8am CT daily). Emails
// the admin a comprehensive analytics report with HTML/CSS charts covering
// yesterday's metrics, the previous 7-day week, and all-time totals.
//
// Security: requires an admin via base44.auth.me(). The workflow's
// invoke_backend_function activity runs as the platform service role which
// provides an admin-level auth context. Direct calls from non-admins return 403.

// Returns Chicago-local date boundaries for the report:
// - yesterday: the full calendar day before today (00:00–24:00 CT)
// - prevDay: the calendar day before yesterday
// - thisWeek: last 7 calendar days (yesterday and the 6 before it)
// - lastWeek: the 7 calendar days before thisWeek
function chicagoBoundaries() {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const parts = fmt.formatToParts(now);
  const y = Number(parts.find((p) => p.type === 'year').value);
  const m = Number(parts.find((p) => p.type === 'month').value) - 1;
  const d = Number(parts.find((p) => p.type === 'day').value);

  // Start of today in Chicago, expressed as a UTC instant.
  // We build a Date in CT midnight then convert to UTC by adding the offset.
  const ctMidnight = new Date(y, m, d, 0, 0, 0, 0);
  // Compute CT UTC offset for this date (CT is UTC-6 in CST, UTC-5 in CDT).
  // Use Intl to get the offset dynamically.
  const offsetMs = getChicagoOffsetMs(ctMidnight);
  const startOfTodayUtc = ctMidnight.getTime() - offsetMs;

  const DAY = 24 * 60 * 60 * 1000;
  return {
    startOfTodayUtc,
    yesterdayStart: startOfTodayUtc - DAY,
    yesterdayEnd: startOfTodayUtc,
    prevDayStart: startOfTodayUtc - 2 * DAY,
    prevDayEnd: startOfTodayUtc - DAY,
    thisWeekStart: startOfTodayUtc - 7 * DAY,
    thisWeekEnd: startOfTodayUtc,
    lastWeekStart: startOfTodayUtc - 14 * DAY,
    lastWeekEnd: startOfTodayUtc - 7 * DAY,
    reportDate: new Date(y, m, d - 1).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    }),
  };
}

function getChicagoOffsetMs(date) {
  // Returns the UTC offset in ms for America/Chicago at the given date.
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    timeZoneName: 'short',
  });
  const parts = dtf.formatToParts(date);
  const tz = parts.find((p) => p.type === 'timeZoneName')?.value || '';
  // CST = UTC-6, CDT = UTC-5
  return tz.includes('CST') ? -6 * 60 * 60 * 1000 : -5 * 60 * 60 * 1000;
}

function inRange(ts, start, end) {
  return ts >= start && ts < end;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    // Resolve recipient: first admin user's email, fallback to SUPPORT_EMAIL.
    const adminUser = await findAdminWithEmail(base44);
    const adminEmail = adminUser?.email || process.env.SUPPORT_EMAIL;
    if (!adminEmail) {
      console.error('send-admin-analytics-report: no admin email or SUPPORT_EMAIL');
      return Response.json({ error: 'No admin recipient configured' }, { status: 500 });
    }

    const b = chicagoBoundaries();

    // Read pre-aggregated DailyAnalyticsRollup rows (one per Chicago day) for the
    // last 14 days instead of scanning raw AnalyticsEvent records. All windows
    // (yesterday, prevDay, thisWeek, lastWeek) are completed days with rollups,
    // so this stays under 3s at 15k customers. Falls back to raw events for any
    // day missing a rollup (e.g. yesterday before the 1am CT nightly rollup runs).
    const DAY = 24 * 60 * 60 * 1000;
    const yesterdayKey = chicagoDayRange(new Date(b.yesterdayStart + 6 * 60 * 60 * 1000)).dateKey;
    const prevDayKey = chicagoDayRange(new Date(b.prevDayStart + 6 * 60 * 60 * 1000)).dateKey;
    const weekStartKey = chicagoDayRange(new Date(b.thisWeekStart + 6 * 60 * 60 * 1000)).dateKey;
    const lastWeekStartKey = chicagoDayRange(new Date(b.lastWeekStart + 6 * 60 * 60 * 1000)).dateKey;
    const lastWeekEndKey = dateKeyNDaysAgo(yesterdayKey, 7);

    const aggs = await loadDayAggregates(
      base44.asServiceRole.entities.DailyAnalyticsRollup,
      base44.asServiceRole.entities.AnalyticsEvent,
      lastWeekStartKey,
      yesterdayKey,
    );

    const unionActive = (startKey, endKey) => {
      const set = new Set();
      for (const [k, a] of aggs) {
        if (k >= startKey && k <= endKey) for (const id of a.activeUserIds) set.add(id);
      }
      return set;
    };
    const sumEvents = (startKey, endKey) => {
      let n = 0;
      for (const [k, a] of aggs) if (k >= startKey && k <= endKey) n += a.totalEvents;
      return n;
    };
    const mergeCounts = (startKey, endKey, field) => {
      const m = {};
      for (const [k, a] of aggs) {
        if (k < startKey || k > endKey) continue;
        for (const [key, count] of Object.entries(a[field])) m[key] = (m[key] || 0) + count;
      }
      return m;
    };

    const yesterdayActive = aggs.get(yesterdayKey)?.activeUserIds || new Set();
    const prevDayActive = aggs.get(prevDayKey)?.activeUserIds || new Set();
    const weekActive = unionActive(weekStartKey, yesterdayKey);
    const prevWeekActive = unionActive(lastWeekStartKey, lastWeekEndKey);
    const yesterdayEvents = aggs.get(yesterdayKey)?.totalEvents || 0;
    const prevDayEvents = aggs.get(prevDayKey)?.totalEvents || 0;
    const weekEvents = sumEvents(weekStartKey, yesterdayKey);
    const prevWeekEvents = sumEvents(lastWeekStartKey, lastWeekEndKey);
    const weekFeatureCounts = mergeCounts(weekStartKey, yesterdayKey, 'featureCounts');
    const weekEventCounts = mergeCounts(weekStartKey, yesterdayKey, 'eventCounts');

    // Build 7-day daily active trend (oldest first), from rollup per-day sets.
    const dailyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const dk = dateKeyNDaysAgo(yesterdayKey, i);
      const a = aggs.get(dk);
      dailyTrend.push({ date: dk, count: a ? a.activeUserIds.size : 0 });
    }

    const topFeatures = Object.entries(weekFeatureCounts)
      .map(([feature, count]) => ({ feature, count }))
      .sort((a, b2) => b2.count - a.count)
      .slice(0, 10);

    const topEvents = Object.entries(weekEventCounts)
      .map(([eventName, count]) => ({ eventName, count }))
      .sort((a, b2) => b2.count - a.count)
      .slice(0, 15);

    // Read the pre-aggregated EntityCountRollup (latest row) for all-time totals
    // instead of 13 full-table listAll calls. Falls back to 0 if no rollup exists
    // yet (first run before the 2am nightly job lands).
    const countRollups = await base44.asServiceRole.entities.EntityCountRollup.list('-dateKey', 1, 0);
    const cr = countRollups[0];

    // Date-filtered reads for windowed counts and 7-day trends: only load
    // records from the last 14 days (reviews/purchases/support) or 7 days
    // (act completions/milestones) instead of every record in the database.
    const lastWeekStartIso = new Date(b.lastWeekStart).toISOString();
    const thisWeekStartIso = new Date(b.thisWeekStart).toISOString();
    const [reviews, purchases, supportMsgs, actCompletions, milestones] = await Promise.all([
      filterAll(base44.asServiceRole.entities.AppReview, { created_date: { $gte: lastWeekStartIso } }),
      filterAll(base44.asServiceRole.entities.Base44Purchase, { created_date: { $gte: lastWeekStartIso } }),
      filterAll(base44.asServiceRole.entities.SupportMessage, { created_date: { $gte: lastWeekStartIso } }),
      filterAll(base44.asServiceRole.entities.ActCompletion, { completedAt: { $gte: thisWeekStartIso } }),
      filterAll(base44.asServiceRole.entities.Milestone, { lastCompletedAt: { $gte: thisWeekStartIso } }),
    ]);

    // New signups, read only from the reporting window — three weeks back covers
    // prev week, this week, yesterday and the day before. The User entity takes
    // only the positional (query, sort, limit, skip) form, so this pages by
    // hand; the volume is bounded by growth inside the window, not by the size
    // of the base, which is what keeps a daily report cheap at 100k accounts.
    const signupWindowStart = new Date(b.lastWeekStart - 7 * 24 * 60 * 60 * 1000).toISOString();
    const recentSignups: any[] = [];
    for (let skip = 0; skip < 20000; skip += 200) {
      const page: any[] = await base44.asServiceRole.entities.User.filter(
        { created_date: { $gte: signupWindowStart } },
        '-created_date', 200, skip,
      );
      recentSignups.push(...page);
      if (page.length < 200) break;
    }

    // New users (by created_date) in each window.
    const newUsersIn = (start, end) => recentSignups.filter((u) => {
      const ts = new Date(u.created_date).getTime();
      return inRange(ts, start, end);
    }).length;

    const yesterdayNewUsers = newUsersIn(b.yesterdayStart, b.yesterdayEnd);
    const prevDayNewUsers = newUsersIn(b.prevDayStart, b.prevDayEnd);
    const weekNewUsers = newUsersIn(b.thisWeekStart, b.thisWeekEnd);
    const prevWeekNewUsers = newUsersIn(b.lastWeekStart, b.lastWeekEnd);

    // New reviews in each window.
    const newReviewsIn = (start, end) => reviews.filter((r) =>
      inRange(new Date(r.created_date).getTime(), start, end)
    ).length;

    const yesterdayNewReviews = newReviewsIn(b.yesterdayStart, b.yesterdayEnd);
    const prevDayNewReviews = newReviewsIn(b.prevDayStart, b.prevDayEnd);
    const weekNewReviews = newReviewsIn(b.thisWeekStart, b.thisWeekEnd);
    const prevWeekNewReviews = newReviewsIn(b.lastWeekStart, b.lastWeekEnd);

    // New purchases (paid) in each window.
    const newPurchasesIn = (start, end) => purchases.filter((p) =>
      p.status === 'paid' && inRange(new Date(p.paidAt || p.created_date).getTime(), start, end)
    ).length;

    const yesterdayNewPurchases = newPurchasesIn(b.yesterdayStart, b.yesterdayEnd);
    const prevDayNewPurchases = newPurchasesIn(b.prevDayStart, b.prevDayEnd);
    const weekNewPurchases = newPurchasesIn(b.thisWeekStart, b.thisWeekEnd);
    const prevWeekNewPurchases = newPurchasesIn(b.lastWeekStart, b.lastWeekEnd);

    // New support messages in each window.
    const newSupportIn = (start, end) => supportMsgs.filter((s) =>
      inRange(new Date(s.created_date).getTime(), start, end)
    ).length;

    const yesterdayNewSupport = newSupportIn(b.yesterdayStart, b.yesterdayEnd);
    const prevDayNewSupport = newSupportIn(b.prevDayStart, b.prevDayEnd);
    const weekNewSupport = newSupportIn(b.thisWeekStart, b.thisWeekEnd);
    const prevWeekNewSupport = newSupportIn(b.lastWeekStart, b.lastWeekEnd);

    // All-time review stats and active subscriptions from the pre-aggregated
    // rollup (the reviews/purchases arrays above are 14-day filtered windows).
    const totalReviews = cr?.totalReviews ?? 0;
    const avgRating = cr?.avgRating ?? 0;
    const activeSubscriptions = cr?.activeSubscriptions ?? 0;

    // Daily acts completed (7-day trend, bucketed by completion date).
    const dailyActCounts = {};
    for (const ac of actCompletions) {
      const ts = new Date(ac.completedAt).getTime();
      if (inRange(ts, b.thisWeekStart, b.thisWeekEnd)) {
        const dayKey = new Date(ts).toISOString().slice(0, 10);
        dailyActCounts[dayKey] = (dailyActCounts[dayKey] || 0) + 1;
      }
    }
    const actsTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(b.thisWeekStart + i * DAY + 6 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      actsTrend.push({ date: key, count: dailyActCounts[key] || 0 });
    }

    // Daily milestones completed (7-day trend, bucketed by lastCompletedAt).
    const dailyMilestoneCounts = {};
    for (const m of milestones) {
      if (!m.lastCompletedAt) continue;
      const ts = new Date(m.lastCompletedAt).getTime();
      if (inRange(ts, b.thisWeekStart, b.thisWeekEnd)) {
        const dayKey = new Date(ts).toISOString().slice(0, 10);
        dailyMilestoneCounts[dayKey] = (dailyMilestoneCounts[dayKey] || 0) + 1;
      }
    }
    const milestonesTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(b.thisWeekStart + i * DAY + 6 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      milestonesTrend.push({ date: key, count: dailyMilestoneCounts[key] || 0 });
    }

    const data = {
      reportDate: b.reportDate,
      yesterday: {
        activeUsers: yesterdayActive.size,
        prevDayActiveUsers: prevDayActive.size,
        totalEvents: yesterdayEvents,
        prevDayTotalEvents: prevDayEvents,
        newUsers: yesterdayNewUsers,
        prevDayNewUsers: prevDayNewUsers,
        newReviews: yesterdayNewReviews,
        prevDayNewReviews: prevDayNewReviews,
        newPurchases: yesterdayNewPurchases,
        prevDayNewPurchases: prevDayNewPurchases,
        newSupportMessages: yesterdayNewSupport,
        prevDayNewSupportMessages: prevDayNewSupport,
      },
      week: {
        activeUsers: weekActive.size,
        prevWeekActiveUsers: prevWeekActive.size,
        totalEvents: weekEvents,
        prevWeekTotalEvents: prevWeekEvents,
        newUsers: weekNewUsers,
        prevWeekNewUsers: prevWeekNewUsers,
        newReviews: weekNewReviews,
        prevWeekNewReviews: prevWeekNewReviews,
        newPurchases: weekNewPurchases,
        prevWeekNewPurchases: prevWeekNewPurchases,
        newSupportMessages: weekNewSupport,
        prevWeekNewSupportMessages: prevWeekNewSupport,
      },
      allTime: {
        totalUsers: cr?.totalUsers ?? 0,
        totalPeople: cr?.totalPeople ?? 0,
        totalPets: cr?.totalPets ?? 0,
        totalActs: cr?.totalActs ?? 0,
        totalEvents: cr?.totalEvents ?? 0,
        totalGiftIdeas: cr?.totalGiftIdeas ?? 0,
        totalGroups: cr?.totalGroups ?? 0,
        totalTrips: cr?.totalTrips ?? 0,
        totalPrayerRequests: cr?.totalPrayerRequests ?? 0,
        totalMilestones: cr?.totalMilestones ?? 0,
        totalPersonalNotes: cr?.totalPersonalNotes ?? 0,
        totalGoals: cr?.totalGoals ?? 0,
        totalReviews,
        avgRating: Math.round(avgRating * 10) / 10,
        totalPurchases: cr?.totalPurchases ?? 0,
        activeSubscriptions,
      },
      dailyTrend,
      actsTrend,
      milestonesTrend,
      topFeatures,
      topEvents,
    };

    const subject = `FinBump Analytics — ${b.reportDate}`;
    const html = buildAnalyticsHtml(data);
    const text = buildAnalyticsText(data);

    let sentVia = 'none';
    if (isResendConfigured()) {
      const ok = await sendHtmlEmailViaResend(adminEmail, subject, html, text);
      if (ok) sentVia = 'resend';
    }
    if (sentVia === 'none') {
      // Send the escaped HTML form with the plain-text report as its
      // alternative, rather than passing the plain-text form as an HTML body.
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: adminEmail,
        subject,
        html,
        text,
      });
      sentVia = 'sendemail';
    }

    return Response.json({
      ok: true,
      sentVia,
      recipient: adminEmail,
      yesterdayActive: yesterdayActive.size,
      weekActive: weekActive.size,
      totalEvents: weekEvents,
    });
  } catch (error) {
    console.error('send-admin-analytics-report error', error?.message || error);
    return Response.json({ error: 'Could not build the analytics report.' }, { status: 500 });
  }
}