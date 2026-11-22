// Color palette + emoji options for groups. Used by the Groups hub, detail
// page, and person-profile badges so a group's look stays consistent.

export const GROUP_COLORS = [
  { key: 'coral', label: 'Coral', chip: 'bg-primary/15 text-primary', dot: 'bg-primary', tile: 'bg-primary/10 border-primary/30' },
  { key: 'teal', label: 'Teal', chip: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500', tile: 'bg-emerald-500/10 border-emerald-500/30' },
  { key: 'gold', label: 'Gold', chip: 'bg-amber-500/15 text-amber-700 dark:text-amber-300', dot: 'bg-amber-500', tile: 'bg-amber-500/10 border-amber-500/30' },
  { key: 'violet', label: 'Violet', chip: 'bg-violet-500/15 text-violet-700 dark:text-violet-300', dot: 'bg-violet-500', tile: 'bg-violet-500/10 border-violet-500/30' },
  { key: 'sky', label: 'Sky', chip: 'bg-sky-500/15 text-sky-700 dark:text-sky-300', dot: 'bg-sky-500', tile: 'bg-sky-500/10 border-sky-500/30' },
  { key: 'rose', label: 'Rose', chip: 'bg-rose-500/15 text-rose-700 dark:text-rose-300', dot: 'bg-rose-500', tile: 'bg-rose-500/10 border-rose-500/30' },
];

// Emoji choices for a group's icon. The one a group picks is its face
// everywhere it appears: the groups hub tile, a person's profile badges and
// "My groups".
export const GROUP_EMOJIS = [
  '👥', '👪', '🧑‍🤝‍🧑', '❤️', '💛', '🤝', '🫶', '👋', '🎉', '🥳', '😊', '🙌',
  '🎾', '⚽', '🏀', '🏈', '⛳', '🏓', '🎳', '🏃', '🚴', '🏊', '🧘', '🎿', '⛷️', '🏋️',
  '⛪', '🕊️', '🙏', '📖', '🕯️', '✨', '🌙', '⭐', '💫', '🔥',
  '☕', '🍷', '🍻', '🥂', '🍳', '🍕', '🍰', '🥗', '🍔', '🍵', '🍦', '🥘',
  '📚', '🎨', '🎵', '🎶', '🎬', '🎭', '📷', '🎹', '🎤', '🎸', '🖌️', '🧶',
  '🌱', '🌿', '🌻', '🌳', '🧳', '✈️', '🏕️', '🏔️', '🌊', '🏖️', '🚐', '🗺️',
  '🐾', '🐶', '🐱', '🐴', '🐦', '🐠', '🐢', '🦮',
];

export const colorFor = (key) => GROUP_COLORS.find((c) => c.key === key) || GROUP_COLORS[0];