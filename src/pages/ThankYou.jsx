import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, SkipForward, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import BrandLogo from '@/components/BrandLogo';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n/I18nContext';

// Where a new member lands after starting the trial or paying. Access is granted
// by the payment webhook, which can arrive a moment after the buyer is sent
// back, so we wait for it and only then hand them into the app — that way a new
// member meets onboarding instead of the paywall again.
export default function ThankYou() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [accessReady, setAccessReady] = useState(false);
  const [skipping, setSkipping] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const check = async () => {
      const res = await base44.functions.invoke('check-access', {}).catch(() => null);
      if (cancelled) return;
      if (res?.data?.hasAccess) {
        setAccessReady(true);
        return;
      }
      attempts += 1;
      // After ~15 seconds we hand off anyway rather than leaving them waiting.
      if (attempts >= 6) {
        setAccessReady(true);
        return;
      }
      setTimeout(check, 2500);
    };
    check();
    return () => {
      cancelled = true;
    };
  }, []);

  const startTour = () => navigate('/');

  // Opting out still needs a finished setup, or the app would show onboarding
  // again on the next screen.
  const skipTour = async () => {
    setSkipping(true);
    await base44.auth.updateMe({ onboarded: true }).catch(() => {});
    navigate('/');
  };

  return (
    <div className="min-h-[100dvh] bg-background max-w-[440px] mx-auto flex flex-col items-center justify-center text-center px-6 pb-[calc(5.5rem_+_env(safe-area-inset-bottom))]">
      <BrandLogo size={56} className="mb-4" />
      <h1 className="font-display text-2xl font-semibold mb-2">{t('thankYou.title')}</h1>
      <p className="text-sm text-muted-foreground mb-5 max-w-xs">
        {t('thankYou.desc')}
      </p>

      {/* One screen, one question, two equal ways forward. The tour is offered
          first, but skipping is a proper button with its destination in the
          label — never a small link an experienced member has to hunt for. */}
      <p className="text-sm font-medium text-foreground mb-3">{t('thankYou.choose')}</p>

      <div className="w-full max-w-xs space-y-2.5">
        <Button
          onClick={startTour}
          disabled={!accessReady}
          className="w-full min-h-14 h-14 rounded-2xl text-base"
        >
          {accessReady ? (
            <>
              <Sparkles size={16} />
              {t('thankYou.tour')}
            </>
          ) : (
            <>
              <Loader2 size={16} className="animate-spin" />
              {t('thankYou.settingUp')}
            </>
          )}
        </Button>

        <Button
          variant="outline"
          onClick={skipTour}
          disabled={!accessReady || skipping}
          className="w-full min-h-14 h-14 rounded-2xl text-base whitespace-normal leading-snug"
        >
          {skipping ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {t('thankYou.opening')}
            </>
          ) : (
            <>
              <SkipForward size={16} />
              {t('thankYou.skip')}
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground pt-1">{t('thankYou.tourHint')}</p>
      </div>
    </div>
  );
}