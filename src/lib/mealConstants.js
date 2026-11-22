// Shared constants and small helpers for the group meal planner.

export const MEAL_STATUS = {
  proposed: 'proposed',
  confirmed: 'confirmed',
  done: 'done',
  cancelled: 'cancelled',
};

// Food types offered as quick picks. Users can also type their own.
export const MEAL_CUISINES = [
  'Anything',
  'Italian',
  'Mexican',
  'Japanese',
  'Chinese',
  'Thai',
  'Indian',
  'Mediterranean',
  'American',
  'Comfort food',
  'Breakfast',
  'Brunch',
  'Coffee & dessert',
  'Pizza',
  'Barbecue',
  'Seafood',
  'Vegetarian',
  'Vegan',
];

export const MEAL_AREAS = ['Anywhere nearby', 'Downtown', 'Near me', 'Halfway for everyone', 'Near their place'];

export const MEAL_BUDGETS = ['Under $20', '$20–40', '$40–60', '$60–100', 'Flexible'];

// Time-of-day options for a proposed slot.
export const MEAL_TIMES = ['Breakfast', 'Brunch', 'Lunch', 'Afternoon', 'Dinner', 'Late evening'];

// Builds the next `count` days (starting today) as yyyy-mm-dd strings for the
// availability picker.
export function upcomingDays(count = 21) {
  const out = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    out.push(d);
  }
  return out;
}

export function toDateInputValue(date) {
  if (!date) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatMealWhen(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// Counts how many participants picked each value, highest first. Used to show
// where the group already agrees.
export function tally(values) {
  const counts = new Map();
  values.forEach((v) => {
    if (!v) return;
    counts.set(v, (counts.get(v) || 0) + 1);
  });
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);
}

export function mealResponseSummary(participants = []) {
  const cuisines = [];
  const areas = [];
  const slots = [];
  let responded = 0;
  participants.forEach((p) => {
    const r = p.response;
    if (p.respondedAt) responded += 1;
    (r?.cuisines || []).forEach((c) => cuisines.push(c));
    (r?.areas || []).forEach((a) => areas.push(a));
    (r?.slots || []).forEach((s) => {
      if (s?.date) slots.push(`${s.date}${s.time ? ` · ${s.time}` : ''}`);
    });
  });
  return {
    responded,
    total: participants.length,
    topCuisines: tally(cuisines),
    topAreas: tally(areas),
    topSlots: tally(slots),
  };
}

// RSVP: alongside the days and food that suit them, an invitee can say whether
// they can make it (response.coming). Answers given before that question existed
// have no RSVP, so 'answered' stays distinct from 'yes'.
export function rsvpStatus(participant) {
  const coming = participant?.response?.coming;
  if (coming === 'yes' || coming === 'maybe' || coming === 'no') return coming;
  return participant?.respondedAt ? 'answered' : 'waiting';
}

// How many invitees sit in each RSVP state.
export function rsvpCounts(participants = []) {
  const counts = { yes: 0, maybe: 0, no: 0, answered: 0, waiting: 0 };
  participants.forEach((p) => {
    counts[rsvpStatus(p)] += 1;
  });
  return counts;
}