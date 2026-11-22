import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';

export default function CategoryAddPanel({ category, personName, onAdd, onAISuggest, aiLoading }) {
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [budget, setBudget] = useState('');

  const handleAdd = () => {
    if (!title.trim()) return;
    onAdd({ title: title.trim(), link: link.trim(), budget: budget ? Number(budget) : null });
    setTitle('');
    setLink('');
    setBudget('');
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-4 space-y-2 mb-3">
      <p className="text-sm font-medium">
        Add a {category} idea{personName ? ` for ${personName}` : ''}
      </p>
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Gift idea" className="h-10" />
      <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Buy link (optional)" className="h-10" />
      <div className="flex gap-2">
        <Input
          type="number"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          placeholder="Budget ($)"
          className="h-10 flex-1"
        />
        <Button onClick={handleAdd} disabled={!title.trim()} className="h-10">
          Add
        </Button>
      </div>
      <Button
        variant="outline"
        onClick={onAISuggest}
        disabled={aiLoading || !personName}
        className="w-full h-10 gap-2"
      >
        {aiLoading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
        {aiLoading ? 'Thinking of ideas…' : `AI suggest ${category} ideas`}
      </Button>
    </div>
  );
}