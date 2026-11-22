import React, { useEffect, useState } from 'react';
import { Lightbulb } from 'lucide-react';
import TopNav from '@/components/TopNav';
import { useKeepsake } from '@/lib/keepsakeStore';
import { useAuth } from '@/lib/AuthContext';
import { useI18n } from '@/lib/i18n/I18nContext';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import EmptyState from '@/components/EmptyState';

const PRIORITY_KEYS = {
  high: 'adminInsights.priorityHigh',
  medium: 'adminInsights.priorityMedium',
  low: 'adminInsights.priorityLow',
};
const PRIORITY_CLASS = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-sky-100 text-sky-700',
};

// Admin-only page showing the bi-weekly AI improvement prompts. Each on-week
// Monday's run creates an AdminInsight record; the most recent unread one is
// marked read on open so its in-app notification stops re-nagging the admin.
export default function AdminInsights() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { adminInsights } = useKeepsake();
  const [markingRead, setMarkingRead] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    const unread = (adminInsights || []).find((i) => !i.readAt);
    if (!unread) return;
    setMarkingRead(true);
    base44.entities.AdminInsight.update(unread.id, { readAt: new Date().toISOString() })
      .catch(() => {})
      .finally(() => setMarkingRead(false));
  }, [user, adminInsights]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="px-4 pt-10 pb-20 max-w-2xl mx-auto">
        <EmptyState
          icon={Lightbulb}
          title={t('adminInsights.adminsOnly')}
          subtitle={t('adminInsights.adminsOnlyDesc')}
        />
      </div>
    );
  }

  const insights = [...(adminInsights || [])].sort(
    (a, b) => new Date(b.created_date || b.weekOf) - new Date(a.created_date || a.weekOf)
  );

  return (
    <div className="pb-20 max-w-2xl mx-auto">
      <TopNav title={t('adminInsights.title')} subtitle={t('adminInsights.adminLabel')} back />

      <div className="px-4 mt-4 space-y-4">
        {insights.length === 0 ? (
          <EmptyState
            icon={Lightbulb}
            title={t('adminInsights.empty')}
            subtitle={t('adminInsights.emptyDesc')}
          />
        ) : (
          insights.map((insight) => (
            <Card key={insight.id} className="p-5 rounded-2xl border-border shadow-card">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  {insight.weekOf ? t('adminInsights.cycleOf', { weekOf: insight.weekOf }) : t('adminInsights.thisCycle')}
                </span>
                {!insight.readAt && <span className="w-2 h-2 rounded-full bg-primary" />}
              </div>
              <h2 className="font-display text-lg font-semibold leading-snug">{insight.title}</h2>
              {insight.summary && (
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{insight.summary}</p>
              )}
              <div className="mt-4 space-y-3">
                {(insight.suggestions || []).map((s, i) => {
                  const key = PRIORITY_KEYS[s.priority] || PRIORITY_KEYS.medium;
                  const cls = PRIORITY_CLASS[s.priority] || PRIORITY_CLASS.medium;
                  return (
                    <div key={i} className="rounded-xl bg-muted/50 p-3.5 border border-border">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-[15px] leading-snug pr-2">{s.title}</p>
                        <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${cls}`}>
                          {t(key)}
                        </span>
                      </div>
                      {s.details && (
                        <p className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed whitespace-pre-line">
                          {s.details}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          ))
        )}
        {markingRead && <p className="text-center text-xs text-muted-foreground">{t('adminInsights.markingRead')}</p>}
      </div>
    </div>
  );
}