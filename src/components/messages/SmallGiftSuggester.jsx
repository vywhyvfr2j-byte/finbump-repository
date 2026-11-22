import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useKeepsake } from '@/lib/keepsakeStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sparkles, ShoppingBag } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { purchaseUrlFor, hasDirectLink } from '@/lib/giftPurchase';
import AffiliateDisclosure from '@/components/AffiliateDisclosure';
import { openAffiliateLink } from '@/lib/deepLink';

// Small, inexpensive AI gift suggestions tailored to the specific person the
// message is for (their likes, details, preferences, and any gifts already
// saved for them), paired with the tone of the message being written.

const RELATION_GUIDANCE = {
  partner: 'your partner or spouse',
  kids: 'a child — keep it age-appropriate, fun, safe, and child-friendly',
  grandkids: 'a grandchild — thoughtful and age-considerate, easy to enjoy',
  siblings: 'a sibling — casual and familiar',
  parents: 'a parent — warm and respectful',
  other: 'the recipient',
};

function personContext(p) {
  const parts = [];
  if (!p) return '';
  const name = p.preferredName || p.name;
  if (name) parts.push(`${name}`);
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

export default function SmallGiftSuggester({
  message = '',
  messageType = '',
  recipientKey = '',
  recipientLabel = '',
  person = null,
}) {
  const { giftIdeas, addGiftIdea, myPreferences } = useKeepsake();
  const { toast } = useToast();
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState([]);

  const isPartner = recipientKey === 'partner' || !recipientKey;
  const guidance = RELATION_GUIDANCE[recipientKey] || 'the recipient';
  const personName = person ? (person.preferredName || person.name) : '';

  const whom = personName
    ? `${personName} (my ${recipientLabel ? recipientLabel.toLowerCase() : 'loved one'})`
    : `my ${recipientLabel ? recipientLabel.toLowerCase() : 'loved one'}`;

  const personBlock = person ? `About the recipient: ${personContext(person)}.` : '';

  const existingGifts = (() => {
    if (!person) return '';
    const nameLc = (person.name || '').toLowerCase();
    const titles = giftIdeas
      .filter((g) => (person.id && g.personId === person.id) || (nameLc && (g.person || '').toLowerCase() === nameLc))
      .map((g) => g.title)
      .filter(Boolean)
      .slice(0, 8);
    return titles.length
      ? `Gift ideas already saved for them: ${titles.join(', ')}. Do not duplicate these — suggest fresh directions.`
      : '';
  })();

  const handleFind = async () => {
    setLoading(true);
    try {
      const prompt = [
        `Suggest 3 small, inexpensive, thoughtful gift ideas tailored to ${whom}.`,
        `The recipient is ${guidance}. Customize each idea to this specific person and your relationship with them.`,
        'Focus on little thoughtful gestures — chocolates, flowers, a favorite coffee or tea, a small treat, a handmade or handwritten note, a single candle, a small book, etc.',
        'Each idea should stay under $30 and feel personal rather than generic.',
        (() => {
          if (!messageType) return '';
          const map = {
            apology: 'an apology',
            'thank you': 'a thank-you',
            'love letter': 'a love letter',
            birthday: 'a birthday message',
            'just because': 'a just-because note',
          };
          return `The gift will accompany ${messageType === 'thank you' ? 'a thank-you' : (map[messageType] || `a ${messageType}`)}.`;
        })(),
        message.trim() ? `The message being sent is: "${message.trim()}". Choose gifts that complement its tone, subject, and this recipient.` : '',
        personBlock,
        existingGifts,
        keyword.trim() ? `Optional theme to consider: ${keyword.trim()}.` : '',
        'For each idea give a short title (5 words or fewer), a one-sentence reason that references the specific recipient and the message, an estimated budget in USD under $30, and a real product link where it can be bought.',
        'Avoid repeating the same idea or anything already saved.',
      ].filter(Boolean).join(' ');

      const shoppingLocations = (myPreferences?.shoppingLocations || []).filter(Boolean);
      const res = await base44.functions.invoke('suggest-gifts', { prompt, includeCategory: false, shoppingLocations });
      setIdeas(res.data.suggestions || []);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = (s) => {
    addGiftIdea({
      title: s.title,
      person: person ? (person.name || recipientLabel) : recipientLabel,
      personId: person && person.id ? person.id : null,
      recipientRelation: recipientKey || '',
      category: 'Other',
      budget: s.budget ?? null,
      note: s.reason || '',
      link: s.link || '',
      source: 'ai',
    });
    toast({ title: 'Saved to gift list' });
  };

  return (
    <div className="bg-accent/20 rounded-2xl border border-accent/40 p-4 mb-5">
      <div className="flex items-center gap-3">
        <Sparkles className="text-accent-foreground shrink-0" size={18} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">Gifts to Match the Message</p>
          <p className="text-xs text-muted-foreground">Tailored to who they are and what you wrote.</p>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <Input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Keywords (e.g., chocolate, flowers)"
          className="h-10"
        />
        <Button onClick={handleFind} disabled={loading || !recipientKey} className="w-full h-10 rounded-xl">
          {loading ? 'Thinking…' : 'Find small gift ideas'}
        </Button>
      </div>

      {ideas.length > 0 && (
        <div className="mt-3 space-y-2">
          {ideas.map((s, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-3 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-sm flex-1">{s.title}</p>
                {s.budget != null && <span className="text-xs text-muted-foreground shrink-0">${s.budget}</span>}
              </div>
              {s.reason && <p className="text-xs text-muted-foreground leading-relaxed">{s.reason}</p>}
              <div className="flex items-center gap-3 pt-0.5">
                <Button size="sm" onClick={() => handleSave(s)} className="h-8">
                  Save to gift list
                </Button>
                <a
                  href={purchaseUrlFor(s)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => { e.preventDefault(); openAffiliateLink(purchaseUrlFor(s)); }}
                  className="inline-flex items-center gap-1 text-xs text-primary font-medium bg-primary/10 px-2.5 py-1.5 rounded-full"
                >
                  {hasDirectLink(s) ? 'View item' : <><ShoppingBag size={11} /> Find online</>}
                </a>
              </div>
            </div>
          ))}
          <AffiliateDisclosure />
        </div>
      )}
    </div>
  );
}