import React, { useState } from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BookOpen } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

// Input-only tab: saved books flow to the contact's profile page.
export default function BookIdeasTab({ personId }) {
  const { addBookIdea, people } = useKeepsake();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');

  const person = people.find((p) => p.id === personId);
  const personName = person?.name;

  const handleAdd = () => {
    if (!title.trim()) return;
    addBookIdea({ title: title.trim(), author: author.trim(), personId });
    setTitle('');
    setAuthor('');
    toast({ title: personName ? `Saved to ${personName}'s profile` : 'Saved to contact', duration: 2500 });
  };

  return (
    <div>
      <div className="space-y-2 mb-3">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Book title" className="h-11" onKeyDown={(e) => e.key === 'Enter' && handleAdd()} />
        <div className="flex gap-2">
          <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author (optional)" className="h-11" onKeyDown={(e) => e.key === 'Enter' && handleAdd()} />
          <Button onClick={handleAdd} disabled={!title.trim()} className="h-11 px-4 shrink-0">Add</Button>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/40 rounded-xl px-3 py-2.5">
        <BookOpen size={14} className="shrink-0" />
        <span>Saved books appear on the contact's profile page.</span>
      </div>
    </div>
  );
}