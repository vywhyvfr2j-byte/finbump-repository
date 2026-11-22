// #9: Content domain slice — events, milestones, notes, goals, commLog,
// personal needs, ideas (movies/books/series/vacation/getaway/favorites).
// Extracted from keepsakeStore.jsx.
import { useCallback } from 'react';
import { TREAT_CATEGORIES, FAVORITE_IDEA_CATEGORIES } from './defaults';

export function useContentSlice({ setState, entities, refs, toast }) {
  const { goalsRef } = refs;

  // ── Events ──
  const addEvent = useCallback((event) => {
    const tempId = 'e' + Date.now();
    setState((s) => ({ ...s, events: [...s.events, { ...event, id: tempId }] }));
    entities.Event.create(event).then((created) => {
      setState((s) => ({ ...s, events: s.events.map((e) => (e.id === tempId ? created : e)) }));
    });
  }, []);
  const updateEvent = useCallback((id, patch) => {
    setState((s) => ({ ...s, events: s.events.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));
    entities.Event.update(id, patch);
  }, []);
  const deleteEvent = useCallback((id) => {
    setState((s) => ({ ...s, events: s.events.filter((e) => e.id !== id) }));
    entities.Event.delete(id);
  }, []);
  const completeEvent = useCallback((id) => {
    const now = new Date().toISOString();
    setState((s) => ({ ...s, events: s.events.map((e) => (e.id === id ? { ...e, lastCompletedAt: now } : e)) }));
    entities.Event.update(id, { lastCompletedAt: now });
  }, []);

  // ── Milestones ──
  const addMilestone = useCallback((milestone) => {
    const tempId = 'm' + Date.now();
    setState((s) => ({ ...s, milestones: [{ id: tempId, ...milestone }, ...s.milestones] }));
    entities.Milestone.create(milestone).then((created) => {
      setState((s) => ({ ...s, milestones: s.milestones.map((m) => (m.id === tempId ? created : m)) }));
    });
  }, []);
  const completeMilestone = useCallback((id) => {
    const now = new Date().toISOString();
    setState((s) => ({ ...s, milestones: s.milestones.map((m) => (m.id === id ? { ...m, lastCompletedAt: now } : m)) }));
    entities.Milestone.update(id, { lastCompletedAt: now });
  }, []);
  const updateMilestone = useCallback((id, patch) => {
    setState((s) => ({ ...s, milestones: s.milestones.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
    entities.Milestone.update(id, patch);
  }, []);
  const deleteMilestone = useCallback((id) => {
    setState((s) => ({ ...s, milestones: s.milestones.filter((m) => m.id !== id) }));
    entities.Milestone.delete(id).catch(() => {});
  }, []);

  // ── Personal notes ──
  const addPersonalNote = useCallback((text, type = 'general', personId = null) => {
    const tempId = 'n' + Date.now();
    const nowIso = new Date().toISOString();
    setState((s) => ({ ...s, personalNotes: [{ id: tempId, text, type, personId, createdAt: nowIso, created_date: nowIso }, ...s.personalNotes] }));
    entities.PersonalNote.create({ text, type, ...(personId ? { personId } : {}) }).then((created) => {
      setState((s) => ({ ...s, personalNotes: s.personalNotes.map((n) => (n.id === tempId ? created : n)) }));
    });
  }, []);
  const updatePersonalNote = useCallback((id, patch) => {
    setState((s) => ({ ...s, personalNotes: s.personalNotes.map((n) => (n.id === id ? { ...n, ...patch } : n)) }));
    entities.PersonalNote.update(id, patch);
  }, []);
  const deletePersonalNote = useCallback((id) => {
    setState((s) => ({ ...s, personalNotes: s.personalNotes.filter((n) => n.id !== id) }));
    entities.PersonalNote.delete(id);
  }, []);

  // Evening memory-moment answer. The moment joins the timeline the instant the
  // user saves, then writes to the backend behind them. `persisted` settles with
  // that write, so the composer can put the words back in the box (and say so)
  // if it fails — an answer is never silently lost.
  const saveMemoryMoment = useCallback((text, memoryDate, photos = []) => {
    const tempId = 'n' + Date.now();
    const nowIso = new Date().toISOString();
    const payload = {
      text,
      type: 'memory',
      memoryDate,
      ...(photos.length ? { photos } : {}),
    };
    setState((s) => ({
      ...s,
      personalNotes: [{ id: tempId, ...payload, createdAt: nowIso, created_date: nowIso }, ...(s.personalNotes || [])],
    }));
    const persisted = entities.PersonalNote.create(payload)
      .then((created) => {
        setState((s) => ({
          ...s,
          personalNotes: (s.personalNotes || []).map((n) => (n.id === tempId ? created : n)),
        }));
        return created;
      })
      .catch((err) => {
        setState((s) => ({
          ...s,
          personalNotes: (s.personalNotes || []).filter((n) => n.id !== tempId),
        }));
        throw err;
      });
    return { id: tempId, persisted };
  }, []);

  // ── Goals ──
  const addGoal = useCallback((goal) => {
    const tempId = 'go' + Date.now();
    setState((s) => ({ ...s, goals: [{ id: tempId, done: false, ...goal }, ...s.goals] }));
    entities.Goal.create({ done: false, ...goal }).then((created) => {
      setState((s) => ({ ...s, goals: s.goals.map((g) => (g.id === tempId ? created : g)) }));
    });
  }, []);
  const toggleGoal = useCallback((id) => {
    const g = goalsRef.current.find((x) => x.id === id);
    const newDone = g ? !g.done : true;
    const completedAt = newDone ? new Date().toISOString() : null;
    if (g) entities.Goal.update(id, { done: newDone, completedAt });
    setState((s) => ({ ...s, goals: s.goals.map((x) => (x.id === id ? { ...x, done: newDone, completedAt } : x)) }));
  }, []);
  const updateGoal = useCallback((id, patch) => {
    setState((s) => ({ ...s, goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) }));
    entities.Goal.update(id, patch);
  }, []);
  const deleteGoal = useCallback((id) => {
    setState((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== id) }));
    entities.Goal.delete(id);
  }, []);

  // ── Comm log ──
  const addLogEntry = useCallback((text) => {
    const tempId = 'l' + Date.now();
    setState((s) => ({ ...s, commLog: [{ id: tempId, text, createdAt: new Date().toISOString() }, ...s.commLog] }));
    entities.CommLog.create({ text }).then((created) => {
      setState((s) => ({ ...s, commLog: s.commLog.map((l) => (l.id === tempId ? created : l)) }));
    });
  }, []);
  const deleteLogEntry = useCallback((id) => {
    setState((s) => ({ ...s, commLog: s.commLog.filter((l) => l.id !== id) }));
    entities.CommLog.delete(id);
  }, []);

  // ── Personal needs ──
  const addPersonalNeed = useCallback((request) => {
    const label = request.category === 'health' ? 'Health need saved' : request.category === 'other' ? 'Need saved' : 'Prayer request saved';
    const tempId = 'pr' + Date.now();
    setState((s) => ({ ...s, personalNeeds: [{ id: tempId, ...request }, ...s.personalNeeds] }));
    entities.PrayerRequest.create(request).then((created) => {
      setState((s) => ({ ...s, personalNeeds: s.personalNeeds.map((r) => (r.id === tempId ? created : r)) }));
    });
  }, []);
  const updatePersonalNeed = useCallback((id, patch) => {
    setState((s) => ({ ...s, personalNeeds: s.personalNeeds.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
    entities.PrayerRequest.update(id, patch);
  }, []);
  const deletePersonalNeed = useCallback((id) => {
    setState((s) => ({ ...s, personalNeeds: s.personalNeeds.filter((r) => r.id !== id) }));
    entities.PrayerRequest.delete(id);
  }, []);

  // ── Movie ideas ──
  const addMovieIdea = useCallback((movie) => {
    const tempId = 'mv' + Date.now();
    setState((s) => ({ ...s, movieIdeas: [{ id: tempId, watched: false, ...movie }, ...s.movieIdeas] }));
    entities.MovieIdea.create({ watched: false, ...movie }).then((created) => {
      setState((s) => ({ ...s, movieIdeas: s.movieIdeas.map((m) => (m.id === tempId ? created : m)) }));
    });
  }, []);
  const toggleMovieWatched = useCallback((id) => {
    setState((s) => {
      const item = s.movieIdeas.find((m) => m.id === id);
      if (item) entities.MovieIdea.update(id, { watched: !item.watched });
      return { ...s, movieIdeas: s.movieIdeas.map((m) => (m.id === id ? { ...m, watched: !m.watched } : m)) };
    });
  }, []);
  const deleteMovieIdea = useCallback((id) => {
    setState((s) => ({ ...s, movieIdeas: s.movieIdeas.filter((m) => m.id !== id) }));
    entities.MovieIdea.delete(id);
  }, []);
  const updateMovieIdea = useCallback((id, patch) => {
    setState((s) => ({ ...s, movieIdeas: s.movieIdeas.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
    entities.MovieIdea.update(id, patch);
  }, []);

  // ── Book ideas ──
  const addBookIdea = useCallback((book) => {
    const tempId = 'bk' + Date.now();
    setState((s) => ({ ...s, bookIdeas: [{ id: tempId, read: false, ...book }, ...s.bookIdeas] }));
    entities.BookIdea.create({ read: false, ...book }).then((created) => {
      setState((s) => ({ ...s, bookIdeas: s.bookIdeas.map((b) => (b.id === tempId ? created : b)) }));
    });
  }, []);
  const toggleBookRead = useCallback((id) => {
    setState((s) => {
      const item = s.bookIdeas.find((b) => b.id === id);
      if (item) entities.BookIdea.update(id, { read: !item.read });
      return { ...s, bookIdeas: s.bookIdeas.map((b) => (b.id === id ? { ...b, read: !b.read } : b)) };
    });
  }, []);
  const deleteBookIdea = useCallback((id) => {
    setState((s) => ({ ...s, bookIdeas: s.bookIdeas.filter((b) => b.id !== id) }));
    entities.BookIdea.delete(id);
  }, []);
  const updateBookIdea = useCallback((id, patch) => {
    setState((s) => ({ ...s, bookIdeas: s.bookIdeas.map((b) => (b.id === id ? { ...b, ...patch } : b)) }));
    entities.BookIdea.update(id, patch);
  }, []);

  // ── Vacation ideas ──
  const addVacationIdea = useCallback((idea) => {
    const tempId = 'vc' + Date.now();
    setState((s) => ({ ...s, vacationIdeas: [{ id: tempId, ...idea }, ...s.vacationIdeas] }));
    entities.FavoriteIdea.create({ ...idea, category: 'vacationIdeas' }).then((created) => {
      setState((s) => ({ ...s, vacationIdeas: s.vacationIdeas.map((v) => (v.id === tempId ? created : v)) }));
    });
  }, []);
  const deleteVacationIdea = useCallback((id) => {
    setState((s) => ({ ...s, vacationIdeas: s.vacationIdeas.filter((v) => v.id !== id) }));
    entities.FavoriteIdea.delete(id);
  }, []);
  const updateVacationIdea = useCallback((id, patch) => {
    setState((s) => ({ ...s, vacationIdeas: s.vacationIdeas.map((v) => (v.id === id ? { ...v, ...patch } : v)) }));
    entities.FavoriteIdea.update(id, patch);
  }, []);

  // ── Getaway ideas ──
  const addGetawayIdea = useCallback((idea) => {
    const tempId = 'gw' + Date.now();
    setState((s) => ({ ...s, getawayIdeas: [{ id: tempId, ...idea }, ...s.getawayIdeas] }));
    entities.FavoriteIdea.create({ ...idea, category: 'getawayIdeas' }).then((created) => {
      setState((s) => ({ ...s, getawayIdeas: s.getawayIdeas.map((g) => (g.id === tempId ? created : g)) }));
    });
  }, []);
  const deleteGetawayIdea = useCallback((id) => {
    setState((s) => ({ ...s, getawayIdeas: s.getawayIdeas.filter((g) => g.id !== id) }));
    entities.FavoriteIdea.delete(id);
  }, []);
  const updateGetawayIdea = useCallback((id, patch) => {
    setState((s) => ({ ...s, getawayIdeas: s.getawayIdeas.map((g) => (g.id === id ? { ...g, ...patch } : g)) }));
    entities.FavoriteIdea.update(id, patch);
  }, []);

  // ── Series ideas ──
  const addSeriesIdea = useCallback((series) => {
    const tempId = 'sr' + Date.now();
    setState((s) => ({ ...s, seriesIdeas: [{ id: tempId, watched: false, ...series }, ...s.seriesIdeas] }));
    entities.SeriesIdea.create({ watched: false, ...series }).then((created) => {
      setState((s) => ({ ...s, seriesIdeas: s.seriesIdeas.map((sr) => (sr.id === tempId ? created : sr)) }));
    });
  }, []);
  const toggleSeriesWatched = useCallback((id) => {
    setState((s) => {
      const item = s.seriesIdeas.find((sr) => sr.id === id);
      if (item) entities.SeriesIdea.update(id, { watched: !item.watched });
      return { ...s, seriesIdeas: s.seriesIdeas.map((sr) => (sr.id === id ? { ...sr, watched: !sr.watched } : sr)) };
    });
  }, []);
  const deleteSeriesIdea = useCallback((id) => {
    setState((s) => ({ ...s, seriesIdeas: s.seriesIdeas.filter((sr) => sr.id !== id) }));
    entities.SeriesIdea.delete(id);
  }, []);

  // ── Favorites (treats + road trips + dinners) ──
  const addFavorite = useCallback((category, item) => {
    const tempId = category.slice(0, 2) + Date.now();
    setState((s) => ({ ...s, [category]: [{ id: tempId, ...item }, ...s[category]] }));
    if (TREAT_CATEGORIES.includes(category)) {
      entities.TreatIdea.create({ ...item, category }).then((created) => {
        setState((s) => ({ ...s, [category]: s[category].map((f) => (f.id === tempId ? created : f)) }));
      });
    } else if (FAVORITE_IDEA_CATEGORIES.has(category)) {
      entities.FavoriteIdea.create({ ...item, category }).then((created) => {
        setState((s) => ({ ...s, [category]: s[category].map((f) => (f.id === tempId ? created : f)) }));
      });
    }
  }, []);
  const deleteFavorite = useCallback((category, id) => {
    setState((s) => ({ ...s, [category]: s[category].filter((f) => f.id !== id) }));
    if (TREAT_CATEGORIES.includes(category)) entities.TreatIdea.delete(id);
    else if (FAVORITE_IDEA_CATEGORIES.has(category)) entities.FavoriteIdea.delete(id);
  }, []);
  const updateFavorite = useCallback((category, id, patch) => {
    setState((s) => ({ ...s, [category]: s[category].map((f) => (f.id === id ? { ...f, ...patch } : f)) }));
    if (TREAT_CATEGORIES.includes(category)) entities.TreatIdea.update(id, patch);
    else if (FAVORITE_IDEA_CATEGORIES.has(category)) entities.FavoriteIdea.update(id, patch);
  }, []);

  return {
    addEvent, updateEvent, deleteEvent, completeEvent,
    addMilestone, completeMilestone, updateMilestone, deleteMilestone,
    addPersonalNote, updatePersonalNote, deletePersonalNote, saveMemoryMoment,
    addGoal, toggleGoal, updateGoal, deleteGoal,
    addLogEntry, deleteLogEntry,
    addPersonalNeed, updatePersonalNeed, deletePersonalNeed,
    addMovieIdea, toggleMovieWatched, deleteMovieIdea, updateMovieIdea,
    addBookIdea, toggleBookRead, deleteBookIdea, updateBookIdea,
    addVacationIdea, deleteVacationIdea, updateVacationIdea,
    addGetawayIdea, deleteGetawayIdea, updateGetawayIdea,
    addSeriesIdea, toggleSeriesWatched, deleteSeriesIdea,
    addFavorite, deleteFavorite, updateFavorite,
  };
}