import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Check } from 'lucide-react';
import { CATEGORY_OPTIONS } from '@/lib/giftConstants';

// Category row for the Gift Tracker list. Shows/filters by category, and when a
// person is selected, doubles as the editable spot for that person's preference
// (ring size, gem preference, etc.) so it isn't duplicated elsewhere on the page.
export default function GiftCategoryTile({ category, Icon, active, onToggle, person, prefValue, onUpdatePreference }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(prefValue || '');

  const options = CATEGORY_OPTIONS?.[category] || [];

  const startEdit = (e) => {
    e.stopPropagation();
    setValue(prefValue || '');
    setEditing(true);
  };

  const save = (e) => {
    e?.stopPropagation();
    onUpdatePreference(value);
    setEditing(false);
  };

  const onValueChange = (v) => {
    const next = v === '__none__' ? '' : v;
    setValue(next);
    onUpdatePreference(next);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-primary bg-card p-2.5">
        <Icon size={17} className="text-muted-foreground shrink-0" />
        {options.length > 0 ? (
          <Select value={value || '__none__'} onValueChange={onValueChange}>
            <SelectTrigger className="h-8 text-xs flex-1">
              <SelectValue placeholder={category} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">— Clear —</SelectItem>
              {options.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save(e)}
            onClick={(e) => e.stopPropagation()}
            placeholder={category}
            className="h-8 text-xs flex-1"
          />
        )}
        <button onClick={save} className="text-primary shrink-0">
          <Check size={16} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-2.5 w-full rounded-xl border p-2.5 text-left transition-colors ${
        active ? 'bg-primary border-primary text-primary-foreground' : 'bg-card border-border'
      }`}
    >
      <Icon size={17} className="shrink-0" />
      <span className="text-sm font-medium flex-1 min-w-0 truncate">{category}</span>
      {prefValue && (
        <span className={`text-xs font-semibold truncate max-w-[35%] ${active ? 'text-primary-foreground' : 'text-accent'}`}>
          {prefValue}
        </span>
      )}
      {person && (
        <span onClick={startEdit} className={`shrink-0 ${active ? 'text-primary-foreground/70' : 'text-muted-foreground/50'}`}>
          <Pencil size={13} />
        </span>
      )}
    </button>
  );
}