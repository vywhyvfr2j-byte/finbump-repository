import React, { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TRIP_TYPES } from '@/lib/tripConstants';

const MAX_TYPES = 3;

// Trip-type chip selector — mirrors the meal planner's cuisine chips so the
// two planners feel the same: pick up to three preset trip types (Beach,
// Mountain, Fishing…) or type your own. The chosen types are kept as one
// comma-separated string, the same shape the meal form uses for cuisines.
export default function TripTypePicker({ value = '', onChange, label = 'Trip type' }) {
  const [input, setInput] = useState('');

  const types = useMemo(
    () => (value ? value.split(',').map((t) => t.trim()).filter(Boolean) : []),
    [value],
  );

  // The presets plus anything the host typed in, so a type of their own shows
  // up as a selected chip they can tap off again.
  const options = useMemo(() => {
    const presets = TRIP_TYPES.slice(0, 12);
    return [...presets, ...types.filter((t) => !presets.includes(t))];
  }, [types]);

  const toggle = (t) => {
    const next = types.includes(t)
      ? types.filter((x) => x !== t)
      : types.length >= MAX_TYPES
        ? types
        : [...types, t];
    onChange(next.join(', '));
  };

  const add = () => {
    const v = input.trim();
    if (!v) return;
    if (!types.includes(v) && types.length < MAX_TYPES) toggle(v);
    setInput('');
  };

  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {options.map((t) => {
          const selected = types.includes(t);
          // With three already chosen the rest stay tappable-looking but dim,
          // so the allowance is visible instead of an unexplained dead tap.
          const full = !selected && types.length >= MAX_TYPES;
          return (
            <button
              key={t}
              type="button"
              aria-pressed={selected}
              onClick={() => toggle(t)}
              disabled={full}
              className={`px-3 h-8 rounded-full border text-xs transition-colors ${
                selected
                  ? 'border-primary bg-primary/10 font-medium'
                  : `border-border text-muted-foreground ${full ? 'opacity-40' : ''}`
              }`}
            >
              {t}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Add an idea"
          aria-label="Add trip type"
          className="h-10"
        />
        <Button variant="outline" className="h-10 shrink-0" onClick={add}>
          Add
        </Button>
      </div>
    </div>
  );
}