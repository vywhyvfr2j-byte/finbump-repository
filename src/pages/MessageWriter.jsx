import React, { useState, useRef, useMemo } from 'react';

const STYLE_CUES = [
  'use a gentle, reflective tone',
  'use a warm, conversational tone',
  'use an uplifting, playful tone',
  'use a tender, poetic tone',
  'use a grounded, sincere tone',
  'use a hopeful, forward-looking tone',
];
import { base44 } from '@/api/base44Client';
import { useKeepsake } from '@/lib/keepsakeStore';
import TopNav from '@/components/TopNav';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useFeatureTracking } from '@/hooks/useFeatureTracking';
import { useAIMessageLimit } from '@/hooks/useAIMessageLimit';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Sparkles, MessageSquare } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import SmallGiftSuggester from '@/components/messages/SmallGiftSuggester';
import { RELATIONS, classifyRelation } from '@/lib/peopleConstants';
import { relativeLast, formatDate } from '@/lib/keepsakeUtils';
import { useI18n } from '@/lib/i18n/I18nContext';

function personContextBlock(person) {
  if (!person) return '';
  const parts = [];
  const likes = (person.likes || []).filter(Boolean);
  if (likes.length) parts.push(`things they love: ${likes.join(', ')}`);
  if (person.birthday) {
    const [by, bm, bdd] = person.birthday.split('-').map(Number);
    if (by && bm && bdd) {
      const now = new Date();
      let age = now.getFullYear() - by;
      const m = now.getMonth() - (bm - 1);
      if (m < 0 || (m === 0 && now.getDate() < bdd)) age--;
      if (age > 0 && age < 120) parts.push(`age: approximately ${age}`);
    }
    parts.push(`birthday: ${person.birthday}`);
  }
  if (person.anniversary) parts.push(`anniversary: ${person.anniversary}`);
  const prefs = person.preferences || {};
  const prefEntries = Object.entries(prefs).filter(([, v]) => v);
  if (prefEntries.length) parts.push(`preferences: ${prefEntries.map(([k, v]) => `${k} ${v}`).join(', ')}`);
  const details = (person.details || []).filter((d) => d.label && d.value);
  if (details.length) parts.push(`details: ${details.map((d) => `${d.label} ${d.value}`).join(', ')}`);
  const otherItems = (person.otherItems || []).filter(Boolean);
  if (otherItems.length) parts.push(`other things to know: ${otherItems.join('; ')}`);
  if (person.notes) parts.push(`notes: ${person.notes}`);
  if (person.healthNotes) parts.push(`health/personal care notes: ${person.healthNotes}`);
  if (person.prayerEnabled) {
    const prayerParts = [];
    if (person.prayerNames) prayerParts.push(`praying for ${person.prayerNames}`);
    if (person.prayerReason) prayerParts.push(`reason: ${person.prayerReason}`);
    if (prayerParts.length) parts.push(`prayer: ${prayerParts.join(', ')}`);
  }
  return parts.join('; ');
}

// Summarizes real, recent moments with this person so the generated message can
// feel grounded in shared history instead of generic sentiment. For the partner
// (blank `person` on acts, no `personId` on events), we match the relationship-
// level defaults; for others we match by id (with a legacy name fallback).
function sharedHistoryBlock(person, isPartner, { acts, events, giftIdeas }) {
  if (!person) return '';
  const actMatches = (act) => {
    const pn = (act.person || '').trim();
    return pn === '' ? isPartner : pn === person.name;
  };
  const recent = (acts || [])
    .filter((a) => a.lastCompleted && actMatches(a))
    .sort((a, b) => new Date(b.lastCompleted) - new Date(a.lastCompleted))
    .slice(0, 5)
    .map((a) => `"${a.name}" (done ${relativeLast(a.lastCompleted)})`);

  const personEvents = (events || [])
    .filter((e) => (isPartner ? !e.personId : String(e.personId) === String(person.id)))
    .filter((e) => e.date)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3)
    .map((e) => `${e.name} (${formatDate(e.date)})`);

  const giftMatches = (g) => {
    if (g.personId) return String(g.personId) === String(person.id);
    const pn = typeof g.person === 'string' ? g.person.trim() : '';
    return pn !== '' && pn === person.name;
  };
  const gifts = (giftIdeas || [])
    .filter(giftMatches)
    .filter((g) => !g.purchased && !g.gifted)
    .slice(0, 4)
    .map((g) => g.title)
    .filter(Boolean);

  const parts = [];
  if (recent.length) parts.push(`recent things I did for them: ${recent.join(', ')}`);
  if (personEvents.length) parts.push(`special dates for us: ${personEvents.join(', ')}`);
  if (gifts.length) parts.push(`gift ideas I've been considering for them: ${gifts.join(', ')}`);
  return parts.join('; ');
}

export default function MessageWriter() {
  useFeatureTracking('message_writer');
  const { t } = useI18n();
  const { profile, people, acts, events, giftIdeas } = useKeepsake();
  const LENGTH_OPTIONS = [
    { value: 'short', label: t('msgWriter.short'), words: '25 to 50 words' },
    { value: 'medium', label: t('msgWriter.medium'), words: '51 to 75 words' },
    { value: 'long', label: t('msgWriter.long'), words: '76 to 125 words' },
  ];
  const MESSAGE_TYPES = [
    { value: 'apology', label: t('msgWriter.apology') },
    { value: 'thank you', label: t('msgWriter.thankYou') },
    { value: 'love letter', label: t('msgWriter.loveLetter') },
    { value: 'birthday', label: t('msgWriter.birthday') },
    { value: 'just because', label: t('msgWriter.justBecause') },
  ];
  const [type, setType] = useState('apology');
  const [context, setContext] = useState('');
  const [length, setLength] = useState('medium');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState(profile.phone || '');
  const [recipient, setRecipient] = useState('');
  const historyRef = useRef([]);
  const { toast } = useToast();
  const { remaining, canGenerate, increment, limit, isPremium } = useAIMessageLimit();

  // Build a list of connected people (the partner plus everyone in the People
  // module), each tagged with the relationship category used to tailor the AI.
  const recipientOptions = useMemo(() => {
    const opts = [{ value: 'partner', label: profile.name || 'Partner', emoji: '💍' }];
    people.forEach((p) => {
      const key = classifyRelation(p.relation);
      const rel = RELATIONS.find((r) => r.key === key) || RELATIONS.find((r) => r.key === 'other');
      opts.push({ value: p.id, label: p.name || 'Unnamed', emoji: rel.emoji, person: p, key });
    });
    return opts;
  }, [profile.name, people]);

  // Resolve the currently selected option into the person + relationship meta.
  const selected = recipient ? recipientOptions.find((o) => o.value === recipient) : null;
  const selMeta = selected
    ? (() => {
        const key = selected.key || 'partner';
        const rel = RELATIONS.find((r) => r.key === key) || RELATIONS.find((r) => r.key === 'other');
        const person = key === 'partner' ? profile : selected.person;
        return { key, label: rel.label, singular: rel.singular, name: person ? (person.name || 'them') : 'them', person };
      })()
    : null;

  const handleGenerate = async () => {
    if (!selMeta || !recipient) {
      toast({ title: t('msgWriter.chooseFirst') });
      return;
    }
    if (!canGenerate) {
      toast({
        title: t('msgWriter.dailyLimitReached', { limit }),
        description: isPremium
          ? t('msgWriter.moreTomorrow')
          : t('msgWriter.upgradePremium'),
      });
      return;
    }
    setLoading(true);
    increment();
    const lengthWords = LENGTH_OPTIONS.find((l) => l.value === length).words;
    const cue = STYLE_CUES[Math.floor(Math.random() * STYLE_CUES.length)];
    const seed = Math.floor(Math.random() * 1000000);
    const prior = historyRef.current;
    const personBlock = personContextBlock(selMeta.person);
    const isPartner = selMeta.key === 'partner';
    const romanticGuard = isPartner
      ? ''
      : `\n- This is NOT a romantic relationship — do not use romantic language or undertones. Express warmth and care appropriate for a ${selMeta.singular}.`;
    const sharedBlock = sharedHistoryBlock(selMeta.person, isPartner, { acts, events, giftIdeas });
    const priorBlock = prior.length
      ? `\nDo NOT reuse the wording, openings, or phrasings from these previous messages:\n${prior
          .map((m, i) => `${i + 1}. ${m}`)
          .join('\n')}`
      : '';
    const ctx = context.trim();
    const prompt = `Write a heartfelt, sincere ${type} from me to my ${selMeta.singular}, ${selMeta.name}. This message must be clearly about the specific things below — make them the subject, not a passing mention.

${ctx ? `What I want this message to be about (use these specifics as the core content — reference them directly and build the message around them):\n"${ctx}"` : 'What I want this message to be about: a sincere, fitting ${type} for them.'}

${personBlock ? `What I know about ${selMeta.name} — their likes, important dates, personal details, and the notes I keep about them (weave in what fits naturally; never list these back at them):\n${personBlock}.` : ''}

${sharedBlock ? `Recent activity and shared history between us — real, specific moments. Use these to ground this message in our actual relationship; refer to moments naturally, don't recite a list:\n${sharedBlock}.` : ''}

Rules:
- Write in first person, from me to ${selMeta.name}. Address them directly by name in the greeting.
- Keep it warm, genuine, and concrete — not generic. Tie the message to the specifics above, and draw on their notes and our recent activity so it feels written from real shared experience.
- Don't use placeholders like [name]. Write a finished, ready-to-send message.
- Keep the length to ${lengthWords}.${romanticGuard}
- Don't repeat this framing back; just write the message itself.${priorBlock}

Style: ${cue}. (variation seed: ${seed})`;
    const response = await base44.functions.invoke('generate-message', { prompt });
    setResult(response.data.message);
    historyRef.current = [response, ...prior].slice(0, 5);
    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    toast({ title: t('msgWriter.copied') });
  };

  const handleSendText = () => {
    const body = encodeURIComponent(result);
    window.location.href = `sms:${phone.trim()}?body=${body}`;
  };

  return (
    <div className="min-h-[100dvh] bg-background max-w-[440px] mx-auto pb-[calc(5.5rem_+_env(safe-area-inset-bottom))]">
      <TopNav title={t('msgWriter.title')} subtitle={t('msgWriter.subtitle')} back />

      <div className="px-5 mt-2 space-y-4">
        <p className="font-display text-sm text-muted-foreground italic">{t('msgWriter.tagline')}</p>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('msgWriter.typeLabel')}</label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MESSAGE_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            {t('msgWriter.whoForRequired')}
          </label>
          <Select value={recipient} onValueChange={setRecipient}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder={t('msgWriter.selectPerson')} />
            </SelectTrigger>
            <SelectContent>
              {recipientOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.emoji} {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            {t('msgWriter.contextLabel')}
          </label>
          <Textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            rows={4}
            placeholder={t('msgWriter.contextPlaceholder')}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('msgWriter.lengthLabel')}</label>
          <Select value={length} onValueChange={setLength}>
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LENGTH_OPTIONS.map((l) => (
                <SelectItem key={l.value} value={l.value}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Button onClick={handleGenerate} disabled={loading || !recipient || !canGenerate} className="w-full h-12 rounded-2xl gap-2">
            <Sparkles size={16} />
            {loading ? t('msgWriter.writing') : canGenerate ? t('msgWriter.generate') : t('msgWriter.dailyLimit')}
            </Button>
            <p className="text-[11px] text-muted-foreground text-center mt-1.5">
            {canGenerate
              ? t('msgWriter.messagesLeft', { remaining, limit })
              : isPremium ? t('msgWriter.comeBack') : t('msgWriter.comeBackPremium')}
            </p>
        </div>

        <SmallGiftSuggester
          message={result}
          messageType={type}
          recipientKey={selMeta?.key || ''}
          recipientLabel={selMeta?.label || ''}
          person={selMeta?.person || null}
        />

        {result && (
          <div className="rounded-2xl border p-4 space-y-3 shadow-card ks-card-tint">
            <Textarea
              value={result}
              onChange={(e) => setResult(e.target.value)}
              rows={8}
              className="text-sm leading-relaxed resize-y"
              aria-label={t('msgWriter.editable')}
            />
            <p className="text-xs font-medium text-primary bg-primary/10 rounded-md px-2.5 py-1.5 border border-primary/20">
              ✏️ Edit the message to make it personal
            </p>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('msgWriter.phoneLabel')}</label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t('msgWriter.phonePlaceholder')}
                className="h-11"
              />
            </div>
            <Button onClick={handleSendText} disabled={!phone.trim()} className="w-full h-10 rounded-xl gap-2">
              <MessageSquare size={15} />
              {t('msgWriter.sendText')}
            </Button>
            <Button variant="outline" onClick={handleCopy} className="w-full h-10 rounded-xl gap-2">
              <Copy size={15} />
              {t('msgWriter.copy')}
            </Button>
          </div>
        )}
      </div>


    </div>
  );
}