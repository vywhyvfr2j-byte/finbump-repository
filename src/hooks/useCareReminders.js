import { useMemo } from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { daysSince } from '@/lib/keepsakeUtils';
import { useI18n } from '@/lib/i18n/I18nContext';

// Due/overdue prayer and health check-in reminders for every contact and pet.
// Shared by the Home care-reminders panel and the "Today" list, so both always
// agree on what is due. Each item carries the callbacks its one-tap actions
// need (log a check-in, snooze for 24 hours) plus the context the card picker
// uses to draft a note.
const reminderEnded = (endDate) => {
  if (!endDate) return false;
  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return false;
  end.setHours(23, 59, 59, 999);
  return Date.now() > end.getTime();
};

const isSnoozed = (snoozedUntil) => {
  if (!snoozedUntil) return false;
  const until = new Date(snoozedUntil);
  if (Number.isNaN(until.getTime())) return false;
  return Date.now() < until.getTime();
};

export const careItemKey = (item) => `${item.kind}-${item.id}-${item.icon}`;

// Card cadence: a card is auto-drafted on the first day a care reminder is due,
// then every other day, until the check-in clears the reminder.
const cardDayFor = (days, cadence) => {
  if (days === null) return true;
  const dueDay = days - cadence + 1;
  return dueDay >= 1 && dueDay % 2 === 1;
};

export function useCareReminders() {
  const { people, pets, updatePerson, updatePet } = useKeepsake();
  const { t } = useI18n();

  const contacts = useMemo(
    () => [
      ...people.map((p) => ({ ...p, kind: 'person' })),
      ...pets.map((p) => ({ ...p, kind: 'pet' })),
    ],
    [people, pets]
  );

  return useMemo(() => {
    const updateContact = (contact, patch) =>
      contact.kind === 'pet' ? updatePet(contact.id, patch) : updatePerson(contact.id, patch);

    const due = [];
    contacts.forEach((c) => {
      // Prayer
      if (c.prayerEnabled && c.prayerReminderDays > 0 && !reminderEnded(c.prayerReminderEndDate)) {
        const days = daysSince(c.lastPrayedAt);
        if ((days === null || days >= c.prayerReminderDays) && !isSnoozed(c.prayerSnoozedUntil)) {
          due.push({
            id: c.id,
            kind: c.kind,
            name: c.prayerNames || c.name,
            contactName: c.name,
            label: t('home.carePrayerLabel'),
            icon: 'prayer',
            cadence: c.prayerReminderDays,
            days,
            cardKey: `${c.kind}-prayer-${c.id}`,
            cardDay: cardDayFor(days, c.prayerReminderDays),
            notes: c.prayerReason || c.healthNotes || '',
            likes: Array.isArray(c.likes) ? c.likes : [],
            relation: c.kind === 'pet' ? c.species || 'pet' : c.relation || '',
            onComplete: () => updateContact(c, { lastPrayedAt: new Date().toISOString() }),
            onSnooze: () => updateContact(c, { prayerSnoozedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() }),
          });
        }
      }
      // Health
      if (c.healthReminderDays > 0 && !reminderEnded(c.healthReminderEndDate)) {
        const days = daysSince(c.lastHealthCheckIn);
        if ((days === null || days >= c.healthReminderDays) && !isSnoozed(c.healthSnoozedUntil)) {
          due.push({
            id: c.id,
            kind: c.kind,
            name: c.name,
            contactName: c.name,
            label: t('home.careHealthLabel'),
            icon: 'health',
            cadence: c.healthReminderDays,
            days,
            cardKey: `${c.kind}-health-${c.id}`,
            cardDay: cardDayFor(days, c.healthReminderDays),
            notes: c.healthNotes || '',
            likes: Array.isArray(c.likes) ? c.likes : [],
            relation: c.kind === 'pet' ? c.species || 'pet' : c.relation || '',
            onComplete: () => updateContact(c, { lastHealthCheckIn: new Date().toISOString() }),
            onSnooze: () => updateContact(c, { healthSnoozedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() }),
          });
        }
      }
    });
    return due;
  }, [contacts, updatePerson, updatePet, t]);
}