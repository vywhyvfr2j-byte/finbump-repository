import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useKeepsake } from '@/lib/keepsakeStore';
import TopNav from '@/components/TopNav';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X, Users, Pencil, Trash2 } from 'lucide-react';
import { GROUP_COLORS, colorFor } from '@/lib/groupConstants';
import GroupEmojiPicker from '@/components/groups/GroupEmojiPicker';
import { useFeatureTracking } from '@/hooks/useFeatureTracking';
import { useI18n } from '@/lib/i18n/I18nContext';
import { useConfirm } from '@/components/ui/confirm-dialog';

export default function Groups() {
  useFeatureTracking('groups');
  const { t } = useI18n();
  const { groups, people, addGroup, updateGroup, deleteGroup } = useKeepsake();
  const { confirm, confirmDialog } = useConfirm();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('👥');
  const [color, setColor] = useState('coral');
  const [notes, setNotes] = useState('');

  const reset = () => {
    setName(''); setEmoji('👥'); setColor('coral'); setNotes('');
    setEditingId(null); setAdding(false);
  };

  const startEdit = (g) => {
    setEditingId(g.id);
    setName(g.name); setEmoji(g.emoji || '👥'); setColor(g.color || 'coral'); setNotes(g.notes || '');
    setAdding(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const payload = { name: name.trim(), emoji, color, notes: notes.trim() };
    if (editingId) updateGroup(editingId, payload);
    else addGroup(payload);
    reset();
  };

  const handleDelete = async (g) => {
    const answer = await confirm({
      title: t('groups.confirmDelete', { name: g.name }),
      confirmLabel: t('common.remove'),
    });
    if (!answer) return;
    deleteGroup(g.id);
    if (editingId === g.id) reset();
  };

  const memberName = (id) => people.find((p) => p.id === id)?.name || '?';

  return (
    <div className="min-h-[100dvh] bg-background max-w-[440px] mx-auto pb-[calc(5.5rem_+_env(safe-area-inset-bottom))]">
      <TopNav
        title={t('groups.title')}
        subtitle={t('groups.subtitle')}
        back
        right={
          <button
            onClick={() => { setAdding((v) => !v); if (!adding) { setEditingId(null); setName(''); setEmoji('👥'); setColor('coral'); setNotes(''); } }}
            className="flex items-center justify-center w-11 h-11 rounded-full bg-primary text-primary-foreground shadow-sm shrink-0"
            aria-label={adding ? t('groups.cancelAria') : t('groups.addAria')}
          >
            {adding ? <X size={22} style={{ stroke: 'currentColor' }} /> : <Plus size={22} style={{ stroke: 'currentColor' }} />}
          </button>
        }
      />

      <div className="px-5 mt-2 space-y-4">
        {adding && (
          <div className="rounded-2xl border p-4 space-y-3 shadow-card ks-card-tint">
            <h2 className="font-display text-base font-semibold">{editingId ? t('groups.editGroup') : t('groups.newGroup')}</h2>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('groups.namePlaceholder')} aria-label={t('groups.nameAria')} className="h-11" autoFocus />
            <GroupEmojiPicker value={emoji} onChange={setEmoji} label={t('groups.icon')} />
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">{t('groups.color')}</p>
              <div className="flex flex-wrap gap-1.5">
                {GROUP_COLORS.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setColor(c.key)}
                    className={`w-11 h-11 -m-1 rounded-full ${c.dot} border-2 transition-transform ${color === c.key ? 'scale-110 border-foreground/40' : 'border-transparent'}`}
                    aria-label={c.label}
                  />
                ))}
              </div>
            </div>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('groups.notesPlaceholder')} aria-label={t('groups.notesAria')} className="min-h-[60px]" />
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={!name.trim()} className="flex-1 h-11">
                {editingId ? t('groups.saveChanges') : t('groups.createGroup')}
              </Button>
              <Button onClick={reset} variant="outline" className="h-11">
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        )}

        {(groups || []).length === 0 && !adding && (
          <div className="text-center py-16 text-muted-foreground">
            <Users size={32} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">{t('groups.noGroups')}</p>
            <p className="text-sm mt-1">{t('groups.noGroupsDesc')}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {(groups || []).map((g) => {
            const c = colorFor(g.color);
            const count = (g.memberIds || []).length;
            return (
              <div key={g.id} className={`rounded-2xl border ${c.tile} p-3.5 flex flex-col`}>
                <div className="flex items-start justify-between">
                  <Link to={`/groups/${g.id}`} className="flex-1 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-background/70 border border-border/60 flex items-center justify-center text-2xl leading-none mb-2">
                      {g.emoji || '👥'}
                    </div>
                    <h3 className="font-display font-semibold truncate">{g.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{count} {count === 1 ? t('groups.person') : t('groups.people')}</p>
                  </Link>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEdit(g)} className="text-muted-foreground hover:text-primary p-1" aria-label={t('groups.editAria')}>
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(g)} className="text-muted-foreground hover:text-destructive p-1" aria-label={t('groups.deleteAria')}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {count > 0 && (
                  <div className="mt-2.5 -space-x-2 flex">
                    {(g.memberIds || []).slice(0, 5).map((id) => {
                      const p = people.find((x) => x.id === id);
                      return p?.photoUrl ? (
                        <img key={id} src={p.photoUrl} alt={p.name} loading="lazy" className="w-7 h-7 rounded-full object-cover border-2 border-background" />
                      ) : (
                        <div key={id} className="w-7 h-7 rounded-full bg-secondary border-2 border-background flex items-center justify-center text-[10px] font-medium">
                          {(memberName(id) || '?').charAt(0).toUpperCase()}
                        </div>
                      );
                    })}
                    {count > 5 && (
                      <div className="w-7 h-7 rounded-full bg-secondary border-2 border-background flex items-center justify-center text-[10px] font-medium">
                        +{count - 5}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {confirmDialog}
    </div>
  );
}