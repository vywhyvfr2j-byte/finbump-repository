import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useKeepsake } from '@/lib/keepsakeStore';
import TopNav from '@/components/TopNav';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import ResponsiveSelect from '@/components/ui/responsive-select';
import { useToast } from '@/components/ui/use-toast';
import { Sparkles, Send, Loader2, Crown, Wand2, X, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/lib/AuthContext';
import { Image } from '@/components/ui/image';
import { CARD_TEMPLATES, TEMPLATE_MAP } from '@/lib/cardTemplates';
import { CARD_MESSAGE_LIBRARY, fillTemplate } from '@/lib/cardMessageLibrary';
import CardView from '@/components/cards/CardView';
import CardMessagePicker from '@/components/cards/CardMessagePicker';
import SendGiftPromptDialog from '@/components/cards/SendGiftPromptDialog';
import { useKeepsakeUsers } from '@/hooks/useKeepsakeUsers';
import KeepsakeUserBadge from '@/components/people/KeepsakeUserBadge';
import { RELATIONS, classifyRelation, sortPeopleForPicker } from '@/lib/peopleConstants';
import { useI18n } from '@/lib/i18n/I18nContext';

const OCCASION_LABELS = {
  birthday: 'birthday card message',
  anniversary: 'anniversary card message',
  prayer: 'prayer / support card message',
  getwell: 'get-well card message',
  graduation: 'graduation card message',
  thankyou: 'thank-you card message',
  thinking: 'thinking-of-you card message',
  justbecause: 'just-because card message',
};

function contextBlock(person) {
  if (!person) return '';
  const parts = [];
  const likes = (person.likes || []).filter(Boolean);
  if (likes.length) parts.push(`things they love: ${likes.join(', ')}`);
  if (person.birthday) parts.push(`birthday: ${person.birthday}`);
  if (person.anniversary) parts.push(`anniversary: ${person.anniversary}`);
  const otherItems = (person.otherItems || []).filter(Boolean);
  if (otherItems.length) parts.push(`other things to know: ${otherItems.join('; ')}`);
  if (person.notes) parts.push(`notes: ${person.notes}`);
  if (person.healthNotes) parts.push(`health/care notes: ${person.healthNotes}`);
  if (person.prayerEnabled && person.prayerReason) parts.push(`prayer reason: ${person.prayerReason}`);
  return parts.join('; ');
}

export default function CardBuilder() {
  const { t } = useI18n();
  const { people } = useKeepsake();
  const keepsakeEmails = useKeepsakeUsers();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { toast } = useToast();

  // Cards deliver app-to-app only — restrict the picker to contacts who are
  // FinBump users (their email matches a registered account).
  const recipientOptions = useMemo(() => sortPeopleForPicker(people)
    .map((p) => {
      const key = classifyRelation(p.relation);
      const rel = RELATIONS.find((r) => r.key === key) || RELATIONS.find((r) => r.key === 'other');
      const isUser = !!(p.email && keepsakeEmails[p.email.trim().toLowerCase()]);
      return { value: p.id, label: p.name || 'Unnamed', person: p, key, isUser };
    }), [people, keepsakeEmails]);

  const prePersonId = params.get('personId');
  const prePerson = params.get('person');
  const preOccasion = params.get('occasion');
  const validOccasion = preOccasion && TEMPLATE_MAP[preOccasion] ? preOccasion : 'birthday';
  const initialRecipient =
    recipientOptions.find((o) => o.value === prePersonId)?.value ||
    recipientOptions.find((o) => o.label === prePerson)?.value ||
    '';

  const [recipient, setRecipient] = useState(initialRecipient);
  const [occasion, setOccasion] = useState(validOccasion);
  const [keywords, setKeywords] = useState('');
  const [templateKey, setTemplateKey] = useState(validOccasion);
  const [message, setMessage] = useState('');
  const [pickedTitle, setPickedTitle] = useState('');
  const [loadingMsg, setLoadingMsg] = useState(false);
  const [sending, setSending] = useState(false);

  // The FinBump-user lookup resolves after mount, so recipientOptions is empty
  // on first render. Auto-select the pre-filled recipient once it populates.
  useEffect(() => {
    if (recipient) return;
    if (!prePersonId && !prePerson) return;
    const match = recipientOptions.find((o) => o.value === prePersonId)
      || recipientOptions.find((o) => o.label === prePerson);
    if (match) setRecipient(match.value);
  }, [recipientOptions, recipient, prePersonId, prePerson]);

  const { user } = useAuth();
  const isPremium = user?.role === 'admin' || user?.plan === 'premium' || (!!user?.lifetimeTier && user?.lifetimeTier !== 'lifetime-basic');

  const [imageUrl, setImageUrl] = useState('');
  const [loadingArt, setLoadingArt] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [giftPromptOpen, setGiftPromptOpen] = useState(false);
  const [senderName, setSenderName] = useState(user?.full_name || '');

  const handleGenerateArt = async () => {
    if (!isPremium) return;
    setLoadingArt(true);
    try {
      const res = await base44.functions.invoke('generate-card-art', { occasion, keywords });
      setImageUrl(res.data.url);
    } catch (e) {
      toast({ title: t('cardBuilder.couldNotGenBg'), description: e?.message });
    }
    setLoadingArt(false);
  };

  const selected = recipientOptions.find((o) => o.value === recipient) || null;
  const person = selected?.person || null;
  const displayName = person?.preferredName || person?.name || 'them';
  const isPartner = selected?.key === 'partner';
  const hasLibrary = Array.isArray(CARD_MESSAGE_LIBRARY[occasion]) && CARD_MESSAGE_LIBRARY[occasion].length > 0;

  const handleGenerate = async () => {
    if (!person) { toast({ title: t('cardBuilder.chooseFirst') }); return; }
    setLoadingMsg(true);
    const ctx = contextBlock(person);
    const kw = keywords.trim();
    const romanticGuard = isPartner ? '' : '\nThis is NOT a romantic relationship — keep it warm but not romantic.';
    const occLabel = OCCASION_LABELS[occasion] || 'card message';
    const prompt = `Write a heartfelt, ready-to-send ${occLabel} from me to ${displayName}.${ctx ? `\n\nWhat I know about them (weave in naturally, never list these back at them): ${ctx}.` : ''}${kw ? `\n\nKey things I want this card to mention — build the message around these: "${kw}".` : ''}\n\nRules:\n- Write in first person, from me to them. Address them by name in the greeting.\n- Warm, genuine, and specific to this person and occasion — not generic. 2 to 4 sentences, fitting a greeting card.\n- No placeholders like [name]. Write the finished message only.${romanticGuard}`;
    try {
      const res = await base44.functions.invoke('generate-message', { prompt });
      setMessage(res.data.message);
    } catch (e) {
      toast({ title: t('cardBuilder.couldNotGen'), description: e?.message });
    }
    setLoadingMsg(false);
  };

  const handleSend = async () => {
    if (!recipient || !message.trim()) { toast({ title: t('cardBuilder.addMsgFirst') }); return; }
    setSending(true);
    try {
      const res = await base44.functions.invoke('send-card', {
        personId: recipient, occasion, keywords, templateKey, message, imageUrl, senderLabel: senderName,
      });
      const data = res.data;
      if (data.delivery === 'app') {
        toast({ title: t('cardBuilder.cardSent', { name: data.recipientName || 'them' }), description: t('cardBuilder.sentDesc') });
      } else {
        toast({ title: t('cardBuilder.notUser', { name: data.recipientName || 'They' }), description: t('cardBuilder.notUserDesc') });
      }
      setGiftPromptOpen(true);
    } catch (e) {
      toast({ title: t('cardBuilder.couldNotSend'), description: e?.message });
    }
    setSending(false);
  };

  // Reminder hand-off after the card is sent: hunt for a gift for this person,
  // or continue to the cards list.
  const goToGiftFinder = () => {
    setGiftPromptOpen(false);
    navigate(person?.name ? `/gift-tracker?person=${encodeURIComponent(person.name)}` : '/gift-tracker');
  };
  const dismissGiftPrompt = () => {
    setGiftPromptOpen(false);
    navigate('/cards');
  };

  const previewCard = {
    occasion,
    message: message || t('cardBuilder.messagePlaceholder'),
    templateKey,
    imageUrl,
    senderName: user?.full_name || '',
    senderLabel: senderName.trim(),
    deliveredAt: new Date().toISOString(),
  };

  return (
    <div className="min-h-[100dvh] bg-background max-w-[440px] mx-auto pb-[calc(5.5rem_+_env(safe-area-inset-bottom))]">
      <TopNav title={t('cardBuilder.sendCardTitle')} subtitle={t('cards.subtitle')} />
      <div className="px-5 mt-2 space-y-4">
        {people.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-10 space-y-2">
            <p className="font-medium text-foreground">{t('cardBuilder.noContacts')}</p>
            <p>{t('cardBuilder.addContactFirst')}</p>
          </div>
        ) : (
          <>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('cardBuilder.whoFor')} <span className="text-destructive">*</span></label>
              <ResponsiveSelect
                value={recipient}
                onValueChange={setRecipient}
                title={t('cardBuilder.whoFor')}
                placeholder={t('cardBuilder.selectPerson')}
                className="h-11"
                options={recipientOptions.map((o) => ({
                  value: o.value,
                  label: (
                    <span className="flex items-center gap-2">
                      {o.label}
                      {o.isUser && <KeepsakeUserBadge variant="dot" />}
                    </span>
                  ),
                }))}
              />
              <p className="text-[11px] text-muted-foreground mt-1">{t('cardBuilder.userBadgeNote')}</p>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('cardBuilder.occasionLabel')}</label>
              <ResponsiveSelect
                value={occasion}
                onValueChange={(v) => { setOccasion(v); setTemplateKey(v); }}
                title={t('cardBuilder.occasionLabel')}
                className="h-11"
                options={CARD_TEMPLATES.map((item) => ({ value: item.key, label: `${item.emoji} ${item.label}` }))}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('cardBuilder.keywordsLabel')}</label>
              <Input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder={t('cardBuilder.keywordsPlaceholder')} className="h-11" />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Sign the card as</label>
              <Input value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="e.g. Mom, Grandma Jo" className="h-11" />
              <p className="text-[11px] text-muted-foreground mt-1">Your FinBump name always shows as the sender — this is the signature line.</p>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('cardBuilder.designLabel')}</label>
              <div className="grid grid-cols-4 gap-2">
                {CARD_TEMPLATES.map((t) => (
                  <button key={t.key} onClick={() => { setTemplateKey(t.key); setOccasion(t.key); }} className={`rounded-xl p-2 bg-gradient-to-br ${t.gradient} ${t.ink} text-center transition-all ${templateKey === t.key ? 'ring-2 ring-primary scale-105' : 'opacity-80'}`}>
                    <div className="text-lg">{t.emoji}</div>
                    <div className="text-[9px] font-semibold leading-tight mt-0.5">{t.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* AI-generated card background — Premium feature */}
            {isPremium ? (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('cardBuilder.bgPremium')}</label>
                {imageUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border border-border">
                    <Image src={imageUrl} alt={t('cardBuilder.aiBgAlt')} fittingType="fill" className="w-full h-28" />
                    <button onClick={() => setImageUrl('')} className="absolute top-1.5 right-1.5 w-11 h-11 rounded-full bg-black/55 text-white flex items-center justify-center" aria-label={t('cardBuilder.removeBg')}>
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <Button onClick={handleGenerateArt} disabled={loadingArt} variant="outline" className="w-full h-11 rounded-2xl gap-2 border-dashed">
                    {loadingArt ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
                    {loadingArt ? t('cardBuilder.painting') : t('cardBuilder.generateBg')}
                  </Button>
                )}
                <p className="text-[11px] text-muted-foreground mt-1">{t('cardBuilder.bgNote')}</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-3.5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-accent/15 text-accent flex items-center justify-center shrink-0"><Crown size={18} /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold">{t('cardBuilder.uniqueBg')}</p>
                  <p className="text-[11px] text-muted-foreground">{t('cardBuilder.premiumFeature')}</p>
                </div>
                <Link to="/settings" className="text-xs font-medium text-primary shrink-0">{t('cardBuilder.upgrade')}</Link>
              </div>
            )}

            {hasLibrary && (
              <CardMessagePicker
                occasion={occasion}
                recipientName={displayName}
                selectedTitle={pickedTitle}
                onPick={(title, text) => { setPickedTitle(title); setMessage(text); }}
              />
            )}

            <Button onClick={handleGenerate} disabled={loadingMsg || !recipient} className="w-full h-12 rounded-2xl gap-2">
              {loadingMsg ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
              {loadingMsg ? t('cardBuilder.writing') : t('cardBuilder.generateMsg')}
            </Button>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('cardBuilder.previewLabel')}</label>
              <button onClick={() => setPreviewOpen(true)} className="block w-full text-left" aria-label={t('cardBuilder.openPreview')}>
                <CardView card={previewCard} />
              </button>
            </div>

            {message && (
              <>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('cardBuilder.messageLabel')}</label>
                  <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} className="text-sm leading-relaxed resize-y" />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setPreviewOpen(true)} variant="outline" className="flex-1 h-12 rounded-2xl gap-2">
                    <Eye size={16} /> {t('cardBuilder.previewBtn')}
                  </Button>
                  <Button onClick={handleSend} disabled={sending || !message.trim()} className="flex-1 h-12 rounded-2xl gap-2">
                    {sending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                    {sending ? t('cardBuilder.sending') : t('cardBuilder.sendCardBtn')}
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </div>

      <SendGiftPromptDialog
        open={giftPromptOpen}
        name={displayName}
        onYes={goToGiftFinder}
        onNo={dismissGiftPrompt}
      />

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-[420px] p-0 overflow-hidden">
          <DialogHeader className="sr-only"><DialogTitle>{t('cardBuilder.previewTitle')}</DialogTitle></DialogHeader>
          <CardView card={previewCard} big />
          <div className="p-4 pt-3">
            <p className="text-xs text-muted-foreground text-center mb-3">{t('cardBuilder.previewNote', { name: displayName === 'them' ? 'they' : displayName })}</p>
            <Button onClick={() => { setPreviewOpen(false); handleSend(); }} disabled={sending || !message.trim()} className="w-full h-12 rounded-2xl gap-2">
              {sending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
              {sending ? t('cardBuilder.sending') : t('cardBuilder.sendCardBtn')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}