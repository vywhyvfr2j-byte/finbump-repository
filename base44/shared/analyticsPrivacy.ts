// Analytics privacy, enforced in code.
//
// FinBump stores details about people's families — names, notes, prayer
// requests, health situations, message text. None of it may ever reach an
// analytics tool. This module is the single gate every event passes through on
// its way into the AnalyticsEvent table:
//
//   * event and feature names must be short snake_case tokens, so a free-text
//     note can never be smuggled in as a name;
//   * each known event declares the only metadata it may carry;
//   * a metadata value is accepted only when it is a number, a boolean, an
//     id-like token (letters, digits, _ and -), or a value from a declared enum.
//
// Anything else is dropped, never stored. scripts/check-analytics-privacy.mjs
// runs on every build and fails it if a call site tries to send a forbidden
// field (a name, a note, message text, an email, health or prayer detail).

export type AnalyticsValue = string | number | boolean;
export type FieldSpec = 'id' | 'number' | 'boolean' | readonly string[];

const NAME = /^[a-z0-9][a-z0-9_]{0,59}$/;
const ID = /^[A-Za-z0-9_-]{1,64}$/;

// Fields that may never be stored, whatever an event declares. They are the
// free-text and personal-detail fields the plan forbids.
export const FORBIDDEN_FIELDS = [
  'name',
  'fullname',
  'preferredname',
  'personname',
  'notes',
  'note',
  'notetext',
  'text',
  'message',
  'messagetext',
  'email',
  'useremail',
  'phone',
  'address',
  'zipcode',
  'birthday',
  'anniversary',
  'prayer',
  'prayernames',
  'prayerreason',
  'healthnotes',
  'details',
  'description',
  'body',
  'title',
  'reviewtext',
  'keywords',
  'reasons',
];

// One row per event the app may send. Adding an event means adding a row here:
// that is the point — nothing is collected by accident.
export const ANALYTICS_EVENTS: Record<string, Record<string, FieldSpec>> = {
  // Page usage — no metadata beyond the feature name it is filed under.
  page_view: {},
  // Daily loop.
  memory_moment_logged: {},
  notification_permission: {
    result: ['granted', 'denied', 'default', 'unsupported'],
  },
  // Money: which kind of gift/occasion link was opened (keys, never text).
  affiliate_click: { occasion: 'id', category: 'id' },
  // Product feedback: the picked category key only.
  suggestion_submitted: { category: 'id' },
  // Accomplishments: which catalog badge was earned, and its shelf — never a
  // member's name or anything they wrote. Written server-side by award-badges.
  badge_earned: { badge_id: 'id', shelf: 'id' },
};

function isValidValue(spec: FieldSpec, value: unknown): value is AnalyticsValue {
  if (spec === 'number') return typeof value === 'number' && Number.isFinite(value);
  if (spec === 'boolean') return typeof value === 'boolean';
  if (spec === 'id') return typeof value === 'string' && ID.test(value);
  return typeof value === 'string' && (spec as readonly string[]).includes(value);
}

export type SanitizeResult =
  | { ok: true; eventName: string; feature: string; metadata: Record<string, AnalyticsValue>; dropped: string[] }
  | { ok: false; reason: string };

/**
 * Validates an event and returns only the metadata it is allowed to carry.
 * Rejects anything whose name or feature is not a plain token, so free text
 * cannot pass as a label. Unknown events are rejected: the event has to be
 * declared here before it can be recorded.
 */
export function sanitizeAnalyticsEvent(
  rawEventName: unknown,
  rawFeature: unknown,
  rawMetadata: unknown,
): SanitizeResult {
  const eventName = String(rawEventName ?? '').trim();
  const feature = String(rawFeature ?? '').trim();
  if (!NAME.test(eventName)) return { ok: false, reason: 'Invalid event name.' };
  if (!NAME.test(feature)) return { ok: false, reason: 'Invalid feature name.' };

  const spec = ANALYTICS_EVENTS[eventName];
  if (!spec) return { ok: false, reason: 'Unknown analytics event.' };

  const metadata: Record<string, AnalyticsValue> = {};
  const dropped: string[] = [];
  const input = rawMetadata && typeof rawMetadata === 'object' && !Array.isArray(rawMetadata)
    ? (rawMetadata as Record<string, unknown>)
    : {};

  for (const [key, value] of Object.entries(input)) {
    const lower = key.toLowerCase();
    const allowed = Object.prototype.hasOwnProperty.call(spec, key) ? spec[key] : undefined;
    // Not declared for this event, or one of the forbidden personal fields:
    // drop it rather than storing something the plan forbids.
    if (!allowed || FORBIDDEN_FIELDS.includes(lower) || !isValidValue(allowed, value)) {
      dropped.push(key);
      continue;
    }
    metadata[key] = value as AnalyticsValue;
  }

  return { ok: true, eventName, feature, metadata, dropped };
}