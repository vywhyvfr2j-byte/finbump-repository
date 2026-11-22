import React, { useState } from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UtensilsCrossed } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import TreatAdvisor from '@/components/ideas/TreatAdvisor';

const CATEGORIES = [
  { key: 'drinks', label: 'Drinks' },
  { key: 'snacks', label: 'Snacks' },
  { key: 'meals', label: 'Meals' },
  { key: 'desserts', label: 'Desserts' },
];

// Input-only tab: saved treats flow to the contact's profile page.
export default function TreatsTab({ personId }) {
  const { addFavorite, people, partnerName } = useKeepsake();
  const [category, setCategory] = useState('drinks');
  const [title, setTitle] = useState('');
  const [recipeUrl, setRecipeUrl] = useState('');

  const selectedPerson = people.find((p) => p.id === personId);
  const advisorName = selectedPerson?.name || partnerName || 'this person';

  const handleAdd = () => {
    if (!title.trim()) return;
    const item =
      category === 'meals'
        ? { title: title.trim(), recipeUrl: recipeUrl.trim(), personId }
        : { title: title.trim(), personId };
    addFavorite(category, item);
    setTitle('');
    setRecipeUrl('');
    toast({ title: selectedPerson ? `Saved to ${selectedPerson.name}'s profile` : 'Saved to contact', duration: 2500 });
  };

  return (
    <div>
      {personId && (
        <TreatAdvisor personId={personId} personName={advisorName} />
      )}

      <div className="flex gap-1.5 flex-wrap mb-4">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setCategory(c.key)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border ${category === c.key ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="space-y-2 mb-3">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={category === 'meals' ? 'Meal name' : `Favorite ${category.slice(0, -1)}`}
          className="h-11"
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        {category === 'meals' && (
          <Input value={recipeUrl} onChange={(e) => setRecipeUrl(e.target.value)} placeholder="Recipe link (optional)" className="h-11" />
        )}
        <Button onClick={handleAdd} disabled={!title.trim()} className="w-full h-11">Add</Button>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/40 rounded-xl px-3 py-2.5">
        <UtensilsCrossed size={14} className="shrink-0" />
        <span>Saved treats appear on the contact's profile page.</span>
      </div>
    </div>
  );
}