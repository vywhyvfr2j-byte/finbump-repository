import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

// Input-only tab: saved places flow to the contact's profile page.
export default function PlaceIdeasTab({ onAdd, placeholder, personId }) {
  const [destination, setDestination] = useState('');
  const [notes, setNotes] = useState('');
  const [budget, setBudget] = useState('');

  const handleAdd = () => {
    if (!destination.trim()) return;
    onAdd({
      destination: destination.trim(),
      notes: notes.trim(),
      budget: budget ? Number(budget) : null,
      ...(personId ? { personId } : {}),
    });
    setDestination('');
    setNotes('');
    setBudget('');
    toast({ title: 'Saved to contact profile', duration: 2500 });
  };

  return (
    <div>
      <div className="space-y-2 mb-3">
        <Input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder={placeholder} className="h-11" onKeyDown={(e) => e.key === 'Enter' && handleAdd()} />
        <Input
          type="number"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          placeholder="Budget ($)"
          className="h-11"
        />
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" className="min-h-[60px]" />
        <Button onClick={handleAdd} disabled={!destination.trim()} className="w-full h-11">Add</Button>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/40 rounded-xl px-3 py-2.5">
        <MapPin size={14} className="shrink-0" />
        <span>Saved places appear on the contact's profile page.</span>
      </div>
    </div>
  );
}