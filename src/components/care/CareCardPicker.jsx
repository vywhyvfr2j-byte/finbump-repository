import React, { useEffect, useState } from 'react';
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

const CATEGORIES = ['Heartfelt', 'Sentimental', 'Serious', 'Funny', 'Religious'];

// Bottom sheet for prayer / health care reminders. Auto-drafts encouragement
// cards when opened (default tone per care type) so the user can review, edit,
// and copy one to send. The "first due day, then every other day" cadence that
// opens this sheet lives in HomeCareReminders.
export default function CareCardPicker({ careType, name, relation, notes, likes, open, onOpenChange }) {
  const defaultCategory = careType === 'prayer' ? 'Religious' : 'Heartfelt';
  const [category, setCategory] = useState(defaultCategory);
  const [cards, setCards] = useState([]);
  const [edits, setEdits] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [extra, setExtra] = useState('');
  const { toast } = useToast();
  const { affiliateLinks } = useKeepsake();
  // Loaded on demand instead of with the first paint — this sheet is the only
  // place these links are ever shown.
  useEnsureEntities(['affiliateLinks']);

  const generate = async (cat) => {
    if (!name) return;
    setLoading(true);
    setError('');
    try {
      const res = await base44.functions.invoke('suggest-cards', {
        personName: name,
        occasion: careType === 'prayer' ? 'prayer support' : 'health check-in',
        relation,
        notes: [notes, extra].filter(Boolean).join(' ').trim(),
        likes: Array.isArray(likes) ? likes : [],
        category: cat,
      });
      const data = res?.data || res;
      setCards(Array.isArray(data.cards) ? data.cards : []);
      setEdits({});
      if (!data.cards || data.cards.length === 0) setError('No drafts came back — try another tone.');
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'Could not generate cards.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Auto-draft on open — the user just reviews, edits, and sends.
  useEffect(() => {
    if (!open) return;
    setExtra('');
    setCategory(defaultCategory);
    generate(defaultCategory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, careType, name]);

  const selectCategory = (cat) => {
    setCategory(cat);
    generate(cat);
  };

  const copy = async (i) => {
    const text = edits[i] ?? cards[i]?.text;
    if (!text || !text.trim()) return;
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Copied', description: 'Card message copied to send.' });
    } catch {
      toast({ title: 'Could not copy', variant: 'destructive' });
    }
  };

  const occasionLabel = careType === 'prayer' ? 'prayer reminder' : 'health check-in';
  const occasionKey = careType === 'prayer' ? 'prayer support' : 'health check-in';
  const fallback = cardBuyInfo(occasionKey, { category });
  const stored = findAffiliateLink(affiliateLinks, occasionKey, category);
  const buy = stored ? { url: stored.url, label: stored.label || fallback.label } : fallback;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-3xl p-0">
        <SheetHeader className="px-5 pt-5 pb-2 text-left">
          <SheetTitle className="font-display text-lg">Send {name || 'them'} a card</SheetTitle>
          <SheetDescription>
            Auto-drafted from their {occasionLabel} — edit freely, then copy to send.
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

          <Button asChild variant="outline" className="w-full h-11 rounded-xl">
            <a href={buy.url} target="_blank" rel="noopener noreferrer" onClick={(e) => { e.preventDefault(); openAffiliateLink(buy.url, { occasion: occasionKey, category }); }}>
              <ShoppingBag size={16} className="mr-2" /> {buy.label}
            </a>
          </Button>
          <AffiliateDisclosure className="text-center" />

          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
                placeholder="Add details to customize (e.g. recovering from knee surgery, loves coffee)…"
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
                    value={edits[i] ?? card.text}
                    onChange={(e) => setEdits((prev) => ({ ...prev, [i]: e.target.value }))}
                    className="min-h-[76px] text-sm leading-relaxed"
                  />
                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => copy(i)} className="h-8 text-xs">
                      <Copy size={13} className="mr-1.5" /> Copy to send
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
              <p className="text-sm">Pick a tone above to generate cards.</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}