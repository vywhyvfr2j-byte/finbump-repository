// #9: Acts domain slice — extracted from keepsakeStore.jsx. Pure method
// factory: takes the shared store context and returns act CRUD methods.
// Testable in isolation (pass a mock setState/entities/refs).
import React, { useCallback } from 'react';
import { ToastAction } from '@/components/ui/toast';

// Tracks the most recent undo toast so we can dismiss it before showing a new one
let lastUndoToast = null;

export function useActsSlice({ setState, entities, refs, toast }) {
  const { actsRef } = refs;

  const checkOffAct = useCallback((actId) => {
    const now = new Date().toISOString();
    setState((s) => {
      const act = s.acts.find((a) => a.id === actId);
      return {
        ...s,
        acts: s.acts.map((a) => (a.id === actId ? { ...a, lastCompleted: now } : a)),
        history: act
          ? [{ id: 'h' + Date.now(), actId, actName: act.name, emoji: act.emoji, completedAt: now }, ...s.history]
          : s.history,
      };
    });
    const act = actsRef.current.find((a) => a.id === actId);
    let completionId = null;
    if (act?.created_date) {
      entities.Act.update(actId, { lastCompleted: now });
      entities.ActCompletion.create({ actId, actName: act.name, emoji: act.emoji, completedAt: now }).then((c) => {
        completionId = c.id;
      });
    }
    // Loaded on demand so the confetti library stays out of the app's first
    // paint — it only matters the moment an act is checked off.
    import('canvas-confetti').then(({ default: confetti }) => confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.6 },
      colors: ['#E87878', '#FFD93D', '#18A999', '#FF6B6B'],
      disableForReducedMotion: true,
      scalar: 0.7,
    }));
    // Undo safety net — revert the completion if tapped within the toast window.
    if (lastUndoToast) lastUndoToast.dismiss();
    lastUndoToast = toast({
      title: 'Act completed',
      duration: 5000,
      action: React.createElement(ToastAction, {
        altText: 'Undo',
        onClick: () => {
          setState((s) => ({
            ...s,
            acts: s.acts.map((a) => (a.id === actId ? { ...a, lastCompleted: null } : a)),
            history: s.history.filter((h) => !(h.actId === actId && h.completedAt === now)),
          }));
          entities.Act.update(actId, { lastCompleted: null });
          if (completionId) entities.ActCompletion.delete(completionId).catch(() => {});
        },
      }, 'Undo'),
    });
  }, []);

  const uncheckAct = useCallback((actId) => {
    setState((s) => ({
      ...s,
      acts: s.acts.map((a) => (a.id === actId ? { ...a, lastCompleted: null } : a)),
    }));
    entities.Act.update(actId, { lastCompleted: null });
  }, []);

  const addCustomAct = useCallback((act) => {
    const tempId = 'a' + Date.now();
    setState((s) => ({
      ...s,
      acts: [...s.acts, { id: tempId, intervalDays: 7, emoji: '✨', lastCompleted: null, ...act }],
    }));
    entities.Act.create({ intervalDays: 7, emoji: '✨', lastCompleted: null, ...act }).then((created) => {
      setState((s) => ({ ...s, acts: s.acts.map((a) => (a.id === tempId ? created : a)) }));
    });
  }, []);

  const addCustomActs = useCallback((patches) => {
    if (!patches.length) return;
    const base = Date.now();
    const tempActs = patches.map((p, i) => ({
      id: `a${base}-${i}`,
      intervalDays: 7,
      emoji: '✨',
      lastCompleted: null,
      ...p,
    }));
    setState((s) => ({ ...s, acts: [...s.acts, ...tempActs] }));
    tempActs.forEach((t) => {
      const { id, ...payload } = t;
      entities.Act.create(payload).then((created) => {
        setState((s) => ({ ...s, acts: s.acts.map((a) => (a.id === id ? created : a)) }));
      });
    });
  }, []);

  const updateAct = useCallback((id, patch) => {
    setState((s) => ({ ...s, acts: s.acts.map((a) => (a.id === id ? { ...a, ...patch } : a)) }));
    entities.Act.update(id, patch);
  }, []);

  const deleteAct = useCallback((id) => {
    const act = actsRef.current.find((a) => a.id === id);
    setState((s) => ({ ...s, acts: s.acts.filter((a) => a.id !== id) }));
    const undoTimer = setTimeout(() => {
      if (act?.created_date) {
        entities.Act.delete(id);
        entities.ActCompletion.deleteMany({ actId: id }).catch(() => {});
      }
    }, 4000);
    // Dismiss any previous undo toast so they don't stack up
    if (lastUndoToast) lastUndoToast.dismiss();
    lastUndoToast = toast({
      title: 'Act removed',
      duration: 4500,
      action: React.createElement(ToastAction, {
        altText: 'Undo',
        onClick: () => {
          clearTimeout(undoTimer);
          if (act) {
            setState((s) => {
              if (s.acts.some((a) => a.id === id)) return s;
              return { ...s, acts: [...s.acts, act] };
            });
          }
        },
      }, 'Undo'),
    });
  }, []);

  return { checkOffAct, uncheckAct, addCustomAct, addCustomActs, updateAct, deleteAct };
}