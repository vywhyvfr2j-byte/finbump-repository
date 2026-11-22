// Affiliate tag configuration for self-contained deep links.
//
// These tags appear in every public affiliate URL — they are NOT secrets — so
// they live here in source. Replace the empty strings with your own tags to
// start earning commissions:
//   - Amazon Associates tag, e.g. 'keepsake-20' (find it in Associates Central)
//   - Etsy affiliate ref (Etsy runs its program through Awin; set this once
//     you have an Awin/ShareASale account)
//
// When a tag is empty the links still work normally — they just don't earn a
// commission until you fill it in.

export const AMAZON_ASSOCIATES_TAG = '';
export const ETSY_AFFILIATE_TAG = '';

/**
 * Attaches the affiliate tag to Amazon/Etsy URLs and leaves every other URL
 * unchanged. Returns the original string on any parse error so links never
 * break.
 * @param {string} url
 * @returns {string}
 */
export function withAffiliateTag(url) {
  if (!url || typeof url !== 'string') return url;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '').toLowerCase();
    if ((host === 'amazon.com' || host.endsWith('.amazon.com')) && AMAZON_ASSOCIATES_TAG && !u.searchParams.has('tag')) {
      u.searchParams.set('tag', AMAZON_ASSOCIATES_TAG);
      return u.toString();
    }
    if ((host === 'etsy.com' || host.endsWith('.etsy.com')) && ETSY_AFFILIATE_TAG && !u.searchParams.has('aff')) {
      u.searchParams.set('aff', ETSY_AFFILIATE_TAG);
      return u.toString();
    }
    return url;
  } catch {
    return url;
  }
}