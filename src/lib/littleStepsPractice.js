// Little Steps — the practice behind a lesson.
//
// Every lesson asks for one real gesture, and each check here answers a single
// question: can the app see that it happened? The checks read only what the
// user has already saved (the same data the store holds for Home), so a lesson
// is never closed by opening a screen — only by doing the thing.

const DAY_MS = 24 * 60 * 60 * 1000;

const any = (list) => Array.isArray(list) && list.length > 0;
const some = (list, test) => Array.isArray(list) && list.some(test);

const savedToday = (stamp) => {
  const at = stamp ? new Date(stamp).getTime() : NaN;
  return Number.isFinite(at) && Date.now() - at < DAY_MS;
};

export const PRACTICE_CHECKS = {
  // An act was checked off within the last day.
  act_done: ({ acts }) => some(acts, (a) => savedToday(a?.lastCompleted)),
  // Someone has a date worth remembering.
  date_remembered: ({ people, pets }) =>
    some(people, (p) => p?.birthday || p?.anniversary) ||
    some(pets, (p) => p?.birthday || p?.adoptionDate),
  // A second act exists, so there is a rhythm and not just a one-off.
  second_act: ({ acts }) => Array.isArray(acts) && acts.length >= 2,
  // A date that matters is on the calendar in its own right.
  date_on_calendar: ({ events, milestones }) => any(events) || any(milestones),
  // Something has been written down, whether it is an appreciation or a moment.
  note_written: ({ personalNotes }) => some(personalNotes, (n) => String(n?.text || '').trim()),
  // A care cadence is switched on for a person or a pet.
  care_reminder: ({ people, pets }) =>
    some(people, (p) => p?.healthReminderDays || p?.prayerEnabled || p?.otherReminderDays || p?.reachOutDays) ||
    some(pets, (p) => p?.healthReminderDays || p?.prayerEnabled || p?.otherReminderDays),
  // A moment from the day has been kept.
  memory_moment: ({ personalNotes }) => some(personalNotes, (n) => n?.type === 'memory'),
  // A gift idea is saved for someone.
  gift_idea: ({ giftIdeas }) => any(giftIdeas),
  // Two people are linked to each other, the way a family actually looks.
  relationship_link: ({ people }) =>
    some(people, (p) => Array.isArray(p?.relationships) && p.relationships.length > 0),
  // A moment has a picture with it.
  moment_photo: ({ personalNotes }) =>
    some(personalNotes, (n) => Array.isArray(n?.photos) && n.photos.length > 0),
};

export function isPracticeDone(checkKey, data) {
  const check = PRACTICE_CHECKS[checkKey];
  if (!check) return false;
  return !!check(data || {});
}