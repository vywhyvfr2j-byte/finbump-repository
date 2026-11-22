// #9: Gifts domain slice — extracted from keepsakeStore.jsx.
import { useCallback } from 'react';

export function useGiftsSlice({ setState, entities, refs, toast }) {
  const { giftIdeasRef } = refs;

  const addGiftIdea = useCallback((idea) => {
    const tempId = `g${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setState((s) => ({
      ...s,
      giftIdeas: [{ id: tempId, purchased: false, ...idea }, ...s.giftIdeas],
    }));
    entities.GiftIdea.create({ purchased: false, ...idea }).then((created) => {
      setState((s) => ({ ...s, giftIdeas: s.giftIdeas.map((g) => (g.id === tempId ? created : g)) }));
    });
  }, []);

  const toggleGiftPurchased = useCallback((id) => {
    const g = giftIdeasRef.current.find((x) => x.id === id);
    if (!g) return;
    const purchased = !g.purchased;
    const patch = { purchased, purchasedAt: purchased ? new Date().toISOString() : null };
    setState((s) => ({ ...s, giftIdeas: s.giftIdeas.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
    entities.GiftIdea.update(id, patch);
  }, []);

  const cycleGiftStatus = useCallback((id) => {
    const g = giftIdeasRef.current.find((x) => x.id === id);
    if (!g) return;
    let patch;
    if (g.gifted) {
      patch = { gifted: false, purchased: false, giftedAt: null, purchasedAt: null };
    } else if (g.purchased) {
      patch = { gifted: true, giftedAt: new Date().toISOString() };
    } else {
      patch = { purchased: true, purchasedAt: new Date().toISOString() };
    }
    setState((s) => ({ ...s, giftIdeas: s.giftIdeas.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
    entities.GiftIdea.update(id, patch);
  }, []);

  const deleteGiftIdea = useCallback((id) => {
    setState((s) => ({ ...s, giftIdeas: s.giftIdeas.filter((g) => g.id !== id) }));
    entities.GiftIdea.delete(id);
  }, []);

  const updateGiftIdea = useCallback((id, patch) => {
    setState((s) => ({ ...s, giftIdeas: s.giftIdeas.map((g) => (g.id === id ? { ...g, ...patch } : g)) }));
    entities.GiftIdea.update(id, patch);
  }, []);

  const setPersonBudget = useCallback((person, limit) => {
    setState((s) => ({ ...s, personBudgets: { ...s.personBudgets, [person]: limit } }));
  }, []);

  return { addGiftIdea, toggleGiftPurchased, cycleGiftStatus, deleteGiftIdea, updateGiftIdea, setPersonBudget };
}