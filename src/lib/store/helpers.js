// Pure helper functions for the FinBump store. Extracted from keepsakeStore.jsx
// (#9) so they can be unit-tested in isolation and shared across slices.

import {
  STORAGE_KEY,
  DISMISSED_KEY,
  CLICKED_KEY,
  DEFAULT_STATE,
  DEFAULT_PROFILE,
  DEFAULT_MY_PREFERENCES,
  DEFAULT_SETTINGS,
} from './defaults';
import { getActiveAccountId, scopedKey } from '@/lib/accountCache';

export function loadDismissed() {
  try {
    const raw = JSON.parse(localStorage.getItem(DISMISSED_KEY) || '{}');
    const now = Date.now();
    const live = {};
    Object.entries(raw).forEach(([id, exp]) => { if (exp > now) live[id] = exp; });
    return live;
  } catch {
    return {};
  }
}

export function saveDismissed(map) {
  localStorage.setItem(DISMISSED_KEY, JSON.stringify(map));
}

// Tracks which notifications the user has clicked (read/completed) and the day
// they were clicked. A notification clicked on a previous day is not re-added
// to the feed — it "will not appear after day one." Entries older than 7 days
// are pruned on load to prevent unbounded growth.
export function loadClicked() {
  try {
    const raw = JSON.parse(localStorage.getItem(CLICKED_KEY) || '{}');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);
    const cutoff = `${cutoffDate.getFullYear()}-${String(cutoffDate.getMonth() + 1).padStart(2, '0')}-${String(cutoffDate.getDate()).padStart(2, '0')}`;
    const live = {};
    let changed = false;
    Object.entries(raw).forEach(([id, day]) => {
      if (day >= cutoff) live[id] = day;
      else changed = true;
    });
    if (changed) localStorage.setItem(CLICKED_KEY, JSON.stringify(live));
    return live;
  } catch {
    return {};
  }
}

export function saveClicked(map) {
  localStorage.setItem(CLICKED_KEY, JSON.stringify(map));
}

export function loadState(userId = getActiveAccountId()) {
  try {
    // The cache is per account. A blob written before that (the plain key) can
    // only belong to the account signed in now, so it is adopted once and then
    // never shared with another account.
    const key = scopedKey(STORAGE_KEY, userId);
    let raw = localStorage.getItem(key);
    if (!raw && key !== STORAGE_KEY) {
      raw = localStorage.getItem(STORAGE_KEY);
      if (raw) localStorage.removeItem(STORAGE_KEY);
    }
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.giftIdeas)) {
      const REMOVE_TITLES = new Set([
        'diamond curved bar bracelet',
        'round diamond solitaire pendant',
        'round diamond solitare pendant',
      ]);
      parsed.giftIdeas = parsed.giftIdeas.filter((g) => {
        const t = (g && typeof g.title === 'string' ? g.title : '').trim().toLowerCase();
        return !REMOVE_TITLES.has(t);
      });
      const seen = {};
      parsed.giftIdeas = parsed.giftIdeas.map((g) => {
        if (!g || (!g.id && g.id !== 0) || seen[g.id]) {
          return { id: `g${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, ...(g || {}) };
        }
        seen[g.id] = true;
        return g;
      });
    }
    if (Array.isArray(parsed.syncRequests)) {
      parsed.syncRequests = parsed.syncRequests.map((r) =>
        typeof r === 'string' ? { personId: r, requestedAt: null, verifiedAt: null } : r
      );
    }
    return {
      ...DEFAULT_STATE,
      ...parsed,
      // Render immediately from cached data. The backend hydration in
      // KeepsakeProvider's mount effect runs in the background and merges
      // fresh data when it arrives — the user sees the app instantly
      // instead of staring at a skeleton while 10 API calls resolve.
      isLoaded: true,
      profile: { ...DEFAULT_PROFILE, ...(parsed.profile || {}) },
      myPreferences: { ...DEFAULT_MY_PREFERENCES, ...(parsed.myPreferences || {}) },
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function mapBackendTrip(b, fromPartner) {
  return {
    id: b.tripId,
    name: b.name,
    destination: b.destination || '',
    startDate: b.startDate || '',
    endDate: b.endDate || '',
    who: b.who || 'both',
    budgetLimit: b.budgetLimit != null ? b.budgetLimit : null,
    categories: Array.isArray(b.categories) ? b.categories : [],
    itinerary: Array.isArray(b.itinerary) ? b.itinerary : [],
    flights: Array.isArray(b.flights) ? b.flights : [],
    hotels: Array.isArray(b.hotels) ? b.hotels : [],
    packingList: Array.isArray(b.packingList) ? b.packingList : [],
    locations: Array.isArray(b.locations) ? b.locations : [],
    linkedGiftIds: Array.isArray(b.linkedGiftIds) ? b.linkedGiftIds : [],
    // The stored sharing flag is the source of truth: a trip the owner has
    // switched off must not come back as shared after a reload.
    sharedWithPartner: b.shared !== false,
    backendId: b.id,
    _fromPartner: !!fromPartner,
  };
}

export function mergeOwnedTrips(localList, backendList) {
  const result = [...localList];
  for (const b of backendList || []) {
    const idx = result.findIndex((t) => t.id === b.tripId);
    if (idx >= 0) {
      result[idx] = { ...result[idx], ...mapBackendTrip(b, false) };
    } else {
      result.push(mapBackendTrip(b, false));
    }
  }
  return result;
}

export function buildTripPayload(t) {
  return {
    tripId: t.id,
    name: t.name,
    destination: t.destination || '',
    startDate: t.startDate || '',
    endDate: t.endDate || '',
    who: t.who || 'both',
    shared: true,
    fromPartner: !!t._fromPartner,
    budgetLimit: t.budgetLimit != null ? t.budgetLimit : null,
    categories: Array.isArray(t.categories) ? t.categories : [],
    itinerary: Array.isArray(t.itinerary) ? t.itinerary : [],
    flights: Array.isArray(t.flights) ? t.flights : [],
    hotels: Array.isArray(t.hotels) ? t.hotels : [],
    packingList: Array.isArray(t.packingList) ? t.packingList : [],
    locations: Array.isArray(t.locations) ? t.locations : [],
    linkedGiftIds: Array.isArray(t.linkedGiftIds) ? t.linkedGiftIds : [],
  };
}

export const safeBulkCreate = (entity, docs) => (docs && docs.length ? entity.bulkCreate(docs) : []);

/**
 * Reads a whole collection by following the SDK cursor to its last page.
 *
 * A single list() call stops at 5000 records with no sign it was cut, and an
 * offset walk re-reads rows that shift whenever a record is written mid-walk.
 * A cursor is the only way to load a long history without silently losing its
 * tail — which is what made old entries vanish from History, Progress and the
 * year reflection once an account passed a few thousand records.
 *
 * Entities without a cursor form answer with a plain array; that is treated as
 * a single, complete page.
 */
export async function listAllByCursor(
  collection,
  { query, sort = '-created_date', pageSize = 500, maxRecords = 20000 } = {}
) {
  const records = [];
  let cursor = null;

  for (let page = 0; page < 200; page++) {
    const options = { sort, limit: pageSize, ...(cursor ? { cursor } : {}) };
    const result = query ? await collection.filter(query, options) : await collection.list(options);
    const items = Array.isArray(result) ? result : result?.items ?? [];
    records.push(...items);

    const next = Array.isArray(result) ? null : result?.next_cursor;
    if (!next || records.length >= maxRecords) break;
    cursor = next;
  }

  return records;
}

export async function migrateLegacyData(legacy, entities) {
  const idMap = {};
  let newPeople = [];
  if (legacy.people?.length) {
    const created = await entities.Person.bulkCreate(
      legacy.people.map(({ id, ...rest }) => rest)
    );
    legacy.people.forEach((p, i) => { idMap[p.id] = created[i]?.id; });
    newPeople = created;
  }

  const remap = (items) =>
    (items || []).map(({ id, personId, ...rest }) => ({
      ...rest,
      ...(personId ? { personId: idMap[personId] || personId } : {}),
    }));

  const treats = [
    ...(legacy.drinks || []).map((t) => ({ ...t, category: 'drinks' })),
    ...(legacy.snacks || []).map((t) => ({ ...t, category: 'snacks' })),
    ...(legacy.meals || []).map((t) => ({ ...t, category: 'meals' })),
    ...(legacy.desserts || []).map((t) => ({ ...t, category: 'desserts' })),
  ];

  const [newMovies, newBooks, newSeries, newTreats] = await Promise.all([
    legacy.movieIdeas?.length ? safeBulkCreate(entities.MovieIdea, remap(legacy.movieIdeas).filter((m) => m.title)) : [],
    legacy.bookIdeas?.length ? safeBulkCreate(entities.BookIdea, remap(legacy.bookIdeas).filter((b) => b.title)) : [],
    legacy.seriesIdeas?.length ? safeBulkCreate(entities.SeriesIdea, remap(legacy.seriesIdeas).filter((s) => s.title)) : [],
    treats.length ? safeBulkCreate(entities.TreatIdea, remap(treats).filter((t) => t.title && t.category)) : [],
  ]);

  return { newPeople, newMovies, newBooks, newSeries, newTreats };
}