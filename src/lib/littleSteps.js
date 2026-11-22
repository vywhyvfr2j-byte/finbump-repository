// Little Steps — the guided start for a new user.
//
// Ten hands-on lessons on days 1, 2, 3, 5, 7, 14, 30, 45, 60 and 90 after
// signup. Each one is taught twice: as a card on Home the first time the app is
// opened that day, and as an email whose buttons open the same screens.
//
// A lesson is a real gesture, never a page to read: `practice` names the one
// thing to do, and littleStepsPractice.js reads the saved result back. Nothing
// closes a lesson except the app seeing that it happened.
//
// The email templates (base44/emails/LittleStepsDay*.html) and the sending
// function carry the same day numbers, so a change to a `day` here must be
// matched there.

export const LITTLE_STEPS = [
  {
    day: 1,
    title: 'Start with one small thing',
    body: 'You do not need a system, just one kind thing today. Your Today list keeps it in front of you, so it is not one more thing to hold in your head.',
    steps: [
      'Open your Today list at the top of Home',
      'Do the smallest version of it, a text counts',
      'Tap Done and watch it turn green',
    ],
    practice: {
      check: 'act_done',
      label: 'Check one thing off today',
      done: 'You checked something off, and the app saw it',
    },
    cta: 'Open my Today list',
    route: '/',
  },
  {
    day: 2,
    title: 'The birthday you should not miss',
    body: 'A name and a birthday is all FinBump needs to remind you early, while there is still time to plan something.',
    steps: [
      'Open Who You Love under Explore',
      'Save their birthday, or an anniversary',
      'Add a like or two while you are there',
    ],
    practice: {
      check: 'date_remembered',
      label: 'Save a birthday for someone',
      done: 'A date is saved, and FinBump will remind you early',
    },
    cta: 'Open Who You Love',
    route: '/people',
  },
  {
    day: 3,
    title: 'Make it come back on its own',
    body: 'One act is a moment. A recurring act is a rhythm the app carries for you, whether you think about it or not.',
    steps: [
      'Tap Add act',
      'Choose who it is for',
      'Pick how often it should come back',
    ],
    practice: {
      check: 'second_act',
      label: 'Add a second act',
      done: 'That is two, so you have a rhythm now',
    },
    cta: 'Add an act',
    route: '/add-act',
  },
  {
    day: 5,
    title: 'Put the month in front of you',
    body: 'Month Ahead groups every date by month, so a birthday stops being a surprise and becomes something you plan for.',
    steps: [
      'Add a date that matters, from your calendar or from their page',
      'Open Month Ahead under Explore',
      'See what is coming this month and next',
    ],
    practice: {
      check: 'date_on_calendar',
      label: 'Put one date on the calendar',
      done: 'That date is on the calendar now',
    },
    cta: 'Open my calendar',
    route: '/calendar',
  },
  {
    day: 7,
    title: 'Write it down while you feel it',
    body: 'The appreciation notes are the part of the app nobody else sees. One honest sentence is enough.',
    steps: [
      'Open Personal Notes, or the appreciation box on Home',
      'Write one line about someone',
      'Save it, and it stays yours alone',
    ],
    practice: {
      check: 'note_written',
      label: 'Write one note',
      done: 'That note is saved, and it is yours alone',
    },
    cta: 'Write a note',
    route: '/personal-notes',
  },
  {
    day: 14,
    title: 'Keep up with someone quietly',
    body: 'Care reminders bring one person back to you at the right interval. It is the difference between meaning to check in and actually doing it.',
    steps: [
      'Open Care & Prayer under Explore',
      'Turn on a prayer or check-in reminder for someone',
      'Choose how often it should come back',
    ],
    practice: {
      check: 'care_reminder',
      label: 'Turn on a care reminder',
      done: 'That reminder is on',
    },
    cta: 'Open Care & Prayer',
    route: '/prayer',
  },
  {
    day: 30,
    title: 'Keep one moment from today',
    body: 'In the evening FinBump asks for one moment worth remembering. It takes seconds, and it is the only record of today you will have in a year.',
    steps: [
      'Open Memory Moments, or wait for the evening question on Home',
      'Answer the question about today',
      'Save it to your own private timeline',
    ],
    practice: {
      check: 'memory_moment',
      label: 'Save one moment from today',
      done: 'Today is kept',
    },
    cta: 'Open Memory Moments',
    route: '/memory',
  },
  {
    day: 45,
    title: 'Save the gift before you forget it',
    body: 'Gift ideas arrive at odd moments and leave just as fast. Park one here and it will be waiting when a date comes around.',
    steps: [
      'Open Gift Tracker under Explore',
      'Save one idea for someone',
      'Add what it costs, if you know',
    ],
    practice: {
      check: 'gift_idea',
      label: 'Save one gift idea',
      done: 'That idea is saved for them',
    },
    cta: 'Open Gift Tracker',
    route: '/gift-tracker',
  },
  {
    day: 60,
    title: 'Show how your people fit together',
    body: 'Linking two people, a spouse, a child, a parent, is how FinBump knows who belongs with whom.',
    steps: [
      'Open Who You Love',
      "Open someone's page",
      'Link them to another person you have added',
    ],
    practice: {
      check: 'relationship_link',
      label: 'Link two people together',
      done: 'They are linked now',
    },
    cta: 'Open Who You Love',
    route: '/people',
  },
  {
    day: 90,
    title: 'Three months in',
    body: 'A quarter of a year of showing up. Give one of your moments a picture, then look back at everything you have kept.',
    steps: [
      'Open Memory Moments',
      'Add a photo to one moment',
      'Open your Year in Moments and read it back',
    ],
    practice: {
      check: 'moment_photo',
      label: 'Add a photo to a moment',
      done: 'That moment has its picture',
    },
    cta: 'Open Memory Moments',
    route: '/memory',
  },
];

export const LITTLE_STEPS_TOTAL = LITTLE_STEPS.length;

// How many days after signup the series keeps running. A lesson is never
// skipped: if the user misses a day or four, the next one they see is the one
// they missed, and the emails catch up the same way.
export const LITTLE_STEPS_WINDOW_DAYS = 91;

// Which day of the series today is. Calendar days, not 24-hour blocks, so a
// late-evening signup still counts as day 1.
export function littleStepsDayNumber(anchorDate, now = new Date()) {
  const start = anchorDate ? new Date(anchorDate) : null;
  if (!start || Number.isNaN(start.getTime())) return 1;
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor((today.getTime() - startDay.getTime()) / 86400000) + 1;
}

// "Not now" on a lesson hides it until tomorrow, remembered on this device.
// Shared with the in-app reminder so both honor the same snooze.
export const LITTLE_STEPS_SNOOZE_KEY = 'ks_little_steps_snoozed_on';

function localDayStr(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function littleStepsSnoozedToday(now = new Date()) {
  try {
    return localStorage.getItem(LITTLE_STEPS_SNOOZE_KEY) === localDayStr(now);
  } catch {
    return false;
  }
}

// The one lesson to show: the earliest unfinished lesson that is already due.
export function nextLittleStep(completedDays = [], dayNumber) {
  const done = Array.isArray(completedDays) ? completedDays : [];
  if (dayNumber > LITTLE_STEPS_WINDOW_DAYS) return null;
  return LITTLE_STEPS.find((lesson) => lesson.day <= dayNumber && !done.includes(lesson.day)) || null;
}