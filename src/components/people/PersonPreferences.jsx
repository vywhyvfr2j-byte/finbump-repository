import React, { useState } from 'react';
import { CATEGORIES, CATEGORY_ICONS, CATEGORY_OPTIONS } from '@/lib/giftConstants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Pencil, Check, ChevronDown, Plus, X, Trash2 } from 'lucide-react';

// Editable per-person info for each gift category icon (ring size, gem preference, etc.),
// stored on person.preferences. Used on both the Gift Tracker and the person's card.
export default function PersonPreferences({ person, onUpdate }) {
  const [editingCat, setEditingCat] = useState(null);
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);
  const [addingCustom, setAddingCustom] = useState(false);
  const [customLabel, setCustomLabel] = useState('');
  const [customValue, setCustomValue] = useState('');
  const preferences = person?.preferences || {};
  const customEntries = Object.keys(preferences).filter((k) => !CATEGORIES.includes(k));

  const startEdit = (cat) => {
    setEditingCat(cat);
    setValue(preferences[cat] || '');
  };

  const save = (val) => {
    onUpdate({ preferences: { ...preferences, [editingCat]: val } });
    setEditingCat(null);
  };

  const saveCustom = () => {
    if (!customLabel.trim()) return;
    onUpdate({ preferences: { ...preferences, [customLabel.trim()]: customValue.trim() } });
    setCustomLabel('');
    setCustomValue('');
    setAddingCustom(false);
  };

  const removeCustom = (key) => {
    const { [key]: _, ...rest } = preferences;
    onUpdate({ preferences: rest });
  };

  if (!person) return null;

  return (
    <div className="mt-3">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-1 w-full text-left">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Preferences & sizes</p>
        <ChevronDown size={13} className={`text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="space-y-1.5 mt-1.5">
          {CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat];
            const val = preferences[cat];
            const options = CATEGORY_OPTIONS[cat] || [];
            if (editingCat === cat) {
              return (
                <div key={cat} className="flex items-center gap-2">
                  <Icon size={15} className="text-muted-foreground shrink-0" />
                  {options.length > 0 ? (
                    <Select value={value || undefined} onValueChange={save}>
                      <SelectTrigger className="h-8 text-xs flex-1">
                        <SelectValue placeholder={cat} />
                      </SelectTrigger>
                      <SelectContent>
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
                      onKeyDown={(e) => e.key === 'Enter' && save(value)}
                      placeholder={cat}
                      className="h-8 text-xs flex-1"
                    />
                  )}
                  {options.length === 0 && (
                    <button onClick={() => save(value)} className="text-primary shrink-0">
                      <Check size={16} />
                    </button>
                  )}
                </div>
              );
            }
            return (
              <button key={cat} onClick={() => startEdit(cat)} className="flex items-center gap-2 w-full text-left group">
                <Icon size={15} className="text-muted-foreground shrink-0" />
                <span className="text-xs flex-1 min-w-0 truncate">
                  <span className="text-muted-foreground">{cat}:</span>{' '}
                  {val ? (
                    <span className="font-medium">{val}</span>
                  ) : (
                    <span className="italic text-muted-foreground/70">Add info</span>
                  )}
                </span>
                <Pencil size={12} className="text-muted-foreground/50 shrink-0" />
              </button>
            );
          })}

          {customEntries.map((key) => (
            <div key={key} className="flex items-center gap-2">
              {editingCat === key ? (
                <>
                  <Input
                    autoFocus
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && save(value)}
                    placeholder={key}
                    className="h-8 text-xs flex-1"
                  />
                  <button onClick={() => save(value)} className="text-primary shrink-0">
                    <Check size={16} />
                  </button>
                </>
              ) : (
                <button onClick={() => startEdit(key)} className="flex items-center gap-2 flex-1 min-w-0 text-left group">
                  <MoreHorizontalIcon />
                  <span className="text-xs flex-1 min-w-0 truncate">
                    <span className="text-muted-foreground">{key}:</span>{' '}
                    {preferences[key] ? (
                      <span className="font-medium">{preferences[key]}</span>
                    ) : (
                      <span className="italic text-muted-foreground/70">Add info</span>
                    )}
                  </span>
                  <Pencil size={12} className="text-muted-foreground/50 shrink-0" />
                </button>
              )}
              <button onClick={() => removeCustom(key)} className="text-muted-foreground/60 shrink-0">
                <Trash2 size={13} />
              </button>
            </div>
          ))}

          {addingCustom ? (
            <div className="flex items-center gap-2">
              <Input
                autoFocus
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="Label (e.g. Coffee order)"
                className="h-8 text-xs flex-1"
              />
              <Input
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveCustom()}
                placeholder="Value"
                className="h-8 text-xs flex-1"
              />
              <button onClick={saveCustom} className="text-primary shrink-0">
                <Check size={16} />
              </button>
              <button onClick={() => setAddingCustom(false)} className="text-muted-foreground shrink-0">
                <X size={14} />
              </button>
            </div>
          ) : (
            <button onClick={() => setAddingCustom(true)} className="flex items-center gap-2 text-xs text-primary font-medium mt-0.5">
              <Plus size={14} /> Add custom detail
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function MoreHorizontalIcon() {
  const Icon = CATEGORY_ICONS.Other;
  return <Icon size={15} className="text-muted-foreground shrink-0" />;
}