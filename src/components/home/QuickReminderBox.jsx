import React, { useRef, useState } from 'react';
import { BellPlus, BookmarkPlus, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useKeepsake } from '@/lib/keepsakeStore';
import { useToast } from '@/components/ui/use-toast';
import { sortPeopleForPicker } from '@/lib/peopleConstants';
import { useI18n } from '@/lib/i18n/I18nContext';
import QuickReminderContactPicker, { OTHER_ID } from '@/components/home/QuickReminderContactPicker';
import SavedMessageTemplates from '@/components/home/SavedMessageTemplates';
import SendMessageDialog from '@/components/home/SendMessageDialog';
import MessageTemplateEditor from '@/components/home/MessageTemplateEditor';
import useMessageTemplates from '@/hooks/useMessageTemplates';
import VoiceInputButton from '@/components/memory/VoiceInputButton';
import { useConfirm } from '@/components/ui/confirm-dialog';

// The one quick-add box inside Acts of support. Collapsed it is a single row;
// tapped it opens: who it is for, what kind of reminder it is, what to remember,
// and how often. Every kind — appreciation, reminder, quick reminder or note —
// is saved as a reminder (an Act) for that person, so it shows up in the same
// Acts of support list and can be edited, snoozed or completed like any other.
const KINDS = [
  { key: 'appreciation', emoji: '💛', labelKey: 'home.reminderKind.appreciation', hintKey: 'home.reminderKind.appreciationHint', category: 'act', cadence: 'month' },
  { key: 'reminder', emoji: '🔔', labelKey: 'home.reminderKind.reminder', hintKey: 'home.reminderKind.reminderHint', category: 'act', cadence: 'week' },
  { key: 'quick', emoji: '⏰', labelKey: 'home.reminderKind.quick', hintKey: 'home.reminderKind.quickHint', category: 'act', cadence: 'once' },
  { key: 'note', emoji: '📝', labelKey: 'home.reminderKind.note', hintKey: 'home.reminderKind.noteHint', category: 'other', cadence: 'once' },
];

const CADENCES = [
  { key: 'week', labelKey: 'home.quickReminderEveryWeek', tag: 'weekly', intervalDays: 7 },
  { key: 'biweek', labelKey: 'home.quickReminderEvery2Weeks', tag: 'weekly', intervalDays: 14 },
  { key: 'month', labelKey: 'home.quickReminderEveryMonth', tag: 'monthly', intervalDays: 30 },
  { key: 'once', labelKey: 'home.quickReminderOnce', tag: 'special', intervalDays: 0 },
];

const todayLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function QuickReminderBox({ onCreated }) {
  const { people, addCustomActs } = useKeepsake();
  const { toast } = useToast();
  const { t } = useI18n();
  const { confirm, confirmDialog } = useConfirm();
  const sorted = sortPeopleForPicker(people || []);
  const partner = sorted.find((p) => ['partner', 'spouse'].includes((p.relation || '').toLowerCase()));

  const [open, setOpen] = useState(false);
  const [kindKey, setKindKey] = useState('reminder');
  const [who, setWho] = useState(() => ({ personId: partner?.id || sorted[0]?.id || OTHER_ID, otherName: '' }));
  const [text, setText] = useState('');
  const [cadenceKey, setCadenceKey] = useState('week');
  const [date, setDate] = useState(todayLocal);
  const [sendOpen, setSendOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const { templates, saveTemplate, updateTemplate, removeTemplate } = useMessageTemplates(open);
  const voiceBaseRef = useRef('');

  const kind = KINDS.find((k) => k.key === kindKey);
  const cadence = CADENCES.find((c) => c.key === cadenceKey);
  const matched = sorted.find((p) => p.id === who.personId) || null;
  const whoName = matched ? (matched.preferredName || matched.name) : (who.otherName || '').trim();

  // Each kind starts on the rhythm that suits it — appreciation monthly,
  // a reminder weekly, a quick reminder and a note just once.
  const pickKind = (key) => {
    setKindKey(key);
    setCadenceKey(KINDS.find((k) => k.key === key).cadence);
  };

  const handleSave = () => {
    if (!text.trim() || !whoName) return;
    const patch = {
      name: text.trim(),
      emoji: kind.emoji,
      tag: cadence.tag,
      category: kind.category,
      intervalDays: cadence.intervalDays,
      person: matched ? matched.name : whoName,
      personId: matched ? matched.id : '',
      notify: true,
    };
    if (cadence.key === 'once') {
      patch.repeat = false;
      patch.nextDue = new Date(`${date}T09:00:00`).toISOString();
    } else {
      patch.repeat = true;
      patch.nextDue = null;
    }
    addCustomActs([patch]);
    toast({ title: t('home.quickReminderCreated'), description: patch.name });
    setText('');
    setOpen(false);
    onCreated?.();
  };

  // Saving opens the same editor used to rename or rewrite a saved message, so a
  // name can be given straight away and nothing is stored until Save is pressed.
  const handleSaveTemplate = () => {
    if (!text.trim()) return;
    setEditingTemplate({ text });
  };

  const handleEditorSave = async ({ title, text: value }) => {
    if (editingTemplate?.id) {
      await updateTemplate(editingTemplate.id, { title, text: value });
    } else {
      await saveTemplate({ title, text: value });
      setText(value);
    }
    toast({ title: t('home.savedMessagesSaved') });
    setEditingTemplate(null);
  };

  const handleEditorDelete = async (template) => {
    const answer = await confirm({
      title: t('home.savedMessagesRemoveConfirm'),
      confirmLabel: t('common.remove'),
    });
    if (!answer) return;
    await removeTemplate(template.id);
    toast({ title: t('home.savedMessagesRemoved') });
    setEditingTemplate(null);
  };

  const handleRemoveTemplate = async (template) => {
    const answer = await confirm({
      title: t('home.savedMessagesRemoveConfirm'),
      confirmLabel: t('common.remove'),
    });
    if (!answer) return;
    await removeTemplate(template.id);
    toast({ title: t('home.savedMessagesRemoved') });
  };

  return (
    <div className="mb-3 rounded-xl border border-dashed border-primary/40 bg-primary/5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left active:scale-[0.99] transition-transform"
      >
        <BellPlus size={17} className="text-primary shrink-0" />
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-medium leading-tight">{t('home.quickReminder')}</span>
          <span className="block text-[11px] text-muted-foreground truncate">{t('home.quickReminderHint')}</span>
        </span>
        {open
          ? <ChevronUp size={16} className="text-muted-foreground shrink-0" />
          : <ChevronDown size={16} className="text-muted-foreground shrink-0" />}
      </button>

      {open && (
        <div className="px-3.5 pb-3.5 space-y-3">
          <Select value={kindKey} onValueChange={pickKind}>
            <SelectTrigger aria-label={t('home.reminderKind.select')} className="h-11 w-full rounded-xl text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KINDS.map((k) => (
                <SelectItem key={k.key} value={k.key}>
                  <span className="mr-1.5">{k.emoji}</span>
                  {t(k.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <QuickReminderContactPicker people={people} value={who} onChange={setWho} />

          {/* Dictate instead of typing: the spoken words land in the box, added
              to whatever is already written there. */}
          <div className="flex items-center gap-2">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t(kind.hintKey)}
              aria-label={t(kind.labelKey)}
              maxLength={120}
              className="h-12 flex-1"
            />
            <VoiceInputButton
              onStart={() => { voiceBaseRef.current = text.trim(); }}
              onTranscript={(spoken) => setText([voiceBaseRef.current, spoken].filter(Boolean).join(' ').trim())}
              startLabel={t('home.voiceStart')}
              stopLabel={t('home.voiceStop')}
              listeningLabel={t('home.voiceListening')}
            />
          </div>

          {/* Saved support messages: one tap fills the box above. Sending is a
              separate step the user confirms, and only reaches saved connections. */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleSaveTemplate}
              disabled={!text.trim()}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary disabled:opacity-40"
            >
              <BookmarkPlus size={14} /> {t('home.savedMessagesSave')}
            </button>
            {matched && (
              <button
                type="button"
                onClick={() => setSendOpen(true)}
                disabled={!text.trim()}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary disabled:opacity-40"
              >
                <Send size={14} /> {t('home.sendMessageOpen')}
              </button>
            )}
          </div>

          <SavedMessageTemplates
            templates={templates}
            onPick={setText}
            onEdit={setEditingTemplate}
            onRemove={handleRemoveTemplate}
          />

          {!matched && !!text.trim() && (
            <p className="text-[11px] text-muted-foreground">{t('home.sendMessageNeedContact')}</p>
          )}

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('home.quickReminderHowOften')}</label>
            <div className="flex flex-wrap gap-2">
              {CADENCES.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCadenceKey(c.key)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    cadenceKey === c.key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {t(c.labelKey)}
                </button>
              ))}
            </div>
            {cadence.key === 'once' && (
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                aria-label={t('home.quickReminderDate')}
                className="h-12 mt-2.5"
              />
            )}
          </div>

          <Button onClick={handleSave} disabled={!text.trim() || !whoName} className="w-full h-12 rounded-2xl">
            {t('home.quickReminderSave')}
          </Button>
        </div>
      )}

      <MessageTemplateEditor
        open={!!editingTemplate}
        template={editingTemplate}
        onClose={() => setEditingTemplate(null)}
        onSave={handleEditorSave}
        onDelete={handleEditorDelete}
      />

      <SendMessageDialog
        open={sendOpen}
        onClose={() => setSendOpen(false)}
        personId={matched?.id || ''}
        personName={whoName}
        message={text}
      />
      {confirmDialog}
    </div>
  );
}