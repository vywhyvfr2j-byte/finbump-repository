import React, { useState } from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Link2, Trash2, Check, ExternalLink, ShoppingBag } from 'lucide-react';
import BulkActionBar from '@/components/gifts/BulkActionBar';
import { purchaseUrlFor, hasDirectLink } from '@/lib/giftPurchase';

export default function PersonGiftIdeas({ personName, personId, searchQuery }) {
  const {
    giftIdeas, addGiftIdea, deleteGiftIdea, toggleGiftPurchased, updateGiftIdea,
    movieIdeas, bookIdeas, seriesIdeas, drinks, snacks, meals, desserts, vacationIdeas, getawayIdeas,
  } = useKeepsake();
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [budget, setBudget] = useState('');
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const items = personName
    ? giftIdeas.filter((g) => (personId && g.personId ? g.personId === personId : g.person === personName))
    : giftIdeas;
  const visibleItems = searchQuery && searchQuery.trim()
    ? items.filter((g) => (g.title || '').toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : items;

  const hasOtherIdeas = personId
    ? [
        ...movieIdeas, ...bookIdeas, ...seriesIdeas,
        ...drinks, ...snacks, ...meals, ...desserts,
        ...vacationIdeas, ...getawayIdeas,
      ].some((i) => i.personId === personId)
    : false;

  const handleAdd = () => {
    if (!title.trim()) return;
    addGiftIdea({
      title: title.trim(),
      link: link.trim(),
      person: personName || '',
      personId: personId || null,
      budget: budget ? Number(budget) : null,
    });
    setTitle('');
    setLink('');
    setBudget('');
  };

  const toggleSelect = (id) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const clearSelection = () => setSelectedIds(new Set());
  const selectAllVisible = () => setSelectedIds(new Set(visibleItems.map((g) => g.id)));
  const bulkDelete = () => {
    [...selectedIds].forEach((id) => deleteGiftIdea(id));
    clearSelection();
  };
  const bulkMoveCategory = (category) => {
    [...selectedIds].forEach((id) => updateGiftIdea(id, { category }));
    clearSelection();
  };
  const bulkSetStatus = (status) => {
    [...selectedIds].forEach((id) =>
      updateGiftIdea(id, {
        purchased: status !== 'Idea',
        gifted: status === 'Gifted',
        giftedAt: status === 'Gifted' ? new Date().toISOString() : null,
        purchasedAt: status !== 'Idea' ? new Date().toISOString() : null,
      })
    );
    clearSelection();
  };

  return (
    <div className={`mt-6 ${selectedIds.size > 0 ? 'pb-44' : ''}`}>
      <h3 className="font-display text-base font-semibold mb-2.5">
        {personName ? `My gift ideas for ${personName}` : 'My gift ideas'}
      </h3>
      <div className="bg-card rounded-2xl border border-border p-4 space-y-2.5 mb-4">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Gift idea title" className="h-11" />
        <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Link to item (optional)" className="h-11" />
        <Input
          type="number"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          placeholder="Budget ($)"
          className="h-11"
        />
        <Button onClick={handleAdd} disabled={!title.trim()} className="w-full h-11 rounded-xl">
          Save idea
        </Button>
      </div>

      <div className="space-y-2.5">
        {items.length > 0 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground -mb-1">
            <span>
              {selectedIds.size > 0
                ? `${selectedIds.size} of ${visibleItems.length} selected`
                : `${visibleItems.length} idea${visibleItems.length === 1 ? '' : 's'}`}
            </span>
            {selectedIds.size > 0 ? (
              <button type="button" onClick={clearSelection} className="font-medium text-primary">
                Clear
              </button>
            ) : (
              <button type="button" onClick={selectAllVisible} className="font-medium text-primary">
                Select all
              </button>
            )}
          </div>
        )}
        {visibleItems.map((g) => (
          <div
            key={g.id}
            className={`bg-card rounded-2xl border p-4 ${
              selectedIds.has(g.id) ? 'border-primary/60 ring-1 ring-primary/30' : 'border-border'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Checkbox
                  checked={selectedIds.has(g.id)}
                  onCheckedChange={() => toggleSelect(g.id)}
                  aria-label={`Select ${g.title}`}
                  className="shrink-0"
                />
                <button
                  onClick={() => toggleGiftPurchased(g.id)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    g.purchased ? 'bg-primary border-primary' : 'border-border'
                  }`}
                >
                  {g.purchased && <Check size={13} strokeWidth={3} className="text-primary-foreground" />}
                </button>
                <p className={`font-medium text-sm truncate ${g.purchased ? 'line-through text-muted-foreground' : ''}`}>
                  {g.title}
                </p>
              </div>
              <button onClick={() => deleteGiftIdea(g.id)} className="text-muted-foreground shrink-0">
                <Trash2 size={16} />
              </button>
            </div>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {!g.purchased && (
                <button
                  onClick={() => {
                    window.open(purchaseUrlFor(g), '_blank', 'noreferrer');
                    toggleGiftPurchased(g.id);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full"
                >
                  {hasDirectLink(g) ? <ExternalLink size={12} /> : <ShoppingBag size={12} />}
                  {hasDirectLink(g) ? 'Buy & mark done' : 'Find & mark done'}
                </button>
              )}
              {g.purchased && (
                <a
                  href={purchaseUrlFor(g)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary font-medium"
                >
                  {hasDirectLink(g) ? <Link2 size={12} /> : <ShoppingBag size={12} />}
                  {hasDirectLink(g) ? 'View item' : 'Find online'}
                </a>
              )}
              {g.budget != null && <span className="text-xs font-medium text-accent">Budget: ${g.budget}</span>}
            </div>
          </div>
        ))}
        {visibleItems.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">{searchQuery ? 'No ideas match your search.' : 'No saved ideas yet.'}</p>
          </div>
        )}
      </div>

      <BulkActionBar
        count={selectedIds.size}
        onClear={clearSelection}
        onDelete={bulkDelete}
        onMoveCategory={bulkMoveCategory}
        onSetStatus={bulkSetStatus}
      />
    </div>
  );
}