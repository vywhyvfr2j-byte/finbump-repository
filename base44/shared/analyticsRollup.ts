// Shared helpers for analytics rollup. The nightly rollup function builds one
// DailyAnalyticsRollup row per Chicago day; the two analytics functions read
// those rows (falling back to raw events for days not yet rolled up, e.g. today)
// so they never scan millions of raw AnalyticsEvent records — keeping them under
// 3s at 15k customers.
import { filterAll } from "./batchProcess.ts";

export interface DayAggregate {
  dateKey: string;
  activeUserIds: Set<string>;
  totalEvents: number;
  featureCounts: Record<string, number>;
  eventCounts: Record<string, number>;
}

// Chicago timezone offset (ms) for a given date — CST = UTC-6, CDT = UTC-5.
export function chicagoOffsetMs(date: Date): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    timeZoneName: 'short',
  });
  const parts = dtf.formatToParts(date);
  const tz = parts.find((p) => p.type === 'timeZoneName')?.value || '';
  return tz.includes('CST') ? -6 * 60 * 60 * 1000 : -5 * 60 * 60 * 1000;
}

// Returns { dateKey, startUtc, endUtc } for the Chicago-local day containing `date`.
export function chicagoDayRange(date: Date): { dateKey: string; startUtc: number; endUtc: number } {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const parts = fmt.formatToParts(date);
  const y = Number(parts.find((p) => p.type === 'year').value);
  const m = Number(parts.find((p) => p.type === 'month').value) - 1;
  const d = Number(parts.find((p) => p.type === 'day').value);
  const ctMidnight = new Date(y, m, d, 0, 0, 0, 0);
  const offset = chicagoOffsetMs(ctMidnight);
  const startUtc = ctMidnight.getTime() - offset;
  const endUtc = startUtc + 24 * 60 * 60 * 1000;
  const dateKey = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  return { dateKey, startUtc, endUtc };
}

function dateKeyToDate(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Returns the dateKey N calendar days before `dateKey` (n=0 → same day).
export function dateKeyNDaysAgo(dateKey: string, n: number): string {
  const d = dateKeyToDate(dateKey);
  d.setDate(d.getDate() - n);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function aggregateEventArray(events: any[], dateKey: string): DayAggregate {
  const activeUserIds = new Set<string>();
  const featureCounts: Record<string, number> = {};
  const eventCounts: Record<string, number> = {};
  for (const ev of events) {
    if (ev.userId) activeUserIds.add(ev.userId);
    if (ev.feature) featureCounts[ev.feature] = (featureCounts[ev.feature] || 0) + 1;
    if (ev.eventName) eventCounts[ev.eventName] = (eventCounts[ev.eventName] || 0) + 1;
  }
  return { dateKey, activeUserIds, totalEvents: events.length, featureCounts, eventCounts };
}

// Aggregates raw AnalyticsEvent records for a UTC time range into a DayAggregate.
export async function aggregateRawEvents(
  eventCollection: any,
  startUtc: number,
  endUtc: number,
  dateKey: string,
): Promise<DayAggregate> {
  const events = await filterAll(eventCollection, {
    created_date: { $gte: new Date(startUtc).toISOString(), $lt: new Date(endUtc).toISOString() },
  });
  return aggregateEventArray(events, dateKey);
}

// Loads a DayAggregate for each Chicago day in [startDateKey, endDateKey] inclusive.
// Uses pre-built DailyAnalyticsRollup rows (one per day); falls back to raw events
// for any day in the range missing a rollup (today, or yesterday before the nightly
// rollup runs). Rollups are bounded to ~90 days retention, so the list is tiny.
export async function loadDayAggregates(
  rollupCollection: any,
  eventCollection: any,
  startDateKey: string,
  endDateKey: string,
): Promise<Map<string, DayAggregate>> {
  const allRollups = await rollupCollection.list('-dateKey', 5000, 0);
  const byKey = new Map<string, DayAggregate>();
  for (const r of allRollups) {
    if (!r.dateKey || r.dateKey < startDateKey || r.dateKey > endDateKey) continue;
    byKey.set(r.dateKey, {
      dateKey: r.dateKey,
      activeUserIds: new Set<string>((r.activeUserIds || []).filter(Boolean)),
      totalEvents: r.totalEvents || 0,
      featureCounts: r.featureCounts || {},
      eventCounts: r.eventCounts || {},
    });
  }

  // Fall back to raw events for missing days in the range (expected: only today).
  const missing: { dateKey: string; startUtc: number; endUtc: number }[] = [];
  const cur = dateKeyToDate(startDateKey);
  const endD = dateKeyToDate(endDateKey);
  while (cur <= endD) {
    const y = cur.getFullYear();
    const m = cur.getMonth() + 1;
    const day = cur.getDate();
    const dk = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (!byKey.has(dk)) {
      // Build the range from the calendar day itself. `cur` is local midnight and
      // the functions run on UTC, where that instant still belongs to the
      // *previous* Chicago day — which would aggregate the wrong day's events.
      // Noon UTC is safely inside the day the key names.
      const range = chicagoDayRange(new Date(Date.UTC(y, m - 1, day, 12)));
      missing.push({ dateKey: dk, startUtc: range.startUtc, endUtc: range.endUtc });
    }
    cur.setDate(cur.getDate() + 1);
  }
  if (missing.length > 0) {
    const fallbacks = await Promise.all(
      missing.map((m) => aggregateRawEvents(eventCollection, m.startUtc, m.endUtc, m.dateKey)),
    );
    for (const f of fallbacks) byKey.set(f.dateKey, f);
  }
  return byKey;
}