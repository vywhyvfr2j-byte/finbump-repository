// A contact (person or pet) marked as remembering keeps everything else about
// them — photos, notes, memories, timeline. Only the reminders change: the
// annual remembrance date replaces birthdays, anniversaries, gift suggestions
// and check-in cadences.
export const DEFAULT_REMEMBRANCE_LEAD_DAYS = 3;

export function isRemembered(record) {
  return !!record?.remembering;
}

export function remembranceLeadDays(record) {
  const value = Number(record?.remembranceLeadDays);
  return Number.isFinite(value) && value >= 0 ? value : DEFAULT_REMEMBRANCE_LEAD_DAYS;
}

// The next annual occurrence of a remembrance date and how many whole days away
// it is (0 = today). Compared by calendar day, so the date itself still counts
// as "today" all day long instead of rolling to next year.
export function nextRemembrance(dateStr) {
  if (!dateStr) return null;
  const parts = String(dateStr).split('-').map(Number);
  if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [, month, day] = parts;
  const midnight = new Date();
  midnight.setHours(0, 0, 0, 0);
  let date = new Date(midnight.getFullYear(), month - 1, day);
  if (Number.isNaN(date.getTime())) return null;
  if (date < midnight) date = new Date(midnight.getFullYear() + 1, month - 1, day);
  return { date, days: Math.round((date.getTime() - midnight.getTime()) / 86400000) };
}

// Years since the remembered date, counted up to the occurrence being shown.
export function remembranceYears(dateStr, occurrence) {
  const year = Number(String(dateStr || '').split('-')[0]);
  const years = occurrence.getFullYear() - year;
  return Number.isInteger(years) && years > 0 ? years : null;
}