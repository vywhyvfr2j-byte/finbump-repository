// Color themes for FinBump — seasonal, holiday, religious, sports, and personal.
// Each theme overrides key CSS custom properties (HSL channel triplets) and
// the brand gradient stops used by every lucide icon app-wide.
// Tokens are applied as inline styles on <html>, overriding the defaults in index.css.

function hsl([h, s, l]) { return `${h} ${s}% ${l}%`; }
function adjustL([h, s, l], dl) { return [h, s, Math.max(0, Math.min(100, l + dl))]; }

function makeTheme(id, label, category, primary, accent, bg, gradient) {
  return {
    id, label, category, gradient,
    light: {
      '--primary': hsl(primary),
      '--accent': hsl(accent),
      '--background': hsl(bg),
      '--card': hsl([bg[0], Math.max(8, bg[1] - 8), 99]),
      '--popover': hsl([bg[0], Math.max(8, bg[1] - 8), 99]),
      '--secondary': hsl([bg[0], Math.max(10, bg[1] - 10), 93]),
      '--muted': hsl([bg[0], Math.max(8, bg[1] - 12), 94]),
      '--border': hsl([bg[0], Math.max(6, bg[1] - 15), 88]),
      '--input': hsl([bg[0], Math.max(6, bg[1] - 15), 88]),
      '--ring': hsl(adjustL(primary, -6)),
    },
    dark: {
      '--primary': hsl(adjustL(primary, 12)),
      '--accent': hsl(adjustL(accent, 10)),
      '--ring': hsl(adjustL(primary, 12)),
    },
  };
}

export const THEMES = [
  // ── Personal ──
  makeTheme('default', 'FinBump', 'Personal', [355, 52, 45], [32, 85, 55], [38, 40, 97], ['#1D7A78', '#F05E75', '#FDD062']),
  makeTheme('ocean', 'Ocean', 'Personal', [200, 70, 42], [180, 60, 45], [200, 30, 97], ['#0EA5E9', '#06B6D4', '#2DD4BF']),
  makeTheme('sunset', 'Sunset', 'Personal', [15, 80, 50], [25, 90, 55], [20, 35, 97], ['#F97316', '#FB7185', '#FBBF24']),
  makeTheme('forest', 'Forest', 'Personal', [145, 55, 32], [85, 50, 45], [120, 25, 97], ['#16A34A', '#65A30D', '#84CC16']),
  makeTheme('lavender', 'Lavender', 'Personal', [265, 60, 55], [290, 60, 60], [270, 25, 97], ['#8B5CF6', '#A855F7', '#C084FC']),

  // ── Seasons ──
  makeTheme('spring', 'Spring', 'Seasons', [330, 65, 50], [140, 55, 50], [330, 30, 97], ['#EC4899', '#22C55E', '#F472B6']),
  makeTheme('summer', 'Summer', 'Seasons', [200, 75, 45], [15, 80, 55], [200, 30, 97], ['#0EA5E9', '#FF6B6B', '#FBBF24']),
  makeTheme('autumn', 'Autumn', 'Seasons', [25, 75, 45], [10, 70, 50], [30, 35, 96], ['#EA580C', '#DC2626', '#F59E0B']),
  makeTheme('winter', 'Winter', 'Seasons', [210, 55, 45], [195, 50, 50], [210, 30, 98], ['#3B82F6', '#06B6D4', '#E0F2FE']),

  // ── Religious ──
  makeTheme('christmas', 'Christmas', 'Religious', [142, 65, 32], [0, 72, 48], [140, 25, 97], ['#16A34A', '#DC2626', '#FBBF24']),
  makeTheme('hanukkah', 'Hanukkah', 'Religious', [220, 70, 45], [210, 60, 55], [220, 25, 97], ['#1E40AF', '#93C5FD', '#E5E7EB']),
  makeTheme('diwali', 'Diwali', 'Religious', [280, 55, 45], [35, 85, 55], [280, 25, 96], ['#7C3AED', '#F59E0B', '#FBBF24']),
  makeTheme('eid', 'Eid', 'Religious', [150, 55, 35], [42, 80, 52], [150, 22, 97], ['#16A34A', '#EAB308', '#84CC16']),
  makeTheme('easter', 'Easter', 'Religious', [290, 55, 55], [330, 60, 58], [290, 25, 97], ['#A855F7', '#F472B6', '#FCD34D']),
  makeTheme('kwanzaa', 'Kwanzaa', 'Religious', [0, 65, 42], [145, 55, 35], [30, 20, 96], ['#DC2626', '#1A1A1A', '#16A34A']),
  makeTheme('ramadan', 'Ramadan', 'Religious', [230, 65, 42], [42, 75, 52], [230, 25, 96], ['#1E3A8A', '#EAB308', '#6D28D9']),

  // ── Holidays (secular / unofficial) ──
  makeTheme('valentines', "Valentine's", 'Holidays', [340, 75, 50], [330, 70, 58], [340, 30, 97], ['#E11D48', '#F472B6', '#FBCFE8']),
  makeTheme('halloween', 'Halloween', 'Holidays', [25, 85, 50], [275, 60, 50], [30, 25, 96], ['#F97316', '#7C3AED', '#1A1A1A']),
  makeTheme('stpatricks', "St. Patrick's", 'Holidays', [135, 60, 35], [50, 80, 50], [130, 25, 97], ['#16A34A', '#EAB308', '#84CC16']),
  makeTheme('fourthjuly', 'July 4th', 'Holidays', [0, 70, 45], [220, 70, 48], [220, 20, 97], ['#DC2626', '#2563EB', '#F3F4F6']),
  makeTheme('thanksgiving', 'Thanksgiving', 'Holidays', [25, 60, 42], [35, 70, 50], [30, 30, 96], ['#C2410C', '#D97706', '#92400E']),
  makeTheme('newyear', "New Year's", 'Holidays', [45, 80, 48], [275, 55, 55], [270, 20, 96], ['#EAB308', '#C0C0C0', '#1A1A1A']),

  // ── Sports (generic team colorways) ──
  makeTheme('sports-blue', 'Blue & White', 'Sports', [215, 75, 45], [200, 65, 50], [215, 25, 97], ['#2563EB', '#3B82F6', '#DBEAFE']),
  makeTheme('sports-red', 'Red & White', 'Sports', [0, 72, 45], [350, 65, 50], [0, 22, 97], ['#DC2626', '#B91C1C', '#F3F4F6']),
  makeTheme('sports-green', 'Green & White', 'Sports', [140, 60, 35], [160, 55, 40], [140, 22, 97], ['#16A34A', '#059669', '#D1FAE5']),
  makeTheme('sports-purple', 'Purple & Gold', 'Sports', [265, 65, 50], [42, 80, 52], [265, 22, 97], ['#7C3AED', '#EAB308', '#FBBF24']),
  makeTheme('sports-black', 'Black & Gold', 'Sports', [45, 80, 48], [0, 0, 20], [45, 15, 97], ['#EAB308', '#1A1A1A', '#FCD34D']),
  makeTheme('sports-silver', 'Silver & Blue', 'Sports', [210, 55, 48], [220, 15, 65], [210, 20, 97], ['#94A3B8', '#3B82F6', '#E2E8F0']),

  // ── Two-tone colorways ──
  makeTheme('orange-blue', 'Orange & Blue', 'Sports', [25, 85, 50], [215, 70, 48], [25, 30, 97], ['#F97316', '#2563EB', '#FED7AA']),
  makeTheme('blue-silver', 'Blue & Silver', 'Sports', [215, 70, 45], [220, 15, 65], [215, 25, 97], ['#2563EB', '#94A3B8', '#E2E8F0']),
  makeTheme('burgundy-gold', 'Burgundy & Gold', 'Sports', [345, 55, 32], [42, 80, 52], [345, 20, 96], ['#7C1D2E', '#EAB308', '#FCD34D']),
  makeTheme('blue-red', 'Blue & Red', 'Sports', [220, 70, 45], [0, 72, 48], [220, 22, 97], ['#2563EB', '#DC2626', '#DBEAFE']),
  makeTheme('black-red', 'Black & Red', 'Sports', [0, 0, 20], [0, 72, 48], [0, 15, 97], ['#1A1A1A', '#DC2626', '#F3F4F6']),
  makeTheme('green-gold', 'Green & Gold', 'Sports', [140, 55, 32], [42, 80, 52], [140, 22, 97], ['#16A34A', '#EAB308', '#D1FAE5']),
  makeTheme('navy-gold', 'Navy & Gold', 'Sports', [225, 65, 28], [42, 80, 52], [225, 22, 96], ['#1E3A8A', '#EAB308', '#FCD34D']),
  makeTheme('purple-silver', 'Purple & Silver', 'Sports', [270, 55, 48], [220, 15, 65], [270, 20, 97], ['#7C3AED', '#94A3B8', '#E2E8F0']),
  makeTheme('teal-orange', 'Teal & Orange', 'Sports', [180, 65, 40], [25, 85, 52], [180, 25, 97], ['#0D9488', '#F97316', '#99F6E4']),
  makeTheme('pink-black', 'Pink & Black', 'Sports', [330, 70, 48], [0, 0, 20], [330, 22, 97], ['#EC4899', '#1A1A1A', '#FBCFE8']),
];

// Seasonal/holiday icon name (lucide-react) for each theme that has one.
// Themes not listed here show no decorative icon. Rendered by SeasonalIcon.
export const THEME_ICONS = {
  spring: 'Flower',
  summer: 'Sun',
  autumn: 'Leaf',
  winter: 'Snowflake',
  christmas: 'TreePine',
  hanukkah: 'Star',
  diwali: 'Flame',
  eid: 'Moon',
  easter: 'Flower2',
  ramadan: 'Moon',
  valentines: 'Heart',
  halloween: 'Ghost',
  stpatricks: 'Clover',
  fourthjuly: 'Flag',
  thanksgiving: 'Leaf',
  newyear: 'PartyPopper',
};

export const DEFAULT_THEME_ID = 'default';
export const THEME_CATEGORIES = ['Personal', 'Seasons', 'Religious', 'Holidays', 'Sports'];

export function getThemeById(id) {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}