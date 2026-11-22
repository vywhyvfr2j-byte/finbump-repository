import { useMemo, useEffect } from 'react';
import { isQuietHoursNow } from '@/lib/quietHours';
import { requestNotificationPermission } from '@/lib/notificationPermission';
import { daysUntil, formatDate, showsInHomeComingUp, OCCASION_RHYTHM_DAYS } from '@/lib/keepsakeUtils';
import { nextOccurrence } from '@/lib/peopleConstants';

// The milestone days (days before the occasion) a browser notification fires
// on — once per milestone per day — and the days a Home row is highlighted as
// the active reminder. The Home banner itself lists a wider window (the coming
// week, see showsInHomeComingUp), so an occasion never disappears between two
// milestones.
export const PERSON_DATE_REMINDER_DAYS = OCCASION_RHYTHM_DAYS;

const NOTIFIED_KEY = 'keepsake_notified_person_dates_v1';

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

// Years between a stored date (YYYY-MM-DD) and its next occurrence. Used to
// tell the card generator the age someone is turning (birthday) or the number
// of years together (anniversary).
function yearsAtOccurrence(dateStr, occasionIso) {
  if (!dateStr || !occasionIso) return null;
  const [by] = dateStr.split('-').map(Number);
  const occ = new Date(occasionIso);
  const years = occ.getFullYear() - by;
  return Number.isFinite(years) ? years : null;
}

// Builds the list of upcoming birthday/anniversary reminders directly from the
// Person profiles (people[]) plus the partner profile and pets. Partner entries
// are skipped when the partner also exists in people[] to avoid duplicates.
// Pets contribute their birthday and adoption ("Gotcha Day") anniversaries.
// Each reminder carries the person context (relation, age/years, likes, notes)
// needed by the occasion-card picker to tailor AI card suggestions.
function buildReminders(profile, people, pets) {
  const entries = [];
  const push = (person, kind, dateStr) => {
    if (!dateStr) return;
    const next = nextOccurrence(dateStr);
    if (!next) return;
    const days = daysUntil(next);
    if (!showsInHomeComingUp(days)) return;
    const occasion = kind === 'birthday' ? 'birthday' : kind === 'adoption' ? 'Gotcha Day' : 'anniversary';
    entries.push({
      key: `${person.id || 'partner'}-${kind}`,
      name: person.preferredName || person.name,
      kind,
      occasion,
      date: next,
      days,
      personId: person.id || 'partner',
      relation: person.relation || '',
      ageTurning: kind === 'birthday' ? yearsAtOccurrence(dateStr, next) : null,
      yearsTogether: kind === 'anniversary' ? yearsAtOccurrence(dateStr, next) : null,
      notes: person.notes || '',
      likes: Array.isArray(person.likes) ? person.likes : [],
      species: person.species || '',
    });
  };

  const partnerPerson = (people || []).find((p) => ['partner', 'spouse'].includes((p.relation || '').toLowerCase()));
  const partnerName = profile?.name?.trim() || partnerPerson?.name;
  const partnerBirthday = profile?.birthday || partnerPerson?.birthday;
  const partnerAnniversary = profile?.anniversary || partnerPerson?.anniversary;
  if (partnerName || partnerBirthday || partnerAnniversary) {
    const partnerCtx = {
      id: 'partner',
      name: partnerName || 'Partner',
      relation: 'partner',
      notes: profile?.notes || '',
      likes: Array.isArray(profile?.likes) ? profile.likes : [],
    };
    push(partnerCtx, 'birthday', partnerBirthday);
    push(partnerCtx, 'anniversary', partnerAnniversary);
  }
  (people || []).forEach((p) => {
    if (partnerPerson && p.id === partnerPerson.id) return;
    if (partnerName && p.name === partnerName) return;
    // Someone being remembered gets the annual remembrance reminder instead.
    if (p.remembering) return;
    push(p, 'birthday', p.birthday);
    push(p, 'anniversary', p.anniversary);
  });
  (pets || []).forEach((pet) => {
    if (pet.remembering) return;
    const petCtx = { ...pet, relation: 'pet' };
    push(petCtx, 'birthday', pet.birthday);
    push(petCtx, 'adoption', pet.adoptionDate);
  });
  // Soonest first. When a contact and a pet fall on the same day the contact is
  // listed first, so a pet never appears ahead of a person.
  return entries.sort(
    (a, b) => a.days - b.days || (a.relation === 'pet' ? 1 : 0) - (b.relation === 'pet' ? 1 : 0)
  );
}

// Returns the upcoming birthday/anniversary reminders for the Home banner and
// fires a browser notification at 18/7/3 days out (once per milestone per day).
export function usePersonDateReminders(profile, people, pets, notifyEvents) {
  const reminders = useMemo(() => buildReminders(profile, people, pets), [profile, people, pets]);

  useEffect(() => {
    if (!notifyEvents || !('Notification' in window) || reminders.length === 0) return;

    const already = getNotifiedToday();
    const due = [];
    reminders.forEach((r) => {
      PERSON_DATE_REMINDER_DAYS.forEach((d) => {
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
        const label = r.occasion || (r.kind === 'birthday' ? 'birthday' : 'anniversary');
        const when = d === 0 ? 'today' : `in ${d} day${d === 1 ? '' : 's'}`;
        new Notification('Reminder', { body: `${r.name}'s ${label}, ${formatDate(r.date)}, ${when}.` });
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
  }, [reminders, notifyEvents]);

  return reminders;
}