// Curated, no-cost visual card templates. Each gradient is a literal Tailwind
// class string so the build's purge keeps it. Premium AI art (imageUrl on the
// Card record) overrides the template background when present.
export const CARD_TEMPLATES = [
  { key: 'birthday', label: 'Birthday', emoji: '🎂', gradient: 'from-pink-400 via-orange-300 to-amber-300', ink: 'text-rose-950' },
  { key: 'anniversary', label: 'Anniversary', emoji: '💞', gradient: 'from-rose-400 via-pink-400 to-fuchsia-400', ink: 'text-rose-950' },
  { key: 'prayer', label: 'Prayer & Support', emoji: '🤲', gradient: 'from-violet-400 via-indigo-300 to-sky-300', ink: 'text-indigo-950' },
  { key: 'getwell', label: 'Get Well', emoji: '🌿', gradient: 'from-emerald-400 via-teal-300 to-cyan-300', ink: 'text-emerald-950' },
  { key: 'graduation', label: 'Graduation', emoji: '🎓', gradient: 'from-blue-500 via-indigo-400 to-amber-300', ink: 'text-indigo-950' },
  { key: 'thankyou', label: 'Thank You', emoji: '🙏', gradient: 'from-amber-400 via-orange-300 to-rose-300', ink: 'text-amber-950' },
  { key: 'thinking', label: 'Thinking of You', emoji: '💭', gradient: 'from-sky-300 via-violet-300 to-pink-300', ink: 'text-indigo-950' },
  { key: 'justbecause', label: 'Just Because', emoji: '✨', gradient: 'from-rose-400 via-amber-300 to-emerald-300', ink: 'text-rose-950' },
];

export const TEMPLATE_MAP = Object.fromEntries(CARD_TEMPLATES.map((t) => [t.key, t]));