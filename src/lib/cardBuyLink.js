// Builds an external "buy a greeting card" search link for a given occasion.
// The link reflects the selected card tone (e.g. "romantic anniversary card")
// so the shopper lands on results matching the card they just picked.

import { withAffiliateTag } from '@/lib/affiliateConfig';

const CARD_QUERIES = {
  birthday: { q: 'birthday card', label: 'Buy a birthday card' },
  anniversary: { q: 'anniversary card', label: 'Buy an anniversary card' },
  'gotcha day': { q: 'pet adoption card', label: 'Buy a pet card' },
  'prayer support': { q: 'thinking of you card', label: 'Buy a thinking-of-you card' },
  'health check-in': { q: 'get well soon card', label: 'Buy a get well card' },
};

// Maps a selected tone/category to a search adjective that refines the
// shopping results. Tones without a useful shopping adjective are omitted.
const CATEGORY_ADJECTIVE = {
  funny: 'funny',
  romantic: 'romantic',
  sentimental: 'sentimental',
  religious: 'religious',
  heartfelt: 'heartfelt',
  'age-appropriate': 'milestone',
};

// Looks up a stored affiliate buy URL (managed in the admin dashboard) for a
// given occasion + optional tone. Returns the matching active record, or null
// so the caller falls back to the generated search URL.
export function findAffiliateLink(affiliateLinks, occasion, category) {
  if (!Array.isArray(affiliateLinks) || !occasion) return null;
  const key = String(occasion).toLowerCase();
  const cat = String(category || '').toLowerCase();
  const exact = affiliateLinks.find(
    (l) => l.active !== false && String(l.occasion || '').toLowerCase() === key && String(l.category || '').toLowerCase() === cat,
  );
  if (exact) return exact;
  // Fall back to the occasion's default (no category) when a tone-specific
  // link doesn't exist.
  return affiliateLinks.find(
    (l) => l.active !== false && String(l.occasion || '').toLowerCase() === key && !(l.category || ''),
  ) || null;
}

export function cardBuyInfo(occasion, { category } = {}) {
  const key = (occasion || '').toLowerCase();
  const entry = CARD_QUERIES[key] || { q: 'greeting card', label: 'Buy a card' };
  const adj = CATEGORY_ADJECTIVE[(category || '').toLowerCase()];
  const q = adj ? `${adj} ${entry.q}` : entry.q;
  const label = adj ? `${entry.label} (${adj})` : entry.label;
  return {
    url: withAffiliateTag(`https://www.amazon.com/s?k=${encodeURIComponent(q)}`),
    label,
  };
}