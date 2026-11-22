import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

// Editable list of custom facts/notes about a contact. Stored on the Person
// as `otherItems` (array of strings) and fed into the AI gift + message prompts
// so the user's freeform knowledge shapes suggestions.
export default function OtherItemsList({ items = [], onUpdate }) {
  const [newItem, setNewItem] = useState('');

  const add = () => {
    const v = newItem.trim();
    if (!v) return;
    onUpdate([...items, v]);
    setNewItem('');
  };
  const remove = (i) => onUpdate(items.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      <div>
        <label className="text-xs font-medium text-muted-foreground">Other things to know</label>
        <p className="text-[11px] text-muted-foreground mt-0.5">Used by AI when suggesting gifts & messages</p>
      </div>
      {items.length > 0 && (
        <ul className="space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className="flex items-start justify-between gap-2 bg-secondary/60 rounded-xl px-3 py-2">
              <span className="text-sm leading-relaxed">{item}</span>
              <button onClick={() => remove(i)} className="text-muted-foreground hover:text-destructive shrink-0 mt-0.5" aria-label="Remove">
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center gap-1.5">
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder="Add a fact or note"
          aria-label="Add a fact or note"
          className="h-9 text-sm flex-1"
        />
        <Button onClick={add} disabled={!newItem.trim()} size="sm" className="h-9 px-3">
          Add
        </Button>
      </div>
    </div>
  );
}