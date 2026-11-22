export const RELATIONS = [
  { key: 'partner', label: 'Partner', singular: 'partner', emoji: '💍' },
  { key: 'kids', label: 'Kids', singular: 'kid', emoji: '🧒' },
  { key: 'grandkids', label: 'Grandkids', singular: 'grandchild', emoji: '👶' },
  { key: 'siblings', label: 'Siblings', singular: 'sibling', emoji: '🧑‍🤝‍🧑' },
  { key: 'parents', label: 'Parents', singular: 'parent', emoji: '👴' },
  { key: 'other', label: 'Other', singular: 'loved one', emoji: '🙂' },
];

const RELATION_TOKENS = [
  ['partner', ['partner', 'spouse', 'husband', 'wife']],
  ['grandkids', ['grand']],
  ['kids', ['kid', 'child', 'son', 'daughter']],
  ['siblings', ['sibling', 'brother', 'sister']],
  ['parents', ['parent', 'mother', 'father', 'mom', 'dad']],
];

// Classify a freeform relation string (from a Person record) into one of the
// standard RELATIONS categories, used to tailor AI messages and gift ideas.
export function classifyRelation(relation) {
  const r = (relation || '').toLowerCase().trim();
  if (!r) return 'other';
  for (const [key, tokens] of RELATION_TOKENS) {
    if (tokens.some((t) => r.includes(t))) return key;
  }
  return 'other';
}

export const DATE_TYPES = [
  { key: 'birthday', label: 'Birthday', emoji: '🎂' },
  { key: 'anniversary', label: 'Anniversary', emoji: '💍' },
];

export function sortPeopleForPicker(people) {
  return [...people].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}

export function sortPetsForPicker(pets) {
  return [...pets].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}

// Sentinel ownerId used when a pet belongs to the user themself (not one of
// their connections). Stored on Pet.ownerId and resolved back to "Me".
export const SELF_OWNER_ID = 'self';

// Build the full owner picker list: the user themself first, then every
// connection (which already includes the partner Person) sorted alphabetically.
// `myName` is the logged-in user's own name (from auth), not the partner's.
export function buildOwnerOptions(people, myName) {
  const self = { id: SELF_OWNER_ID, label: (myName || '').trim() || 'Me' };
  const connections = sortPeopleForPicker(people).map((p) => ({
    id: p.id,
    label: p.preferredName || p.name,
  }));
  return [self, ...connections];
}

// Resolve an ownerId (real Person id or SELF_OWNER_ID) to a display name.
export function ownerDisplayName(ownerId, people, myName) {
  if (!ownerId) return '';
  if (ownerId === SELF_OWNER_ID) {
    return (myName || '').trim() || 'Me';
  }
  const p = people.find((x) => x.id === ownerId);
  return p?.preferredName || p?.name || '';
}

export function nextOccurrence(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  const now = new Date();
  let next = new Date(now.getFullYear(), m - 1, d);
  if (next < now) next = new Date(now.getFullYear() + 1, m - 1, d);
  return next.toISOString();
}