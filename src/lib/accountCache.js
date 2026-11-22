// Account-scoped browser cache.
//
// Anything kept in the browser that can hold personal records (the cached app
// state, the offline write queue) is stored under a key tied to the signed-in
// account, so on a shared tablet or browser one person's data can never render
// for whoever signs in next. Signing out wipes all of it.
import { STORAGE_KEY } from '@/lib/store/defaults';

const ACTIVE_ACCOUNT_KEY = 'keepsake_active_account_v1';
const WRITE_QUEUE_KEY = 'keepsake_write_queue';
const SESSION_TRIP_IDEAS_KEY = 'ks_ai_trip_ideas';

// Cache families that are re-written per account as `<base>:<userId>`.
const SCOPED_BASES = [STORAGE_KEY, WRITE_QUEUE_KEY];

export function getActiveAccountId() {
  try {
    return localStorage.getItem(ACTIVE_ACCOUNT_KEY) || null;
  } catch {
    return null;
  }
}

export function setActiveAccountId(userId) {
  try {
    if (userId) localStorage.setItem(ACTIVE_ACCOUNT_KEY, userId);
    else localStorage.removeItem(ACTIVE_ACCOUNT_KEY);
  } catch {
    // Storage unavailable (private mode, quota) — the app works without a cache.
  }
}

// The key for an account's copy of a cache. Falls back to the plain key before
// the account is known, which is then adopted by that account on first load.
export function scopedKey(base, userId = getActiveAccountId()) {
  return userId ? `${base}:${userId}` : base;
}

function keysFor(base) {
  const keys = [];
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && (key === base || key.startsWith(`${base}:`))) keys.push(key);
    }
  } catch {
    // ignore
  }
  return keys;
}

// Drops this device's cached app state (every account's copy), leaving
// unrelated preferences such as theme and language untouched.
export function removeCachedState() {
  keysFor(STORAGE_KEY).forEach((key) => {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  });
}

// Sign-out / account-switch wipe: cached records, queued writes, the account
// marker, and the in-tab trip idea draft. Nothing personal survives here.
export function clearAccountCache() {
  SCOPED_BASES.forEach((base) => {
    keysFor(base).forEach((key) => {
      try { localStorage.removeItem(key); } catch { /* ignore */ }
    });
  });
  try {
    localStorage.removeItem(ACTIVE_ACCOUNT_KEY);
    sessionStorage.removeItem(SESSION_TRIP_IDEAS_KEY);
  } catch {
    // Storage unavailable — nothing cached to leak.
  }
}