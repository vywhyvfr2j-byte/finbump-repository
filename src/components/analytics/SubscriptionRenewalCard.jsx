import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { RefreshCw, Repeat } from "lucide-react";

// Yearly subscribers with auto-renew off: the number that says how much of the
// yearly book is already known not to renew. Fed by get-analytics-summary; the
// button reads every subscription back from Base44 Payments and refreshes it.
export default function SubscriptionRenewalCard({ subscriptions, onSynced }) {
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(null);

  const checkNow = async () => {
    setChecking(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("sync-subscription-renewal", {});
      const payload = res?.data || res;
      if (payload?.error) throw new Error(payload.error);
      await onSynced();
    } catch (e) {
      setError(e?.message || "Could not reach Base44 Payments just now.");
    } finally {
      setChecking(false);
    }
  };

  const checkedAt = subscriptions.checkedAt
    ? new Date(subscriptions.checkedAt).toLocaleDateString()
    : null;

  return (
    <section
      className="rounded-xl border p-4 shadow-card ks-card-tint"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h2 className="font-heading text-sm font-semibold flex items-center gap-2">
          <Repeat className="w-4 h-4" /> Yearly subscriptions
        </h2>
        <button
          onClick={checkNow}
          disabled={checking}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${checking ? "animate-spin" : ""}`} />
          {checking ? "Checking" : "Check now"}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-xl font-heading font-bold">{subscriptions.yearlyActive}</p>
          <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">Yearly active</p>
        </div>
        <div>
          <p className="text-xl font-heading font-bold">{subscriptions.yearlyAutoRenewOff}</p>
          <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">Auto-renew off</p>
        </div>
        <div>
          <p className="text-xl font-heading font-bold">{subscriptions.yearlyAutoRenewUnknown}</p>
          <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">Not yet read</p>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground mt-3">
        {subscriptions.tracked === 0
          ? "No subscriptions on record yet."
          : `${subscriptions.tracked} subscription${subscriptions.tracked === 1 ? "" : "s"} read from Base44 Payments${checkedAt ? ` · last checked ${checkedAt}` : ""}.`}
      </p>
      {error && <p className="text-[11px] text-destructive mt-1.5">{error}</p>}
    </section>
  );
}