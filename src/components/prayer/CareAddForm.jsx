import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useI18n } from '@/lib/i18n/I18nContext';
import PrivacyHint from '@/components/PrivacyHint';

// Self-contained add form for prayer/health/other care reminders. Manages its
// own state and calls onSave with a resolved payload + person selection.
export default function CareAddForm({ tab, availablePeople, onUpdateExisting, onAddNew, onCancel, editPerson }) {
  const { t } = useI18n();
  const editing = !!editPerson;
  const CADENCE_OPTIONS = [
    { value: '1', label: t('careAdd.everyDay') },
    { value: '3', label: t('careAdd.every3Days') },
    { value: '7', label: t('careAdd.every7Days') },
    { value: '14', label: t('careAdd.every14Days') },
    { value: '30', label: t('careAdd.every30Days') },
  ];
  const FORM_CONFIG = {
    prayer: {
      title: t('careAdd.prayerTitle'),
      primaryPlaceholder: t('careAdd.prayerNamesPlaceholder'),
      primaryLabel: 'prayerNames',
      showSecondary: true,
      secondaryPlaceholder: t('careAdd.prayerReasonPlaceholder'),
      buttonText: t('careAdd.prayerButton'),
    },
    health: {
      title: t('careAdd.healthTitle'),
      primaryPlaceholder: t('careAdd.healthNotesPlaceholder'),
      primaryLabel: 'healthNotes',
      showSecondary: false,
      buttonText: t('careAdd.healthButton'),
    },
    other: {
      title: t('careAdd.otherTitle'),
      primaryPlaceholder: t('careAdd.otherNotesPlaceholder'),
      primaryLabel: 'otherNotes',
      showSecondary: false,
      buttonText: t('careAdd.otherButton'),
    },
  };
  const cfg = FORM_CONFIG[tab];
  const [addMode, setAddMode] = useState('existing');
  const [selectedPersonId, setSelectedPersonId] = useState(editPerson?.id || '');
  const [newName, setNewName] = useState('');
  const initialPrimary = editPerson
    ? (tab === 'prayer' ? editPerson.prayerNames || '' : tab === 'health' ? editPerson.healthNotes || '' : editPerson.otherNotes || '')
    : '';
  const initialSecondary = editPerson?.prayerReason || '';
  const initialCadence = editPerson
    ? String((tab === 'prayer' ? editPerson.prayerReminderDays : tab === 'health' ? editPerson.healthReminderDays : editPerson.otherReminderDays) || 7)
    : '7';
  const initialEndDateRaw = editPerson
    ? (tab === 'prayer' ? editPerson.prayerReminderEndDate : tab === 'health' ? editPerson.healthReminderEndDate : editPerson.otherReminderEndDate)
    : '';
  const initialEnd = (initialEndDateRaw || '').slice(0, 10);
  const [primaryField, setPrimaryField] = useState(initialPrimary);
  const [secondaryField, setSecondaryField] = useState(initialSecondary);
  const [cadence, setCadence] = useState(initialCadence);
  const [endDate, setEndDate] = useState(initialEnd);

  const canSave = (addMode === 'existing' && !!selectedPersonId) || (addMode === 'new' && newName.trim().length > 0);

  const handleSave = () => {
    if (!canSave) return;
    const reminderDays = Number(cadence) || 0;
    const payload = {};
    if (tab === 'prayer') {
      payload.prayerEnabled = true;
      payload.prayerReminderDays = reminderDays;
      payload.prayerReminderEndDate = endDate || null;
      if (primaryField.trim()) payload.prayerNames = primaryField.trim();
      if (secondaryField.trim()) payload.prayerReason = secondaryField.trim();
    } else if (tab === 'health') {
      payload.healthReminderDays = reminderDays;
      payload.healthReminderEndDate = endDate || null;
      if (primaryField.trim()) payload.healthNotes = primaryField.trim();
    } else {
      payload.otherReminderDays = reminderDays;
      payload.otherReminderEndDate = endDate || null;
      if (primaryField.trim()) payload.otherNotes = primaryField.trim();
    }
    if (addMode === 'existing') {
      onUpdateExisting(selectedPersonId, payload);
    } else {
      onAddNew({ name: newName.trim(), ...payload });
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-4 space-y-3 mb-5">
      <h3 className="font-display text-sm font-semibold">{editing ? `Edit ${tab === 'prayer' ? 'prayer' : tab === 'health' ? 'health check-in' : 'reminder'}` : cfg.title}</h3>
      {!editing && (
        <div className="flex gap-1.5">
          <button
            onClick={() => setAddMode('existing')}
            className={`flex-1 h-9 rounded-lg text-xs font-medium transition-colors ${addMode === 'existing' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
          >
            {t('careAdd.existingPerson')}
          </button>
          <button
            onClick={() => setAddMode('new')}
            className={`flex-1 h-9 rounded-lg text-xs font-medium transition-colors ${addMode === 'new' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
          >
            {t('careAdd.someoneNew')}
          </button>
        </div>
      )}
      {editing ? (
        <p className="text-sm font-medium">{editPerson.name}{editPerson.kind === 'pet' ? ' 🐾' : ''}</p>
      ) : addMode === 'existing' ? (
        availablePeople.length > 0 ? (
          <Select value={selectedPersonId} onValueChange={setSelectedPersonId}>
            <SelectTrigger className="h-11"><SelectValue placeholder={t('careAdd.choosePerson')} /></SelectTrigger>
            <SelectContent>
              {availablePeople.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}{p.kind === 'pet' ? ' 🐾' : ''}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <p className="text-sm text-muted-foreground">{t('careAdd.noContacts')}</p>
        )
      ) : (
        <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t('careAdd.theirName')} className="h-11" />
      )}
      <PrivacyHint className="mb-1" />
      {tab === 'prayer' ? (
        <>
          <Input value={primaryField} onChange={(e) => setPrimaryField(e.target.value)} placeholder={cfg.primaryPlaceholder} className="h-11" />
          <Textarea value={secondaryField} onChange={(e) => setSecondaryField(e.target.value)} placeholder={cfg.secondaryPlaceholder} className="min-h-[50px]" />
        </>
      ) : (
        <Textarea value={primaryField} onChange={(e) => setPrimaryField(e.target.value)} placeholder={cfg.primaryPlaceholder} className="min-h-[50px]" />
      )}
      <Select value={cadence} onValueChange={setCadence}>
        <SelectTrigger className="h-11 flex-1"><SelectValue /></SelectTrigger>
        <SelectContent>
          {CADENCE_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground whitespace-nowrap">{t('careAdd.remindUntil')}</span>
        <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-11 flex-1" />
        {endDate && <button onClick={() => setEndDate('')} className="text-xs text-muted-foreground shrink-0">{t('careAdd.clear')}</button>}
      </div>
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={!canSave} className="flex-1 h-11 rounded-xl">{cfg.buttonText}</Button>
        <Button onClick={onCancel} variant="outline" className="h-11 rounded-xl px-4">{t('common.cancel')}</Button>
      </div>
    </div>
  );
}