// #9: Groups domain slice — CRUD for user-defined groups of connections.
import { useCallback } from 'react';

export function useGroupsSlice({ setState, entities, toast }) {
  const addGroup = useCallback((group) => {
    const tempId = 'g' + Date.now();
    setState((s) => ({ ...s, groups: [{ id: tempId, memberIds: [], ...group }, ...s.groups] }));
    entities.Group.create({ memberIds: [], ...group }).then((created) => {
      setState((s) => ({ ...s, groups: s.groups.map((g) => (g.id === tempId ? created : g)) }));
    }).catch(() => {
      setState((s) => ({ ...s, groups: s.groups.filter((g) => g.id !== tempId) }));
      toast({ title: 'Could not create group', variant: 'destructive' });
    });
    return tempId;
  }, [entities, toast]);

  const updateGroup = useCallback((id, patch) => {
    setState((s) => ({ ...s, groups: s.groups.map((g) => (g.id === id ? { ...g, ...patch } : g)) }));
    entities.Group.update(id, patch);
  }, [entities]);

  const deleteGroup = useCallback((id) => {
    setState((s) => ({ ...s, groups: s.groups.filter((g) => g.id !== id) }));
    entities.Group.delete(id);
  }, [entities]);

  // Toggle a person's membership in a group.
  const toggleGroupMember = useCallback((groupId, personId) => {
    setState((s) => ({
      ...s,
      groups: s.groups.map((g) => {
        if (g.id !== groupId) return g;
        const has = (g.memberIds || []).includes(personId);
        return { ...g, memberIds: has ? g.memberIds.filter((id) => id !== personId) : [...(g.memberIds || []), personId] };
      }),
    }));
    setState((s) => {
      const g = s.groups.find((x) => x.id === groupId);
      if (g) entities.Group.update(groupId, { memberIds: g.memberIds });
      return s;
    });
  }, [entities]);

  return { addGroup, updateGroup, deleteGroup, toggleGroupMember };
}