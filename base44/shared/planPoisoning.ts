// Both group planners ask a model to summarise what a whole group said, then
// save that summary where every participant reads it as the app's own
// recommendation. Guests answer through a public invite link, so their free-text
// answers are untrusted input sitting in the middle of the prompt: steering text
// that comes back out in the plan borrows the app's authority (a fake fee, a
// payment link, a place the attacker named).
//
// One guard for both planners, applied to every field the plan shows:
//
//   - a field that carries a place, a venue or a stay must never contain a
//     participant's own words — that is exactly the "venue they wrote down" the
//     prompt forbids — and no field may carry a link;
//   - prose (rationale, summary, why, itinerary, cuisine, area) must not
//     reproduce a participant's sentence.
//
// Dietary needs are deliberately left out of the prose check: the plan is meant
// to restate them ("vegetarian-friendly options"), so matching them there would
// reject good plans. They stay in the place check, where an echoed phrase means
// the model took a venue from a guest rather than from web search.
//
// Matching runs on normalised text — lower-cased, punctuation and runs of
// whitespace collapsed — so a casing or spacing tweak cannot slip a fragment
// past it, and short fragments are covered rather than only long ones.

const PLACE_MIN_LENGTH = 4;
const PLACE_WORD_MIN_LENGTH = 6;
const PROSE_MIN_LENGTH = 8;
const MAX_FRAGMENTS = 60;
const LINK = /(https?:\/\/|www\.)/i;

export type PlanFragments = { place: string[]; prose: string[] };

function normalise(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// A single short word ("Thai", "Soho") is far more likely to be a cuisine or a
// neighbourhood the plan is meant to reflect than a venue stolen from a guest,
// so single words only count from six characters — short multi-word phrases and
// longer names still count in full.
function isPlaceFragment(text: string): boolean {
  if (text.length < PLACE_MIN_LENGTH) return false;
  return text.includes(' ') || text.length >= PLACE_WORD_MIN_LENGTH;
}

// The participant-authored text a generated plan must not carry, split into the
// two checks above. Pass each answer's `response` object.
export function participantFragments(answers: any[]): PlanFragments {
  const place = new Set<string>();
  const prose = new Set<string>();

  const add = (set: Set<string>, value: unknown, qualifies: (text: string) => boolean) => {
    const text = normalise(value);
    if (text && qualifies(text) && set.size < MAX_FRAGMENTS) set.add(text);
  };

  for (const answer of answers || []) {
    const a = answer || {};
    // The fields a guest types into themselves.
    add(place, a.notes, isPlaceFragment);
    add(place, a.dietary, isPlaceFragment);
    add(prose, a.notes, (text) => text.length >= PROSE_MIN_LENGTH);
    for (const interest of Array.isArray(a.interests) ? a.interests : []) {
      add(place, interest, isPlaceFragment);
      add(prose, interest, (text) => text.length >= PROSE_MIN_LENGTH);
    }
  }

  return { place: [...place], prose: [...prose] };
}

// True when one field of the generated plan is unsafe to show the group.
export function planFieldUnsafe(
  value: unknown,
  fragments: PlanFragments,
  kind: 'place' | 'prose',
): boolean {
  const raw = String(value ?? '');
  if (!raw) return false;
  if (LINK.test(raw)) return true;

  const text = normalise(raw);
  if (!text) return false;
  const list = kind === 'place' ? fragments.place : fragments.prose;
  return list.some((fragment) => text.includes(fragment));
}