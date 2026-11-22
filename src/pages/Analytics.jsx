import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useFeatureTracking } from "@/hooks/useFeatureTracking";
import TopNav from "@/components/TopNav";
import SubscriptionRenewalCard from "@/components/analytics/SubscriptionRenewalCard";
import { Users, TrendingUp, Activity, BarChart3, Trophy, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n/I18nContext";

export default function Analytics() {
  useFeatureTracking("analytics");
  const { t } = useI18n();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    return base44.functions
      .invoke("get-analytics-summary", {})
      .then((res) => {
        const payload = res.data || res;
        if (payload.error) {
          setError(payload.message || t('analytics.accessDenied'));
        } else {
          setData(payload);
          setError(null);
        }
      })
      .catch(() => setError(t('analytics.couldNotLoad')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const maxDaily = data?.dailyActive?.length
    ? Math.max(...data.dailyActive.map((d) => d.count), 1)
    : 1;
  const maxFeature = data?.topFeatures?.length
    ? Math.max(...data.topFeatures.map((f) => f.count), 1)
    : 1;

  return (
    <div className="min-h-[100dvh] pb-24">
      <TopNav title={t('analytics.title')} subtitle={t('analytics.subtitle')} back />

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-6">
        <Link
          to="/reviews"
          className="flex items-center justify-between rounded-xl border p-4 hover:bg-secondary/40 transition-colors shadow-card ks-card-tint"
        >
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            <div>
              <p className="text-sm font-medium">{t('analytics.manageReviews')}</p>
              <p className="text-xs text-muted-foreground">{t('analytics.manageReviewsDesc')}</p>
            </div>
          </div>
          <span className="text-xs font-medium text-primary">{t('analytics.openArrow')}</span>
        </Link>
        <Link
          to="/growth"
          className="flex items-center justify-between rounded-xl border p-4 hover:bg-secondary/40 transition-colors shadow-card"
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            <div>
              <p className="text-sm font-medium">Growth dashboard</p>
              <p className="text-xs text-muted-foreground">Retention, subscriptions and purchase failures in one view</p>
            </div>
          </div>
          <span className="text-xs font-medium text-primary">{t('analytics.openArrow')}</span>
        </Link>
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
            <p className="text-sm text-destructive font-medium">{error}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('analytics.adminOnly')}
            </p>
          </div>
        )}

        {data && !error && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                icon={<Users className="w-5 h-5" />}
                label={t('analytics.activeToday')}
                value={data.totals.activeUsersToday}
              />
              <StatCard
                icon={<TrendingUp className="w-5 h-5" />}
                label={t('analytics.active7d')}
                value={data.totals.activeUsers7d}
              />
              <StatCard
                icon={<Activity className="w-5 h-5" />}
                label={t('analytics.active30d')}
                value={data.totals.activeUsers30d}
              />
              <StatCard
                icon={<BarChart3 className="w-5 h-5" />}
                label={t('analytics.totalEventsLabel')}
                value={data.totals.totalEvents}
              />
            </div>

            {data.subscriptions && (
              <SubscriptionRenewalCard subscriptions={data.subscriptions} onSynced={load} />
            )}

            {/* Daily active users trend */}
            <section className="rounded-xl border p-4 shadow-card ks-card-tint">
              <h2 className="font-heading text-sm font-semibold mb-3">
                {t('analytics.dailyActive14')}
              </h2>
              <div className="flex items-end gap-1 h-32">
                {data.dailyActive.map((d) => (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t bg-primary/70 min-h-[2px] transition-all"
                      style={{ height: `${(d.count / maxDaily) * 100}%` }}
                      title={`${d.date}: ${d.count} ${t('analytics.users')}`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
                <span>{data.dailyActive[0]?.date?.slice(5)}</span>
                <span>{data.dailyActive[data.dailyActive.length - 1]?.date?.slice(5)}</span>
              </div>
            </section>

            {/* Top features */}
            <section className="rounded-xl border p-4 shadow-card ks-card-tint">
              <h2 className="font-heading text-sm font-semibold mb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4" /> {t('analytics.topFeatures')}
              </h2>
              {data.topFeatures.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('analytics.noUsage')}</p>
              ) : (
                <div className="space-y-2">
                  {data.topFeatures.map((f, i) => (
                    <div key={f.feature} className="flex items-center gap-3">
                      <span className="text-xs font-mono text-muted-foreground w-5">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium capitalize">{f.feature.replace(/_/g, " ")}</span>
                          <span className="text-muted-foreground">{f.count}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-accent"
                            style={{ width: `${(f.count / maxFeature) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Top events */}
            <section className="rounded-xl border p-4 shadow-card ks-card-tint">
              <h2 className="font-heading text-sm font-semibold mb-3">
                {t('analytics.topActions')}
              </h2>
              {data.topEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('analytics.noEventData')}</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {data.topEvents.slice(0, 12).map((e) => (
                    <span
                      key={e.eventName}
                      className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs"
                    >
                      <span className="font-medium">{e.eventName.replace(/_/g, " ")}</span>
                      <span className="text-muted-foreground">{e.count}</span>
                    </span>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="rounded-xl border p-4 shadow-card ks-card-tint">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-2xl font-heading font-bold">{value}</p>
    </div>
  );
}