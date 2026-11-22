import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
import { startCheckout } from '@/lib/checkout';
import { trialProgress, planLabel, planPrice, TRIAL_DAYS } from '@/lib/trialPlans';
import { Crown, CalendarClock, CreditCard, ShieldCheck, Loader2, ChevronRight } from 'lucide-react';

const fmtDate = (d) =>
  d ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';

// The 7-day trial, as the member sees it: which day they're on, the day the card
// is first charged, how to pay early, and how to cancel before any charge.
export default function TrialStatusCard({ purchase, onChanged }) {
  const { toast } = useToast();
  const [paying, setPaying] = useState(false);
  const [canceling, setCanceling] = useState(false);

  const progress = trialProgress(purchase);
  const price = planPrice(purchase?.productId);
  const label = planLabel(purchase?.productId);
  const canceled = purchase?.autoRenew === false;

  const payNow = async () => {
    setPaying(true);
    try {
      await startCheckout(purchase.productId, { payNow: true });
    } catch (e) {
      toast({
        title: 'Could not start checkout',
        description: e?.response?.data?.error || e?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setPaying(false);
    }
  };

  const cancelTrial = async () => {
    setCanceling(true);
    try {
      const res = await base44.functions.invoke('cancel-trial', {});
      const data = res?.data || res;
      if (data?.error) {
        toast({ title: 'Could not cancel the trial', description: data.error, variant: 'destructive' });
        return;
      }
      toast({
        title: 'Trial canceled — no charge',
        description: data?.immediate
          ? 'Your trial has ended and your card will not be charged.'
          : `You keep your trial until ${fmtDate(progress?.endDate)}, and your card will not be charged.`,
      });
      onChanged?.();
    } catch (e) {
      toast({
        title: 'Could not cancel the trial',
        description: e?.response?.data?.error || e?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCanceling(false);
    }
  };

  if (!progress) return null;

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-gradient-to-br from-accent/10 to-primary/5 border border-accent/30 p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-accent/15 text-accent">
              <Crown size={18} />
            </div>
            <div>
              <p className="font-display text-base font-semibold leading-none">
                Free trial — {label}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {canceled ? 'Canceled — no charge' : 'All Premium features unlocked'}
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-card border border-border px-2 py-1 text-[11px] font-semibold">
            Day {progress.day} of {TRIAL_DAYS}
          </span>
        </div>

        <div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">
            {progress.daysLeft === 1
              ? 'Last day of your trial'
              : `${progress.daysLeft} days left in your trial`}
          </p>
        </div>

        <div className="rounded-xl bg-card border border-border p-3 space-y-2">
          <div className="flex items-start gap-2">
            <CreditCard size={14} className="mt-0.5 shrink-0 text-muted-foreground" />
            <p className="text-[11px] text-muted-foreground leading-snug">
              {canceled
                ? 'Your card will not be charged. Access ends when the trial does.'
                : `Your card is on file and will be charged ${price ? `${price} ` : ''}on ${fmtDate(progress.endDate)} unless you cancel before then.`}
            </p>
          </div>
          <div className="flex items-start gap-2">
            <CalendarClock size={14} className="mt-0.5 shrink-0 text-muted-foreground" />
            <p className="text-[11px] text-muted-foreground leading-snug">
              Cancel any time before {fmtDate(progress.endDate)} and you won't be charged.
            </p>
          </div>
        </div>

        {!canceled && (
          <div className="space-y-2">
            <Button onClick={payNow} disabled={paying || canceling} className="w-full h-11 rounded-xl">
              {paying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Opening checkout…
                </>
              ) : (
                <>Pay now{price ? ` — ${price}` : ''} and keep {label}</>
              )}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full h-10 rounded-xl" disabled={canceling || paying}>
                  {canceling ? 'Canceling…' : 'Cancel trial — no charge'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel your free trial?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Your card will not be charged. You keep the rest of your trial until{' '}
                    {fmtDate(progress.endDate)}, and Premium features stop after that.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep my trial</AlertDialogCancel>
                  <AlertDialogAction onClick={cancelTrial} disabled={canceling}>
                    {canceling ? 'Canceling…' : 'Cancel trial'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {canceled && (
          <div className="flex items-start gap-2 rounded-xl bg-card border border-border p-3">
            <ShieldCheck size={14} className="mt-0.5 shrink-0 text-primary" />
            <p className="text-[11px] text-muted-foreground leading-snug">
              Trial canceled. You won't be charged, and you can subscribe any time to keep your
              features.
            </p>
          </div>
        )}

        <div className="flex items-center justify-center gap-3">
          <Link
            to="/trial"
            className="flex items-center gap-1 text-[11px] font-medium text-primary py-1"
          >
            See your trial dashboard
            <ChevronRight size={12} />
          </Link>
          <Link
            to="/paywall"
            className="flex items-center gap-1 text-[11px] font-medium text-primary py-1"
          >
            Pay now / other plans
            <ChevronRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}