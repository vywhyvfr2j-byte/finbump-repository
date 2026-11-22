import { useEffect } from 'react';
import { isQuietHoursNow } from '@/lib/quietHours';
import { requestNotificationPermission } from '@/lib/notificationPermission';
import { actStatus } from '@/lib/keepsakeUtils';

const NOTIFIED_KEY = 'keepsake_notified_acts_v1';

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

// Alerts the user with a browser notification when acts of support haven't been
// completed in a while, once per act per day, only when overdue reminders are enabled.
export function useOverdueNotifications(acts, notifyOverdue) {
  useEffect(() => {
    if (!notifyOverdue || !('Notification' in window)) return;

    const overdueActs = acts.filter((a) => actStatus(a) === 'overdue');
    if (overdueActs.length === 0) return;

    const alreadyNotified = getNotifiedToday();
    const toNotify = overdueActs.filter((a) => !alreadyNotified.includes(a.id));
    if (toNotify.length === 0) return;
    // Quiet hours: hold the nudge — nothing is marked as notified, so it goes out
    // once the window closes.
    if (isQuietHoursNow()) return;

    const send = () => {
      toNotify.forEach((act) => {
        new Notification("It's been a while", {
          body: `${act.emoji ? act.emoji + ' ' : ''}${act.name} hasn't been done in a bit.`,
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
  }, [acts, notifyOverdue]);
}