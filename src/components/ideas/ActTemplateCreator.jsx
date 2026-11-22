import React, { useState } from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CalendarPlus } from 'lucide-react';
import { ACT_TAGS, DEFAULT_TAG, ACT_CATEGORIES } from '@/lib/actTags';
import { toast } from '@/components/ui/use-toast';
import ResponsiveSelect from '@/components/ui/responsive-select';

const EMOJIS = ['✨', '🍷', '✉️', '🎁', '🤲', '💛', '🌙', '🤍', '🍫', '🌸', '📞', '☕'];
const CATEGORY_UNIT = { daily: 'days', weekly: 'weeks', monthly: 'months', special: 'days' };

// Lets the user turn an idea into a recurring act of support, linked to the
// selected contact. Created acts appear on the contact's profile and the Home page.
export default function ActTemplateCreator({ personId }) {
  const { addCustomAct, people } = useKeepsake();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('✨');
  const [intervalValue, setIntervalValue] = useState('7');
  const [unit, setUnit] = useState('days');
  const [tag, setTag] = useState(DEFAULT_TAG);
  const [category, setCategory] = useState('act');

  const person = people.find((p) => p.id === personId);

  const handleSave = () => {
    if (!name.trim() || !personId) return;
    const rawInterval = Number(intervalValue) || 1;
    const intervalDays = unit === 'weeks' ? rawInterval * 7 : unit === 'months' ? rawInterval * 30 : rawInterval;
    const isSpecial = tag === 'special';
    addCustomAct({
      name: name.trim(),
      intervalDays: isSpecial ? 0 : intervalDays,
      emoji,
      person: person?.name || '',
      personId,
      tag,
      category,
      ...(isSpecial ? { repeat: false, nextDue: new Date().toISOString() } : {}),
    });
    setName('');
    setEmoji('✨');
    setIntervalValue('7');
    setUnit('days');
    setTag(DEFAULT_TAG);
    setCategory('act');
    toast({ title: `Act template added to ${person?.name || 'contact'}`, duration: 2500 });
  };

  if (!personId) return null;

  return (
    <div className="bg-card rounded-2xl border border-border p-4 space-y-3 mb-5">
      <div className="flex items-center gap-2">
        <CalendarPlus size={16} className="text-primary" />
        <h3 className="text-sm font-semibold">Create an act template</h3>
      </div>
      <p className="text-xs text-muted-foreground -mt-1">Turn an idea into a recurring reminder for {person?.name || 'this contact'}.</p>

      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Watch a movie together"
        className="h-11"
        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
      />

      <div className="flex gap-1.5 flex-wrap">
        {EMOJIS.map((e) => (
          <button
            key={e}
            onClick={() => setEmoji(e)}
            className={`text-lg w-11 h-11 -m-1 rounded-lg border flex items-center justify-center transition-colors ${emoji === e ? 'border-primary bg-primary/10' : 'border-border'}`}
          >
            {e}
          </button>
        ))}
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {ACT_CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setCategory(c.key)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border ${category === c.key ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'}`}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {ACT_TAGS.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setTag(t.key);
              setUnit(CATEGORY_UNIT[t.key] || 'days');
            }}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border ${tag === t.key ? 'bg-secondary text-secondary-foreground border-secondary' : 'border-border text-muted-foreground'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tag !== 'special' && (
        <div className="flex gap-2 items-center">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Every</span>
          <Input
            type="number"
            value={intervalValue}
            onChange={(e) => setIntervalValue(e.target.value)}
            className="h-9 w-20"
          />
          <ResponsiveSelect
            value={unit}
            onValueChange={setUnit}
            ariaLabel="Repeat unit"
            title="Repeat every"
            className="h-9 w-auto px-2 text-sm"
            options={[
              { value: 'days', label: 'days' },
              { value: 'weeks', label: 'weeks' },
              { value: 'months', label: 'months' },
            ]}
          />
        </div>
      )}

      <Button onClick={handleSave} disabled={!name.trim()} className="w-full h-11">
        Add to {person?.name || 'contact'}
      </Button>
    </div>
  );
}