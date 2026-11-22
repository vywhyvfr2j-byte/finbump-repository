import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ACT_TAGS } from '@/lib/actTags';
import { sortPeopleForPicker } from '@/lib/peopleConstants';
import { useI18n } from '@/lib/i18n/I18nContext';

const UNITS = ['days', 'weeks', 'months'];

// Optional bulk edit for selected acts. Each section is gated by a switch so
// the user opts into exactly which fields change; untouched fields are left
// as-is on every selected act. onApply receives only the fields to set.
export default function BulkEditSheet({ open, onOpenChange, count, people, onApply }) {
  const { t } = useI18n();
  const [changeTag, setChangeTag] = useState(false);
  const [tag, setTag] = useState(ACT_TAGS[0].key);
  const [changeCadence, setChangeCadence] = useState(false);
  const [intervalValue, setIntervalValue] = useState('7');
  const [unit, setUnit] = useState('days');
  const [changePerson, setChangePerson] = useState(false);
  const [person, setPerson] = useState('__general__');

  // Reset the form each time the sheet opens so prior edits don't leak in.
  useEffect(() => {
    if (open) {
      setChangeTag(false);
      setTag(ACT_TAGS[0].key);
      setChangeCadence(false);
      setIntervalValue('7');
      setUnit('days');
      setChangePerson(false);
      setPerson('__general__');
    }
  }, [open]);

  const canApply = changeTag || changeCadence || changePerson;

  const handleApply = () => {
    if (!canApply) return;
    const patch = {};
    if (changeTag) patch.tag = tag;
    if (changeCadence) {
      const n = Math.max(1, Number(intervalValue) || 1);
      patch.intervalDays = unit === 'weeks' ? n * 7 : unit === 'months' ? n * 30 : n;
    }
    if (changePerson) patch.person = person === '__general__' ? '' : person;
    onApply(patch);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-w-[440px] mx-auto rounded-t-2xl max-h-[88dvh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t('acts.bulkEdit.title', { count, s: count === 1 ? '' : 's' })}</SheetTitle>
          <SheetDescription>{t('acts.bulkEdit.description')}</SheetDescription>
        </SheetHeader>

        <div className="space-y-5 mt-4">
          {/* Category */}
          <div className="rounded-xl border border-border p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t('acts.bulkEdit.category')}</span>
              <Switch checked={changeTag} onCheckedChange={setChangeTag} aria-label={t('acts.bulkEdit.changeCategory')} />
            </div>
            {changeTag && (
              <div className="flex flex-wrap gap-2 mt-3">
                {ACT_TAGS.map((tg) => (
                  <button
                    key={tg.key}
                    onClick={() => setTag(tg.key)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 transition-colors ${
                      tag === tg.key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${tg.dot}`} />
                    {t(tg.labelKey)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cadence */}
          <div className="rounded-xl border border-border p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t('acts.bulkEdit.repeatEvery')}</span>
              <Switch checked={changeCadence} onCheckedChange={setChangeCadence} aria-label={t('acts.bulkEdit.changeCadence')} />
            </div>
            {changeCadence && (
              <div className="mt-3">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    value={intervalValue}
                    onChange={(e) => setIntervalValue(e.target.value)}
                    className="h-10 w-20"
                  />
                  <div className="flex gap-1 bg-secondary rounded-lg p-1">
                    {UNITS.map((u) => (
                      <button
                        key={u}
                        onClick={() => setUnit(u)}
                        className={`px-3 h-8 rounded text-sm font-medium capitalize transition-colors ${
                          unit === u ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                        }`}
                      >
                        {t(`acts.unit.${u}`)}
                        </button>
                        ))}
                        </div>
                        </div>
                        {(() => {
                        const n = Number(intervalValue);
                        if (!n || n < 1) return null;
                        const label = n === 1
                        ? (unit === 'days' ? t('acts.bulkEdit.everyDay') : unit === 'weeks' ? t('acts.bulkEdit.everyWeek') : t('acts.bulkEdit.everyMonth'))
                        : t('acts.bulkEdit.everyNUnit', { n, unit: t(`acts.unit.${unit}`) });
                        return <p className="text-xs text-primary/80 mt-1.5 font-medium">{label}</p>;
                        })()}
              </div>
            )}
          </div>

          {/* Who it's for */}
          {people.length > 0 && (
            <div className="rounded-xl border border-border p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t('acts.bulkEdit.whoFor')}</span>
                <Switch checked={changePerson} onCheckedChange={setChangePerson} aria-label={t('acts.bulkEdit.changeWhoFor')} />
              </div>
              {changePerson && (
                <Select value={person} onValueChange={setPerson}>
                  <SelectTrigger className="h-10 mt-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__general__">{t('acts.bulkEdit.general')}</SelectItem>
                    {sortPeopleForPicker(people).map((p) => (
                      <SelectItem key={p.id} value={p.name}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </div>

        <SheetFooter className="mt-6">
          <Button onClick={handleApply} disabled={!canApply} className="w-full h-11 rounded-xl">
            {t('acts.bulkEdit.apply', { count, s: count === 1 ? '' : 's' })}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}