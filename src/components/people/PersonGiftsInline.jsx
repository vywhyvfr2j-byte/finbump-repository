import React, { useState } from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import GiftIdeaItem from '@/components/gifts/GiftIdeaItem';
import GiftTemplates from '@/components/gifts/GiftTemplates';
import EmptyState from '@/components/EmptyState';
import { CATEGORIES, OCCASIONS } from '@/lib/giftConstants';
import { buildNameCount, giftMatchesPerson } from '@/lib/giftMatch';
import { KsGifts } from '@/components/icons/KsIcons';

// Inline gift list scoped to a single person. Reuses the same store methods
// as the full gift tracker, so every add/edit/delete updates the overall
// gift features in real time.
export default function PersonGiftsInline({ person }) {
  const {
    giftIdeas, addGiftIdea, toggleGiftPurchased, cycleGiftStatus,
    deleteGiftIdea, updateGiftIdea, people,
  } = useKeepsake();

  const [qTitle, setQTitle] = useState('');
  const [qLink, setQLink] = useState('');
  const [qBudget, setQBudget] = useState('');
  const [qOccasion, setQOccasion] = useState('Other');
  const [qCategory, setQCategory] = useState('Other');
  const [filter, setFilter] = useState('All');
  const [aiKeyword, setAiKeyword] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const nameCounts = buildNameCount(people);
  const personGifts = giftIdeas.filter((g) => giftMatchesPerson(g, person, nameCounts));
  const filtered = filter === 'All' ? personGifts : personGifts.filter((g) => (g.category || 'Other') === filter);

  const handleQuickAdd = () => {
    if (!qTitle.trim()) return;
    addGiftIdea({
      title: qTitle.trim(),
      link: qLink.trim(),
      category: qCategory,
      occasion: qOccasion,
      person: person.name,
      personId: person.id || null,
      budget: qBudget ? Number(qBudget) : null,
    });
    setQTitle('');
    setQLink('');
    setQBudget('');
  };

  const handleAISuggest = async () => {
    if (!person?.name) return;
    setAiLoading(true);
    try {
      const personGiftTitles = personGifts.map((g) => g.title);
      const otherTitles = giftIdeas.filter((g) => !giftMatchesPerson(g, person, nameCounts)).map((g) => g.title);
      const likesList = (person.likes || []).filter(Boolean);
      const detailsList = (person.details || []).filter((d) => d?.value).map((d) => `${d.label}: ${d.value}`);
      const otherItemsList = (person.otherItems || []).filter(Boolean);
      const context = [
        `Suggest 3 thoughtful gift ideas across different categories for ${person.name}.`,
        aiKeyword.trim() ? `Focus on: "${aiKeyword.trim()}".` : '',
        person.relation ? `Relationship: ${person.relation}.` : '',
        likesList.length ? `Things they like: ${likesList.join(', ')}.` : '',
        detailsList.length ? `Details — ${detailsList.join('; ')}.` : '',
        otherItemsList.length ? `Other things to know — ${otherItemsList.join('; ')}.` : '',
        person.notes ? `Notes: ${person.notes}.` : '',
        personGiftTitles.length ? `Already saved — avoid repeating: ${personGiftTitles.join(', ')}.` : '',
        otherTitles.length ? `Other people's gifts for context — don't suggest: ${otherTitles.join(', ')}.` : '',
        `Assign each to one of: ${CATEGORIES.join(', ')}.`,
        'For each: short title, category, one-sentence reason, estimated budget in USD, and a direct product page link.',
      ].filter(Boolean).join(' ');
      const res = await base44.functions.invoke('suggest-gifts', { prompt: context, includeCategory: true });
      (res.data.suggestions || []).forEach((s) => {
        const cat = CATEGORIES.includes(s.category) ? s.category : 'Other';
        addGiftIdea({
          title: s.title,
          category: cat,
          person: person.name,
          personId: person.id || null,
          budget: s.budget ?? null,
          note: s.reason || '',
          link: s.link || '',
          source: 'ai',
        });
      });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-2xl border border-border p-3 space-y-2">
        <Input value={qTitle} onChange={(e) => setQTitle(e.target.value)} placeholder="Gift idea" className="h-10" />
        <Input value={qLink} onChange={(e) => setQLink(e.target.value)} placeholder="Link (optional)" className="h-10" />
        <div className="flex gap-2">
          <Select value={qCategory} onValueChange={setQCategory}>
            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={qOccasion} onValueChange={setQOccasion}>
            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              {OCCASIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Input type="number" value={qBudget} onChange={(e) => setQBudget(e.target.value)} placeholder="Budget ($)" className="h-10" />
          <Button onClick={handleQuickAdd} disabled={!qTitle.trim()} className="h-10 flex-1">Add</Button>
        </div>
      </div>

      <div className="bg-accent/20 rounded-2xl border border-accent/40 p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="text-accent-foreground" size={16} />
          <p className="text-sm font-medium">AI Gift Finder</p>
        </div>
        <Input value={aiKeyword} onChange={(e) => setAiKeyword(e.target.value)} placeholder="Keywords (e.g. ring, spa)" className="h-9" />
        <Button onClick={handleAISuggest} disabled={aiLoading} className="w-full h-9 rounded-xl">
          {aiLoading ? (<><Loader2 size={14} className="animate-spin" /> Thinking…</>) : 'Find 3 ideas'}
        </Button>
      </div>

      <GiftTemplates
        onAdd={(item) => addGiftIdea({ ...item, person: person.name, personId: person.id || null })}
      />

      <Select value={filter} onValueChange={setFilter}>
        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All categories</SelectItem>
          {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
        </SelectContent>
      </Select>

      <div className="space-y-2">
        {filtered.map((g) => (
          <GiftIdeaItem
            key={g.id}
            idea={g}
            people={people}
            onToggle={toggleGiftPurchased}
            onCycleStatus={cycleGiftStatus}
            onDelete={deleteGiftIdea}
            onSaveActualCost={(id, v) => updateGiftIdea(id, { actualCost: v ? Number(v) : null })}
            onSaveEdit={updateGiftIdea}
          />
        ))}
        {filtered.length === 0 && (
          <EmptyState icon={KsGifts} title={`No ideas for ${person.name} yet`} subtitle="Add one above or use the AI Gift Finder." />
        )}
      </div>
    </div>
  );
}