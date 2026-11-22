import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import TopNav from '@/components/TopNav';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Gift, Send, CheckCircle2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';

export default function SuggestImprovement() {
  const { t } = useI18n();
  const CATEGORIES = [
    t('suggest.catNewFeature'),
    t('suggest.catImprove'),
    t('suggest.catBug'),
    t('suggest.catDesign'),
    t('suggest.catPerformance'),
    t('suggest.catContent'),
    t('suggest.catOther'),
  ];
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const { toast } = useToast();

  const submit = async () => {
    if (!category) {
      toast({ title: t('suggest.pickCategory'), variant: 'destructive' });
      return;
    }
    if (message.trim().length < 5) {
      toast({ title: t('suggest.tellMore'), variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      await base44.functions.invoke('submit-suggestion', { category, message: message.trim() });
      base44.analytics.track({ eventName: 'suggestion_submitted', properties: { feature: 'suggest_improvement', category } });
      setDone(true);
    } catch (e) {
      toast({ title: t('suggest.couldNotSubmit'), description: e?.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background max-w-[440px] mx-auto pb-[calc(5.5rem_+_env(safe-area-inset-bottom))]">
      <TopNav title={t('suggest.title')} subtitle={t('suggest.subtitle')} back backTo="/find-it" />
      <div className="px-5 mt-2 space-y-4">
        {/* Monthly giveaway banner */}
        <div
          className="rounded-2xl p-4 border"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--primary) / 0.14), hsl(var(--secondary) / 0.14))',
            borderColor: 'hsl(var(--primary) / 0.3)',
          }}
        >
          <div className="flex items-start gap-3">
            <div className="rounded-full p-2 bg-primary/15 text-primary shrink-0">
              <Gift size={22} />
            </div>
            <div>
              <p className="font-display text-sm font-semibold">{t('suggest.giveawayTitle')}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('suggest.giveawayDesc')}
              </p>
            </div>
          </div>
        </div>

        {done ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-center space-y-3">
            <CheckCircle2 className="size-12 mx-auto text-secondary" />
            <p className="font-display text-base font-semibold">{t('suggest.thankYou')}</p>
            <p className="text-sm text-muted-foreground">
              {t('suggest.thankYouDesc')}
            </p>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                setDone(false);
                setCategory('');
                setMessage('');
              }}
            >
              {t('suggest.submitAnother')}
            </Button>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('suggest.aboutLabel')}</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder={t('suggest.chooseCategory')} />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('suggest.messageLabel')}</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('suggest.messagePlaceholder')}
                className="rounded-xl min-h-[120px]"
              />
            </div>
            <Button onClick={submit} disabled={submitting} className="w-full rounded-xl h-11">
              {submitting ? (
                t('suggest.sending')
              ) : (
                <>
                  <Send size={16} className="mr-2" /> {t('suggest.sendSuggestion')}
                </>
              )}
            </Button>
            <p className="font-display text-center text-sm text-muted-foreground italic pt-1">
              {t('suggest.tagline')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}