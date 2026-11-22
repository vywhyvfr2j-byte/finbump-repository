import { useEffect } from 'react';
import { isQuietHoursNow } from '@/lib/quietHours';
import { requestNotificationPermission } from '@/lib/notificationPermission';
import { daysUntil } from '@/lib/keepsakeUtils';

const NOTIFIED_KEY = 'keepsake_notified_events_v1';
const NOTIFIED_GIFTS_KEY = 'keepsake_notified_gift_search_v1';
const DEFAULT_REMINDER_DAYS = [30, 7, 3];
const DEFAULT_GIFT_SEARCH_DAYS = [30, 14, 7];
// If a person has this many (or more) unpurchased gift ideas saved, we won't
// nudge them to search for more — they already have options to pick from.
const GIFT_SEARCH_IDEA_THRESHOLD = 3;

function getNotifiedToday(key) {
  try {
    const raw = JSON.parse(localStorage.getItem(key) || '{}');
    const today = new Date().toDateString();
    return raw.day === today ? raw.ids : [];
  } catch {
    return [];
  }
}

function markNotifiedToday(key, ids) {
  localStorage.setItem(key, JSON.stringify({ day: new Date().toDateString(), ids }));
}

// Events don't always carry a personId (custom events and legacy data often only
// have a name + relation). Resolve the person as best we can so gift info can
// surface on birthday, anniversary, holiday, trip, and custom notifications alike.
function resolvePerson(event, people) {
  if (!people || people.length === 0) return null;
  if (event.personId) {
    const byId = people.find((p) => String(p.id) === String(event.personId));
    if (byId) return byId;
  }
  const name = event.name || '';
  const stripped = name
    .replace(/'s (Birthday|Anniversary)$/i, '')
    .replace(/\s*\((.+?)\)\s*$/, '')
    .trim();
  if (stripped) {
    const byName = people.find((p) => p.name === stripped);
    if (byName) return byName;
  }
  // Last resort: an event name that merely includes a person's name.
  const contains = people.find((p) => p.name && name.includes(p.name));
  return contains || null;
}

// Alerts the user with a browser notification 30/7/3 days before (or on) an
// event's or milestone's date, once per item+interval per day. Any event type —
// birthday, anniversary, holiday, trip, custom — gets a notification, and the
// body surfaces any unpurchased gift ideas saved for the linked person.
export function useEventReminders(events, milestones, giftIdeas, people, notifyEvents) {
  useEffect(() => {
    if (!notifyEvents || !('Notification' in window)) return;

    const items = [
      ...events.map((e) => {
        const person = resolvePerson(e, people);
        return {
          id: e.id,
          name: e.name,
          date: e.date,
          type: e.type,
          reminderDays: e.reminderDays && e.reminderDays.length ? e.reminderDays : DEFAULT_REMINDER_DAYS,
          person,
        };
      }),
      ...(milestones || []).map((m) => ({
        id: 'ms-' + m.id,
        name: m.title,
        date: m.date,
        type: 'milestone',
        reminderDays: m.reminderDays && m.reminderDays.length ? m.reminderDays : DEFAULT_REMINDER_DAYS,
        person: null,
      })),
    ];

    const alreadyNotified = getNotifiedToday(NOTIFIED_KEY);
    const due = [];
    items.forEach((item) => {
      item.reminderDays.forEach((r) => {
        if (daysUntil(item.date) === r) {
          const key = `${item.id}-${r}`;
          if (!alreadyNotified.includes(key)) due.push({ item, key, r });
        }
      });
    });
    if (due.length === 0) return;
    // Quiet hours: hold the nudge — nothing is marked as notified, so it goes out
    // once the window closes.
    if (isQuietHoursNow()) return;

    const send = () => {
      due.forEach(({ item, r }) => {
        const relevantGifts = item.person
          ? (giftIdeas || []).filter((g) => g.person === item.person.name && !g.purchased)
          : [];
        let body = `${item.name} is ${r === 0 ? 'today' : `in ${r} day${r === 1 ? '' : 's'}`}.`;
        if (relevantGifts.length > 0) {
          const giftList = relevantGifts
            .slice(0, 4)
            .map((g) => (g.budget ? `${g.title} ($${g.budget})` : g.title))
            .join(', ');
          body += ` Gift ideas: ${giftList}.`;
        } else if (item.person) {
          body += ` No gift ideas saved for ${item.person.name} yet — tap to search for one.`;
        }
        new Notification('Coming up', { body });
      });
      markNotifiedToday(NOTIFIED_KEY, [...alreadyNotified, ...due.map((d) => d.key)]);
    };

    if (Notification.permission === 'granted') {
      send();
    } else if (Notification.permission !== 'denied') {
      requestNotificationPermission().then((perm) => {
        if (perm === 'granted') send();
      });
    }
  }, [events, milestones, giftIdeas, people, notifyEvents]);

  // Separate "time to search for a gift" reminder. Fires only for events that
  // link to a person, when the person has fewer than the threshold of
  // unpurchased gift ideas saved — a nudge to start gift hunting before the
  // occasion arrives. Firing days are intentionally earlier (30/14/7) so there's
  // time to buy and ship.
  useEffect(() => {
    if (!notifyEvents || !('Notification' in window)) return;

    const alreadyNotified = getNotifiedToday(NOTIFIED_GIFTS_KEY);
    const due = [];
    events.forEach((e) => {
      const person = resolvePerson(e, people);
      if (!person) return;
      const relevantGifts = (giftIdeas || []).filter((g) => g.person === person.name && !g.purchased);
      if (relevantGifts.length >= GIFT_SEARCH_IDEA_THRESHOLD) return;
      const days = daysUntil(e.date);
      if (days < 0) return;
      DEFAULT_GIFT_SEARCH_DAYS.forEach((r) => {
        if (days === r) {
          const key = `${e.id}-${r}`;
          if (!alreadyNotified.includes(key)) {
            due.push({ item: e, person, days: r, savedCount: relevantGifts.length });
          }
        }
      });
    });
    if (due.length === 0) return;
    // Quiet hours: hold the nudge — nothing is marked as notified, so it goes out
    // once the window closes.
    if (isQuietHoursNow()) return;

    const pluralize = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
    const send = () => {
      due.forEach(({ item, person, days, savedCount }) => {
        const when = days === 0 ? 'today' : `in ${pluralize(days, 'day')}`;
        const giftLine =
          savedCount === 0
            ? `No gift ideas saved yet — time to find the perfect one.`
            : `Only ${savedCount} gift idea${savedCount === 1 ? '' : 's'} saved — find a few more options.`;
        const body = `${item.name} for ${person.name} is ${when}. ${giftLine}`;
        new Notification('Time to find a gift', { body });
      });
      markNotifiedToday(NOTIFIED_GIFTS_KEY, [...alreadyNotified, ...due.map((d) => d.key)]);
    };

    if (Notification.permission === 'granted') {
      send();
    } else if (Notification.permission !== 'denied') {
      requestNotificationPermission().then((perm) => {
        if (perm === 'granted') send();
      });
    }
  }, [events, giftIdeas, people, notifyEvents]);
}