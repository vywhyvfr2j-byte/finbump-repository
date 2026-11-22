// The app's own base URL — used for links we email people (meal invites,
// confirmations, reminders) and for the URLs Wix sends a paid buyer back to.
//
// The platform injects `X-Base44-App-Url` (correct behind custom domains), but a
// request header is caller-settable, so it is only honoured when it points at an
// origin this app actually owns — the server-owned WIX_CHECKOUT_APP_URL or this
// app's own published origin (OWNED_ORIGINS below). Any other value is ignored in
// favour of the server-owned URL, so a caller can never send a paid buyer to a
// page they control, or make an emailed invite link carry a participant's private
// token off-site.

const ENV_KEY = 'WIX_CHECKOUT_APP_URL';

// Where this app is published today. Links are built on this origin whenever the
// server-owned URL names a different platform host (see envAppUrl below).
const PUBLISHED_ORIGIN = 'https://finbump-memory.base44.app';

// The public marketing website lives on its own host and does not serve the app,
// so an app route built on it (an invite, a checkout return) would land on its
// 404 page. No app link may ever be built on it.
const WEBSITE_HOSTS = ['finbump.online', 'www.finbump.online'];

// Origins this app is served from. The server-owned WIX_CHECKOUT_APP_URL always
// counts; the published app origin is listed too, so the platform-injected header
// keeps working if it reports a host the secret hasn't caught up with. Nothing else
// is trusted — in particular NOT every *.base44.app host, because another app's page
// (whose content its owner does control) would then be accepted as a return target.
const OWNED_ORIGINS = [PUBLISHED_ORIGIN];

function rawEnvAppUrl(): string {
  const fromProcess = (globalThis as any)?.process?.env?.[ENV_KEY];
  if (fromProcess) return String(fromProcess).trim();
  try {
    return String((globalThis as any)?.Deno?.env?.get?.(ENV_KEY) || '').trim();
  } catch {
    return '';
  }
}

function envAppUrl(): string {
  const raw = rawEnvAppUrl();
  const origin = originOf(raw);
  if (!origin) return PUBLISHED_ORIGIN;
  // A platform-assigned host that is no longer this app's is a leftover from before
  // it was re-hosted, so no link may be built on it. A connected custom domain (any
  // other origin) is always honoured as-is.
  if (origin.endsWith('.base44.app') && origin !== PUBLISHED_ORIGIN) {
    console.warn('appUrl: ignoring stale WIX_CHECKOUT_APP_URL host');
    return PUBLISHED_ORIGIN;
  }
  // The marketing website is not the app: links built on it would 404.
  if (WEBSITE_HOSTS.includes(new URL(origin).hostname)) {
    console.warn('appUrl: ignoring the marketing website host');
    return PUBLISHED_ORIGIN;
  }
  return raw.replace(/\/+$/, '');
}

// Normalized scheme://host[:port] for http(s) URLs; '' for anything else
// (malformed values, javascript:/data: URLs, relative paths).
function originOf(value: unknown): string {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';
    return url.origin;
  } catch {
    return '';
  }
}

export function isTrustedAppUrl(candidate: unknown, envUrl: string = envAppUrl()): boolean {
  const origin = originOf(candidate);
  if (!origin) return false;
  if (origin === originOf(envUrl)) return true;
  return OWNED_ORIGINS.includes(origin);
}

// Never returns a caller-supplied value that isn't an origin the app owns.
export function resolveAppUrl(req: any): string {
  const header = String(req?.headers?.get?.('x-base44-app-url') || '').trim();
  const envUrl = envAppUrl().replace(/\/+$/, '');

  if (!header) return envUrl;
  if (!isTrustedAppUrl(header, envUrl)) {
    console.warn('appUrl: ignoring untrusted X-Base44-App-Url header');
    return envUrl;
  }
  return originOf(header);
}