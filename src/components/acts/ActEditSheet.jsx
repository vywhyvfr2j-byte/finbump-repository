import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Trash2 } from 'lucide-react';
import { ACT_TAGS, ACT_CATEGORIES } from '@/lib/actTags';
import { sortPeopleForPicker } from '@/lib/peopleConstants';
import { useI18n } from '@/lib/i18n/I18nContext';
import { useConfirm } from '@/components/ui/confirm-dialog';

const EMOJIS = ['✨', '🍷', '✉️', '🎁', '🤲', '💛', '🌙', '🤍', '🍫', '🌸'];
const CATEGORY_UNIT = { daily: 'days', weekly: 'weeks', monthly: 'months', special: 'days' };

// Consolidated edit sheet — replaces the full-page AddAct edit AND the separate
// RescheduleSheet. Opens in place from any act row (pencil or clock). Edits name,
// icon, cadence (including one-time date / restart cycle), category, person, and
// delete — all without leaving the page.
export default function ActEditSheet({ act, people, onClose, onSave, onDelete }) {
  const { t } = useI18n();
  const { confirm, confirmDialog } = useConfirm();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('✨');
  const [tag, setTag] = useState('weekly');
  const [intervalValue, setIntervalValue] = useState('7');
  const [unit, setUnit] = useState('weeks');
  const [date, setDate] = useState('');
  const [startFresh, setStartFresh] = useState(false);
  const [category, setCategory] = useState('act');
  const [personId, setPersonId] = useState('__general__');

  useEffect(() => {
    if (!act) return;
    setName(act.name || '');
    setEmoji(act.emoji || '✨');
    setTag(act.tag || 'weekly');
    const d = act.intervalDays || 7;
    const tagUnit = CATEGORY_UNIT[act.tag] || 'days';
    if (tagUnit === 'weeks') { setIntervalValue(String(Math.round(d / 7))); setUnit('weeks'); }
    else if (tagUnit === 'months') { setIntervalValue(String(Math.round(d / 30))); setUnit('months'); }
    else { setIntervalValue(String(d)); setUnit('days'); }
    setDate(act.nextDue ? act.nextDue.slice(0, 10) : '');
    setStartFresh(false);
    setCategory(act.category || 'act');
    setPersonId(act.personId || '__general__');
  }, [act]);

  const isSpecial = tag === 'special';

  const handleSave = () => {
    if (!name.trim()) return;
    const rawInterval = Number(intervalValue) || 1;
    const intervalDays = isSpecial
      ? 0
      : unit === 'weeks' ? rawInterval * 7 : unit === 'months' ? rawInterval * 30 : rawInterval;
    const matchedPerson = people.find((p) => p.id === personId);
    const patch = {
      name: name.trim(),
      emoji,
      tag,
      category,
      intervalDays,
      person: matchedPerson?.name || '',
      personId: personId === '__general__' ? '' : personId,
    };
    if (isSpecial) {
      patch.repeat = false;
      patch.nextDue = date ? new Date(date + 'T12:00:00').toISOString() : new Date().toISOString();
    } else {
      patch.repeat = true;
      patch.nextDue = null;
      if (startFresh) patch.lastCompleted = new Date().toISOString();
    }
    onSave(act.id, patch);
    onClose();
  };

  const handleDelete = async () => {
    const answer = await confirm({
      title: t('acts.edit.confirmRemove', { name: act.name }),
      confirmLabel: t('common.remove'),
    });
    if (!answer) return;
    onDelete(act.id);
    onClose();
  };

  return (
    <Sheet open={!!act} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="max-w-[440px] mx-auto rounded-t-2xl max-h-[90dvh] overflow-y-auto p-5">
        <SheetHeader className="text-left">
          <SheetTitle className="font-display text-base">{t('acts.edit.title')}</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 mt-4">
          {/* Name */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('acts.edit.whatIsIt')}</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('acts.edit.namePlaceholder')} className="h-12" />
          </div>

          {/* Icon */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('acts.edit.icon')}</label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map((e) => (
                <button key={e} onClick={() => setEmoji(e)} className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-colors ${emoji === e ? 'bg-primary/15 ring-2 ring-primary' : 'bg-secondary'}`}>{e}</button>
              ))}
            </div>
          </div>

          {/* Cadence + reschedule */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('acts.edit.howOften')}</label>
            <div className="flex flex-wrap gap-2">
              {ACT_TAGS.map((tg) => (
                <button key={tg.key} onClick={() => { setTag(tg.key); setUnit(CATEGORY_UNIT[tg.key]); }} className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 transition-colors ${tag === tg.key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${tg.dot}`} />{t(tg.labelKey)}
                </button>
              ))}
            </div>
            {isSpecial ? (
              <div className="mt-2.5">
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-12" />
                <p className="text-xs text-primary/80 mt-1.5 font-medium">{t('acts.edit.oneTimeHint')}</p>
              </div>
            ) : (
              <div className="mt-2.5 space-y-2.5">
                <div className="flex gap-2">
                  <Input type="number" min="1" value={intervalValue} onChange={(e) => setIntervalValue(e.target.value)} className="h-12 flex-1" />
                  <div className="flex gap-1 bg-secondary rounded-lg p-1">
                    {['days', 'weeks', 'months'].map((u) => (
                      <button key={u} onClick={() => setUnit(u)} className={`px-3 h-10 rounded text-sm font-medium capitalize transition-colors ${unit === u ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>{t(`acts.unit.${u}`)}</button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-secondary/60 px-3.5 py-2.5">
                  <span className="text-xs font-medium">{t('acts.edit.startFresh')}</span>
                  <Switch checked={startFresh} onCheckedChange={setStartFresh} aria-label={t('acts.edit.startFreshAria')} />
                </div>
                {startFresh && <p className="text-xs text-primary/80 font-medium">{t('acts.edit.startFreshHint')}</p>}
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('acts.edit.whatKind')}</label>
            <div className="flex flex-wrap gap-2">
              {ACT_CATEGORIES.map((c) => (
                <button key={c.key} onClick={() => setCategory(c.key)} className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 transition-colors ${category === c.key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                  <span>{c.emoji}</span>{t(c.labelKey)}
                </button>
              ))}
            </div>
          </div>

          {/* Person */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('acts.edit.whoFor')}</label>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setPersonId('__general__')} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${personId === '__general__' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>{t('acts.edit.general')}</button>
              {sortPeopleForPicker(people).map((p) => (
                <button key={p.id} onClick={() => setPersonId(p.id)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${personId === p.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>{p.name}</button>
              ))}
            </div>
          </div>
        </div>

        <SheetFooter className="mt-6 flex-col gap-2">
          <Button onClick={handleSave} disabled={!name.trim()} className="w-full h-12 rounded-2xl">{t('acts.edit.saveChanges')}</Button>
          <Button onClick={handleDelete} variant="outline" className="w-full h-12 rounded-2xl text-destructive border-destructive/30">
            <Trash2 size={16} className="mr-1.5" /> {t('acts.edit.removeAct')}
          </Button>
        </SheetFooter>
      </SheetContent>
      {confirmDialog}
    </Sheet>
  );
}