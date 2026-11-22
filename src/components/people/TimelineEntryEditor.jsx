import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import ConnectionPicker from './ConnectionPicker';
import { useI18n } from '@/lib/i18n/I18nContext';

// Inline editor for a timeline entry (a milestone or a personal note) opened
// from a connection's page. Besides the entry's own text it can hand the entry
// to another connection through the all-names dropdown.
export default function TimelineEntryEditor({ kind, record, people, onSave, onCancel }) {
  const { t } = useI18n();
  const isMilestone = kind === 'milestone';
  const [title, setTitle] = useState(record?.title || '');
  const [date, setDate] = useState(record?.date ? String(record.date).slice(0, 10) : '');
  const [description, setDescription] = useState(record?.description || '');
  const [text, setText] = useState(record?.text || '');
  const [personId, setPersonId] = useState(record?.personId || '');

  const canSave = isMilestone ? Boolean(title.trim() && date) : Boolean(text.trim());

  const handleSave = () => {
    if (!canSave) return;
    onSave(
      isMilestone
        ? {
            title: title.trim(),
            date: new Date(date).toISOString(),
            description: description.trim(),
            personId: personId || null,
          }
        : { text: text.trim(), personId: personId || null }
    );
  };

  return (
    <div className="mt-2 rounded-xl border border-border bg-background/60 p-3 space-y-2.5">
      {isMilestone ? (
        <>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('relNotes.milestoneTitle')}
            aria-label={t('relNotes.milestoneTitle')}
            className="h-10"
          />
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label={t('relNotes.milestoneDate')}
            className="h-10"
          />
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('relNotes.milestoneDescPlaceholder')}
            aria-label={t('relNotes.milestoneDescAria')}
            rows={2}
          />
        </>
      ) : (
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('personalNotes.placeholder')}
          aria-label={t('personalNotes.placeholder')}
          rows={3}
        />
      )}

      <div>
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide block mb-1">
          {t('timeline.linkPerson')}
        </span>
        <ConnectionPicker people={people} value={personId} onChange={setPersonId} />
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={!canSave} className="flex-1 h-10 rounded-xl">
          {t('common.save')}
        </Button>
        <Button onClick={onCancel} variant="outline" className="h-10 rounded-xl px-4">
          {t('common.cancel')}
        </Button>
      </div>
    </div>
  );
}