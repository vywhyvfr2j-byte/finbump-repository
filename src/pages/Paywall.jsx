import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/AuthContext';
import { startCheckout } from '@/lib/checkout';
import { activeTrialPurchase } from '@/lib/trialPlans';
import BrandLogo from '@/components/BrandLogo';
import NoAdsNote from '@/components/NoAdsNote';
import PlanOptionList from '@/components/billing/PlanOptionList';
import {
  Crown, Gift, MessageSquare, MessageCircle, Image, Plane, Users, X, Heart, CalendarRange,
} from 'lucide-react';

const PREMIUM_FEATURES = [
  { icon: Gift, label: 'AI Gift Finder' },
  { icon: MessageSquare, label: 'AI Message Writer' },
  { icon: MessageCircle, label: 'AI Chat Assistant' },
  { icon: Image, label: 'AI Card Art' },
  { icon: Plane, label: 'Vacation Planner' },
  { icon: Heart, label: 'Remembrance' },
  { icon: CalendarRange, label: 'Year in Moments' },
  { icon: Users, label: 'Family Pass Sharing' },
];

// Two ways in, never a hidden toggle: every plan carries its own "Pay now"
// button, and only a member who has not started (or already used) a trial also
// sees "Free 7 days". During a trial the page is pay-only, so the same trial is
// never offered twice.
export default function Paywall() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(null);
  const [trialState, setTrialState] = useState({ checked: false, running: false, used: false });

  const forcePay = new URLSearchParams(window.location.search).get('payNow') === '1';
  const trialEnded = !!user?.passExpiresAt && new Date(user.passExpiresAt).getTime() < Date.now();
  const payOnly = forcePay || trialState.running || trialState.used;
  const dismissKey = user?.passExpiresAt ? `ks_paywall_dismissed_${user.passExpiresAt}` : 'ks_paywall_dismissed';

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    base44.entities.Base44Purchase.filter({ appUserId: user.id })
      .then((rows) => {
        if (cancelled) return;
        const paid = (rows || []).filter((p) => p.status === 'paid');
        const expiryRunning =
          !!user.passExpiresAt && new Date(user.passExpiresAt).getTime() > Date.now() && !user.lifetimeTier;
        setTrialState({
          checked: true,
          running: !!activeTrialPurchase(paid) || expiryRunning,
          used: paid.some((p) => !!p.trialEndDate),
        });
      })
      .catch(() => {
        if (!cancelled) setTrialState({ checked: true, running: false, used: false });
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // A member who already pays should never land here — but a running trial is
  // exactly who this page is for now, so it is never bounced away. Admins (the
  // account reviewing the plans) always see the page.
  useEffect(() => {
    if (!user || !trialState.checked) return;
    if (user.role === 'admin') return;
    const paying = !!user.lifetimeTier || (user.plan && user.plan !== 'free');
    if (paying && !trialState.running) navigate('/', { replace: true });
  }, [user, trialState]);

  const start = async (productId, payNow) => {
    setLoading(`${productId}:${payNow ? 'pay' : 'trial'}`);
    try {
      await startCheckout(productId, { payNow });
    } catch (error) {
      toast({
        title: 'Could not start checkout',
        description: error?.response?.data?.error || error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  const dismiss = () => {
    try {
      window.localStorage.setItem(dismissKey, '1');
    } catch {
      /* private mode */
    }
    navigate('/');
  };

  const headline = trialState.running
    ? 'Pay now, keep everything'
    : trialEnded
      ? 'Your free trial has ended'
      : 'Choose your plan';
  const subline = trialState.running
    ? 'Your trial is free until day 8. Pick a plan to pay today instead — it starts right away and the trial is stopped, so you are never charged twice.'
    : trialEnded
      ? 'Keep every moment close. Pick a plan to turn everything back on.'
      : 'Start with 7 free days, or pay now and it is yours today. A card is required either way.';

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md pt-[calc(14px+env(safe-area-inset-top))]">
        <div className="flex items-center justify-between px-4 pb-3">
          <div className="flex items-center gap-2">
            <BrandLogo size={26} />
            <span className="font-display text-base font-semibold">FinBump</span>
          </div>
          <button
            onClick={dismiss}
            className="flex items-center justify-center w-11 h-11 rounded-full hover:bg-secondary/60 transition-colors"
            aria-label="Maybe later"
          >
            <X size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pb-16 space-y-5">
        <section className="text-center pt-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent/15 text-accent mb-3">
            <Crown size={28} />
          </div>
          <h1 className="font-display text-2xl font-semibold leading-tight">{headline}</h1>
          <p className="text-sm text-muted-foreground mt-2 px-1">{subline}</p>
        </section>

        <section className="space-y-2">
          <PlanOptionList payOnly={payOnly} loading={loading} onStart={start} />
          <NoAdsNote />
        </section>

        <section className="rounded-2xl border border-border bg-card p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Premium includes
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {PREMIUM_FEATURES.map((feature) => (
              <div key={feature.label} className="flex items-center gap-1.5">
                <feature.icon size={13} className="shrink-0 text-accent" />
                <span className="text-[11px] text-muted-foreground leading-snug">{feature.label}</span>
              </div>
            ))}
          </div>
        </section>

        <button
          onClick={dismiss}
          className="block w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
        >
          Maybe later
        </button>

        <p className="text-center text-[11px] text-muted-foreground">
          Subscriptions renew automatically. Cancel anytime from Settings with a prorated refund.
        </p>
      </main>
    </div>
  );
}