// Builds deep links to the Card Builder with a pre-filled recipient + occasion,
// so "Send a card" CTAs on reminders jump straight into a ready-to-send card.
// personId is preferred (robust); personName is a fallback for partner entries
// whose id is the literal 'partner'.

// Map care-reminder tabs to Card Builder occasion keys.
export const CARE_OCCASION = {
  prayer: 'prayer',
  health: 'getwell',
  other: 'thinking',
};

// Map FindIt event types to Card Builder occasion keys.
export const EVENT_OCCASION = {
  birthday: 'birthday',
  anniversary: 'anniversary',
  holiday: 'justbecause',
  custom: 'justbecause',
  trip: 'justbecause',
};

// Strips occasion suffixes from an event name ("Alex's Birthday" -> "Alex")
// so it can be matched to a Person record.
export function stripEventName(name) {
  if (!name) return '';
  return name
    .replace(/'s (Birthday|Anniversary)$/i, '')
    .replace(/\s*\((.+?)\)\s*$/, '')
    .trim();
}

export function cardBuilderLink({ personId, personName, occasion } = {}) {
  const params = new URLSearchParams();
  if (personId) params.set('personId', personId);
  if (personName) params.set('person', personName);
  if (occasion) params.set('occasion', occasion);
  const qs = params.toString();
  return qs ? `/card-builder?${qs}` : '/card-builder';
}