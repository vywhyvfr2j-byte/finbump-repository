// Memory refresh domain slice — CRUD for MemoryRefresh reminders.
// These are lightweight, user-set reminders to revisit a memory of time
// spent with / thinking about a contact. No AI, no credits — just dates.
import { useCallback } from 'react';

export function useMemorySlice({ setState, entities }) {
  const addMemoryRefresh = useCallback((payload) => {
    const tempId = 'mr' + Date.now();
    const record = { done: false, ...payload };
    setState((s) => ({
      ...s,
      memoryRefreshes: [...s.memoryRefreshes, { id: tempId, ...record }],
    }));
    entities.MemoryRefresh.create(record).then((created) => {
      setState((s) => ({
        ...s,
        memoryRefreshes: s.memoryRefreshes.map((m) => (m.id === tempId ? created : m)),
      }));
    }).catch(() => {});
  }, []);

  const dismissMemoryRefresh = useCallback((id) => {
    setState((s) => ({
      ...s,
      memoryRefreshes: s.memoryRefreshes.map((m) => (m.id === id ? { ...m, done: true } : m)),
    }));
    entities.MemoryRefresh.update(id, { done: true }).catch(() => {});
  }, []);

  const deleteMemoryRefresh = useCallback((id) => {
    setState((s) => ({ ...s, memoryRefreshes: s.memoryRefreshes.filter((m) => m.id !== id) }));
    entities.MemoryRefresh.delete(id).catch(() => {});
  }, []);

  return { addMemoryRefresh, dismissMemoryRefresh, deleteMemoryRefresh };
}