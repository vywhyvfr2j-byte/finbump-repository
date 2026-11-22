import React, { useState, useEffect } from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { base44 } from '@/api/base44Client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Sparkles, ShoppingBag } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { purchaseUrlFor, hasDirectLink } from '@/lib/giftPurchase';
import PersonGiftIdeas from '@/components/ideas/PersonGiftIdeas';
import { sortPeopleForPicker, classifyRelation } from '@/lib/peopleConstants';

const GIFT_CATEGORIES = [
  { label: 'Gift Cards', emoji: '🎁', query: 'gift card' },
  { label: 'Flowers', emoji: '💐', query: 'flowers bouquet delivery' },
  { label: 'Chocolates', emoji: '🍫', query: 'gourmet chocolates gift box' },
  { label: 'Perfume', emoji: '🌸', query: 'perfume fragrance gift set' },
  { label: 'Jewelry', emoji: '💍', query: 'jewelry gift' },
  { label: 'Books', emoji: '📚', query: 'bestseller book gift' },
  { label: 'Spa & Self-Care', emoji: '🧖', query: 'spa self care gift set' },
  { label: 'Experiences', emoji: '🎟️', query: 'experience gift voucher' },
];

const RELATION_GUIDANCE = {
  partner: 'your partner or spouse',
  kids: 'a child — keep it age-appropriate, fun, safe, and child-friendly',
  grandkids: 'a grandchild — thoughtful and age-considerate, easy to enjoy',
  siblings: 'a sibling — casual and familiar',
  parents: 'a parent — warm and respectful',
  other: 'the recipient',
};

function personContext(p) {
  if (!p) return '';
  const parts = [];
  const name = p.preferredName || p.name;
  if (name) parts.push(name);
  if (p.birthday) parts.push(`birthday: ${p.birthday}`);
  if (p.anniversary) parts.push(`anniversary: ${p.anniversary}`);
  const likes = (p.likes || []).filter(Boolean);
  if (likes.length) parts.push(`things they love: ${likes.join(', ')}`);
  const prefs = p.preferences || {};
  const prefEntries = Object.entries(prefs).filter(([, v]) => v);
  if (prefEntries.length) parts.push(`preferences: ${prefEntries.map(([k, v]) => `${k} ${v}`).join(', ')}`);
  const details = (p.details || []).filter((d) => d.label && d.value);
  if (details.length) parts.push(`details: ${details.map((d) => `${d.label} ${d.value}`).join(', ')}`);
  if (p.zipCode) parts.push(`local area zip: ${p.zipCode}`);
  if (p.notes) parts.push(`notes: ${p.notes}`);
  return parts.join('; ');
}

export default function PersonGiftsView() {
  const { people, giftIdeas, addGiftIdea } = useKeepsake();
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiIdeas, setAiIdeas] = useState([]);
  const [categoryQueries, setCategoryQueries] = useState({});
  const [categoryLoading, setCategoryLoading] = useState(false);

  const sortedPeople = sortPeopleForPicker(people);

  useEffect(() => {
    if (!sortedPeople.length) { setSelectedId(''); return; }
    if (!selectedId || !sortedPeople.find((p) => p.id === selectedId)) {
      setSelectedId(sortedPeople[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedPeople.length]);

  const selectedPerson = people.find((p) => p.id === selectedId) || null;

  // Reset AI ideas when switching people
  useEffect(() => { setAiIdeas([]); }, [selectedId]);

  // Generate personalized shopping queries for each gift category based on the
  // selected person's profile, notes, relationship, and existing gift ideas.
  useEffect(() => {
    if (!selectedPerson) { setCategoryQueries({}); return; }
    let cancelled = false;
    setCategoryLoading(true);
    setCategoryQueries({});

    const name = selectedPerson.preferredName || selectedPerson.name;
    const relKey = classifyRelation(selectedPerson.relation);
    const guidance = RELATION_GUIDANCE[relKey] || 'the recipient';
    const personBlock = personContext(selectedPerson);

    const existingTitles = giftIdeas
      .filter((g) => (selectedPerson.id && g.personId === selectedPerson.id) ||
        ((g.person || '').toLowerCase() === selectedPerson.name.toLowerCase()))
      .map((g) => g.title)
      .filter(Boolean).slice(0, 8);
    const existingBlock = existingTitles.length
      ? `Gift ideas already saved for them: ${existingTitles.join(', ')}.`
      : '';

    const prompt = [
      `Create one personalized shopping search query for each of these gift categories, tailored to ${name}.`,
      `The recipient is ${guidance}.`,
      'Each query should be specific enough to find a real, thoughtful product for THIS person — weave in their interests, preferences, notes, and relationship where relevant.',
      'Keep each query under 8 words, optimized for an online shopping search (no quotes, no punctuation at the end).',
      personBlock ? `About the recipient: ${personBlock}.` : '',
      existingBlock,
      `Return exactly ${GIFT_CATEGORIES.length} queries, one per category, in the same order.`,
    ].filter(Boolean).join(' ');

    base44.functions.invoke('suggest-gift-queries', { prompt })
      .then((res) => {
        if (cancelled) return;
        const map = {};
        (res.data.queries || []).forEach((q) => {
          if (q.category && q.query) map[q.category] = q.query;
        });
        setCategoryQueries(map);
      })
      .catch(() => { /* silent — fall back to generic queries */ })
      .finally(() => { if (!cancelled) setCategoryLoading(false); });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const handleAIFind = async () => {
    if (!selectedPerson) return;
    setAiLoading(true);
    try {
      const name = selectedPerson.preferredName || selectedPerson.name;
      const relKey = classifyRelation(selectedPerson.relation);
      const guidance = RELATION_GUIDANCE[relKey] || 'the recipient';
      const personBlock = personContext(selectedPerson);

      const existingTitles = giftIdeas
        .filter((g) => (selectedPerson.id && g.personId === selectedPerson.id) ||
          ((g.person || '').toLowerCase() === selectedPerson.name.toLowerCase()))
        .map((g) => g.title)
        .filter(Boolean).slice(0, 8);
      const existingBlock = existingTitles.length
        ? `Gift ideas already saved for them: ${existingTitles.join(', ')}. Do not duplicate these — suggest fresh directions.`
        : '';

      const prompt = [
        `Suggest 6 thoughtful gift ideas tailored to ${name}.`,
        `The recipient is ${guidance}.`,
        'For each idea give a short title (5 words or fewer), a one-sentence reason referencing this specific person, an estimated budget in USD, and a real product link where it can be bought.',
        'Vary the price range — include a few small touches under $25 and a couple of bigger ideas.',
        personBlock ? `About the recipient: ${personBlock}.` : '',
        existingBlock,
        'Avoid repeating the same idea or anything already saved.',
      ].filter(Boolean).join(' ');

      const res = await base44.functions.invoke('suggest-gifts', { prompt });
      setAiIdeas(res.data.suggestions || []);
    } catch {
      toast({ title: 'Could not generate ideas', variant: 'destructive' });
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveAI = (s) => {
    if (!selectedPerson) return;
    addGiftIdea({
      title: s.title,
      person: selectedPerson.name,
      personId: selectedPerson.id,
      note: s.reason || '',
      budget: s.budget ?? null,
      link: s.link || '',
      source: 'ai',
      category: 'Other',
    });
    toast({ title: 'Saved to gift list' });
  };

  if (!people.length) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="font-medium">No connections yet</p>
        <p className="text-sm mt-1">Add someone first to see gift ideas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Person dropdown */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground pl-1">Choose a connection</label>
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger className="h-12 text-base font-medium">
            <SelectValue placeholder="Select a person" />
          </SelectTrigger>
          <SelectContent>
            {sortedPeople.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.preferredName || p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedPerson && (
        <>
          {/* Gift Options — categories with personalized shopping links */}
          <section>
            <h3 className="font-display text-base font-semibold mb-2.5 flex items-center gap-2">
              Gift Options
              {categoryLoading && (
                <span className="text-xs font-normal text-muted-foreground inline-flex items-center gap-1">
                  <span className="w-3 h-3 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                  personalizing…
                </span>
              )}
            </h3>
            <p className="text-xs text-muted-foreground mb-2.5 -mt-1.5">
              {categoryLoading
                ? `Tailoring links to ${selectedPerson.preferredName || selectedPerson.name}'s profile…`
                : `Links tailored to ${selectedPerson.preferredName || selectedPerson.name}'s profile, notes, and interests.`}
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {GIFT_CATEGORIES.map((cat) => {
                const personalized = categoryQueries[cat.label];
                const query = personalized
                  ? encodeURIComponent(`${personalized} for ${selectedPerson.preferredName || selectedPerson.name}`)
                  : encodeURIComponent(`${cat.query} for ${selectedPerson.preferredName || selectedPerson.name}`);
                return (
                  <a
                    key={cat.label}
                    href={`https://www.google.com/search?q=${query}&tbm=shop`}
                    target="_blank"
                    rel="noreferrer"
                    title={`Search ${cat.label} for ${selectedPerson.preferredName || selectedPerson.name}`}
                    className="flex items-center gap-2.5 bg-card border border-border rounded-2xl p-3.5 hover:bg-secondary/40 transition-colors"
                  >
                    <span className="text-2xl leading-none">{cat.emoji}</span>
                    <div className="min-w-0">
                      <span className="text-sm font-medium block">{cat.label}</span>
                      {personalized && (
                        <span className="text-[11px] text-muted-foreground block truncate">{personalized}</span>
                      )}
                    </div>
                  </a>
                );
              })}
            </div>
          </section>

          {/* Personal Suggested Gifts — saved gift ideas for this person */}
          <PersonGiftIdeas personName={selectedPerson.name} personId={selectedPerson.id} />

          {/* AI Gift Suggestions */}
          <section>
            <div className="bg-accent/20 rounded-2xl border border-accent/40 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Sparkles className="text-accent-foreground shrink-0" size={18} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">AI Gift Suggestions</p>
                  <p className="text-xs text-muted-foreground">Tailored to {selectedPerson.preferredName || selectedPerson.name}'s profile.</p>
                </div>
              </div>
              <Button onClick={handleAIFind} disabled={aiLoading} className="w-full h-11 rounded-xl">
                {aiLoading ? 'Thinking…' : 'Find gift ideas'}
              </Button>
              {aiIdeas.length > 0 && (
                <div className="space-y-2">
                  {aiIdeas.map((s, i) => (
                    <div key={i} className="bg-card border border-border rounded-xl p-3 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-sm flex-1">{s.title}</p>
                        {s.budget != null && <span className="text-xs text-muted-foreground shrink-0">${s.budget}</span>}
                      </div>
                      {s.reason && <p className="text-xs text-muted-foreground leading-relaxed">{s.reason}</p>}
                      <div className="flex items-center gap-3 pt-0.5">
                        <Button size="sm" onClick={() => handleSaveAI(s)} className="h-8">
                          Save to gift list
                        </Button>
                        <a
                          href={purchaseUrlFor(s)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary font-medium bg-primary/10 px-2.5 py-1.5 rounded-full"
                        >
                          {hasDirectLink(s) ? 'View item' : <><ShoppingBag size={11} /> Find online</>}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}