// Categorization + dedupe for the daily "A true story" feed.
//
// The curated STORIES file is grouped by theme (humanitarian, science, sports,
// civil rights, war, medical, animals, arts, space, kindness). We tag each
// story with one of the user-facing categories by its index range, then apply
// two keyword overrides so the small Environment category and the music/
// pop-culture split inside Arts are surfaced accurately. The pool is deduped
// by story text so the same story is never listed twice — which is what keeps
// a category from showing duplicate postings within a year.
import { STORIES } from './stories';

export const STORY_CATEGORIES = [
  { key: 'pop_culture', label: 'Pop culture' },
  { key: 'music_history', label: 'Music history' },
  { key: 'american_history', label: 'American history' },
  { key: 'science', label: 'Science' },
  { key: 'environment', label: 'Environment' },
  { key: 'world_history', label: 'World history' },
  { key: 'sports_trivia', label: 'Sports trivia' },
  { key: 'other', label: 'Other' },
];

export const STORY_CATEGORY_LABELS = STORY_CATEGORIES.reduce((m, c) => {
  m[c.key] = c.label;
  return m;
}, {});

// Categories we don't ship yet but the user may want to add. Shown in the
// picker as suggestions so the admin knows what else could be broken out.
export const SUGGESTED_CATEGORIES = [
  'Technology & invention',
  'Space & aviation',
  'Medicine & health',
  'Animals & nature',
  'Civil rights & justice',
  'Art & literature',
  'Humanitarian heroes',
  'Everyday kindness',
];

// Curated section boundaries in the STORIES array (inclusive index ranges),
// each mapped to its default user-facing category.
const SECTION_DEFAULTS = [
  [0, 49, 'other'],            // Humanitarian heroes
  [50, 99, 'science'],         // Scientists & inventors
  [100, 139, 'other'],         // Exploration & adventure
  [140, 179, 'sports_trivia'], // Sports stories
  [180, 219, 'american_history'], // Civil rights & justice
  [220, 259, 'world_history'],   // War & sacrifice
  [260, 289, 'science'],       // Medical & health
  [290, 319, 'other'],         // Animals
  [320, 349, 'pop_culture'],   // Arts, music & literature
  [350, 375, 'science'],       // Space & aviation
  [376, 399, 'other'],         // Everyday kindness & community
];

const ENV_RE = /\b(climate|rainforest|amazon|deforest|conservation|endangered|pollution|coral reef|whale|poach|habitat|ecosystem|biodiversity|carbon|emission|recycle|solar power|wind turbine|greenhouse|oil spill|wetland|glacier|wildfire|reforest|tree planting|wildlife|game reserve|safari|overfish|bycatch)\b/i;
const MUSIC_RE = /\b(song|album|band|singer|composer|symphony|orchestra|guitar|jazz|blues|folk festival|grammy|conduct|melody|opera|soprano|choir|gospel|soul music|funk|disco|punk|bach|mozart|beethoven|chopin|elvis|beatles|dylan|springsteen|prince|madonna|michael jackson|whitney|beyonce|rihanna|taylor swift|kanye|adele|ed sheeran|bruno mars|bts|k-pop|lead singer|platinum|vinyl|lyric|ballad|aria|concerto)\b/i;
const POP_RE = /\b(movie|film|hollywood|actor|actress|director|oscar|emmy|television|tv show|sitcom|documentary|celebrity|netflix|streaming|talk show|comedian|video game|youtube|influencer|viral|tiktok|instagram|social media|reality tv|game show|star wars|marvel|disney|pixar|anime|cosplay|sequel|franchise)\b/i;

function sectionCategory(i) {
  for (const [start, end, cat] of SECTION_DEFAULTS) {
    if (i >= start && i <= end) return cat;
  }
  return 'other';
}

export function categorizeStory(story, index) {
  const text = `${story.story || ''} ${story.storySource || ''}`;
  // Environment stories are scattered across sections — surface them first.
  if (ENV_RE.test(text)) return 'environment';
  const cat = sectionCategory(index);
  // Split the Arts section: music stories → Music history, the rest stay Pop culture.
  if (cat === 'pop_culture' && MUSIC_RE.test(text)) return 'music_history';
  // Everyday-kindness stories about entertainers → Pop culture.
  if (cat === 'other' && POP_RE.test(text)) return 'pop_culture';
  return cat;
}

let poolCache = null;
let poolCacheKey = '';

// Returns the deduped, categorized story pool filtered to the selected
// categories. Empty/missing selection = all categories (backward compatible).
export function buildStoryPool(selectedCategories) {
  const sel = Array.isArray(selectedCategories) ? selectedCategories.filter(Boolean) : [];
  const useAll = sel.length === 0;
  const cacheKey = useAll ? 'ALL' : sel.slice().sort().join('|');
  if (poolCache && poolCacheKey === cacheKey) return poolCache;

  const seen = new Set();
  const pool = [];
  STORIES.forEach((s, i) => {
    const sig = (s.story || '').toLowerCase().replace(/\s+/g, ' ').trim();
    if (!sig || seen.has(sig)) return; // dedupe exact-duplicate story text
    const cat = categorizeStory(s, i);
    if (!useAll && !sel.includes(cat)) return;
    seen.add(sig);
    pool.push({ ...s, category: cat });
  });

  poolCache = pool;
  poolCacheKey = cacheKey;
  return pool;
}

// Picks the story for a given day-of-year from the (deduped) selected pool.
// Because the pool holds no duplicate entries, the same story is never shown
// twice within a single pass; the full pool comfortably covers a 365-day year.
export function pickStoryForDay(selectedCategories, dayOfYear) {
  const pool = buildStoryPool(selectedCategories);
  if (!pool.length) return null;
  return pool[dayOfYear % pool.length];
}