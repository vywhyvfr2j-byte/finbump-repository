import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import TrialStatusCard from '@/components/billing/TrialStatusCard';
import { activeTrialPurchase } from '@/lib/trialPlans';
import { Crown, ChevronRight } from 'lucide-react';

// The plan block on the profile: a running trial shows its days left, the charge
// date, and the two things a member needs — pay early, or cancel before the card
// is charged. An account with no trial and no paid purchase gets a plain way in.
export default function TrialSection({ showUpsell = true }) {
  const [trial, setTrial] = useState(null);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const me = await base44.auth.me();
    const purchases = await base44.entities.Base44Purchase.filter({ appUserId: me.id });
    setTrial(activeTrialPurchase(purchases));
    setIsSubscriber(purchases.some((p) => p.status === 'paid'));
    setLoading(false);
  };

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, []);

  if (loading) return null;

  if (!trial && (isSubscriber || !showUpsell)) return null;

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground">Your plan</label>
      {trial ? (
        <TrialStatusCard purchase={trial} onChanged={load} />
      ) : (
        <div className="rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/10 to-primary/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-accent/15 text-accent">
              <Crown size={18} />
            </div>
            <div>
              <p className="font-display text-base font-semibold leading-none">No active trial</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Start a 7-day free trial or pay now to unlock Premium.
              </p>
            </div>
          </div>
          <Link
            to="/paywall"
            className="flex items-center justify-center gap-1 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
          >
            See plans and pay now
            <ChevronRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}