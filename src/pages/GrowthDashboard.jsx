import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import TopNav from '@/components/TopNav';
import PageSkeleton from '@/components/PageSkeleton';
import GrowthStats from '@/components/growth/GrowthStats';
import RetentionPanel from '@/components/growth/RetentionPanel';
import SubscriptionsPanel from '@/components/growth/SubscriptionsPanel';
import PurchaseFailuresPanel from '@/components/growth/PurchaseFailuresPanel';
import UnavailableSourcesPanel from '@/components/growth/UnavailableSourcesPanel';

export default function GrowthDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    base44.functions
      .invoke('get-growth-summary', {})
      .then((res) => {
        const payload = res?.data || res;
        if (cancelled) return;
        if (payload?.error) setError(payload.message || 'Admins only.');
        else setData(payload);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load the growth summary.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-[100dvh] pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      <TopNav title="Growth" subtitle="Last 30 days" back />

      <div className="mx-auto max-w-2xl space-y-4 px-4 pt-4">
        {loading && <PageSkeleton />}

        {!loading && error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
            <p className="text-sm font-medium text-destructive">{error}</p>
            <p className="mt-1 text-xs text-muted-foreground">This dashboard is for admins.</p>
          </div>
        )}

        {!loading && data && (
          <>
            <GrowthStats
              stats={{
                signups30: data.signups?.signups30 || 0,
                activeToday: data.activity?.activeToday || 0,
                retention14: data.activity?.retention14 || 0,
                pendingCount: data.failures?.pendingCount || 0,
              }}
            />
            <RetentionPanel daily={data.activity?.daily || []} />
            <PurchaseFailuresPanel failures={data.failures} />
            <SubscriptionsPanel subscriptions={data.subscriptions} />
            <UnavailableSourcesPanel />
          </>
        )}
      </div>
    </div>
  );
}