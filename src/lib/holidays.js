// US holidays — recurring annual dates shown on the calendar so every
// month has the standard holidays without the user needing to add them.

function nthWeekday(year, month, weekday, n) {
  const first = new Date(year, month, 1);
  const offset = (weekday - first.getDay() + 7) % 7;
  return new Date(year, month, 1 + offset + (n - 1) * 7);
}

function lastWeekday(year, month, weekday) {
  const lastDay = new Date(year, month + 1, 0).getDate();
  const last = new Date(year, month, lastDay);
  const offset = (last.getDay() - weekday + 7) % 7;
  return new Date(year, month, lastDay - offset);
}

const FIXED = [
  { month: 0, day: 1, label: "New Year's Day" },
  { month: 5, day: 19, label: 'Juneteenth' },
  { month: 6, day: 4, label: 'Independence Day' },
  { month: 10, day: 11, label: 'Veterans Day' },
  { month: 11, day: 25, label: 'Christmas Day' },
];

const FLOATING = [
  { month: 0, fn: (y) => nthWeekday(y, 0, 1, 3), label: 'Martin Luther King Jr. Day' },
  { month: 1, fn: (y) => nthWeekday(y, 1, 1, 3), label: "Presidents' Day" },
  { month: 4, fn: (y) => lastWeekday(y, 4, 1), label: 'Memorial Day' },
  { month: 8, fn: (y) => nthWeekday(y, 8, 1, 1), label: 'Labor Day' },
  { month: 9, fn: (y) => nthWeekday(y, 9, 1, 2), label: 'Columbus Day' },
  { month: 10, fn: (y) => nthWeekday(y, 10, 4, 4), label: 'Thanksgiving' },
];

export function getHolidaysForYear(year) {
  const list = FIXED.map((h) => ({ date: new Date(year, h.month, h.day), label: h.label }));
  FLOATING.forEach((h) => list.push({ date: h.fn(year), label: h.label }));
  return list;
}