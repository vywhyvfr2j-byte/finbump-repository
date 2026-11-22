import { useMemo, useEffect } from 'react';
import { isQuietHoursNow } from '@/lib/quietHours';
import { requestNotificationPermission } from '@/lib/notificationPermission';
import { daysUntil } from '@/lib/keepsakeUtils';
import { nextOccurrence } from '@/lib/peopleConstants';

// "Send a card" reminders fire 10 days before each birthday & anniversary.
// They surface on the Home acts-of-support list and trigger a browser
// notification once per occasion when the 10-day mark is hit.
export const CARD_LEAD_DAYS = 10;

const NOTIFIED_KEY = 'keepsake_notified_send_card_v1';

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

// Builds the list of upcoming "send a card" reminders for birthdays &
// anniversaries stored on Person profiles (plus the partner profile).
// Pets are excluded — cards are for people. Only occasions within the
// CARD_LEAD_DAYS window are returned so the card prompt stays actionable.
function buildCardReminders(profile, people) {
  const entries = [];
  const push = (person, kind, dateStr) => {
    if (!dateStr) return;
    const next = nextOccurrence(dateStr);
    if (!next) return;
    const days = daysUntil(next);
    if (days < 0 || days > CARD_LEAD_DAYS) return;
    const occasion = kind === 'birthday' ? 'birthday' : 'anniversary';
    const dateLabel = new Date(next).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });
    entries.push({
      key: `${person.id || 'partner'}-${kind}`,
      personId: person.id || '',
      name: person.preferredName || person.name,
      kind,
      occasion,
      date: next,
      days,
      dateLabel,
    });
  };

  const partnerPerson = (people || []).find((p) => ['partner', 'spouse'].includes((p.relation || '').toLowerCase()));
  const partnerName = profile?.name?.trim() || partnerPerson?.name;
  const partnerBirthday = profile?.birthday || partnerPerson?.birthday;
  const partnerAnniversary = profile?.anniversary || partnerPerson?.anniversary;
  if (partnerName || partnerBirthday || partnerAnniversary) {
    push({ id: 'partner', name: partnerName || 'Partner' }, 'birthday', partnerBirthday);
    push({ id: 'partner', name: partnerName || 'Partner' }, 'anniversary', partnerAnniversary);
  }
  (people || []).forEach((p) => {
    if (partnerPerson && p.id === partnerPerson.id) return;
    if (partnerName && p.name === partnerName) return;
    // No cards for someone who is no longer in the user's life.
    if (p.remembering) return;
    push(p, 'birthday', p.birthday);
    push(p, 'anniversary', p.anniversary);
  });
  return entries.sort((a, b) => a.days - b.days);
}

// Returns the "send a card" reminders for the Home list and fires a browser
// notification at the 10-day mark (once per occasion per day).
export function useSendCardReminders(profile, people, notifyEvents) {
  const reminders = useMemo(() => buildCardReminders(profile, people), [profile, people]);

  useEffect(() => {
    if (!notifyEvents || !('Notification' in window) || reminders.length === 0) return;

    const already = getNotifiedToday();
    const due = reminders.filter((r) => r.days === CARD_LEAD_DAYS && !already.includes(r.key));
    if (due.length === 0) return;
    // Quiet hours: hold the nudge — nothing is marked as notified, so it goes out
    // once the window closes.
    if (isQuietHoursNow()) return;

    const send = () => {
      due.forEach((r) => {
        const cardType = r.kind === 'birthday' ? 'Birthday' : 'Anniversary';
        new Notification('Send a card', {
          body: `Send ${cardType} Card to ${r.name} - ${r.occasion} (${r.dateLabel})`,
        });
      });
      markNotifiedToday([...already, ...due.map((r) => r.key)]);
    };

    if (Notification.permission === 'granted') {
      send();
    } else if (Notification.permission !== 'denied') {
      requestNotificationPermission().then((perm) => {
        if (perm === 'granted') send();
      });
    }
  }, [reminders, notifyEvents]);

  return reminders;
}