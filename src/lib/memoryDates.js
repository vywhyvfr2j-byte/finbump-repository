// Memory moments keep a date-only day (YYYY-MM-DD) chosen in the user's own
// timezone. `new Date('2026-09-01')` reads that as UTC midnight, which lands on
// Aug 31 in the Americas — pushing moments saved on the 1st into the month (and
// even the year) before. Month grouping reads the day through this helper
// instead, so a moment is filed under the month the user actually lived it.
export function parseMemoryDay(at) {
  if (typeof at === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(at)) {
    const [y, m, d] = at.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(at);
}

// Localized month name for a month bucket (0-11), e.g. "September".
export function monthLabel(monthIndex, year, language) {
  return new Date(year, monthIndex, 1).toLocaleDateString(
    language === 'es' ? 'es-ES' : 'en-US',
    { month: 'long' }
  );
}