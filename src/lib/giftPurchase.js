// Shared purchase-link helpers used across gift tracker, recommendations,
// templates, and AI suggestions. Every gift item gets a visible purchase
// path — a saved direct link when available, otherwise a shopping search
// for the title so the user can find and buy it.

/**
 * Returns a direct purchase URL for a gift idea. Uses the saved link when
 * present; otherwise falls back to a Google Shopping search for the title.
 * @param {{ title?: string, link?: string }} gift
 * @returns {string} a URL the user can open to buy the item
 */
import { withAffiliateTag } from '@/lib/affiliateConfig';

export const isSafeUrl = (url) =>
  typeof url === 'string' && /^https?:\/\//i.test(url.trim());

export function purchaseUrlFor(gift) {
  if (isSafeUrl(gift?.link)) return withAffiliateTag(gift.link);
  const query = encodeURIComponent((gift?.title || '').trim());
  // Regular Google search (not Shopping grid) so the top result is the
  // exact product page rather than a grid of similar products.
  return `https://www.google.com/search?q=${query}`;
}

/**
 * Returns true when the gift has a real saved product link (not a search
 * fallback). Used to decide whether to show "Buy" vs "Find online".
 * @param {{ link?: string }} gift
 * @returns {boolean}
 */
export function hasDirectLink(gift) {
  return !!(gift?.link && isSafeUrl(gift.link));
}