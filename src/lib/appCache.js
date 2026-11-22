import { clearAccountCache } from '@/lib/accountCache';

// The service worker keeps an offline cache of the app shell. Nothing per-user
// belongs in it, and Cache Storage is keyed by URL alone — it has no idea who is
// signed in — so signing out must wipe it before the next person uses this
// browser.
export async function clearAppCaches() {
  // Local account-scoped caches (records, queued writes) go first — they hold
  // personal data regardless of whether Cache Storage is available.
  clearAccountCache();
  if (typeof caches === 'undefined') return;
  try {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  } catch {
    // Cache Storage is best-effort: never block signing out if it refuses.
  }
}