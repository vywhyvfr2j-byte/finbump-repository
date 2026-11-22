import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, Trash2, Sparkles, Pencil, Gift, MoreHorizontal } from 'lucide-react';
import { purchaseUrlFor, hasDirectLink } from '@/lib/giftPurchase';
import { openAffiliateLink } from '@/lib/deepLink';
import { CATEGORY_ICONS, OCCASIONS } from '@/lib/giftConstants';
import { sortPeopleForPicker } from '@/lib/peopleConstants';

const STATUS_META = {
  Idea: {
    label: 'Idea',
    badge: 'border-border bg-secondary text-muted-foreground',
  },
  Purchased: {
    label: 'Purchased',
    badge: 'border-primary/40 bg-primary/10 text-primary',
  },
  Gifted: {
    label: 'Gifted',
    badge: 'border-accent/50 bg-accent/20 text-accent-foreground',
  },
};

export function giftStatus(g) {
  if (g?.gifted) return 'Gifted';
  if (g?.purchased) return 'Purchased';
  return 'Idea';
}

export default function GiftIdeaItem({ idea: g, onToggle, onCycleStatus, onDelete, onSaveActualCost, onSaveEdit, people = [], selected = false, onToggleSelect }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(g.title);
  const [link, setLink] = useState(g.link || '');
  const [budget, setBudget] = useState(g.budget ?? '');
  const [personId, setPersonId] = useState(g.personId || '');
  const [occasion, setOccasion] = useState(g.occasion || 'Other');
  const [targetDate, setTargetDate] = useState(g.targetDate || '');

  const overBudget = g.budget != null && g.actualCost != null && g.actualCost > g.budget;
  const CatIcon = CATEGORY_ICONS[g.category || 'Other'] || MoreHorizontal;

  const startEdit = () => {
    setTitle(g.title);
    setLink(g.link || '');
    setBudget(g.budget ?? '');
    setPersonId(g.personId || '');
    setOccasion(g.occasion || 'Other');
    setTargetDate(g.targetDate || '');
    setEditing(true);
  };

  const save = () => {
    if (!title.trim()) return;
    const person = people.find((p) => p.id === personId);
    onSaveEdit(g.id, {
      title: title.trim(),
      link: link.trim(),
      budget: budget ? Number(budget) : null,
      personId: personId || null,
      person: person?.name || '',
      occasion,
      targetDate: targetDate || null,
    });
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="bg-card rounded-2xl border border-primary p-3.5 space-y-2">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Gift idea" className="h-10" autoFocus />
        {people.length > 0 && (
          <Select value={personId || '__none__'} onValueChange={(v) => setPersonId(v === '__none__' ? '' : v)}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Who is this for?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">No one specific</SelectItem>
              {sortPeopleForPicker(people).map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Buy link (optional)" className="h-10" />
        <Select value={occasion} onValueChange={setOccasion}>
          <SelectTrigger className="h-10">
            <SelectValue placeholder="Occasion" />
          </SelectTrigger>
          <SelectContent>
            {OCCASIONS.map((o) => (
              <SelectItem key={o} value={o}>{o}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="number"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          placeholder="Budget ($)"
          className="h-10"
        />
        <Input
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          placeholder="Planned for"
          className="h-10"
        />
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditing(false)} className="flex-1 h-10">
            Cancel
          </Button>
          <Button onClick={save} disabled={!title.trim()} className="flex-1 h-10">
            Save
          </Button>
        </div>
      </div>
    );
  }

  const openPurchase = () => {
    const url = purchaseUrlFor(g);
    if (url) openAffiliateLink(url);
  };

  return (
    <div
      className={`bg-card rounded-2xl border p-3.5 cursor-pointer hover:border-primary/30 transition-colors ${selected ? 'border-primary/60 ring-1 ring-primary/30' : 'border-border'}`}
      onClick={openPurchase}
    >
      <div className="flex items-center gap-3">
        {onToggleSelect && (
          <Checkbox
            checked={selected}
            onCheckedChange={() => onToggleSelect(g.id)}
            aria-label={`Select ${g.title}`}
            className="shrink-0"
            onClick={(e) => e.stopPropagation()}
          />
        )}
        {onCycleStatus ? (
          <button
            type="button"
            aria-label={`Status: ${STATUS_META[giftStatus(g)].label}. Tap to change.`}
            onClick={(e) => { e.stopPropagation(); onCycleStatus(g.id); }}
            className={`shrink-0 text-[10px] font-semibold uppercase tracking-wide px-2.5 h-7 rounded-full border flex items-center gap-1 transition-colors ${STATUS_META[giftStatus(g)].badge}`}
          >
            {giftStatus(g) === 'Gifted' && <Gift size={11} />}
            {giftStatus(g) === 'Purchased' && <Check size={11} strokeWidth={3} />}
            {STATUS_META[giftStatus(g)].label}
          </button>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onToggle && onToggle(g.id); }}
            className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 ${
              g.purchased ? 'bg-primary border-primary' : 'border-border'
            }`}
          >
            {g.purchased && <Check size={15} strokeWidth={3} className="text-primary-foreground" />}
          </button>
        )}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${giftStatus(g) === 'Gifted' ? 'line-through text-muted-foreground' : giftStatus(g) === 'Purchased' ? 'text-muted-foreground' : ''}`}>{g.title}</p>
          <div className="flex items-center gap-2 flex-wrap mt-0.5">
            <a
              href={purchaseUrlFor(g)}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); openAffiliateLink(purchaseUrlFor(g)); }}
              title={`${g.category || 'Other'} — ${hasDirectLink(g) ? 'Buy' : 'Find online'}`}
              aria-label={`${hasDirectLink(g) ? 'Buy' : 'Find'} ${g.title} online`}
              className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground hover:text-primary transition-colors"
            >
              <CatIcon size={12} />
              {g.category || 'Other'}
            </a>
            {g.person && <span className="text-[10px] text-muted-foreground">· For {g.person}</span>}
            <label className={`inline-flex items-center gap-0.5 text-[10px] font-medium ${overBudget ? 'text-destructive' : 'text-accent'}`}>
              Budget $
              <input
                type="number"
                defaultValue={g.budget ?? ''}
                onBlur={(e) => {
                  const v = e.target.value;
                  onSaveEdit(g.id, { budget: v ? Number(v) : null });
                }}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => e.stopPropagation()}
                placeholder="—"
                aria-label={`Budget for ${g.title}`}
                className="w-14 h-6 text-[10px] border border-border rounded px-1 bg-card focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </label>
            {g.source === 'ai' && (
              <span className="text-[10px] font-medium text-primary flex items-center gap-0.5">
                <Sparkles size={10} /> AI
              </span>
            )}
          </div>
          {g.note && <p className="text-xs text-muted-foreground mt-1 italic leading-relaxed">{g.note}</p>}
        </div>
        <button
          type="button"
          aria-label="Edit gift idea"
          onClick={(e) => { e.stopPropagation(); startEdit(); }}
          className="flex items-center justify-center w-11 h-11 -m-1 rounded-full text-muted-foreground hover:bg-accent/30 active:bg-accent/50 shrink-0"
        >
          <Pencil size={16} />
        </button>
        <button
          type="button"
          aria-label="Delete gift idea"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(g.id);
          }}
          className="flex items-center justify-center w-11 h-11 -m-1 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive active:bg-destructive/20 shrink-0"
        >
          <Trash2 size={16} />
        </button>
      </div>
      {g.purchased && (
        <div className="mt-2.5 pl-10">
          <Input
            type="number"
            defaultValue={g.actualCost ?? ''}
            onBlur={(e) => onSaveActualCost(g.id, e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            placeholder="Actual amount spent ($)"
            className="h-9 text-xs"
          />
        </div>
      )}
    </div>
  );
}