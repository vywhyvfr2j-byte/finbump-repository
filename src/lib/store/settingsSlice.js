// #9: Settings, profile, preferences, and notifications domain slice.
// Extracted from keepsakeStore.jsx.
import { useCallback } from 'react';
import { loadDismissed, saveDismissed, loadClicked, saveClicked } from './helpers';
import { DEFAULT_STATE, DEFAULT_PARTNER_DATA, READ_TTL_MS } from './defaults';
import { removeCachedState } from '@/lib/accountCache';

function dayKeyToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function useSettingsSlice({ setState, entities, refs, toast, base44, setPartnerData, actsMethods, peopleMethods }) {
  const { myPreferencesRef, userPrefIdRef, notificationsRef, peopleRef, petsRef, updatePetRef } = refs;
  const { checkOffAct, uncheckAct, addCustomActs } = actsMethods;
  const { updatePerson } = peopleMethods;

  // New user: set the profile and create a Person entity for everyone named
  // during setup, so their dates are live in the reminders from the start.
  // `newPeople` is the list the shorter first run collects (partner, family,
  // friends); without it the legacy single-partner shape is used, so any older
  // caller keeps working. Each starter act carries the `personIndex` of the
  // person it was set up for (-1/absent = nobody in particular), so the act is
  // created once that person's record exists and linked to it.
  const completeOnboarding = useCallback((profile, selectedActs = [], newPeople = [], newPets = []) => {
    setState((s) => ({ ...s, onboarded: true, profile: { ...s.profile, ...profile } }));
    base44.auth.updateMe({ onboarded: true }).catch(() => {});

    const peopleToCreate = (Array.isArray(newPeople) && newPeople.length)
      ? newPeople
      : (profile.name
        ? [{ name: profile.name, relation: 'partner', birthday: profile.birthday || '', anniversary: profile.anniversary || '' }]
        : []);

    // Acts meant for nobody in particular are created straight away.
    const generalActs = selectedActs.filter((a) => !(a.personIndex >= 0));
    if (generalActs.length) {
      addCustomActs(generalActs.map(({ personIndex, ...a }) => ({ ...a, person: '', personId: '' })));
    }

    peopleToCreate.forEach((person, index) => {
      const personData = {
        name: person.name || 'My partner',
        preferredName: person.preferredName || '',
        relation: person.relation || 'partner',
        birthday: person.birthday || '',
        anniversary: person.anniversary || '',
        likes: (person.likes || []).filter(Boolean),
      };
      entities.Person.create(personData)
        .then((created) => {
          setState((s) => ({ ...s, people: [created, ...s.people] }));
          const mine = selectedActs.filter((a) => a.personIndex === index);
          if (mine.length) {
            addCustomActs(
              mine.map(({ personIndex, ...a }) => ({ ...a, person: created.name, personId: created.id }))
            );
          }
        })
        .catch(() => {});
    });

    // Pets named during setup, so their birthdays are alive in the reminders
    // from the start, the same way a person's dates are. A pet is created on
    // its own (unassigned, the way one added later can be) and can be linked to
    // whoever it belongs to afterwards.
    (Array.isArray(newPets) ? newPets : []).forEach((pet) => {
      if (!pet?.name) return;
      entities.Pet.create({
        name: pet.name,
        species: pet.species || '',
        birthday: pet.birthday || '',
      })
        .then((created) => setState((s) => ({ ...s, pets: [created, ...s.pets] })))
        .catch(() => {});
    });
  }, [addCustomActs]);

  const updateProfile = useCallback((patch) => {
    setState((s) => ({ ...s, profile: { ...s.profile, ...patch } }));
  }, []);

  const updateMyPreferences = useCallback((patch) => {
    const newPrefs = { ...myPreferencesRef.current, ...patch };
    setState((s) => ({ ...s, myPreferences: newPrefs }));
    if (userPrefIdRef.current) {
      entities.UserPreference.update(userPrefIdRef.current, newPrefs);
    } else {
      entities.UserPreference.create(newPrefs).then((created) => {
        userPrefIdRef.current = created.id;
      });
    }
  }, []);

  const updateSettings = useCallback((patch) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  }, []);

  const setDailyEncouragementContent = useCallback((content) => {
    setState((s) => ({ ...s, dailyEncouragementContent: content }));
  }, []);

  const setNotificationFeed = useCallback((fresh) => {
    setState((s) => {
      const dismissed = loadDismissed();
      const clicked = loadClicked();
      const todayKey = dayKeyToday();
      // Daily-dated items (id ends in YYYY-MM-DD) are meant to rotate per day
      // — a fresh instance is generated each morning. Stable (non-dated)
      // items (overdue, care, memory-refresh) persist until the user acts.
      const isDatedId = (id) => /-\d{4}-\d{2}-\d{2}$/.test(id);
      const notifDay = (n) => {
        if (n.dayKey) return n.dayKey;
        const m = n.id.match(/-(\d{4}-\d{2}-\d{2})$/);
        if (m) return m[1];
        if (n.createdAt) {
          const d = new Date(n.createdAt);
          if (!Number.isNaN(d.getTime())) {
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          }
        }
        return todayKey;
      };
      const freshMap = {};
      fresh.forEach((n) => { freshMap[n.id] = n; });
      // Retention rules:
      //  - Dismissed → always dropped.
      //  - Daily-dated items → keep only today's instance (they rotate).
      //  - Read/clicked items → struck through for the rest of today, then
      //    dropped on day rollover (next day they do not appear).
      //  - Unread items → persist across days until the user marks them.
      const kept = s.notifications
        .filter((n) => !dismissed[n.id])
        .filter((n) => {
          if (isDatedId(n.id)) return notifDay(n) === todayKey;
          const clickedDay = clicked[n.id];
          if (clickedDay) return clickedDay === todayKey;
          return true;
        })
        .map((n) => {
          const f = freshMap[n.id];
          return f ? { ...f, read: n.read ?? false, readAt: n.readAt, completed: n.completed ?? false, completedAt: n.completedAt } : n;
        });
      const seenIds = new Set();
      const dedupedKept = kept.filter((n) => {
        if (seenIds.has(n.id)) return false;
        seenIds.add(n.id);
        return true;
      });
      fresh.forEach((n) => {
        if (seenIds.has(n.id) || dismissed[n.id]) return;
        // Skip notifications clicked on a previous day — they should not
        // reappear after day rollover.
        const clickedDay = clicked[n.id];
        if (clickedDay && clickedDay < todayKey) return;
        seenIds.add(n.id);
        // Preserve read state across reloads: if the notification was
        // clicked today it stays with strikethrough for the rest of the day.
        dedupedKept.push({ ...n, read: clickedDay === todayKey });
      });
      // Content-based dedup: if two notifications have the same title + body,
      // keep only the oldest (first encountered — kept items come before fresh).
      const contentSeen = new Set();
      const contentDeduped = dedupedKept.filter((n) => {
        const key = `${n.title}||${n.body}`;
        if (contentSeen.has(key)) return false;
        contentSeen.add(key);
        return true;
      });
      return { ...s, notifications: contentDeduped };
    });
  }, []);

  const markNotificationRead = useCallback((notificationId) => {
    const now = Date.now();
    setState((s) => ({
      ...s,
      notifications: s.notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true, readAt: n.readAt || now } : n
      ),
    }));
    // Record the click so the notification doesn't reappear after day rollover.
    const todayKey = dayKeyToday();
    const clicked = loadClicked();
    if (clicked[notificationId] !== todayKey) {
      clicked[notificationId] = todayKey;
      saveClicked(clicked);
    }
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    const now = Date.now();
    const todayKey = dayKeyToday();
    setState((s) => ({
      ...s,
      notifications: s.notifications.map((n) => ({ ...n, read: true, readAt: n.readAt || now })),
    }));
    // Record all current notifications as clicked so they don't reappear.
    const clicked = loadClicked();
    let changed = false;
    notificationsRef.current.forEach((n) => {
      if (clicked[n.id] !== todayKey) {
        clicked[n.id] = todayKey;
        changed = true;
      }
    });
    if (changed) saveClicked(clicked);
  }, []);

  const clearNotifications = useCallback(() => {
    saveDismissed({});
    setState((s) => ({ ...s, notifications: [] }));
  }, []);

  const dismissNotification = useCallback((notificationId) => {
    const dismissed = loadDismissed();
    dismissed[notificationId] = Date.now() + READ_TTL_MS;
    saveDismissed(dismissed);
    setState((s) => ({ ...s, notifications: s.notifications.filter((n) => n.id !== notificationId) }));
  }, []);

  const toggleNotificationCompleted = useCallback((notificationId) => {
    const notification = notificationsRef.current.find((n) => n.id === notificationId);
    if (!notification) return;
    const newCompleted = !notification.completed;
    if (newCompleted) {
      // Completing crosses out the notification (line-through) but keeps it
      // visible for the rest of the day. It auto-clears at day rollover.
      const now = Date.now();
      setState((s) => ({
        ...s,
        notifications: s.notifications.map((n) =>
          n.id === notificationId ? { ...n, completed: true, completedAt: now, read: true, readAt: n.readAt || now } : n
        ),
      }));
      // Record the click so the notification doesn't reappear after day rollover.
      const todayKey = dayKeyToday();
      const clicked = loadClicked();
      if (clicked[notificationId] !== todayKey) {
        clicked[notificationId] = todayKey;
        saveClicked(clicked);
      }
    } else {
      setState((s) => ({
        ...s,
        notifications: s.notifications.map((n) => (n.id === notificationId ? { ...n, completed: false, read: true } : n)),
      }));
    }
    const isPet = petsRef.current.some((p) => p.id === notification.personId);
    const updateCare = isPet ? updatePetRef.current : updatePerson;
    if (newCompleted) {
      if (notification.type === 'overdue' || notification.type === 'due') {
        checkOffAct(notification.itemId);
      } else if (notification.type === 'prayer' && notification.personId) {
        updateCare(notification.personId, { lastPrayedAt: new Date().toISOString() });
      } else if (notification.type === 'prayer' && notification.itemId === 'prayer-list') {
        const ts = new Date().toISOString();
        peopleRef.current.filter((p) => p.prayerEnabled && p.notify !== false)
          .forEach((p) => updatePerson(p.id, { lastPrayedAt: ts }));
        petsRef.current.filter((p) => p.prayerEnabled && p.notify !== false)
          .forEach((p) => updatePetRef.current?.(p.id, { lastPrayedAt: ts }));
      } else if (notification.type === 'care' && notification.personId) {
        const ts = new Date().toISOString();
        const updates = {};
        (notification.careTypes || []).forEach((t) => {
          if (t === 'health') updates.lastHealthCheckIn = ts;
          if (t === 'other') updates.lastOtherCheckIn = ts;
        });
        if (Object.keys(updates).length) updateCare(notification.personId, updates);
      } else if (notification.type === 'health' && notification.personId) {
        updateCare(notification.personId, { lastHealthCheckIn: new Date().toISOString() });
      } else if (notification.type === 'other' && notification.personId) {
        updateCare(notification.personId, { lastOtherCheckIn: new Date().toISOString() });
      } else if (notification.type === 'memory_refresh' && notification.itemId) {
        setState((s) => ({ ...s, memoryRefreshes: s.memoryRefreshes.map((m) => (m.id === notification.itemId ? { ...m, done: true } : m)) }));
        entities.MemoryRefresh.update(notification.itemId, { done: true }).catch(() => {});
      }
    } else {
      if (notification.type === 'memory_refresh' && notification.itemId) {
        setState((s) => ({ ...s, memoryRefreshes: s.memoryRefreshes.map((m) => (m.id === notification.itemId ? { ...m, done: false } : m)) }));
        entities.MemoryRefresh.update(notification.itemId, { done: false }).catch(() => {});
      }
      if (notification.type === 'overdue' || notification.type === 'due') {
        uncheckAct(notification.itemId);
      } else if (notification.type === 'prayer' && notification.personId) {
        updateCare(notification.personId, { lastPrayedAt: null });
      } else if (notification.type === 'prayer' && notification.itemId === 'prayer-list') {
        peopleRef.current.filter((p) => p.prayerEnabled && p.notify !== false)
          .forEach((p) => updatePerson(p.id, { lastPrayedAt: null }));
        petsRef.current.filter((p) => p.prayerEnabled && p.notify !== false)
          .forEach((p) => updatePetRef.current?.(p.id, { lastPrayedAt: null }));
      } else if (notification.type === 'care' && notification.personId) {
        const updates = {};
        (notification.careTypes || []).forEach((t) => {
          if (t === 'health') updates.lastHealthCheckIn = null;
          if (t === 'other') updates.lastOtherCheckIn = null;
        });
        if (Object.keys(updates).length) updateCare(notification.personId, updates);
      } else if (notification.type === 'health' && notification.personId) {
        updateCare(notification.personId, { lastHealthCheckIn: null });
      } else if (notification.type === 'other' && notification.personId) {
        updateCare(notification.personId, { lastOtherCheckIn: null });
      }
    }
  }, [checkOffAct, uncheckAct, updatePerson]);

  const resetAll = useCallback(() => {
    removeCachedState();
    setState(DEFAULT_STATE);
  }, []);

  const deleteAccount = useCallback(async () => {
    await Promise.all([
      entities.Person.deleteMany({}), entities.Pet.deleteMany({}),
      entities.MovieIdea.deleteMany({}), entities.BookIdea.deleteMany({}),
      entities.SeriesIdea.deleteMany({}), entities.TreatIdea.deleteMany({}),
      entities.Trip.deleteMany({}), entities.DigestSnapshot.deleteMany({}),
      entities.Act.deleteMany({}), entities.ActCompletion.deleteMany({}),
      entities.Event.deleteMany({}), entities.GiftIdea.deleteMany({}),
      entities.Milestone.deleteMany({}), entities.PersonalNote.deleteMany({}),
      entities.Goal.deleteMany({}), entities.CommLog.deleteMany({}),
      entities.FavoriteIdea.deleteMany({}), entities.UserPreference.deleteMany({}),
      entities.PrayerRequest.deleteMany({}), entities.PassCode.deleteMany({}),
      entities.SupportMessage.deleteMany({}), entities.AnalyticsEvent.deleteMany({}),
      entities.MemoryRefresh.deleteMany({}),
    ]).catch(() => {});
    removeCachedState();
    setState(DEFAULT_STATE);
  }, []);

  const unpair = useCallback(async () => {
    try {
      await base44.functions.invoke('unpair', {});
      setPartnerData(DEFAULT_PARTNER_DATA);
      toast({ title: 'Unpaired', duration: 3000 });
    } catch {
      toast({ title: 'Could not unpair', variant: 'destructive', duration: 3000 });
    }
  }, []);

  return {
    completeOnboarding, updateProfile, updateMyPreferences, updateSettings,
    setDailyEncouragementContent, setNotificationFeed, markAllNotificationsRead,
    markNotificationRead, clearNotifications, dismissNotification, toggleNotificationCompleted, resetAll, deleteAccount, unpair,
  };
}