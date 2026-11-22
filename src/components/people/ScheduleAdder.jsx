import React, { useState } from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ResponsiveMenu from '@/components/ui/responsive-menu';
import { Switch } from '@/components/ui/switch';
import { Plus, X, CalendarClock, Repeat, ChevronDown } from 'lucide-react';
import { ACT_CATEGORIES, CATEGORY_BY_KEY } from '@/lib/actTags';

const UNIT_FACTOR = { days: 1, weeks: 7, months: 30 };
const UNIT_TAG = { days: 'daily', weeks: 'weekly', months: 'monthly' };
const EMOJI_CHOICES = ['✨', '💛', '🤲', '❤️', '🍷', '✉️', '🌙', '🎁', '🌸', '🍫'];

const todayStr = () => new Date().toISOString().slice(0, 10);

// Unified "add a scheduled item" dropdown for a single contact. The user picks a
// category (act of kindness / prayer / health & personal / other), a date, and a
// repeat cadence; the item is created as an Act scoped to that person so it shows
// on the Home acts list and the events calendar.
export default function ScheduleAdder({ personName, personId }) {
  const { addCustomAct } = useKeepsake();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState('act');
  const [name, setName] = useState('');
  const [date, setDate] = useState(todayStr());
  const [repeat, setRepeat] = useState(true);
  const [intervalValue, setIntervalValue] = useState('1');
  const [unit, setUnit] = useState('weeks');
  const [emoji, setEmoji] = useState(CATEGORY_BY_KEY.act.emoji);

  if (!personName) return null;

  const reset = () => {
    setCategory('act');
    setName('');
    setDate(todayStr());
    setRepeat(true);
    setIntervalValue('1');
    setUnit('weeks');
    setEmoji(CATEGORY_BY_KEY.act.emoji);
    setOpen(false);
  };

  const pickCategory = (key) => {
    setCategory(key);
    setEmoji(CATEGORY_BY_KEY[key]?.emoji || emoji);
  };

  const handleSave = () => {
    if (!name.trim() || !date) return;
    const factor = UNIT_FACTOR[unit] || 1;
    const intervalDays = repeat ? Math.max(1, Number(intervalValue) || 1) * factor : 0;
    addCustomAct({
      name: name.trim(),
      nextDue: new Date(date + 'T00:00:00').toISOString(),
      repeat,
      intervalDays,
      category,
      emoji,
      person: personName,
      ...(personId ? { personId } : {}),
      tag: repeat ? UNIT_TAG[unit] : 'special',
    });
    reset();
  };

  const QUICK_OPTIONS = [
    { key: 'act', label: 'Add act' },
    { key: 'prayer', label: 'Add prayer' },
    { key: 'health', label: 'Health reminder' },
    { key: 'other', label: 'Other reminder' },
  ];

  const pickQuick = (key) => {
    setCategory(key);
    setEmoji(CATEGORY_BY_KEY[key]?.emoji || emoji);
    setOpen(true);
  };

  if (!open) {
    return (
      <ResponsiveMenu
        title="Add an act or reminder"
        align="center"
        contentClassName="w-56 p-1"
        trigger={
          <button
            type="button"
            className="w-full flex items-center justify-center gap-1.5 h-11 rounded-xl border border-dashed border-primary/40 text-primary text-sm font-medium hover:bg-primary/5 transition-colors"
          >
            <Plus size={16} /> Add an act or reminder
            <ChevronDown size={14} className="opacity-60" />
          </button>
        }
      >
        {(close) =>
          QUICK_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => {
                close();
                pickQuick(opt.key);
              }}
              className="flex w-full min-h-12 items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-sm hover:bg-accent/60"
            >
              <span className="text-base">{CATEGORY_BY_KEY[opt.key]?.emoji}</span>
              {opt.label}
            </button>
          ))
        }
      </ResponsiveMenu>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold">For {personName}</h3>
        <button onClick={reset} className="text-muted-foreground" aria-label="Cancel">
          <X size={18} />
        </button>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">What kind of item?</label>
        <Select value={category} onValueChange={pickCategory}>
          <SelectTrigger className="h-11" aria-label="Item category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACT_CATEGORIES.map((c) => (
              <SelectItem key={c.key} value={c.key}>
                {c.emoji} {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">What is it?</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={
            category === 'prayer' ? 'e.g. Pray for their healing'
            : category === 'health' ? 'e.g. Check on recovery'
            : category === 'other' ? 'e.g. Send a thinking-of-you text'
            : 'e.g. Cook their favorite meal'
          }
          aria-label="Item name"
          className="h-11"
          autoFocus
        />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
          <CalendarClock size={13} /> Date
        </label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Item date" className="h-11" />
      </div>

      <div className="flex items-center justify-between bg-secondary/60 rounded-xl px-3.5 py-2.5">
        <span className="text-sm font-medium flex items-center gap-1.5">
          <Repeat size={15} /> Repeats
        </span>
        <Switch checked={repeat} onCheckedChange={setRepeat} />
      </div>

      {repeat && (
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Repeat every</label>
          <div className="flex gap-2">
            <Input
              type="number"
              min="1"
              value={intervalValue}
              onChange={(e) => setIntervalValue(e.target.value)}
              aria-label="Repeat interval"
              className="h-11 flex-1"
            />
            <div className="flex items-center gap-1 bg-secondary rounded-md p-1">
              {['days', 'weeks', 'months'].map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  className={`px-3 h-9 rounded text-sm font-medium capitalize transition-colors ${
                    unit === u ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Icon</label>
        <div className="flex flex-wrap gap-2">
          {EMOJI_CHOICES.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-colors ${
                emoji === e ? 'bg-primary/15 ring-2 ring-primary' : 'bg-secondary'
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <Button onClick={handleSave} disabled={!name.trim() || !date} className="w-full h-11 rounded-2xl">
        Save item
      </Button>
    </div>
  );
}