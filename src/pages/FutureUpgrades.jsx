import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import TopNav from '@/components/TopNav';
import { Plus, Trash2, Check, Loader2, Lightbulb } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';
import { optimisticWrite } from '@/lib/optimisticWrite';

const STATUS_STYLES = {
  idea: 'bg-secondary text-secondary-foreground',
  planned: 'bg-accent/20 text-accent-foreground',
  done: 'bg-primary/15 text-primary',
};

export default function FutureUpgrades() {
  const { t } = useI18n();
  const PRIORITIES = [
    { key: 'high', label: t('futureUpgrades.priorityHigh'), color: 'text-destructive' },
    { key: 'medium', label: t('futureUpgrades.priorityMed'), color: 'text-accent-foreground' },
    { key: 'low', label: t('futureUpgrades.priorityLow'), color: 'text-muted-foreground' },
  ];
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState('medium');

  const load = () => {
    base44.entities.FutureUpgrade.list('-updated_date', 200)
      .then((data) => setItems(data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // The idea appears in the list as soon as it is added, the status flips on
  // tap and a deleted row goes at once — each written behind the user, and put
  // back if the write fails.
  const add = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    const payload = {
      title: title.trim(),
      notes: notes.trim(),
      priority,
      status: 'idea',
    };
    const temp = { id: 'tmp-' + Date.now(), ...payload };
    setTitle('');
    setNotes('');
    setPriority('medium');
    optimisticWrite({
      setItems,
      prev: items,
      next: [temp, ...items],
      write: () => base44.entities.FutureUpgrade.create(payload),
      onSuccess: (created) => setItems((list) => list.map((i) => (i.id === temp.id ? created : i))),
      onError: () => {
        setTitle(payload.title);
        setNotes(payload.notes);
        setPriority(payload.priority);
      },
    });
  };

  const cycleStatus = (item) => {
    const next = item.status === 'idea' ? 'planned' : item.status === 'planned' ? 'done' : 'idea';
    optimisticWrite({
      setItems,
      prev: items,
      next: items.map((i) => (i.id === item.id ? { ...i, status: next } : i)),
      write: () => base44.entities.FutureUpgrade.update(item.id, { status: next }),
    });
  };

  const remove = (id) => {
    optimisticWrite({
      setItems,
      prev: items,
      next: items.filter((i) => i.id !== id),
      write: () => base44.entities.FutureUpgrade.delete(id),
    });
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-[100dvh] pb-24">
        <TopNav title={t('futureUpgrades.title')} subtitle={t('futureUpgrades.subtitleAdmin')} back />
        <div className="max-w-2xl mx-auto px-4 pt-10 text-center text-muted-foreground">
          {t('futureUpgrades.adminOnlyDesc')}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] pb-24">
      <TopNav title={t('futureUpgrades.title')} subtitle={t('futureUpgrades.subtitle')} back />

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-5">
        {/* Add form */}
        <form onSubmit={add} className="rounded-2xl border p-4 space-y-3 shadow-card ks-card-tint">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('futureUpgrades.placeholder')}
            className="w-full h-11 px-3 rounded-xl border border-input bg-background text-sm"
          />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('futureUpgrades.notesPlaceholder')}
            rows={2}
            className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm"
          />
          <div className="flex items-center gap-2">
            {PRIORITIES.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPriority(p.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                  priority === p.key ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'
                }`}
              >
                {p.label}
              </button>
            ))}
            <button
              type="submit"
              disabled={!title.trim()}
              className="relative ks-hit ml-auto flex items-center gap-1.5 px-4 h-9 rounded-full bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
            >
              <Plus size={15} />
              {t('common.add')}
            </button>
          </div>
        </form>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Lightbulb size={32} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t('futureUpgrades.noIdeas')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="rounded-2xl border p-3.5 shadow-card ks-card-tint">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => cycleStatus(item)}
                    className={`mt-0.5 shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${STATUS_STYLES[item.status] || STATUS_STYLES.idea}`}
                    title={t('futureUpgrades.clickCycle')}
                  >
                    {item.status}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${item.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                      {item.title}
                    </p>
                    {item.notes && (
                      <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1.5 capitalize">{t('futureUpgrades.priorityLabel', { priority: item.priority })}</p>
                  </div>
                  <button
                    onClick={() => remove(item.id)}
                    className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label={t('futureUpgrades.deleteAria')}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-[11px] text-muted-foreground text-center pt-2">
          {t('futureUpgrades.reminderNote')}
        </p>
      </div>
    </div>
  );
}