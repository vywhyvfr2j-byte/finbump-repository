import { useEffect } from 'react';
import { isQuietHoursNow } from '@/lib/quietHours';
import { requestNotificationPermission } from '@/lib/notificationPermission';

// Browser notifications that fire on each act's scheduled (due) date — once per act
// per day, only when the app is open. Shares the notified-today store with the overdue
// hook so a due-date act doesn't get a second "overdue" notification the same day.
const NOTIFIED_KEY = 'keepsake_notified_acts_v1';

function localDayStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// The date an act is meant to be done by:
//  - one-time scheduled acts use their explicit nextDue date
//  - recurring acts roll to lastCompleted + intervalDays
function actDueDate(act) {
  if (act.nextDue && act.repeat === false) {
    const d = new Date(act.nextDue);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (act.lastCompleted && act.intervalDays) {
    const d = new Date(act.lastCompleted);
    if (Number.isNaN(d.getTime())) return null;
    d.setDate(d.getDate() + Number(act.intervalDays));
    return d;
  }
  return null;
}

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

export function useScheduledActReminders(acts, enabled) {
  useEffect(() => {
    if (!enabled || !('Notification' in window)) return;

    const today = localDayStr(new Date());
    const dueToday = acts.filter((a) => {
      const due = actDueDate(a);
      if (!due) return false;
      return localDayStr(due) === today;
    });
    if (dueToday.length === 0) return;

    const alreadyNotified = getNotifiedToday();
    const toNotify = dueToday.filter((a) => !alreadyNotified.includes(a.id));
    if (toNotify.length === 0) return;
    // Quiet hours: hold the nudge — nothing is marked as notified, so it goes out
    // once the window closes.
    if (isQuietHoursNow()) return;

    const send = () => {
      toNotify.forEach((act) => {
        new Notification('Act due today', {
          body: `${act.emoji ? act.emoji + ' ' : ''}${act.name} is on for today.`,
        });
      });
      markNotifiedToday([...alreadyNotified, ...toNotify.map((a) => a.id)]);
    };

    if (Notification.permission === 'granted') {
      send();
    } else if (Notification.permission !== 'denied') {
      requestNotificationPermission().then((perm) => {
        if (perm === 'granted') send();
      });
    }
  }, [acts, enabled]);
}