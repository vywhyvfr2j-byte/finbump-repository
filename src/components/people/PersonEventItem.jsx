import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pin, Pencil, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/keepsakeUtils';

export default function PersonEventItem({ event, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(event.name);
  const [date, setDate] = useState(event.date ? event.date.slice(0, 10) : '');

  const save = () => {
    if (!name.trim() || !date) return;
    onUpdate(event.id, { name: name.trim(), date: new Date(date).toISOString() });
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex gap-2 mt-1.5">
        <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-xs flex-1" />
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9 text-xs" />
        <Button onClick={save} className="h-9 px-3 text-xs">Save</Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 mt-1">
      <p className="text-xs text-muted-foreground flex items-center gap-1.5 min-w-0">
        <Pin size={12} className="shrink-0" /> <span className="truncate">{event.name}: {formatDate(event.date)}</span>
      </p>
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={() => setEditing(true)} className="text-muted-foreground">
          <Pencil size={13} />
        </button>
        <button onClick={() => onDelete(event.id)} className="text-muted-foreground">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}