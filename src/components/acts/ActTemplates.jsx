import React, { useState } from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles } from 'lucide-react';
import { sortPeopleForPicker } from '@/lib/peopleConstants';
import { useI18n } from '@/lib/i18n/I18nContext';

// Maps template English names to i18n keys for display.
const TEMPLATE_NAME_KEYS = {
  'Check in by text': 'acts.template.checkInByText',
  'Ask about their day': 'acts.template.askAboutDay',
  'Give a sincere compliment': 'acts.template.giveCompliment',
  'Cook their favorite meal': 'acts.template.cookMeal',
  'Plan a date night': 'acts.template.planDateNight',
  'Write a handwritten note': 'acts.template.writeNote',
  'Send a thinking-of-you message': 'acts.template.sendThinkingMessage',
  'Bring them coffee or tea': 'acts.template.bringCoffee',
  'Plan a small surprise': 'acts.template.planSurprise',
  'Say thank you for something specific': 'acts.template.sayThankYou',
  'Give them a hug (no reason)': 'acts.template.giveHug',
  'Listen without fixing': 'acts.template.listenWithoutFixing',
};

// Common support-act templates. Pick one, then pick a contact — the act is
// only added once both are chosen.
export const ACT_TEMPLATES = [
  { name: 'Check in by text', emoji: '✉️', tag: 'weekly', intervalDays: 7 },
  { name: 'Ask about their day', emoji: '💭', tag: 'daily', intervalDays: 1 },
  { name: 'Give a sincere compliment', emoji: '💛', tag: 'daily', intervalDays: 1 },
  { name: 'Cook their favorite meal', emoji: '🍷', tag: 'weekly', intervalDays: 7 },
  { name: 'Plan a date night', emoji: '🌙', tag: 'special', intervalDays: 30 },
  { name: 'Write a handwritten note', emoji: '✨', tag: 'weekly', intervalDays: 7 },
  { name: 'Send a thinking-of-you message', emoji: '🤍', tag: 'weekly', intervalDays: 7 },
  { name: 'Bring them coffee or tea', emoji: '☕', tag: 'daily', intervalDays: 1 },
  { name: 'Plan a small surprise', emoji: '🎁', tag: 'special', intervalDays: 30 },
  { name: 'Say thank you for something specific', emoji: '🤲', tag: 'weekly', intervalDays: 7 },
  { name: 'Give them a hug (no reason)', emoji: '🤗', tag: 'daily', intervalDays: 1 },
  { name: 'Listen without fixing', emoji: '👂', tag: 'weekly', intervalDays: 7 },
];

// Custom act templates persist for the day in localStorage and clear out
// before the next day (filtered by dateKey on load). Selecting one does not
// remove it — it stays available to reuse across contacts.
const CUSTOM_TPL_STORAGE = 'keepsake_custom_act_templates';
const todayKey = () => new Date().toLocaleDateString('en-CA');
const loadCustomTemplates = () => {
  try {
    const raw = localStorage.getItem(CUSTOM_TPL_STORAGE);
    if (!raw) return [];
    const data = JSON.parse(raw);
    const today = todayKey();
    const valid = (data.templates || []).filter((t) => t.dateKey === today);
    if (valid.length !== (data.templates || []).length) {
      localStorage.setItem(CUSTOM_TPL_STORAGE, JSON.stringify({ templates: valid }));
    }
    return valid;
  } catch {
    return [];
  }
};
const persistCustomTemplates = (templates) => {
  localStorage.setItem(CUSTOM_TPL_STORAGE, JSON.stringify({ templates }));
};

const displayPerson = (p) => p.preferredName || p.name;

export default function ActTemplates() {
  const { addCustomAct, acts, people } = useKeepsake();
  const { toast } = useToast();
  const { t } = useI18n();
  const tplName = (name) => TEMPLATE_NAME_KEYS[name] ? t(TEMPLATE_NAME_KEYS[name]) : name;
  const [pendingTemplate, setPendingTemplate] = useState('');
  const [personId, setPersonId] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customInterval, setCustomInterval] = useState(7);
  const [customDate, setCustomDate] = useState('');
  const [customTemplates, setCustomTemplates] = useState(() => loadCustomTemplates());
  // Cadence override for template acts — lets any template be scheduled as a
  // one-time act (with a date) instead of its preset recurring interval.
  const [tplInterval, setTplInterval] = useState(null);
  const [tplDate, setTplDate] = useState('');

  const existingNames = new Set(acts.map((a) => a.name.toLowerCase()));

  const commit = (tplName, pId) => {
    const tpl = ACT_TEMPLATES.find((t) => t.name === tplName) || customTemplates.find((t) => t.name === tplName);
    if (!tpl) return;
    const matchedPerson = people.find((p) => p.id === pId);
    // Prevent duplicates: skip if an act with the same name already exists
    // for the same person (or both unassigned).
    const dup = acts.some((a) =>
      a.name.toLowerCase() === tpl.name.toLowerCase() &&
      (a.personId || '') === (pId || '')
    );
    if (dup) {
      toast({
        title: t('acts.toast.alreadyOnList', { name: tplName(tpl.name) }),
        description: matchedPerson ? t('acts.toast.forName', { name: displayPerson(matchedPerson) }) : undefined,
      });
      setPendingTemplate('');
      setPersonId('');
      setTplInterval(null);
      setTplDate('');
      return;
    }
    // Apply the cadence override chosen in the frequency selector (defaults to
    // the template's preset interval). "One time" (0) or a set date makes the
    // act a one-time scheduled act instead of recurring.
    const useInterval = tplInterval != null ? tplInterval : tpl.intervalDays;
    const isOneTime = useInterval === 0 || !!tplDate;
    const overrideTag = isOneTime ? 'special' : useInterval <= 1 ? 'daily' : useInterval >= 30 ? 'special' : 'weekly';
    addCustomAct({
      name: tpl.name,
      emoji: tpl.emoji,
      tag: tpl.tag !== 'special' ? overrideTag : tpl.tag,
      intervalDays: isOneTime ? 0 : useInterval,
      person: matchedPerson?.name || '',
      personId: pId || '',
      nextDue: isOneTime ? (tplDate ? new Date(tplDate + 'T09:00:00').toISOString() : (tpl.nextDue || null)) : (tpl.nextDue || null),
      repeat: isOneTime ? false : (tpl.repeat !== undefined ? tpl.repeat : true),
    });
    toast({
      title: t('acts.toast.added', { name: tplName(tpl.name) }),
      description: matchedPerson ? t('acts.toast.forName', { name: displayPerson(matchedPerson) }) : t('acts.toast.findInList'),
    });
    setPendingTemplate('');
    setPersonId('');
    setTplInterval(null);
    setTplDate('');
  };

  const handleTemplateSelect = (name) => {
    if (name === '__custom__') {
      setIsCustom(true);
      setPendingTemplate('');
      return;
    }
    setIsCustom(false);
    setPendingTemplate(name);
    // Default the cadence override to the template's preset interval so the
    // frequency selector reflects the template's natural cadence.
    const tpl = ACT_TEMPLATES.find((t) => t.name === name) || customTemplates.find((t) => t.name === name);
    setTplInterval(tpl ? tpl.intervalDays : 7);
    setTplDate('');
    // If a person is already chosen, add immediately.
    if (personId) commit(name, personId);
  };

  const saveCustomAct = () => {
    const name = customName.trim();
    if (!name) return;
    const isOneTime = customInterval === 0 || !!customDate;
    const tag = isOneTime ? 'special' : customInterval <= 1 ? 'daily' : customInterval >= 30 ? 'special' : 'weekly';
    const tpl = {
      name,
      emoji: '✨',
      tag,
      intervalDays: isOneTime ? 0 : customInterval,
      dateKey: todayKey(),
      ...(isOneTime ? { nextDue: customDate ? new Date(customDate + 'T09:00:00').toISOString() : null, repeat: false } : {}),
    };
    const next = [tpl, ...customTemplates.filter((t) => t.name.toLowerCase() !== name.toLowerCase())];
    setCustomTemplates(next);
    persistCustomTemplates(next);
    setPendingTemplate(name);
    setIsCustom(false);
    setCustomName('');
    setCustomDate('');
    // If a person is already chosen, add immediately.
    if (personId) commit(name, personId);
  };

  const handlePersonSelect = (v) => {
    setPersonId(v);
    // If a template is already chosen, add immediately.
    if (pendingTemplate) commit(pendingTemplate, v);
  };

  return (
    <div className="mb-4 space-y-2">
      <div className="flex items-center gap-1.5">
        <Sparkles size={14} className="text-primary" />
        <p className="text-xs font-medium text-muted-foreground">
          {isCustom ? t('acts.templates.customPrompt') : pendingTemplate ? t('acts.templates.chooseContact') : t('acts.templates.prompt')}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Select value={pendingTemplate} onValueChange={handleTemplateSelect}>
          <SelectTrigger className="h-10 w-full">
            <SelectValue placeholder={t('acts.templates.chooseTemplate')} />
          </SelectTrigger>
          <SelectContent>
            {ACT_TEMPLATES.map((tpl) => {
              const exists = existingNames.has(tpl.name.toLowerCase());
              return (
                <SelectItem key={tpl.name} value={tpl.name} disabled={exists}>
                  <span className="mr-1.5">{tpl.emoji}</span>
                  {tplName(tpl.name)}
                  {exists && <span className="ml-1.5 text-[10px] text-muted-foreground/60">{t('acts.templates.added')}</span>}
                </SelectItem>
              );
            })}
            {customTemplates
              .filter((t) => !ACT_TEMPLATES.some((p) => p.name === t.name))
              .map((tpl) => (
                <SelectItem key={`custom-${tpl.name}`} value={tpl.name}>
                  <span className="mr-1.5">{tpl.emoji}</span>
                  {tpl.name}
                </SelectItem>
              ))}
            <SelectItem value="__custom__">{t('acts.templates.addOwn')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={personId} onValueChange={handlePersonSelect}>
          <SelectTrigger className="h-10 w-full">
            <SelectValue placeholder={t('acts.templates.chooseContactPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {sortPeopleForPicker(people).map((p) => (
              <SelectItem key={p.id} value={p.id}>{displayPerson(p)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {pendingTemplate && !isCustom && (
        <div className="rounded-xl border border-border bg-card p-3 space-y-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-muted-foreground shrink-0">{t('acts.templates.every')}</span>
            {[
              { labelKey: 'acts.templates.oneTime', days: 0 },
              { labelKey: 'acts.templates.day', days: 1 },
              { labelKey: 'acts.templates.week', days: 7 },
              { labelKey: 'acts.templates.month', days: 30 },
            ].map((opt) => (
              <button
                key={opt.days}
                onClick={() => setTplInterval(opt.days)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  tplInterval === opt.days ? 'bg-foreground text-background' : 'bg-secondary text-secondary-foreground'
                }`}
              >
              {t(opt.labelKey)}
              </button>
              ))}
              </div>
              {tplInterval === 0 && (
              <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground shrink-0">{t('acts.templates.date')}</span>
              <input
                type="date"
                value={tplDate}
                onChange={(e) => setTplDate(e.target.value)}
                className="flex-1 h-9 rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              {tplDate && (
                <button
                  onClick={() => setTplDate('')}
                  className="text-xs text-muted-foreground hover:text-foreground shrink-0"
                >
                  {t('acts.templates.clear')}
                </button>
              )}
            </div>
          )}
          <p className="text-[11px] text-muted-foreground">
            {tplInterval === 0
              ? t('acts.templates.oneTimeHint')
              : t('acts.templates.adjustHint')}
          </p>
        </div>
      )}
      {isCustom && (
        <div className="rounded-xl border border-border bg-card p-3 space-y-2.5">
          <input
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder={t('acts.templates.customPlaceholder')}
            className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') saveCustomAct(); }}
          />
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground shrink-0">{t('acts.templates.date')}</span>
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="flex-1 h-9 rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              {customDate && (
                <button
                  onClick={() => setCustomDate('')}
                  className="text-xs text-muted-foreground hover:text-foreground shrink-0"
                >
                  {t('acts.templates.clear')}
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground shrink-0">{t('acts.templates.every')}</span>
              {[
                { labelKey: 'acts.templates.oneTime', days: 0 },
                { labelKey: 'acts.templates.day', days: 1 },
                { labelKey: 'acts.templates.week', days: 7 },
                { labelKey: 'acts.templates.month', days: 30 },
              ].map((opt) => (
              <button
                key={opt.days}
                onClick={() => setCustomInterval(opt.days)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  customInterval === opt.days ? 'bg-foreground text-background' : 'bg-secondary text-secondary-foreground'
                }`}
              >
                {t(opt.labelKey)}
              </button>
            ))}
          </div>
          <button
            onClick={saveCustomAct}
            disabled={!customName.trim()}
            className="w-full h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
          >
            {t('acts.templates.save')}
          </button>
        </div>
      )}
    </div>
  );
}