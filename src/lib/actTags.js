export const ACT_TAGS = [
  { key: 'daily', label: 'Daily', labelKey: 'acts.tag.daily', dot: 'bg-sky-500' },
  { key: 'weekly', label: 'Weekly', labelKey: 'acts.tag.weekly', dot: 'bg-violet-500' },
  { key: 'monthly', label: 'Monthly', labelKey: 'acts.tag.monthly', dot: 'bg-amber-500' },
  { key: 'special', label: 'Special occasion', labelKey: 'acts.tag.special', dot: 'bg-rose-500' },
];

export const TAG_BY_KEY = Object.fromEntries(ACT_TAGS.map((t) => [t.key, t]));

export const DEFAULT_TAG = 'weekly';

// Categories describe *what kind* of scheduled item an act is. They are chosen
// from the per-contact "add" dropdown so acts of kindness, prayer, health &
// personal, and other care items all live on the same list.
export const ACT_CATEGORIES = [
  { key: 'act', label: 'Act of kindness', labelKey: 'acts.category.act', emoji: '💛', dot: 'bg-rose-500', chip: 'bg-rose-500/15 text-rose-700 border-rose-300' },
  { key: 'prayer', label: 'Prayer', labelKey: 'acts.category.prayer', emoji: '🤲', dot: 'bg-violet-500', chip: 'bg-violet-500/15 text-violet-700 border-violet-300' },
  { key: 'health', label: 'Health & personal', labelKey: 'acts.category.health', emoji: '❤️', dot: 'bg-emerald-500', chip: 'bg-emerald-500/15 text-emerald-700 border-emerald-300' },
  { key: 'other', label: 'Other', labelKey: 'acts.category.other', emoji: '✨', dot: 'bg-amber-500', chip: 'bg-amber-500/15 text-amber-700 border-amber-300' },
];

export const CATEGORY_BY_KEY = Object.fromEntries(ACT_CATEGORIES.map((c) => [c.key, c]));