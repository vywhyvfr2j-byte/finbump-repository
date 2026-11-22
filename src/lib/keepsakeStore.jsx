import React, { createContext, useContext, useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';
import { createResilientEntities } from '@/lib/writeQueue';
import { clearAccountCache, getActiveAccountId, scopedKey, setActiveAccountId } from '@/lib/accountCache';
import {
  STORAGE_KEY,
  DEFAULT_STATE,
  DEFAULT_PROFILE,
  DEFAULT_PARTNER_DATA,
  DEFAULT_MY_PREFERENCES,
  DEFAULT_RECS,
} from './store/defaults';
import {
  loadState,
  mapBackendTrip,
  mergeOwnedTrips,
  buildTripPayload,
  safeBulkCreate,
  migrateLegacyData,
  listAllByCursor,
} from './store/helpers';
import { useActsSlice } from './store/actsSlice';
import { usePeopleSlice } from './store/peopleSlice';
import { useGiftsSlice } from './store/giftsSlice';
import { useTripsSlice } from './store/tripsSlice';
import { useSettingsSlice } from './store/settingsSlice';
import { useContentSlice } from './store/contentSlice';
import { useGroupsSlice } from './store/groupsSlice';
import { useMemorySlice } from './store/memorySlice';

// #9: The store is split into domain slices (acts, people, gifts, trips,
// settings, content). Each slice is a pure method factory imported above
// and testable in isolation. This file is now just the provider: state, refs,
// load/save effects, and slice composition.
const entities = createResilientEntities(base44.entities);

// Runtime-only state that's rebuilt on every session — never persisted to
// localStorage. Everything else is cached for instant startup.
const TRANSIENT_KEYS = new Set(['isLoaded', 'notifications', 'dailyEncouragementContent', 'adminInsights']);

// Cache the context on globalThis so HMR re-evaluations of this module
// (triggered by edits to slices, helpers, or this file) reuse the SAME
// context object. Without this, HMR creates a new KeepsakeContext while
// already-mounted consumers still hold the old reference, producing
// "useKeepsake must be used within KeepsakeProvider". import.meta.hot.decline
// (below) is the primary defense, but this belt-and-suspenders guard keeps
// the context identity stable even when decline is bypassed.
export const KeepsakeContext = globalThis.__KEEPSAKE_CONTEXT__ ??= createContext(null);

// Preload the most-visited page chunks at module-eval time — before React
// mounts, before auth is checked — so their first visit doesn't pay a
// chunk-download penalty on top of its data fetch. The 4.9s People page
// first-visit was the outlier: its chunk (56KB) and its large contact list
// were both downloading at once. This overlaps the chunk download with the
// auth check + data hydration that follow, so by the time the user
// navigates there the chunk is already cached.
Promise.all([
  import('@/pages/Home'),
  import('@/pages/People'),
  import('@/pages/Settings'),
  import('@/pages/ActDetail'),
]).catch(() => {});

export function KeepsakeProvider({ children }) {
  const [state, setState] = useState(loadState);
  const [partnerData, setPartnerData] = useState(DEFAULT_PARTNER_DATA);
  const [isOffline, setIsOffline] = useState(false);

  // Refs give callbacks access to the latest state without re-creating them.
  const tripsRef = useRef([]); tripsRef.current = state.trips;
  const actsRef = useRef([]); actsRef.current = state.acts;
  const giftIdeasRef = useRef([]); giftIdeasRef.current = state.giftIdeas;
  const peopleRef = useRef([]); peopleRef.current = state.people;
  const petsRef = useRef([]); petsRef.current = state.pets;
  const updatePetRef = useRef(null);
  const goalsRef = useRef([]); goalsRef.current = state.goals;
  const notificationsRef = useRef([]); notificationsRef.current = state.notifications;
  const historyRef = useRef([]); historyRef.current = state.history;
  const myPreferencesRef = useRef(DEFAULT_MY_PREFERENCES); myPreferencesRef.current = state.myPreferences;
  const userPrefIdRef = useRef(null);
  const savedTripsRef = useRef({});
  const prevSharedRef = useRef({});

  const refs = {
    tripsRef, actsRef, giftIdeasRef, peopleRef, petsRef, updatePetRef,
    goalsRef, notificationsRef, myPreferencesRef, userPrefIdRef,
    savedTripsRef, prevSharedRef,
  };

  // Tracks which entity collections have been loaded (eager on mount, or
  // lazy via ensureLoaded). Prevents re-fetching on repeated page visits.
  // affiliateLinks is loaded on demand by the card pickers that read it.
  const loadedKeysRef = useRef(new Set(['people', 'pets', 'acts', 'events', 'milestones', 'giftIdeas', 'myPreferences', 'groups', 'memoryRefreshes']));

  const saveTimerRef = useRef(null);
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      // No signed-in account, no cache: this also covers a save that was
      // scheduled just before signing out, so the previous account's records
      // can never be written back after the sign-out wipe.
      if (!getActiveAccountId()) return;
      // Exclude transient runtime flags from the cache so the persisted
      // blob stays small and doesn't grow as the user accumulates data.
      const persist = {};
      Object.keys(state).forEach((k) => {
        if (!TRANSIENT_KEYS.has(k)) persist[k] = state[k];
      });
      localStorage.setItem(scopedKey(STORAGE_KEY), JSON.stringify(persist));
    }, 300);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [state]);

  // Load (and, if needed, migrate) shared data from the backend on first mount.
  useEffect(() => {
    let cancelled = false;
    let retriedAfterThrottle = false;

    const load = async () => {
      // Every collection settles on its own, so one failing or throttled call
      // degrades that single feature instead of blanking the whole app. The
      // auth user rides in the same batch, so it adds no sequential round-trip.
      const settled = await Promise.allSettled([
        entities.Person.list('-created_date'),
        entities.Pet.list('-created_date'),
        entities.Act.list('-created_date'),
        entities.Event.list('-created_date'),
        entities.GiftIdea.list('-created_date'),
        entities.Milestone.list('-created_date'),
        entities.Group.list('-created_date'),
        entities.MemoryRefresh.list('-created_date'),
        base44.auth.me().catch(() => null),
      ]);

      const failed = settled.filter((r) => r.status === 'rejected');
      const loaded = (index) => settled[index].status === 'fulfilled';
      const asList = (index) =>
        loaded(index) && Array.isArray(settled[index].value) ? settled[index].value : [];

      // A 429 asks us to slow down, not to give up — hand it to the retry-once
      // path in `run` below, which keeps the cached state on screen meanwhile.
      const throttled = failed.find(
        (r) => (r.reason?.response?.status ?? r.reason?.status) === 429
      );
      if (throttled) throw throttled.reason;

      // Nothing came back at all: that is an outage, not an empty account.
      if (failed.length === settled.length - 1) throw failed[0].reason;

      if (failed.length) {
        console.warn(
          '[keepsake] collections unavailable this load',
          failed.map((r) => r.reason?.message || r.reason)
        );
      }

      let people = asList(0);
      let pets = asList(1);
      let acts = asList(2);
      let events = asList(3);
      let giftIdeas = asList(4);
      let milestones = asList(5);
      const groups = asList(6);
      const memoryRefreshes = asList(7);
      // Completions are no longer downloaded on app open. Home's four counters
      // ask get-completion-stats for server-side counts, and the screens that
      // actually list completions (History, Progress, contact timelines, the
      // monthly summary) pull them through ensureLoaded('history'). `history`
      // below still starts from the cached copy, so a returning user sees their
      // data immediately.
      let actCompletions = [];
      const me = settled[8].status === 'fulfilled' ? settled[8].value : null;

      // The browser cache belongs to one account. If a different account is
      // signed in than the one this device last cached (an expired session, or
      // a shared device), drop that cache and start clean rather than merging
      // one person's records into another's screen.
      if (me?.id) {
        const cachedAccount = getActiveAccountId();
        if (cachedAccount && cachedAccount !== me.id) {
          clearAccountCache();
          window.location.reload();
          return;
        }
        setActiveAccountId(me.id);
      }

      // Insights are for admins only, so no other account pays for this call or
      // its payload on every app open. Loaded once `me` tells us the role.
      let adminInsights = null;
      if (me?.role === 'admin') {
        adminInsights = await entities.AdminInsight.list('-created_date').catch(() => []);
      }

      const legacy = loadState();
      const hasLegacyData =
        legacy.people?.length ||
        legacy.movieIdeas?.length ||
        legacy.bookIdeas?.length ||
        legacy.seriesIdeas?.length ||
        legacy.drinks?.length ||
        legacy.snacks?.length ||
        legacy.meals?.length ||
        legacy.desserts?.length;

      // `loaded(0)` matters: an empty list from a FAILED load would otherwise
      // look like a brand-new account and re-run the one-time legacy import.
      if (loaded(0) && !legacy.settings.migratedToBackend && hasLegacyData && people.length === 0) {
        const migrated = await migrateLegacyData(legacy, entities);
        people = migrated.newPeople;
      }

      if (loaded(2) && acts.length === 0 && legacy.acts?.length) {
        const actMap = {};
        const createdActs = await safeBulkCreate(entities.Act,
          legacy.acts.map(({ id, ...rest }) => rest).filter((a) => a.name)
        );
        legacy.acts.forEach((a, i) => { actMap[a.id] = createdActs[i]?.id; });
        acts = createdActs;
        if (legacy.events?.length) {
          events = await safeBulkCreate(entities.Event,
            legacy.events.map(({ id, ...rest }) => rest).filter((e) => e.name && e.date)
          );
        }
        if (legacy.giftIdeas?.length) {
          giftIdeas = await safeBulkCreate(entities.GiftIdea,
            legacy.giftIdeas.map(({ id, ...rest }) => rest).filter((g) => g.title)
          );
        }
        if (legacy.history?.length) {
          actCompletions = await safeBulkCreate(entities.ActCompletion,
            legacy.history
              .map(({ id, actId, actName, emoji, completedAt }) => ({ actId: actMap[actId] || actId, actName, emoji, completedAt }))
              .filter((c) => c.actId && c.completedAt)
          );
        }
      }

      if (loaded(5) && milestones.length === 0 && legacy.milestones?.length) {
        milestones = await safeBulkCreate(entities.Milestone,
          legacy.milestones.map(({ id, ...rest }) => rest).filter((m) => m.title && m.date)
        );
      }

      // Read ONLY the signed-in user's own preference row. Listing the whole
      // collection brought other accounts' settings into an admin's load, and
      // past 5,000 rows the list truncates — so the user's OWN row could be
      // missed, leaving them with defaults. `me` resolves in the parallel batch
      // above, so this costs no extra auth round-trip.
      const userPrefs = me?.id
        ? await entities.UserPreference.filter({ created_by_id: me.id }, '-created_date', 1)
        : [];
      let myPrefs = userPrefs[0] || null;

      if (!myPrefs && legacy.myPreferences && Object.keys(legacy.myPreferences).some((k) => legacy.myPreferences[k])) {
        myPrefs = await entities.UserPreference.create(legacy.myPreferences);
      }
      if (myPrefs) userPrefIdRef.current = myPrefs.id;

      // `me` was fetched in parallel above — no extra round-trip needed.
      const userOnboarded = !!me?.onboarded;
      // Sync partner profile from the partner Person entity when the localStorage
      // profile is empty (new device, returning-user onboarding, etc.) so the
      // Home greeting and Partner Profile page show the right data.
      const partnerPerson = people.find((p) => ['partner', 'spouse'].includes((p.relation || '').toLowerCase()));
      // Backfill: if the user has a legacy partner profile but no partner Person
      // entity (e.g. onboarding ran before the Person-creation step existed),
      // create one so the partner appears in every connection/owner picker.
      let backfilledPartner = null;
      // Only backfill when the contact list actually loaded — otherwise a
      // failed call would create a second partner record for the same person.
      if (!partnerPerson && loaded(0) && legacy.profile?.name) {
        try {
          backfilledPartner = await entities.Person.create({
            name: legacy.profile.name,
            preferredName: legacy.profile.nickname || '',
            relation: 'partner',
            birthday: legacy.profile.birthday || '',
            anniversary: legacy.profile.anniversary || '',
            phone: legacy.profile.phone || '',
            zipCode: legacy.profile.zipCode || '',
            photoUrl: legacy.profile.photoUrl || '',
            likes: (legacy.profile.likes || []).filter(Boolean),
            notes: legacy.profile.notes || '',
          });
          people = [backfilledPartner, ...people];
        } catch (e) { /* ignore — pickers just won't show partner */ }
      }
      const syncedProfile = (!legacy.profile?.name && (partnerPerson || backfilledPartner))
        ? {
            ...DEFAULT_PROFILE,
            name: (partnerPerson || backfilledPartner).name || '',
            nickname: (partnerPerson || backfilledPartner).preferredName || '',
            photoUrl: (partnerPerson || backfilledPartner).photoUrl || '',
            phone: (partnerPerson || backfilledPartner).phone || '',
            birthday: (partnerPerson || backfilledPartner).birthday || '',
            anniversary: (partnerPerson || backfilledPartner).anniversary || '',
            zipCode: (partnerPerson || backfilledPartner).zipCode || '',
            likes: (partnerPerson || backfilledPartner).likes?.length ? (partnerPerson || backfilledPartner).likes : ['', '', '', '', ''],
            details: (partnerPerson || backfilledPartner).details || [],
            notes: (partnerPerson || backfilledPartner).notes || '',
          }
        : undefined;
      // Deduplicate acts: collapse records sharing the same name + person,
      // keeping the most recently updated one. Orphaned duplicates are deleted
      // from the database so they don't reappear on reload or fire duplicate
      // notifications. This runs once on load, after migration.
      const dedupKey = (a) => {
        const name = (a.name || '').trim().toLowerCase();
        const person = (a.personId || a.person || '').toString();
        return `${name}|${person}`;
      };
      if (acts.length > 1) {
        const best = new Map();
        acts.forEach((a) => {
          const k = dedupKey(a);
          const cur = best.get(k);
          if (!cur) { best.set(k, a); return; }
          const aTime = new Date(a.updated_date || a.lastCompleted || a.created_date || 0).getTime();
          const cTime = new Date(cur.updated_date || cur.lastCompleted || cur.created_date || 0).getTime();
          if (aTime > cTime) best.set(k, a);
        });
        const keptIds = new Set([...best.values()].map((a) => a.id));
        const dupes = acts.filter((a) => !keptIds.has(a.id) && a.created_date);
        acts = [...best.values()];
        dupes.forEach((d) => entities.Act.delete(d.id).catch(() => {}));
      }

      // Deduplicate calendar events the same way. The legacy → backend
      // migration runs once per browser profile, so the same birthday or
      // anniversary can end up stored many times over. Collapse records that
      // share an occasion (name + date + contact) into the single most useful
      // copy — one linked to a contact, or carrying a note or a completion —
      // and delete the surplus from the database so the calendar, reminders
      // and suggestions only ever see one.
      if (events.length > 1) {
        const eventKey = (e) =>
          `${(e.name || '').trim().toLowerCase()}|${String(e.date || '').slice(0, 10)}|${e.personId || ''}`;
        const eventScore = (e) =>
          (e.personId ? 4 : 0) + (String(e.note || '').trim() ? 2 : 0) + (e.lastCompletedAt ? 1 : 0);
        const bestEvent = new Map();
        events.forEach((e) => {
          const k = eventKey(e);
          const cur = bestEvent.get(k);
          if (!cur) { bestEvent.set(k, e); return; }
          const eScore = eventScore(e);
          const cScore = eventScore(cur);
          const eTime = new Date(e.created_date || 0).getTime();
          const cTime = new Date(cur.created_date || 0).getTime();
          if (eScore > cScore || (eScore === cScore && eTime < cTime)) bestEvent.set(k, e);
        });
        const keptEventIds = new Set([...bestEvent.values()].map((e) => e.id));
        const dupeEvents = events.filter((e) => !keptEventIds.has(e.id) && e.created_date);
        events = [...bestEvent.values()];
        dupeEvents.forEach((d) => entities.Event.delete(d.id).catch(() => {}));
      }

      setState((s) => ({
        ...s,
        isLoaded: true,
        myName: me?.full_name || s.myName || '',
        onboarded: s.onboarded || userOnboarded || people.length > 0 || acts.length > 0 || events.length > 0 || milestones.length > 0,
        people, pets,
        groups: groups.length ? groups : (s.groups || []),
        acts: acts.length ? acts : s.acts,
        events: events.length ? events : s.events,
        giftIdeas: giftIdeas.length ? giftIdeas : s.giftIdeas,
        milestones: milestones.length ? milestones : s.milestones,
        history: actCompletions.length ? actCompletions : s.history,
        memoryRefreshes: memoryRefreshes || [],
        adminInsights: adminInsights || [],
        myPreferences: myPrefs ? { ...DEFAULT_MY_PREFERENCES, ...myPrefs } : s.myPreferences,
        settings: {
          ...s.settings,
          // The nickname is kept on the account as well as in the local cache,
          // so a cleared browser or a new device still greets the person the
          // way they asked to be called instead of by their login name.
          nickname: (s.settings?.nickname || '').trim() || me?.nickname || '',
          email: me?.email || s.settings.email || '',
          migratedToBackend: true,
        },
        ...(syncedProfile ? { profile: { ...s.profile, ...syncedProfile } } : {}),
      }));
    };

    // A 429 is not an outage. The backend is reachable and simply asked us to
    // slow down, so keep showing the cached state and retry once after the wait
    // it asks for — instead of telling the user they are offline, which hides
    // the real cause and sends them looking for a connection problem.
    const run = () => load().catch((err) => {
      if (cancelled) return;
      const status = err?.response?.status ?? err?.status;
      if (status === 429 && !retriedAfterThrottle) {
        retriedAfterThrottle = true;
        setState((s) => ({ ...s, isLoaded: true }));
        const retryAfter = Number(err?.response?.headers?.['retry-after']);
        const waitMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 5000;
        setTimeout(() => { if (!cancelled) run(); }, waitMs);
        return;
      }
      setIsOffline(true);
      setState((s) => ({ ...s, isLoaded: true }));
    });

    run();
    return () => { cancelled = true; };
  }, []);

  // Lazy-load entity collections on demand. Pages call this via the
  // useEnsureEntities hook to fetch only what they need, when they need it.
  const ensureLoaded = useCallback(async (keys) => {
    const missing = keys.filter((k) => !loadedKeysRef.current.has(k));
    if (!missing.length) return;
    missing.forEach((k) => loadedKeysRef.current.add(k));

    const legacy = loadState();
    const updates = {};

    for (const key of missing) {
      switch (key) {
        case 'movieIdeas':
          updates.movieIdeas = await entities.MovieIdea.list('-created_date');
          break;
        case 'bookIdeas':
          updates.bookIdeas = await entities.BookIdea.list('-created_date');
          break;
        case 'seriesIdeas':
          updates.seriesIdeas = await entities.SeriesIdea.list('-created_date');
          break;
        case 'treatIdeas': {
          const treats = await entities.TreatIdea.list('-created_date');
          updates.drinks = treats.filter((t) => t.category === 'drinks');
          updates.snacks = treats.filter((t) => t.category === 'snacks');
          updates.meals = treats.filter((t) => t.category === 'meals');
          updates.desserts = treats.filter((t) => t.category === 'desserts');
          break;
        }
        case 'trips': {
          const ownTrips = await entities.Trip.list('-created_date');
          const mergedTrips = mergeOwnedTrips(legacy.trips, ownTrips);
          mergedTrips.forEach((t) => {
            if (t.sharedWithPartner) {
              savedTripsRef.current[t.id] = JSON.stringify({ ...t, backendId: undefined, _fromPartner: undefined });
              prevSharedRef.current[t.id] = true;
            }
          });
          const existingPartnerTrips = tripsRef.current.filter((t) => t._fromPartner);
          updates.trips = [...mergedTrips, ...existingPartnerTrips.filter((pt) => !mergedTrips.some((mt) => mt.id === pt.id))];
          break;
        }
        case 'history': {
          // Cursor-paged to the last record. A single call stops at 5000 with no
          // sign it was cut, which silently hid older entries from History,
          // Progress and the year reflection.
          const fetched = await listAllByCursor(entities.ActCompletion);
          // Preserve optimistic completions (local IDs from checkOffAct) that
          // haven't persisted to the DB yet, so navigating to History right
          // after completing an act doesn't lose the just-completed entry.
          const fetchedIds = new Set(fetched.map((h) => h.id));
          const optimistic = (historyRef.current || []).filter(
            (h) => h.id && String(h.id).startsWith('h') && !fetchedIds.has(h.id)
          );
          updates.history = [...optimistic, ...fetched];
          break;
        }
        case 'personalNotes':
          // Same reason: notes span years, and only the newest 5000 would come
          // back from a single call — the rest of the year simply disappeared.
          updates.personalNotes = await listAllByCursor(entities.PersonalNote);
          break;
        case 'affiliateLinks':
          updates.affiliateLinks = await entities.AffiliateLink.list('-created_date');
          break;
        case 'goals':
          updates.goals = await entities.Goal.list('-created_date');
          break;
        case 'commLog':
          updates.commLog = await entities.CommLog.list('-created_date');
          break;
        case 'favoriteIdeas': {
          const favs = await entities.FavoriteIdea.list('-created_date');
          updates.vacationIdeas = favs.filter((f) => f.category === 'vacationIdeas');
          updates.getawayIdeas = favs.filter((f) => f.category === 'getawayIdeas');
          updates.roadTripIdeas = favs.filter((f) => f.category === 'roadTripIdeas');
          updates.dinnerIdeas = favs.filter((f) => f.category === 'dinnerIdeas');
          break;
        }
        case 'personalNeeds':
          updates.personalNeeds = await entities.PrayerRequest.list('-created_date');
          break;
        default:
          break;
      }
    }

    if (Object.keys(updates).length) {
      setState((s) => ({ ...s, ...updates }));
    }
  }, []);

  // Pull-to-refresh: re-read the collections every screen shares, so a pull
  // shows what changed elsewhere (another device, a partner's account, a shared
  // trip) instead of just spinning. Each collection settles on its own, so one
  // failed call leaves that list as it was rather than blanking the screen.
  const refresh = useCallback(async () => {
    const settled = await Promise.allSettled([
      entities.Person.list('-created_date'),
      entities.Pet.list('-created_date'),
      entities.Act.list('-created_date'),
      entities.Event.list('-created_date'),
      entities.GiftIdea.list('-created_date'),
      entities.Milestone.list('-created_date'),
      entities.Group.list('-created_date'),
      entities.MemoryRefresh.list('-created_date'),
    ]);
    const keys = ['people', 'pets', 'acts', 'events', 'giftIdeas', 'milestones', 'groups', 'memoryRefreshes'];
    const updates = {};
    settled.forEach((result, i) => {
      if (result.status === 'fulfilled' && Array.isArray(result.value)) updates[keys[i]] = result.value;
    });
    if (Object.keys(updates).length) setState((s) => ({ ...s, ...updates }));
  }, []);

  // Load partner's shared data (if paired) + pass-expiry check.
  useEffect(() => {
    base44.functions.invoke('getPartnerSharedData', {}).then((res) => {
      if (res.data && !res.data.error) {
        setPartnerData(res.data);
        const partnerTrips = (res.data.trips || []).map((b) => mapBackendTrip(b, true));
        partnerTrips.forEach((t) => {
          savedTripsRef.current[t.id] = JSON.stringify({ ...t, backendId: undefined, _fromPartner: undefined });
          prevSharedRef.current[t.id] = true;
        });
        setState((s) => {
          // Trips the partner no longer shares (unshared, or unpaired by now)
          // must disappear here too instead of lingering in this browser.
          const sharedIds = new Set(partnerTrips.map((t) => t.id));
          const kept = s.trips.filter((t) => !t._fromPartner || sharedIds.has(t.id));
          const existing = new Set(kept.map((t) => t.id));
          const added = partnerTrips.filter((t) => !existing.has(t.id));
          if (!added.length && kept.length === s.trips.length) return s;
          return { ...s, trips: [...kept, ...added] };
        });
      }
    });
    base44.functions.invoke('redeem-pass-code', {}).catch(() => {});
  }, []);

  // Persist shared trips to the backend.
  useEffect(() => {
    state.trips.forEach((t) => {
      if (!t.sharedWithPartner) return;
      const sig = JSON.stringify({ ...t, backendId: undefined, _fromPartner: undefined });
      if (savedTripsRef.current[t.id] === sig) return;
      savedTripsRef.current[t.id] = sig;
      base44.functions
        .invoke('saveSharedTrip', buildTripPayload(t))
        .then((res) => {
          const bid = res?.data?.id;
          const current = tripsRef.current.find((x) => x.id === t.id);
          if (bid && current && !current.backendId) {
            setState((s) => ({ ...s, trips: s.trips.map((x) => (x.id === t.id ? { ...x, backendId: bid } : x)) }));
          }
        })
        .catch(() => { delete savedTripsRef.current[t.id]; });
    });
  }, [state.trips]);

  // ── Domain slices (#9) ──
  const actsMethods = useActsSlice({ setState, entities, refs, toast });
  const peopleMethods = usePeopleSlice({ setState, entities, refs, toast });
  const giftsMethods = useGiftsSlice({ setState, entities, refs, toast });
  const tripsMethods = useTripsSlice({ setState, entities, refs });
  const settingsMethods = useSettingsSlice({ setState, entities, refs, toast, base44, setPartnerData, actsMethods, peopleMethods });
  const contentMethods = useContentSlice({ setState, entities, refs, toast });
  const groupsMethods = useGroupsSlice({ setState, entities, toast });
  const memoryMethods = useMemorySlice({ setState, entities });

  // Slice methods are built from useCallback (stable references), but the
  // objects themselves are new every render. Stash them in a ref so the
  // memoized context value below doesn't churn — consumers that only use
  // methods (forms, buttons) don't re-render when unrelated state changes.
  const methodsRef = useRef({});
  methodsRef.current = {
    ...actsMethods,
    ...peopleMethods,
    ...giftsMethods,
    ...tripsMethods,
    ...settingsMethods,
    ...contentMethods,
    ...groupsMethods,
    ...memoryMethods,
  };

  // Memoize the context value so it only changes when state or partner
  // data changes — not on every provider render caused by parent updates.
  const contextValue = useMemo(() => ({
    ...state,
    isOffline,
    ensureLoaded,
    refresh,
    myName: state.myName,
    partnerName: partnerData.partnerName,
    partnerPeople: partnerData.people,
    partnerPets: partnerData.pets,
    partnerMovieIdeas: partnerData.movieIdeas,
    partnerBookIdeas: partnerData.bookIdeas,
    partnerSeriesIdeas: partnerData.seriesIdeas,
    partnerTreatIdeas: partnerData.treatIdeas,
    ...methodsRef.current,
    recommendations: DEFAULT_RECS,
  }), [state, isOffline, ensureLoaded, refresh, partnerData]);

  return (
    <KeepsakeContext.Provider value={contextValue}>
      {children}
    </KeepsakeContext.Provider>
  );
}

export function useKeepsake() {
  const ctx = useContext(globalThis.__KEEPSAKE_CONTEXT__ ?? KeepsakeContext);
  if (!ctx) throw new Error('useKeepsake must be used within KeepsakeProvider');
  return ctx;
}

// Context modules cannot be safely hot-swapped: HMR creates a new
// KeepsakeContext object while already-mounted components still hold the
// old reference, causing "useKeepsake must be used within KeepsakeProvider"
// on the next render. Declining HMR forces a clean full-page reload instead.
if (import.meta.hot) {
  import.meta.hot.decline();
}