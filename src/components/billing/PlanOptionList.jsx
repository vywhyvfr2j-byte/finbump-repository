import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

// The four ways in, in one compact list: every plan shows its price and only the
// actions that apply to this member — "Free 7 days" disappears once they are on a
// trial (or have already used one) and "Pay now" is always there.
const PLANS = [
  {
    id: 'keepsake-basic-yearly',
    tier: 'Basic',
    cycle: 'Annual',
    price: '$9.49',
    note: 'per year, renews',
    trial: true,
  },
  {
    id: 'keepsake-basic-lifetime',
    tier: 'Basic',
    cycle: 'Lifetime',
    price: '$29.99',
    note: 'one time, never renews',
    trial: false,
  },
  {
    id: 'keepsake-premium-yearly',
    tier: 'Premium',
    cycle: 'Annual',
    price: '$18.99',
    note: 'per year, renews',
    trial: true,
  },
  {
    id: 'keepsake-premium-lifetime',
    tier: 'Premium',
    cycle: 'Lifetime',
    price: '$59.99',
    note: 'one time, never renews',
    trial: false,
  },
];

export default function PlanOptionList({ payOnly = false, loading = null, onStart }) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {['Basic', 'Premium'].map((tier) => (
        <div key={tier}>
          <p className="px-3 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {tier}
          </p>
          {PLANS.filter((p) => p.tier === tier).map((plan) => {
            const busyPay = loading === `${plan.id}:pay`;
            const busyTrial = loading === `${plan.id}:trial`;
            const busy = loading !== null;
            return (
              <div
                key={plan.id}
                className="flex flex-wrap items-center gap-x-2 gap-y-1.5 border-t border-border/60 px-3 py-2.5"
              >
                <div className="min-w-[92px] flex-1">
                  <p className="text-sm font-medium leading-tight">{plan.cycle}</p>
                  <p className="text-[11px] text-muted-foreground leading-snug">{plan.note}</p>
                </div>
                <span className="text-sm font-semibold tabular-nums">{plan.price}</span>
                <div className="ml-auto flex items-center gap-1.5">
                  {plan.trial && !payOnly && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-lg px-2.5"
                      disabled={busy}
                      onClick={() => onStart(plan.id, false)}
                    >
                      {busyTrial ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Free 7 days'}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    className="h-8 rounded-lg px-2.5"
                    disabled={busy}
                    onClick={() => onStart(plan.id, true)}
                  >
                    {busyPay ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Pay now'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}