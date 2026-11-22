import React from 'react';
import { AlertCircle } from 'lucide-react';

const money = (amount, currency) => {
  if (!amount) return '—';
  const cur = String(currency || 'USD').toUpperCase();
  return cur === 'USD' ? `$${amount}` : `${amount} ${cur}`;
};

const when = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export default function PurchaseFailuresPanel({ failures }) {
  const list = failures?.pendingList || [];
  const pending = failures?.pendingCount || 0;

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-display text-base font-semibold">Purchase failures</h2>
        </div>
        {pending > 0 && (
          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive">
            {pending} unfinished
          </span>
        )}
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        Checkouts a person started but never paid. Most are abandoned carts, not card declines.
      </p>

      {list.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">No unfinished checkouts. Everything either paid or was canceled.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {list.map((p) => (
            <li key={p.id} className="rounded-lg border border-border/70 px-3 py-2">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate text-sm font-medium">{p.productName}</p>
                <p className="shrink-0 text-sm font-semibold tabular-nums">{money(p.amount, p.currency)}</p>
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span>{when(p.createdAt)}</span>
                {p.stale && (
                  <span className="rounded-full bg-muted px-1.5 py-0.5 font-medium">over 24h</span>
                )}
                {p.email && <span className="truncate">· {p.email}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}

      {failures?.stalePending > 0 && (
        <p className="mt-3 text-[11px] text-muted-foreground">
          {failures.stalePending} of these have been waiting more than a day — worth a follow-up note.
        </p>
      )}
    </section>
  );
}