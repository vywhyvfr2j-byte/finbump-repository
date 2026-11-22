import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function AddPersonEventForm({ onAdd, onClose }) {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');

  const handleSave = () => {
    if (!name.trim() || !date) return;
    onAdd({
      name: name.trim(),
      date: new Date(date).toISOString(),
      type: 'custom',
      note: '',
      reminderDays: [7, 1],
    });
    setName('');
    setDate('');
    onClose();
  };

  return (
    <div className="space-y-2 mt-2.5 pt-2.5 border-t border-border">
      <p className="text-[11px] font-medium text-muted-foreground">One-time event (doesn't repeat)</p>
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Event name" className="h-10 text-sm" />
      <div className="flex gap-2">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-10 flex-1" />
        <Button onClick={handleSave} disabled={!name.trim() || !date} className="h-10">
          Add
        </Button>
      </div>
    </div>
  );
}