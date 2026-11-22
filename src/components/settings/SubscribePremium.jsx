import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import FamilyPassManager from '@/components/settings/FamilyPassManager';
import TrialStatusCard from '@/components/billing/TrialStatusCard';
import { activeTrialPurchase } from '@/lib/trialPlans';
import NoAdsNote from '@/components/NoAdsNote';
import { openCheckoutUrl } from '@/lib/openCheckoutUrl';
import { Gift, Crown, Sparkles, Check } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';

const BASIC_FEATURES = [
  'Unlimited people, pets & groups',
  'Acts of support with reminders',
  'Calendar, special dates & countdowns',
  'Gift tracker (manual entry)',
  'Personal notes & appreciation journal',
  'Prayer & care check-in reminders',
  'Standard cards (curated templates)',
  'Progress charts',
  'Partner pairing & sync',
];

const PREMIUM_FEATURES = [
  'AI gift finder with buy links',
  'AI message & card writer',
  '__AI_CHAT__',
  'AI card art generation',
  'Vacation planner with AI itinerary',
  'Family pass sharing',
];

const TIER_PLANS = {
  basic: [
    { id: 'keepsake-basic-yearly', label: 'Annual', price: '$9.49', period: '/yr', save: 'Save 21%', isLifetime: false },
    { id: 'keepsake-basic-lifetime', label: 'Lifetime', price: '$29.99', period: '', isLifetime: true },
  ],
  premium: [
    { id: 'keepsake-premium-yearly', label: 'Annual', price: '$18.99', period: '/yr', save: 'Save 21%', isLifetime: false },
    { id: 'keepsake-premium-lifetime', label: 'Lifetime', price: '$59.99', period: '', isLifetime: true },
  ],
};

const FAMILY_PLANS = [
  { id: 'keepsake-family-starter', label: 'Family Starter', price: '$29.99', period: '/year', save: '1 pass', blurb: 'You + 1 annual pass to share' },
  { id: 'keepsake-family-package', label: 'Family Package', price: '$44.99', period: '/year', save: '3 passes', blurb: 'You + 3 annual passes to share' },
  { id: 'keepsake-super-family', label: 'Super Family Pass', price: '$49.99', period: '/year', save: '4 passes', blurb: 'You + 4 annual passes to share' },
];

const LIFETIME_FAMILY_PLANS = [
  { id: 'keepsake-lifetime-plus', label: 'Lifetime Plus', price: '$119.99', blurb: 'Lifetime Premium for you + 2 annual passes to share.', passes: '2 passes' },
  { id: 'keepsake-lifetime-premium', label: 'Lifetime Family/Group Plan', price: '$179.99', blurb: 'Lifetime Premium for you + 4 annual passes to share. Add more people anytime for $10 each — no limit.', passes: '4 passes' },
];

const LIFETIME_LABELS = {
  'lifetime-basic': 'Lifetime Basic',
  'lifetime-premium-individual': 'Lifetime Premium',
  'lifetime-essential': 'Lifetime Essential',
  'lifetime-plus': 'Lifetime Plus',
  'lifetime-premium': 'Lifetime Family/Group Plan',
};

function TierCard({ tier, features, isPremium, selectedCycle, onSelectCycle, onSubscribe, loading }) {
  const plans = TIER_PLANS[tier];
  const selectedPlan = plans.find((p) => p.label === selectedCycle) || plans[1];
  const accent = isPremium ? 'accent' : 'primary';
  const Icon = isPremium ? Crown : Sparkles;

  return (
    <div className={`rounded-2xl border p-4 space-y-3 ${isPremium ? 'border-accent/40 bg-gradient-to-br from-accent/5 to-primary/5' : 'border-border bg-card'}`}>
      <div className="flex items-center gap-2">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${isPremium ? 'bg-accent/15 text-accent' : 'bg-primary/10 text-primary'}`}>
          <Icon size={16} />
        </div>
        <div>
          <p className="font-display text-base font-semibold">{isPremium ? 'Premium' : 'Basic'}</p>
          <p className="text-xs text-muted-foreground">
            {isPremium ? 'AI-powered relationship care' : 'Core relationship tracking'}
          </p>
        </div>
      </div>

      <div className="flex gap-1.5">
        {plans.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelectCycle(p.label)}
            className={`flex-1 rounded-lg border px-2 py-2 text-center transition-colors ${
              selectedCycle === p.label
                ? isPremium
                  ? 'border-accent bg-accent/10 ring-1 ring-accent'
                  : 'border-primary bg-primary/10 ring-1 ring-primary'
                : 'border-border hover:bg-secondary/50'
            }`}
          >
            <p className="text-[11px] font-medium leading-none">{p.label}</p>
            <p className="font-display text-sm font-semibold mt-1 leading-none">
              {p.price}
            </p>
            {p.save && (
              <p className={`text-[9px] font-semibold mt-1 ${isPremium ? 'text-accent' : 'text-primary'}`}>
                {p.save}
              </p>
            )}
          </button>
        ))}
      </div>

      <ul className="space-y-1.5">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-1.5">
            <Check size={13} className={`mt-0.5 shrink-0 ${isPremium ? 'text-accent' : 'text-primary'}`} />
            <span className="text-[11px] text-muted-foreground leading-snug">{f}</span>
          </li>
        ))}
      </ul>

      <NoAdsNote />

      <Button
        onClick={() => onSubscribe(selectedPlan.id, selectedPlan.isLifetime)}
        disabled={loading}
        className={`w-full h-10 rounded-xl ${isPremium ? '' : ''}`}
        variant={isPremium ? 'default' : 'outline'}
      >
        {loading ? 'Starting checkout…' : selectedPlan.isLifetime
          ? `Get ${isPremium ? 'Premium' : 'Basic'} Lifetime`
          : `Start 7-day free trial`}
      </Button>
    </div>
  );
}

export default function SubscribePremium() {
  const { t } = useI18n();
  const [plan, setPlan] = useState(null);
  const [lifetimeTier, setLifetimeTier] = useState(null);
  const [passCredits, setPassCredits] = useState({ annual: 0, monthly: 0 });
  const [basicCycle, setBasicCycle] = useState('Annual');
  const [premiumCycle, setPremiumCycle] = useState('Annual');
  const [loadingTier, setLoadingTier] = useState(null);
  const [canceling, setCanceling] = useState(false);
  const [trial, setTrial] = useState(null);
  const [pendingRequest, setPendingRequest] = useState(null);
  const [selectedFamilyPlan, setSelectedFamilyPlan] = useState(null);
  const [selectedLifetimeFamily, setSelectedLifetimeFamily] = useState(null);
  const { toast } = useToast();

  const fetchStatus = async () => {
    try {
      const user = await base44.auth.me();
      setPlan(user.plan || 'free');
      setLifetimeTier(user.lifetimeTier || null);
      setPassCredits({
        annual: user?.passCreditsAnnual || 0,
        monthly: user?.passCreditsMonthly || 0,
      });
      try {
        const requests = await base44.entities.CancelRequest.filter({
          userId: user.id,
          status: 'pending',
        });
        setPendingRequest(requests?.[0] || null);
      } catch {
        setPendingRequest(null);
      }
      // A running 7-day trial gets its own card (day count, charge date, pay
      // early, cancel for free) instead of the paid subscriber panel.
      try {
        const purchases = await base44.entities.Base44Purchase.filter({ appUserId: user.id });
        setTrial(activeTrialPurchase(purchases));
      } catch {
        setTrial(null);
      }
    } catch {
      setPlan('free');
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const subscribe = async (productId, isLifetime = false) => {
    setLoadingTier(productId);
    try {
      const res = await base44.functions.invoke('create-checkout', { productId, isUpgrade: false });
      const redirectUrl = res?.redirectUrl || res?.data?.redirectUrl;
      if (redirectUrl) {
        openCheckoutUrl(redirectUrl);
        return;
      }
      toast({ title: 'Could not start checkout', variant: 'destructive' });
    } catch {
      toast({ title: 'Checkout failed', variant: 'destructive' });
    } finally {
      setLoadingTier(null);
    }
  };

  const cancel = async () => {
    setCanceling(true);
    try {
      const res = await base44.functions.invoke('cancel-subscription', {});
      const data = res?.data || res;
      if (data?.error) {
        toast({ title: 'Could not cancel', description: data.error, variant: 'destructive' });
        return;
      }
      toast({
        title: 'Cancellation request submitted',
        description: data?.isTrial
          ? 'Your subscription will end when your free trial expires — no charge, no refund needed.'
          : `Prorated refund of $${data?.refundAmount?.toFixed(2)} pending admin approval.`,
      });
      fetchStatus();
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'Could not cancel.';
      toast({ title: 'Could not cancel', description: msg, variant: 'destructive' });
    } finally {
      setCanceling(false);
    }
  };

  if (pendingRequest) {
    return (
      <div className="rounded-2xl bg-card border border-border p-4 space-y-2">
        <p className="font-display text-base font-semibold">Cancellation pending</p>
        <p className="text-xs text-muted-foreground">
          Your cancellation request is awaiting admin review. You'll keep your current access until
          it's processed.
        </p>
      </div>
    );
  }

  const isPremiumTier = plan === 'premium' || (!!lifetimeTier && lifetimeTier !== 'lifetime-basic');
  const isBasicTier = plan === 'basic' || lifetimeTier === 'lifetime-basic';
  const isLifetime = !!lifetimeTier;
  const lifetimeLabel = lifetimeTier ? LIFETIME_LABELS[lifetimeTier] : null;

  // ---- Already Premium subscriber ----
  if (isPremiumTier) {
    return (
      <div className="space-y-4">
        {/* On the 7-day trial: progress, the day the card is charged, pay early,
            or cancel for free. After the trial this is the paid subscriber card. */}
        {trial ? (
          <TrialStatusCard purchase={trial} onChanged={fetchStatus} />
        ) : (
        <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
          <div className="flex items-center gap-2">
            {isLifetime ? <Crown size={18} className="text-accent" /> : <Sparkles size={18} className="text-primary" />}
            <div>
              <p className="font-display text-base font-semibold">
                {isLifetime ? lifetimeLabel || 'Lifetime Premium' : t('app.premium')}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isLifetime
                  ? "You're on a lifetime pass — thank you! No renewals, ever."
                  : "You're on Premium — thank you! Renews automatically."}
              </p>
            </div>
          </div>
          {!isLifetime && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full h-10 rounded-xl" disabled={canceling}>
                  {canceling ? 'Submitting…' : 'Cancel with prorated refund'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel your subscription?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You'll receive a prorated refund for the unused months. One day of use in a month
                    counts as the whole month, and your cancellation takes effect at the end of the
                    current month. The refund is processed after admin approval.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Premium</AlertDialogCancel>
                  <AlertDialogAction onClick={cancel} disabled={canceling}>
                    {canceling ? 'Submitting…' : 'Request cancellation'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
        )}

        {!isLifetime && (
          <div className="rounded-2xl bg-gradient-to-br from-accent/10 to-primary/5 border border-accent/30 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Crown size={18} className="text-accent" />
              <div>
                <p className="font-display text-base font-semibold">Upgrade to a Lifetime Pass</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Pay once, never renew. Choose a lifetime pass below.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {LIFETIME_FAMILY_PLANS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedLifetimeFamily(p.id)}
                  className={`w-full flex items-start justify-between rounded-xl border p-3 text-left transition-colors ${
                    selectedLifetimeFamily === p.id
                      ? 'border-accent bg-accent/5 ring-1 ring-accent'
                      : 'border-border hover:bg-secondary/50'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className={`w-4 h-4 mt-0.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      selectedLifetimeFamily === p.id ? 'border-accent' : 'border-muted-foreground/40'
                    }`}>
                      {selectedLifetimeFamily === p.id && <div className="w-2 h-2 rounded-full bg-accent" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{p.label}</span>
                        {p.passes && (
                          <span className="text-[10px] font-semibold text-accent-foreground bg-accent/20 px-1.5 py-0.5 rounded-full">
                            {p.passes}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{p.blurb}</p>
                    </div>
                  </div>
                  <span className="font-display font-semibold text-sm shrink-0">
                    {p.price}
                    <span className="text-muted-foreground font-body font-normal text-xs block">one-time</span>
                  </span>
                </button>
              ))}
            </div>
            <NoAdsNote className="mb-3" />

            <Button
              onClick={() => selectedLifetimeFamily && subscribe(selectedLifetimeFamily, true)}
              disabled={loadingTier !== null || !selectedLifetimeFamily}
              className="w-full h-11 rounded-xl"
            >
              {loadingTier !== null ? 'Starting checkout…' : 'Upgrade to lifetime'}
            </Button>
          </div>
        )}

        {isLifetime && (
          <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
            <div>
              <p className="font-display text-base font-semibold">Add a person</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add more people to your lifetime plan for $10 each — no limit. Each adds a shareable lifetime pass.
              </p>
            </div>
            <Button
              onClick={() => subscribe('keepsake-extra-person', true)}
              disabled={loadingTier !== null}
              variant="outline"
              className="w-full h-11 rounded-xl"
            >
              {loadingTier !== null ? 'Starting checkout…' : 'Add a person — $10'}
            </Button>
          </div>
        )}

        <FamilyPassManager user={{ passCreditsAnnual: passCredits.annual, passCreditsMonthly: passCredits.monthly }} onPlanChanged={fetchStatus} />
      </div>
    );
  }

  // ---- Already Basic subscriber ----
  if (isBasicTier) {
    return (
      <div className="space-y-4">
        {trial ? (
          <TrialStatusCard purchase={trial} onChanged={fetchStatus} />
        ) : (
        <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-primary" />
            <div>
              <p className="font-display text-base font-semibold">
                {isLifetime ? lifetimeLabel || 'Lifetime Basic' : t('app.basic')}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isLifetime
                  ? "You're on Basic Lifetime — thank you! No renewals, ever."
                  : "You're on Basic — thank you! Renews automatically."}
              </p>
            </div>
          </div>
          {!isLifetime && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full h-10 rounded-xl" disabled={canceling}>
                  {canceling ? 'Submitting…' : 'Cancel with prorated refund'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel your subscription?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You'll receive a prorated refund for the unused months. Your cancellation takes
                    effect at the end of the current month, processed after admin approval.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Basic</AlertDialogCancel>
                  <AlertDialogAction onClick={cancel} disabled={canceling}>
                    {canceling ? 'Submitting…' : 'Request cancellation'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
        )}

        {/* Upgrade to Premium */}
        <div className="rounded-2xl bg-gradient-to-br from-accent/10 to-primary/5 border border-accent/30 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Crown size={18} className="text-accent" />
            <div>
              <p className="font-display text-base font-semibold">Upgrade to Premium</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Unlock AI-powered features — gift finder, message writer, chat assistant, and more.
              </p>
            </div>
          </div>
          <div className="flex gap-1.5">
            {TIER_PLANS.premium.map((p) => (
              <button
                key={p.id}
                onClick={() => setPremiumCycle(p.label)}
                className={`flex-1 rounded-lg border px-2 py-2 text-center transition-colors ${
                  premiumCycle === p.label
                    ? 'border-accent bg-accent/10 ring-1 ring-accent'
                    : 'border-border hover:bg-secondary/50'
                }`}
              >
                <p className="text-[11px] font-medium leading-none">{p.label}</p>
                <p className="font-display text-sm font-semibold mt-1 leading-none">{p.price}</p>
                {p.save && <p className="text-[9px] font-semibold mt-1 text-accent">{p.save}</p>}
              </button>
            ))}
          </div>
          <ul className="space-y-1.5">
            {PREMIUM_FEATURES.map((rawF, i) => {
              const f = rawF === '__AI_CHAT__' ? t('app.askChat') : rawF;
              return (
              <li key={i} className="flex items-start gap-1.5">
                <Check size={13} className="mt-0.5 shrink-0 text-accent" />
                <span className="text-[11px] text-muted-foreground leading-snug">{f}</span>
              </li>
              );
            })}
          </ul>
          <Button
            onClick={() => {
              const p = TIER_PLANS.premium.find((x) => x.label === premiumCycle) || TIER_PLANS.premium[1];
              subscribe(p.id, p.isLifetime);
            }}
            disabled={loadingTier !== null}
            className="w-full h-11 rounded-xl"
          >
            {loadingTier !== null ? 'Starting checkout…' : 'Upgrade to Premium'}
          </Button>
        </div>

        <FamilyPassManager user={{ passCreditsAnnual: passCredits.annual, passCreditsMonthly: passCredits.monthly }} onPlanChanged={fetchStatus} />
      </div>
    );
  }

  // ---- Free user: show tier selection ----
  const selectedFamilyDef = FAMILY_PLANS.find((p) => p.id === selectedFamilyPlan);
  const isFamily = selectedFamilyDef?.group === 'family';
  const selectedIsLifetimeFamily = LIFETIME_FAMILY_PLANS.some((p) => p.id === selectedLifetimeFamily);

  return (
    <div className="space-y-4">
      <div>
        <p className="font-display text-base font-semibold mb-1">Choose your plan</p>
        <p className="text-xs text-muted-foreground">
          7-day free trial on annual plans. A card is required to start — you are not charged until day 8, and canceling before then is free.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <TierCard
          tier="basic"
          features={BASIC_FEATURES}
          isPremium={false}
          selectedCycle={basicCycle}
          onSelectCycle={setBasicCycle}
          onSubscribe={subscribe}
          loading={loadingTier !== null}
        />
        <TierCard
          tier="premium"
          features={PREMIUM_FEATURES}
          isPremium={true}
          selectedCycle={premiumCycle}
          onSelectCycle={setPremiumCycle}
          onSubscribe={subscribe}
          loading={loadingTier !== null}
        />
      </div>

      {/* Family Packages */}
      <div className="rounded-2xl bg-card border border-border p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Gift size={18} />
          <div>
            <p className="font-display text-base font-semibold">Family Packages</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Premium for you plus shareable passes for friends and family — no trial, billed annually. Renews at 15% off.
            </p>
          </div>
        </div>
        <div className="space-y-2">
          {FAMILY_PLANS.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedFamilyPlan(p.id)}
              className={`w-full flex items-start justify-between rounded-xl border p-3 text-left transition-colors ${
                selectedFamilyPlan === p.id
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border hover:bg-secondary/50'
              }`}
            >
              <div className="flex items-start gap-2">
                <div className={`w-4 h-4 mt-0.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  selectedFamilyPlan === p.id ? 'border-primary' : 'border-muted-foreground/40'
                }`}>
                  {selectedFamilyPlan === p.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{p.label}</span>
                    <span className="text-[10px] font-semibold text-accent-foreground bg-accent/20 px-1.5 py-0.5 rounded-full">
                      {p.save}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{p.blurb}</p>
                </div>
              </div>
              <span className="font-display font-semibold text-sm shrink-0">
                {p.price}
                <span className="text-muted-foreground font-body font-normal text-xs">{p.period}</span>
              </span>
            </button>
          ))}
        </div>
        <NoAdsNote className="mb-3" />

        <Button
          onClick={() => selectedFamilyPlan && subscribe(selectedFamilyPlan, false)}
          disabled={loadingTier !== null || !selectedFamilyPlan}
          className="w-full h-11 rounded-xl"
        >
          {loadingTier !== null ? 'Starting checkout…' : selectedFamilyDef ? `Get ${selectedFamilyDef.label}` : 'Select a package'}
        </Button>
      </div>

      {/* Lifetime Family Passes */}
      <div className="rounded-2xl bg-gradient-to-br from-accent/10 to-primary/5 border border-accent/30 p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Crown size={18} className="text-accent" />
          <div>
            <p className="font-display text-base font-semibold">Lifetime Family Passes</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pay once, keep Premium forever — no renewals, no trial. Includes shareable passes for your whole family.
            </p>
          </div>
        </div>
        <div className="space-y-2">
          {LIFETIME_FAMILY_PLANS.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedLifetimeFamily(p.id)}
              className={`w-full flex items-start justify-between rounded-xl border p-3 text-left transition-colors ${
                selectedLifetimeFamily === p.id
                  ? 'border-accent bg-accent/5 ring-1 ring-accent'
                  : 'border-border hover:bg-secondary/50'
              }`}
            >
              <div className="flex items-start gap-2">
                <div className={`w-4 h-4 mt-0.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  selectedLifetimeFamily === p.id ? 'border-accent' : 'border-muted-foreground/40'
                }`}>
                  {selectedLifetimeFamily === p.id && <div className="w-2 h-2 rounded-full bg-accent" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{p.label}</span>
                    {p.passes && (
                      <span className="text-[10px] font-semibold text-accent-foreground bg-accent/20 px-1.5 py-0.5 rounded-full">
                        {p.passes}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{p.blurb}</p>
                </div>
              </div>
              <span className="font-display font-semibold text-sm shrink-0">
                {p.price}
                <span className="text-muted-foreground font-body font-normal text-xs block">one-time</span>
              </span>
            </button>
          ))}
        </div>
        <Button
          onClick={() => selectedLifetimeFamily && subscribe(selectedLifetimeFamily, true)}
          disabled={loadingTier !== null || !selectedLifetimeFamily}
          className="w-full h-11 rounded-xl"
        >
          {loadingTier !== null ? 'Starting checkout…' : selectedIsLifetimeFamily ? 'Get lifetime pass' : 'Select a lifetime pass'}
        </Button>
      </div>

      <FamilyPassManager user={{ passCreditsAnnual: passCredits.annual, passCreditsMonthly: passCredits.monthly }} onPlanChanged={fetchStatus} />
    </div>
  );
}