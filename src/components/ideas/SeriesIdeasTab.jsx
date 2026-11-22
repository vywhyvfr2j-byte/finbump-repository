import React, { useState } from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tv } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const PLATFORMS = ['Netflix', 'Prime Video', 'Disney+', 'Hulu', 'HBO Max', 'Apple TV+'];

// Input-only tab: saved series flow to the contact's profile page.
export default function SeriesIdeasTab({ personId }) {
  const { addSeriesIdea, people } = useKeepsake();
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState(PLATFORMS[0]);

  const person = people.find((p) => p.id === personId);
  const personName = person?.name;

  const handleAdd = () => {
    if (!title.trim()) return;
    addSeriesIdea({ title: title.trim(), platform, personId });
    setTitle('');
    toast({ title: personName ? `Saved to ${personName}'s profile` : 'Saved to contact', duration: 2500 });
  };

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Series title" className="h-11" onKeyDown={(e) => e.key === 'Enter' && handleAdd()} />
        <Button onClick={handleAdd} disabled={!title.trim()} className="h-11 px-4 shrink-0">Add</Button>
      </div>
      <div className="flex gap-1.5 flex-wrap mb-3">
        {PLATFORMS.map((p) => (
          <button
            key={p}
            onClick={() => setPlatform(p)}
            className={`text-xs px-2.5 py-1.5 rounded-full border ${platform === p ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'}`}
          >
            {p}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/40 rounded-xl px-3 py-2.5">
        <Tv size={14} className="shrink-0" />
        <span>Saved series appear on the contact's profile page.</span>
      </div>
    </div>
  );
}