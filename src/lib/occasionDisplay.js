// Shared display helpers for upcoming occasions — birthdays, anniversaries and
// pet Gotcha Days. Keeps the wording in one place so the Month Ahead dashboard
// and the Home banner always read the same.

export function occasionLabel(occasion, t) {
  if (occasion === 'birthday') return t('occasions.birthday');
  if (occasion === 'gotcha') return t('occasions.gotcha');
  return t('occasions.anniversary');
}

// "today" / "tomorrow" / "in 18 days"
export function occasionWhen(days, t) {
  if (days === 0) return t('time.today');
  if (days === 1) return t('time.tomorrow');
  return t('time.inDays', { days });
}

// The age someone is turning, or the years together for an anniversary.
export function occasionDetail(occasion, years, t) {
  if (!years) return '';
  if (occasion === 'birthday') return t('occasions.turns', { years });
  if (occasion === 'gotcha') return t('occasions.yearsWithYou', { years });
  return t('occasions.yearsTogether', { years });
}