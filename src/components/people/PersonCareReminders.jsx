import React, { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heart, HandHeart, Check } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import PrivacyHint from '@/components/PrivacyHint';

const CADENCE_OPTIONS = [
  { value: '0', label: 'Off' },
  { value: '7', label: 'Every 7 days' },
  { value: '30', label: 'Every 30 days' },
  { value: '60', label: 'Every 60 days' },
  { value: '90', label: 'Every 90 days' },
];

function daysSince(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

// Health check-in, prayer, and reach-out reminders for a single contact. Text
// fields use local draft state and commit on blur to avoid an API call per
// keystroke; cadence selects and action buttons commit immediately.
export default function PersonCareReminders({ person, onUpdate }) {
  const { toast } = useToast();
  const [draft, setDraft] = useState({
    healthNotes: person.healthNotes || '',
    prayerNames: person.prayerNames || '',
    prayerReason: person.prayerReason || '',
  });

  // Re-seed the draft when switching contacts.
  useEffect(() => {
    setDraft({
      healthNotes: person.healthNotes || '',
      prayerNames: person.prayerNames || '',
      prayerReason: person.prayerReason || '',
    });
  }, [person.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const commit = (field) => () => {
    if (draft[field] !== (person[field] || '')) {
      onUpdate({ [field]: draft[field] });
    }
  };

  const stamp = (field, label) => {
    onUpdate({ [field]: new Date().toISOString() });
    toast({ title: label });
  };

  const cadenceValue = (val) => (val ? String(val) : '0');
  const setCadence = (field, v) => onUpdate({ [field]: Number(v) || null });

  return (
    <div className="space-y-3">
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Care reminders</p>
      <PrivacyHint className="mb-1" />

      {/* Health check-in */}
      <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Heart size={16} className="text-primary" />
          <p className="text-sm font-medium">Health & personal care</p>
        </div>
        <Textarea
          value={draft.healthNotes}
          onChange={(e) => setDraft((d) => ({ ...d, healthNotes: e.target.value }))}
          onBlur={commit('healthNotes')}
          placeholder="Notes about their health or personal situation…"
          aria-label="Health notes"
          className="min-h-[60px]"
        />
        <div className="flex items-center gap-2">
          <Select
            value={cadenceValue(person.healthReminderDays)}
            onValueChange={(v) => setCadence('healthReminderDays', v)}
          >
            <SelectTrigger className="h-9 flex-1" aria-label="Health check-in cadence">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CADENCE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => stamp('lastHealthCheckIn', 'Check-in logged')}
            className="h-9 shrink-0 gap-1"
          >
            <Check size={14} /> Checked in
          </Button>
        </div>
        {person.healthReminderDays > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Remind until</span>
            <Input
              type="date"
              value={person.healthReminderEndDate || ''}
              onChange={(e) => onUpdate({ healthReminderEndDate: e.target.value || null })}
              aria-label="Health reminder end date"
              className="h-9 flex-1"
            />
            {person.healthReminderEndDate && (
              <button
                type="button"
                onClick={() => onUpdate({ healthReminderEndDate: null })}
                className="text-xs text-muted-foreground shrink-0"
              >
                Clear
              </button>
            )}
          </div>
        )}
        {person.healthReminderDays > 0 && person.lastHealthCheckIn && (
          <p className="text-xs text-muted-foreground">
            Last check-in {daysSince(person.lastHealthCheckIn)} day{daysSince(person.lastHealthCheckIn) === 1 ? '' : 's'} ago
          </p>
        )}
      </div>

      {/* Prayer */}
      <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HandHeart size={16} className="text-primary" />
            <p className="text-sm font-medium">Prayer reminder</p>
          </div>
          <Switch
            checked={person.prayerEnabled === true}
            onCheckedChange={(v) => onUpdate({ prayerEnabled: v })}
            aria-label="Prayer reminder"
          />
        </div>
        {person.prayerEnabled && (
          <>
            <Input
              value={draft.prayerNames}
              onChange={(e) => setDraft((d) => ({ ...d, prayerNames: e.target.value }))}
              onBlur={commit('prayerNames')}
              placeholder="Names to pray for (can be anyone)"
              aria-label="Names to pray for"
              className="h-10"
            />
            <Textarea
              value={draft.prayerReason}
              onChange={(e) => setDraft((d) => ({ ...d, prayerReason: e.target.value }))}
              onBlur={commit('prayerReason')}
              placeholder="Reason or intention for prayer"
              aria-label="Prayer reason"
              className="min-h-[50px]"
            />
            {person.healthNotes && (
              <button
                type="button"
                onClick={() => {
                  setDraft((d) => ({ ...d, prayerReason: person.healthNotes }));
                  onUpdate({ prayerReason: person.healthNotes });
                }}
                className="text-xs text-primary"
              >
                Use health note as reason
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={person.prayerReminderDays || ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    onUpdate({ prayerReminderDays: v === '' ? null : Math.max(0, Number(v)) });
                  }}
                  placeholder="Off"
                  aria-label="Prayer reminder days"
                  className="h-9 w-20"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">days (0 = off)</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => stamp('lastPrayedAt', 'Prayer logged')}
                className="h-9 shrink-0 gap-1"
              >
                <Check size={14} /> Prayed
              </Button>
            </div>
            {person.prayerReminderDays > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground whitespace-nowrap">Remind until</span>
                <Input
                  type="date"
                  value={person.prayerReminderEndDate || ''}
                  onChange={(e) => onUpdate({ prayerReminderEndDate: e.target.value || null })}
                  aria-label="Prayer reminder end date"
                  className="h-9 flex-1"
                />
                {person.prayerReminderEndDate && (
                  <button
                    type="button"
                    onClick={() => onUpdate({ prayerReminderEndDate: null })}
                    className="text-xs text-muted-foreground shrink-0"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}
            {person.prayerReminderDays > 0 && person.lastPrayedAt && (
              <p className="text-xs text-muted-foreground">
                Last prayed {daysSince(person.lastPrayedAt)} day{daysSince(person.lastPrayedAt) === 1 ? '' : 's'} ago
              </p>
            )}
          </>
        )}
      </div>

    </div>
  );
}