import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

// The user's saved support messages. Loaded once when the quick-reminder box is
// opened (newest first) and updated in place on save/remove, so tapping a saved
// message fills the box instantly without another round trip.
export default function useMessageTemplates(enabled) {
  const [templates, setTemplates] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!enabled || loaded) return;
    let cancelled = false;
    base44.entities.MessageTemplate.filter({}, { sort: '-created_date', limit: 50 })
      .then((page) => {
        if (cancelled) return;
        setTemplates(page?.items || []);
        setLoaded(true);
      })
      .catch(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [enabled, loaded]);

  const saveTemplate = useCallback(async ({ title, text }) => {
    const created = await base44.entities.MessageTemplate.create({ title: title || '', text: text.trim() });
    setTemplates((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateTemplate = useCallback(async (id, patch) => {
    const updated = await base44.entities.MessageTemplate.update(id, patch);
    setTemplates((prev) => prev.map((tpl) => (tpl.id === id ? { ...tpl, ...patch } : tpl)));
    return updated;
  }, []);

  const removeTemplate = useCallback(async (id) => {
    await base44.entities.MessageTemplate.delete(id);
    setTemplates((prev) => prev.filter((tpl) => tpl.id !== id));
  }, []);

  return { templates, saveTemplate, updateTemplate, removeTemplate };
}