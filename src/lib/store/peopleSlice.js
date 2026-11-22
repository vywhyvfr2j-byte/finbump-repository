// #9: People & pets domain slice — extracted from keepsakeStore.jsx.
import { useCallback } from 'react';

export function usePeopleSlice({ setState, entities, refs, toast }) {
  const { updatePetRef, petsRef } = refs;

  const addPerson = useCallback((person) => {
    const tempId = 'p' + Date.now();
    setState((s) => ({ ...s, people: [{ id: tempId, ...person }, ...s.people] }));
    entities.Person.create(person).then((created) => {
      setState((s) => ({
        ...s,
        people: s.people.map((p) => (p.id === tempId ? created : p)),
        movieIdeas: s.movieIdeas.map((m) => (m.personId === tempId ? { ...m, personId: created.id } : m)),
        bookIdeas: s.bookIdeas.map((b) => (b.personId === tempId ? { ...b, personId: created.id } : b)),
        seriesIdeas: s.seriesIdeas.map((sr) => (sr.personId === tempId ? { ...sr, personId: created.id } : sr)),
        drinks: s.drinks.map((t) => (t.personId === tempId ? { ...t, personId: created.id } : t)),
        snacks: s.snacks.map((t) => (t.personId === tempId ? { ...t, personId: created.id } : t)),
        meals: s.meals.map((t) => (t.personId === tempId ? { ...t, personId: created.id } : t)),
        desserts: s.desserts.map((t) => (t.personId === tempId ? { ...t, personId: created.id } : t)),
      }));
    });
    return tempId;
  }, []);

  // Returns the record write so callers can wait for it: a save that only
  // updates local state looks successful while the stored contact still holds
  // the old details, so the next load shows the edit snapping back.
  const updatePerson = useCallback((id, patch) => {
    setState((s) => ({ ...s, people: s.people.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
    return entities.Person.update(id, patch);
  }, []);

  const deletePerson = useCallback((id) => {
    setState((s) => {
      const person = s.people.find((p) => p.id === id);
      const name = person?.name;
      return {
        ...s,
        people: s.people.filter((p) => p.id !== id),
        // Cascade-remove all person-scoped data so reminders (acts, memory
        // refreshes) and other tied records don't linger after the profile is gone.
        acts: s.acts.filter((a) => a.personId !== id && (!name || a.person !== name)),
        events: (s.events || []).filter((e) => e.personId !== id && (!name || (e.name !== `${name}'s Birthday` && e.name !== `${name}'s Anniversary`))),
        memoryRefreshes: (s.memoryRefreshes || []).filter((m) => m.personId !== id),
        giftIdeas: s.giftIdeas.filter((g) => g.personId !== id),
        goals: (s.goals || []).filter((g) => g.personId !== id),
        personalNotes: (s.personalNotes || []).filter((n) => n.personId !== id),
        commLog: (s.commLog || []).filter((c) => c.personId !== id),
        movieIdeas: (s.movieIdeas || []).filter((m) => m.personId !== id),
        bookIdeas: (s.bookIdeas || []).filter((b) => b.personId !== id),
        seriesIdeas: (s.seriesIdeas || []).filter((sr) => sr.personId !== id),
        drinks: (s.drinks || []).filter((t) => t.personId !== id),
        snacks: (s.snacks || []).filter((t) => t.personId !== id),
        meals: (s.meals || []).filter((t) => t.personId !== id),
        desserts: (s.desserts || []).filter((t) => t.personId !== id),
        trips: (s.trips || []).filter((t) => t.personId !== id),
        personalNeeds: (s.personalNeeds || []).filter((n) => n.recipientId !== id),
        // Drop any in-app notifications tied to this person so their care
        // reminder, overdue/due act notices, and occasion alerts don't linger
        // in the feed after the profile is gone. The feed merge in
        // setNotificationFeed otherwise keeps stale unread stable-id items.
        notifications: (s.notifications || []).filter((n) => n.personId !== id && n.personName !== name),
      };
    });
    entities.Person.delete(id);
    // Cascade-delete person-scoped records from the backend so they don't
    // reappear on reload or keep firing reminders.
    entities.Event.deleteMany({ personId: id }).catch(() => {});
    if (name) {
      entities.Event.deleteMany({ name: `${name}'s Birthday` }).catch(() => {});
      entities.Event.deleteMany({ name: `${name}'s Anniversary` }).catch(() => {});
    }
    entities.Act.deleteMany({ personId: id }).catch(() => {});
    entities.MemoryRefresh.deleteMany({ personId: id }).catch(() => {});
    entities.GiftIdea.deleteMany({ personId: id }).catch(() => {});
    entities.Goal.deleteMany({ personId: id }).catch(() => {});
    entities.PersonalNote.deleteMany({ personId: id }).catch(() => {});
    entities.CommLog.deleteMany({ personId: id }).catch(() => {});
    entities.MovieIdea.deleteMany({ personId: id }).catch(() => {});
    entities.BookIdea.deleteMany({ personId: id }).catch(() => {});
    entities.SeriesIdea.deleteMany({ personId: id }).catch(() => {});
    entities.TreatIdea.deleteMany({ personId: id }).catch(() => {});
    entities.Trip.deleteMany({ personId: id }).catch(() => {});
    entities.PrayerRequest.deleteMany({ recipientId: id }).catch(() => {});
  }, []);

  const addPet = useCallback((pet) => {
    const tempId = 'pt' + Date.now();
    setState((s) => ({ ...s, pets: [{ id: tempId, ...pet }, ...s.pets] }));
    entities.Pet.create(pet).then((created) => {
      setState((s) => ({
        ...s,
        pets: s.pets.map((p) => (p.id === tempId ? created : p)),
        giftIdeas: s.giftIdeas.map((g) => (g.personId === tempId ? { ...g, personId: created.id } : g)),
      }));
    });
    return tempId;
  }, []);

  const updatePet = useCallback((id, patch) => {
    setState((s) => ({ ...s, pets: s.pets.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
    entities.Pet.update(id, patch);
  }, []);

  const deletePet = useCallback((id) => {
    setState((s) => {
      const pet = s.pets.find((p) => p.id === id);
      const name = pet?.name;
      return {
        ...s,
        pets: s.pets.filter((p) => p.id !== id),
        events: (s.events || []).filter((e) => e.personId !== id && (!name || (e.name !== `${name}'s Birthday` && e.name !== `${name}'s Adoption Day`))),
        notifications: (s.notifications || []).filter((n) => n.personId !== id && n.personName !== name),
      };
    });
    entities.Pet.delete(id);
    entities.Event.deleteMany({ personId: id }).catch(() => {});
    const petName = petsRef?.current?.find((p) => p.id === id)?.name;
    if (petName) {
      entities.Event.deleteMany({ name: `${petName}'s Birthday` }).catch(() => {});
      entities.Event.deleteMany({ name: `${petName}'s Adoption Day` }).catch(() => {});
    }
  }, []);

  // Expose updatePet to the notifications slice via ref.
  if (updatePetRef) updatePetRef.current = updatePet;

  const requestPersonSync = useCallback((personId) => {
    setState((s) =>
      s.syncRequests.some((r) => (typeof r === 'string' ? r === personId : r.personId === personId))
        ? s
        : {
            ...s,
            syncRequests: [...s.syncRequests, { personId, requestedAt: new Date().toISOString(), verifiedAt: null }],
          }
    );
  }, []);

  const cancelPersonSyncRequest = useCallback((personId) => {
    setState((s) => ({
      ...s,
      syncRequests: s.syncRequests.filter((r) => (typeof r === 'string' ? r !== personId : r.personId !== personId)),
    }));
  }, []);

  const verifyPersonSync = useCallback((personId) => {
    setState((s) => ({
      ...s,
      syncRequests: s.syncRequests.map((r) =>
        typeof r === 'string' || r.personId !== personId ? r : { ...r, verifiedAt: new Date().toISOString() }
      ),
    }));
  }, []);

  const reloadPeople = useCallback(async () => {
    const people = await entities.Person.list();
    setState((s) => ({ ...s, people }));
  }, []);

  return {
    addPerson, updatePerson, deletePerson,
    addPet, updatePet, deletePet,
    requestPersonSync, cancelPersonSyncRequest, verifyPersonSync,
    reloadPeople,
  };
}