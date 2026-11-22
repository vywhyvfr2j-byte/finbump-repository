import React, { useState } from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format, subDays } from 'date-fns';
import { Plus, Trash2 } from 'lucide-react';

function nextDate(month, day) {
  const now = new Date();
  let d = new Date(now.getFullYear(), month - 1, day);
  if (d < now) d = new Date(now.getFullYear() + 1, month - 1, day);
  return d;
}

function daysBefore(dateStr) {
  if (!dateStr) return null;
  const [, m, d] = dateStr.split('-').map(Number);
  return subDays(nextDate(m, d), 30);
}

export default function PartnerSyncOptions() {
  const { settings, updateSettings, profile } = useKeepsake();
  const [newLabel, setNewLabel] = useState('');
  const [newDate, setNewDate] = useState('');

  const customDates = settings.customSyncReminderDates || [];

  const reminderDates = [
    { label: "30 days before their birthday", date: daysBefore(profile.birthday) },
    { label: 'February 1st', date: nextDate(2, 1) },
    { label: '30 days before your anniversary', date: daysBefore(profile.anniversary) },
    { label: 'November 15th', date: nextDate(11, 15) },
    { label: 'December 5th', date: nextDate(12, 5) },
  ];

  const addCustomDate = () => {
    const label = newLabel.trim();
    if (!label || !newDate) return;
    const [y, m, d] = newDate.split('-').map(Number);
    const entry = { id: 'cr' + Date.now(), label, month: m, day: d };
    updateSettings({ customSyncReminderDates: [...customDates, entry] });
    setNewLabel('');
    setNewDate('');
  };

  const removeCustomDate = (id) => {
    updateSettings({ customSyncReminderDates: customDates.filter((c) => c.id !== id) });
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
      <div>
        <p className="text-sm font-medium">Partner sync</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Choose how your data stays in sync with your paired partner.
        </p>
      </div>

      <label className="flex items-start gap-2.5 bg-secondary/40 rounded-xl px-3.5 py-3 cursor-pointer">
        <Checkbox
          checked={settings.syncAutosync}
          onCheckedChange={(v) => updateSettings({ syncAutosync: !!v })}
          className="mt-0.5"
        />
        <div>
          <p className="text-sm font-medium">Autosync</p>
          <p className="text-xs text-muted-foreground">Keep shared data synced automatically at all times.</p>
        </div>
      </label>

      <label className="flex items-start gap-2.5 bg-secondary/40 rounded-xl px-3.5 py-3 cursor-pointer">
        <Checkbox
          checked={settings.syncAnnualReminder}
          onCheckedChange={(v) => updateSettings({ syncAnnualReminder: !!v })}
          className="mt-0.5"
        />
        <div>
          <p className="text-sm font-medium">Annual reminder</p>
          <p className="text-xs text-muted-foreground">Remind me once a year to review and sync details.</p>
        </div>
      </label>

      <label className="flex items-start gap-2.5 bg-secondary/40 rounded-xl px-3.5 py-3 cursor-pointer">
        <Checkbox
          checked={settings.syncDateReminders}
          onCheckedChange={(v) => updateSettings({ syncDateReminders: !!v })}
          className="mt-0.5"
        />
        <div>
          <p className="text-sm font-medium">Scheduled sync reminders</p>
          <p className="text-xs text-muted-foreground">Remind me to sync around these key dates each year.</p>
        </div>
      </label>

      {settings.syncDateReminders && (
        <div className="pl-1 space-y-1.5">
          {reminderDates.map((r) => (
            <div key={r.label} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{r.label}</span>
              {r.date && <span className="font-medium">{format(r.date, 'MMM d, yyyy')}</span>}
            </div>
          ))}

          {customDates.length > 0 && (
            <div className="pt-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Your dates</p>
              {customDates.map((c) => (
                <div key={c.id} className="flex items-center justify-between text-xs py-0.5">
                  <span className="text-muted-foreground">{c.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{format(nextDate(c.month, c.day), 'MMM d, yyyy')}</span>
                    <button
                      onClick={() => removeCustomDate(c.id)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={`Remove ${c.label}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Add a date</p>
            <Input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Label (e.g. Before Mother's Day)"
              className="h-9 text-sm"
            />
            <div className="flex gap-2">
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="h-9 text-sm flex-1"
              />
              <Button
                onClick={addCustomDate}
                disabled={!newLabel.trim() || !newDate}
                size="sm"
                className="h-9 shrink-0"
              >
                <Plus size={16} /> Add
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}