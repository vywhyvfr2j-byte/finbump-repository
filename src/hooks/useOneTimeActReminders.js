import { useMemo, useEffect } from 'react';
import { isQuietHoursNow } from '@/lib/quietHours';
import { requestNotificationPermission } from '@/lib/notificationPermission';
import { daysUntil, formatDate } from '@/lib/keepsakeUtils';

// Reminder milestones (days before the one-time act) — surfaced as an in-app
// banner on Home and as a browser notification fired once per milestone per day.
export const ONE_TIME_ACT_REMINDER_DAYS = [30, 10, 3, 0];
// How far out to keep showing the upcoming one-time act banner on Home.
const HOME_WINDOW_DAYS = 30;

const NOTIFIED_KEY = 'keepsake_notified_onetime_acts_v1';

function getNotifiedToday() {
  try {
    const raw = JSON.parse(localStorage.getItem(NOTIFIED_KEY) || '{}');
    const today = new Date().toDateString();
    return raw.day === today ? raw.ids : [];
  } catch {
    return [];
  }
}

function markNotifiedToday(ids) {
  localStorage.setItem(NOTIFIED_KEY, JSON.stringify({ day: new Date().toDateString(), ids }));
}

// Builds the list of upcoming one-time acts (repeat === false with a nextDue)
// within the 30-day Home window. Each entry carries the act context needed by
// the banner to show the act name, emoji, assigned person, and days remaining.
function buildReminders(acts, people) {
  if (!acts || acts.length === 0) return [];
  const entries = [];
  acts.forEach((act) => {
    if (act.repeat !== false) return;
    if (!act.nextDue) return;
    if (act.notify === false) return;
    const due = new Date(act.nextDue);
    if (Number.isNaN(due.getTime())) return;
    const days = daysUntil(due);
    if (days < 0 || days > HOME_WINDOW_DAYS) return;
    const person = act.personId
      ? people?.find((p) => String(p.id) === String(act.personId))
      : act.person
        ? people?.find((p) => p.name === act.person)
        : null;
    entries.push({
      key: `onetime-${act.id}`,
      id: act.id,
      name: act.name,
      emoji: act.emoji || '✨',
      date: due.toISOString(),
      days,
      personName: person?.preferredName || person?.name || '',
      personId: person?.id || '',
    });
  });
  return entries.sort((a, b) => a.days - b.days);
}

// Returns the upcoming one-time act reminders for the Home banner and fires a
// browser notification at 30/10/3/0 days out (once per milestone per day).
export function useOneTimeActReminders(acts, people, notifyScheduledActs) {
  const reminders = useMemo(() => buildReminders(acts, people), [acts, people]);

  useEffect(() => {
    if (!notifyScheduledActs || !('Notification' in window) || reminders.length === 0) return;

    const already = getNotifiedToday();
    const due = [];
    reminders.forEach((r) => {
      ONE_TIME_ACT_REMINDER_DAYS.forEach((d) => {
        if (r.days === d) {
          const key = `${r.key}-${d}`;
          if (!already.includes(key)) due.push({ r, key, d });
        }
      });
    });
    if (due.length === 0) return;
    // Quiet hours: hold the nudge — nothing is marked as notified, so it goes out
    // once the window closes.
    if (isQuietHoursNow()) return;

    const send = () => {
      due.forEach(({ r, d }) => {
        const when = d === 0 ? 'today' : `in ${d} day${d === 1 ? '' : 's'}`;
        new Notification('Reminder', { body: `${r.emoji} ${r.name}${r.personName ? ` (${r.personName})` : ''}, ${formatDate(r.date)}, ${when}.` });
      });
      markNotifiedToday([...already, ...due.map((x) => x.key)]);
    };

    if (Notification.permission === 'granted') {
      send();
    } else if (Notification.permission !== 'denied') {
      requestNotificationPermission().then((perm) => {
        if (perm === 'granted') send();
      });
    }
  }, [reminders, notifyScheduledActs]);

  return reminders;
}