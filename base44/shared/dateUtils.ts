// Shared date utilities used by backend functions (push notifications, widget
// feeds, etc.). Mirrors the client-side keepsakeUtils.js logic so server-side
// computations stay consistent.

export function daysSince(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return null;
  return Math.floor((Date.now() - then) / 86400000);
}

export function daysUntil(dateStr: string | null | undefined): number {
  const d = new Date(dateStr).getTime();
  if (Number.isNaN(d)) return NaN;
  return Math.ceil((d - Date.now()) / 86400000);
}

// Next annual occurrence of a month/day date (birthday, anniversary). For a
// date-only "YYYY-MM-DD" string, rolls forward to next year if this year's
// occurrence has already passed.
export function nextOccurrence(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const parts = String(dateStr).split('-').map(Number);
  if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [, m, d] = parts;
  const now = new Date();
  let next = new Date(now.getFullYear(), m - 1, d);
  if (next < now) next = new Date(now.getFullYear() + 1, m - 1, d);
  return next.toISOString();
}