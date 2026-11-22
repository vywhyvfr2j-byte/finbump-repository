import React from 'react';
import { CreditCard } from 'lucide-react';

export default function SubscriptionsPanel({ subscriptions }) {
  const counts = subscriptions?.statusCounts || {};
  const subStatuses = subscriptions?.subscriptionStatuses || {};
  const active = subStatuses.ACTIVE || 0;
  const paused = subStatuses.PAUSED || 0;
  const ended = (subStatuses.CANCELED || 0) + (subStatuses.ENDED || 0);
  const paid = counts.paid || 0;

  const rows = [
    { label: 'Active subscriptions', value: active },
    { label: 'Paused', value: paused },
    { label: 'Canceled or ended', value: ended },
    { label: 'Auto-renew turned off', value: subscriptions?.autoRenewOff || 0 },
    { label: 'Completed payments', value: paid },
  ];

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-center gap-2">
        <CreditCard className="w-4 h-4 text-muted-foreground" />
        <h2 className="font-display text-base font-semibold">Subscription status</h2>
      </div>

      <dl className="mt-3 divide-y divide-border">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-3 py-2">
            <dt className="text-sm text-muted-foreground">{r.label}</dt>
            <dd className="text-sm font-semibold tabular-nums">{r.value}</dd>
          </div>
        ))}
      </dl>

      {paid === 0 && (
        <p className="mt-3 rounded-lg bg-muted/60 p-2.5 text-[11px] leading-relaxed text-muted-foreground">
          No payment has completed yet, so there are no subscriptions to report on. Numbers above fill in as soon as
          the first checkout is paid.
        </p>
      )}
    </section>
  );
}