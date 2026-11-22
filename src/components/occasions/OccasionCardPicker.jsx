import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Copy, RefreshCw, Sparkles, ShoppingBag } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { cardBuyInfo, findAffiliateLink } from '@/lib/cardBuyLink';
import { openAffiliateLink } from '@/lib/deepLink';
import { useKeepsake } from '@/lib/keepsakeStore';
import { useEnsureEntities } from '@/hooks/useEnsureEntities';
import AffiliateDisclosure from '@/components/AffiliateDisclosure';
import { useToast } from '@/components/ui/use-toast';
import { classifyRelation } from '@/lib/peopleConstants';

const BASE_CATEGORIES = ['Funny', 'Sentimental', 'Serious', 'Age-appropriate', 'Religious'];

// Bottom sheet that generates short, ready-to-send greeting card messages for
// an upcoming birthday / anniversary / Gotcha Day. The user picks a tone, the
// suggest-cards backend function returns tailored messages based on the
// person's relationship, age, likes, and notes, and each can be copied to send.
export default function OccasionCardPicker({ reminder, open, onOpenChange }) {
  const [category, setCategory] = useState('Funny');
  const [cards, setCards] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [extra, setExtra] = useState('');
  const { toast } = useToast();
  const { affiliateLinks } = useKeepsake();
  // Loaded on demand instead of with the first paint — this sheet is the only
  // place these links are ever shown.
  useEnsureEntities(['affiliateLinks']);
  const isPartner = classifyRelation(reminder?.relation) === 'partner';
  const CATEGORIES = isPartner
    ? ['Funny', 'Romantic', 'Sentimental', 'Serious', 'Age-appropriate', 'Religious']
    : BASE_CATEGORIES;

  useEffect(() => {
    if (!open) return;
    setExtra('');
    setCategory('Funny');
    setCards([]);
    generate('Funny', '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reminder]);

  const generate = async (cat, extraNotes = extra) => {
    if (!reminder) return;
    setLoading(true);
    setError('');
    try {
      const res = await base44.functions.invoke('suggest-cards', {
        personName: reminder.name,
        occasion: reminder.occasion,
        relation: reminder.relation,
        ageTurning: reminder.ageTurning,
        yearsTogether: reminder.yearsTogether,
        notes: [reminder.notes, extraNotes].filter(Boolean).join(' ').trim(),
        likes: reminder.likes,
        species: reminder.species,
        category: cat,
      });
      const data = res?.data || res;
      const list = Array.isArray(data.cards) ? data.cards : [];
      setCards(list);
      setDrafts(list.map((c) => c.text || ''));
      if (!data.cards || data.cards.length === 0) setError('No cards came back — try another tone.');
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'Could not generate cards.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const selectCategory = (cat) => {
    setCategory(cat);
    setCards([]);
    generate(cat);
  };

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Copied', description: 'Card message copied to clipboard.' });
    } catch {
      toast({ title: 'Could not copy', variant: 'destructive' });
    }
  };

  const occasionLabel = reminder?.occasion || (reminder?.kind === 'birthday' ? 'birthday' : 'anniversary');
  const relationPhrase = reminder?.relation ? ` — your ${reminder.relation}` : '';
  const fallback = cardBuyInfo(reminder?.occasion, { category });
  const stored = findAffiliateLink(affiliateLinks, reminder?.occasion, category);
  const buy = stored ? { url: stored.url, label: stored.label || fallback.label } : fallback;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-3xl p-0">
        <SheetHeader className="px-5 pt-5 pb-2 text-left">
          <SheetTitle className="font-display text-lg">
            {reminder?.name ? `${reminder.name}'s ${occasionLabel}` : 'Occasion cards'}
          </SheetTitle>
          <SheetDescription>
            Pick a tone, then edit and copy a card to send. Tailored to {reminder?.name || 'them'}
            {relationPhrase}.
          </SheetDescription>
        </SheetHeader>

        <div className="px-5 pb-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => selectCategory(c)}
                className={`px-3 h-8 rounded-full text-xs font-medium border transition-colors ${
                  category === c
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-border text-foreground hover:bg-secondary/60'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
                placeholder="Add details to customize (e.g. turning 30, loves hiking, 10 years together)…"
                className="flex-1 h-10 px-3 rounded-xl border border-input bg-background text-sm"
              />
              <Button size="sm" onClick={() => generate(category)} disabled={loading} className="h-10 shrink-0">
                <RefreshCw size={14} className="mr-1.5" /> Update
              </Button>
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <RefreshCw size={16} className="animate-spin mr-2" /> Writing cards…
            </div>
          )}

          {!loading && error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {!loading && !error && cards.length > 0 && (
            <div className="space-y-2.5">
              {cards.map((card, i) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-4 space-y-2.5">
                  <Textarea
                    value={drafts[i] ?? ''}
                    onChange={(e) => setDrafts((prev) => prev.map((d, idx) => (idx === i ? e.target.value : d)))}
                    rows={4}
                    className="text-sm leading-relaxed resize-y bg-transparent border-0 p-0 focus-visible:ring-0"
                    aria-label="Edit card message"
                  />
                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => copy(drafts[i] ?? card.text)} className="h-8 text-xs">
                      <Copy size={13} className="mr-1.5" /> Copy
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && cards.length === 0 && (
            <div className="flex flex-col items-center text-center py-10 text-muted-foreground">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-accent/15 text-accent mb-3">
                <Sparkles size={20} />
              </div>
              <p className="text-sm">Pick a tone above to generate cards for {reminder?.name || 'them'}.</p>
            </div>
          )}

          <Button asChild variant="outline" className="w-full h-11 rounded-xl">
            <a href={buy.url} target="_blank" rel="noopener noreferrer" onClick={(e) => { e.preventDefault(); openAffiliateLink(buy.url, { occasion: reminder?.occasion, category }); }}>
              <ShoppingBag size={16} className="mr-2" /> {buy.label}
            </a>
          </Button>
          <AffiliateDisclosure className="text-center" />
        </div>
      </SheetContent>
    </Sheet>
  );
}