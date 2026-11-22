import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKeepsake } from '@/lib/keepsakeStore';
import TopNav from '@/components/TopNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ACT_TAGS, DEFAULT_TAG, ACT_CATEGORIES } from '@/lib/actTags';
import { sortPeopleForPicker } from '@/lib/peopleConstants';
import { useI18n } from '@/lib/i18n/I18nContext';
import { useConfirm } from '@/components/ui/confirm-dialog';

const EMOJIS = ['✨', '🍷', '✉️', '🎁', '🤲', '💛', '🌙', '🤍', '🍫', '🌸'];
const CATEGORY_UNIT = { daily: 'days', weekly: 'weeks', monthly: 'months', special: 'days' };
const QUICK_IDEAS = [
  { name: 'Cook their favorite meal', emoji: '🍷', tag: 'weekly' },
  { name: 'Write a handwritten note', emoji: '✉️', tag: 'weekly' },
  { name: 'Ask about their day', emoji: '💭', tag: 'daily' },
  { name: 'Plan a date night', emoji: '🌙', tag: 'special' },
  { name: 'Give a sincere compliment', emoji: '💛', tag: 'daily' },
];

export default function AddAct() {
  const { addCustomAct, addCustomActs, updateAct, deleteAct, people, acts } = useKeepsake();
  const navigate = useNavigate();
  const { confirm, confirmDialog } = useConfirm();
  const { t } = useI18n();
  const searchParams = new URLSearchParams(window.location.search);
  const editId = searchParams.get('editId');
  const editingAct = editId ? acts.find((a) => a.id === editId) : null;
  // Home's "nothing matches this filter" prompt links here with the filter it was
  // showing, so the new act starts on that person or category.
  const presetPersonId = editId ? null : searchParams.get('personId');
  const presetCategory = editId ? null : searchParams.get('category');

  const [name, setName] = useState(editingAct?.name || '');
  const initialInterval = (() => {
    const d = editingAct?.intervalDays;
    const tagUnit = CATEGORY_UNIT[editingAct?.tag] || 'days';
    if (!d) return { value: '7', unit: tagUnit };
    if (tagUnit === 'weeks') return { value: String(Math.round(d / 7)), unit: 'weeks' };
    if (tagUnit === 'months') return { value: String(Math.round(d / 30)), unit: 'months' };
    return { value: String(d), unit: 'days' };
  })();
  const [intervalValue, setIntervalValue] = useState(initialInterval.value);
  const [unit, setUnit] = useState(initialInterval.unit);
  const [emoji, setEmoji] = useState(editingAct?.emoji || '✨');
  const [selectedIds, setSelectedIds] = useState(
    editingAct?.personId
      ? [editingAct.personId]
      : presetPersonId
        ? [presetPersonId]
        : ['__general__']
  );
  const togglePerson = (id) => {
    setSelectedIds((prev) => {
      if (editingAct) return [id];
      if (prev.includes(id)) {
        const next = prev.filter((x) => x !== id);
        return next.length ? next : ['__general__'];
      }
      if (id === '__general__') return ['__general__'];
      return [...prev.filter((x) => x !== '__general__'), id];
    });
  };
  const [tag, setTag] = useState(editingAct?.tag || DEFAULT_TAG);
  const [category, setCategory] = useState(
    editingAct?.category ||
      (ACT_CATEGORIES.some((c) => c.key === presetCategory) ? presetCategory : 'act')
  );
  const [scheduledDate, setScheduledDate] = useState(
    editingAct?.nextDue ? editingAct.nextDue.slice(0, 10) : ''
  );
  const [firstDate, setFirstDate] = useState(
    editingAct?.nextDue && editingAct.tag !== 'special' ? editingAct.nextDue.slice(0, 10) : ''
  );

  const handleSave = () => {
    if (!name.trim()) return;
    const rawInterval = Number(intervalValue) || 1;
    const intervalDays = unit === 'weeks' ? rawInterval * 7 : unit === 'months' ? rawInterval * 30 : rawInterval;
    const isSpecial = tag === 'special';
    const buildPatch = (pid) => {
      const matchedPerson = people.find((p) => p.id === pid);
      const baseNextDue = firstDate
        ? new Date(firstDate + 'T09:00:00').toISOString()
        : new Date().toISOString();
      return {
        name: name.trim(),
        intervalDays: isSpecial ? 0 : intervalDays,
        emoji,
        person: matchedPerson?.name || '',
        personId: pid,
        tag,
        category,
        ...(isSpecial ? {
          repeat: false,
          nextDue: scheduledDate
            ? new Date(scheduledDate + 'T09:00:00').toISOString()
            : new Date().toISOString(),
        } : {
          nextDue: baseNextDue,
        }),
      };
    };
    if (editingAct) {
      const pid = selectedIds[0] === '__general__' ? '' : selectedIds[0];
      updateAct(editingAct.id, buildPatch(pid));
    } else {
      const targets = selectedIds.includes('__general__') || selectedIds.length === 0
        ? ['']
        : selectedIds;
      addCustomActs(targets.map(buildPatch));
    }
    navigate('/acts');
  };

  const handleDelete = async () => {
    if (!editingAct) return;
    const answer = await confirm({
      title: t('acts.edit.confirmRemove', { name: editingAct.name }),
      confirmLabel: t('common.remove'),
    });
    if (!answer) return;
    deleteAct(editingAct.id);
    navigate('/acts');
  };

  return (
    <div className="min-h-[100dvh] bg-background max-w-[440px] mx-auto pb-[calc(5.5rem_+_env(safe-area-inset-bottom))]">
      <TopNav title={editingAct ? t('acts.edit.title') : t('addAct.title')} subtitle={editingAct ? t('acts.edit.title') : t('addAct.subtitle')} back backTo="/acts" />

      <div className="px-5 mt-2 space-y-5">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('addAct.name')}</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('addAct.namePlaceholder')}
            className="h-12"
            autoFocus
          />
          {!editingAct && (
            <div className="mt-2.5">
              <p className="text-[11px] text-muted-foreground mb-1.5">{t('addAct.quickIdeas')}</p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_IDEAS.map((idea) => (
                  <button
                    key={idea.name}
                    type="button"
                    onClick={() => {
                      setName(idea.name);
                      setEmoji(idea.emoji);
                      setTag(idea.tag);
                      setUnit(CATEGORY_UNIT[idea.tag]);
                      setIntervalValue('1');
                    }}
                    className="px-2.5 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/70 transition-colors"
                  >
                    {idea.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('addAct.icon')}</label>
          <div className="flex flex-wrap gap-2">
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-colors ${
                  emoji === e ? 'bg-primary/15 ring-2 ring-primary' : 'bg-secondary'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('addAct.howOften')}</label>
          <p className="text-[11px] text-muted-foreground/80 mb-2 -mt-0.5">Sets the reminder cadence and list grouping.</p>
          <div className="flex flex-wrap gap-2">
            {ACT_TAGS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => {
                  setTag(t.key);
                  setUnit(CATEGORY_UNIT[t.key]);
                  setIntervalValue('1');
                }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 transition-colors ${
                  tag === t.key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />
                {t.label}
              </button>
            ))}
          </div>
          {tag !== 'special' ? (
            <div className="flex gap-2 mt-2.5">
              <Input
                type="number"
                min="1"
                value={intervalValue}
                onChange={(e) => setIntervalValue(e.target.value)}
                className="h-12 flex-1"
              />
              <div className="flex items-center px-3 h-12 bg-secondary rounded-md text-sm font-medium capitalize text-muted-foreground">
                {unit}
              </div>
            </div>
          ) : (
            <>
              <p className="text-xs text-primary/80 mt-2.5 font-medium">{t('addAct.oneTimeHint')}</p>
              <div className="mt-2.5">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('addAct.date')}</label>
                <Input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="h-12"
                />
                <p className="text-[11px] text-muted-foreground/80 mt-1.5">e.g. a concert, appointment, or special outing.</p>
              </div>
            </>
          )}
          {tag !== 'special' && (() => {
            const n = Number(intervalValue);
            if (!n || n < 1) return null;
            const text = n === 1
              ? `Reminds you every ${unit === 'days' ? 'day' : unit === 'weeks' ? 'week' : 'month'}`
              : `Reminds you every ${n} ${unit}`;
            return <p className="text-xs text-primary/80 mt-1.5 font-medium">{text}</p>;
          })()}
          {tag !== 'special' && (
            <div className="mt-2.5">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Date of first event (optional)</label>
              <Input
                type="date"
                value={firstDate}
                onChange={(e) => setFirstDate(e.target.value)}
                className="h-12"
              />
              <p className="text-[11px] text-muted-foreground/80 mt-1.5">Start the reminder cycle from this date instead of today.</p>
            </div>
          )}
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('addAct.whatKind')}</label>
          <p className="text-[11px] text-muted-foreground mb-1.5">Used to filter your list by type.</p>
          <div className="flex flex-wrap gap-2">
            {ACT_CATEGORIES.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setCategory(c.key)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 transition-colors ${
                  category === c.key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                }`}
              >
                <span>{c.emoji}</span>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            {t('addAct.whoFor')}{!editingAct && people.length > 1 ? ' (tap multiple to share)' : ''}
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => togglePerson('__general__')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedIds.includes('__general__') ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
              }`}
            >
              {t('addAct.general')}
            </button>
            {sortPeopleForPicker(people).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => togglePerson(p.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedIds.includes(p.id) ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
          {people.length === 0 && (
            <p className="text-[11px] text-muted-foreground/80 mt-1.5">
              Add people from the People page to assign acts to specific individuals.
            </p>
          )}
          {!editingAct && selectedIds.length > 1 && !selectedIds.includes('__general__') && (
            <p className="text-xs text-primary/80 mt-1.5 font-medium">
              Creates a separate tracked act for each of the {selectedIds.length} selected people.
            </p>
          )}
        </div>

        <Button onClick={handleSave} disabled={!name.trim()} className="w-full h-12 rounded-2xl mt-2">
          {editingAct ? t('addAct.saveChanges') : t('addAct.save')}
        </Button>

        {editingAct && (
          <Button onClick={handleDelete} variant="outline" className="w-full h-12 rounded-2xl text-destructive">
            {t('acts.edit.removeAct')}
          </Button>
        )}
      </div>
      {confirmDialog}
    </div>
  );
}