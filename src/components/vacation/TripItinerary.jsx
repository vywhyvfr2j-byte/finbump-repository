import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Trash2, MapPinned } from 'lucide-react';
import { formatDate } from '@/lib/keepsakeUtils';

export default function TripItinerary({ trip, onAddItem, onDeleteItem }) {
  const [date, setDate] = useState('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');

  const handleAdd = () => {
    if (!title.trim()) return;
    onAddItem({ date, title: title.trim(), notes: notes.trim() });
    setDate('');
    setTitle('');
    setNotes('');
  };

  const sorted = [...trip.itinerary].sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  return (
    <div>
      <div className="space-y-2 mb-3">
        <div className="flex gap-2">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-10 w-[150px] shrink-0" />
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Activity" className="h-10 flex-1" />
        </div>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" className="min-h-[50px]" />
        <Button onClick={handleAdd} disabled={!title.trim()} className="w-full h-10">
          Add to itinerary
        </Button>
      </div>

      <div className="space-y-2.5">
        {sorted.map((item) => (
          <div key={item.id} className="bg-card rounded-2xl border border-border p-3.5 flex gap-3">
            <MapPinned size={16} className="text-accent shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{item.title}</p>
                {item.date && <span className="text-[11px] text-muted-foreground whitespace-nowrap">{formatDate(item.date)}</span>}
              </div>
              {item.notes && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.notes}</p>}
            </div>
            <button onClick={() => onDeleteItem(item.id)} className="text-muted-foreground shrink-0">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        {sorted.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No itinerary items yet.</p>}
      </div>
    </div>
  );
}