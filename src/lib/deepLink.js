import { withAffiliateTag } from '@/lib/affiliateConfig';
import { trackEvent } from '@/hooks/useFeatureTracking';

// Self-contained mobile deep linking.
//
// On a phone, tapping an affiliate buy link tries to hand the URL to the
// native Amazon/Etsy app via its custom URL scheme; if the app isn't installed
// (the page stays visible), it falls back to the tagged web URL in the
// browser. On desktop it just opens the tagged web URL in a new tab.
//
// The web fallback is ALWAYS the tagged URL, so the affiliate tag survives
// either path and the click stays attributable. (Amazon's own amzn:// scheme
// is for the Appstore and carries no tag, so we use the community shopping-app
// scheme for the app attempt and keep the tagged https URL as the fallback.)

const isMobile = (() => {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const touch = navigator.maxTouchPoints > 1 && window.innerWidth < 900;
  return /Android|iPhone|iPad|iPod/i.test(ua) || touch;
})();

// Maps an https Amazon/Etsy URL to the native app's custom URL scheme.
function toAppScheme(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '').toLowerCase();
    const pathAndQuery = u.pathname + u.search;
    if (host === 'amazon.com' || host.endsWith('.amazon.com')) {
      return `com.amazon.mobile.shopping.web://amazon.com${pathAndQuery}`;
    }
    if (host === 'etsy.com' || host.endsWith('.etsy.com')) {
      return `etsy://${pathAndQuery.replace(/^\//, '')}`;
    }
    return null;
  } catch {
    return null;
  }
}

// Only http(s) links may reach a navigation sink. A saved gift-idea link could
// otherwise hold a javascript: or data: value, which would run script in the
// app's own origin the moment its buy button is tapped. Anything that does not
// parse as an absolute http/https URL is refused here, before any sink.
function safeWebUrl(value) {
  if (typeof value !== 'string') return null;
  const raw = value.trim();
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u.toString();
  } catch {
    return null;
  }
}

// True when the app is running installed from the home screen (the iOS wrapper
// or an installed PWA) rather than inside a browser tab.
function isStandalone() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  if (navigator.standalone === true) return true;
  try {
    return (
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(display-mode: standalone)').matches
    );
  } catch {
    return false;
  }
}

// Hands a shopping link to the phone's own browser. Inside the wrapper the
// webview must never render a store page itself, so we use "_system" — the
// target native shells intercept to open Safari/Chrome — and fall back to a
// real link activation, which the shell also picks up.
function openInSystemBrowser(url) {
  const external = window.open(url, '_system');
  if (external) return;
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/**
 * Opens an affiliate buy link, deep-linking into the native app on mobile when
 * possible and falling back to the tagged web URL. Only absolute http(s) links
 * are opened; anything else is ignored.
 * @param {string} rawUrl
 */
export function openAffiliateLink(rawUrl, meta = {}) {
  const webUrl = safeWebUrl(withAffiliateTag(rawUrl));
  if (!webUrl) return;
  // Fire-and-forget click log so the admin can verify clicks and cross-reference
  // with the affiliate dashboard's 24-hour reporting.
  trackEvent('affiliate_click', 'affiliate', meta);

  // Installed app: every shopping link leaves for the system browser, never an
  // in-app webview or a store app scheme.
  if (isStandalone()) {
    openInSystemBrowser(webUrl);
    return;
  }

  if (!isMobile) {
    window.open(webUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  const appUrl = toAppScheme(webUrl);
  if (!appUrl) {
    window.open(webUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  // Try the native app scheme; if the page stays visible (app didn't open),
  // fall back to the tagged web URL after a short delay.
  let timer;
  const cleanup = () => {
    clearTimeout(timer);
    document.removeEventListener('visibilitychange', onVis);
    window.removeEventListener('pagehide', onVis);
    window.removeEventListener('blur', onVis);
  };
  const onVis = () => {
    if (document.hidden) cleanup(); // app opened — cancel the fallback
  };
  timer = setTimeout(() => {
    cleanup();
    window.open(webUrl, '_blank', 'noopener,noreferrer');
  }, 1500);
  document.addEventListener('visibilitychange', onVis);
  window.addEventListener('pagehide', onVis);
  window.addEventListener('blur', onVis);

  window.location.href = appUrl;
}