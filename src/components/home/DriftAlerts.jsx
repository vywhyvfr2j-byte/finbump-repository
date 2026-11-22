import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radar } from 'lucide-react';
import { daysSince } from '@/lib/keepsakeUtils';
import { useI18n } from '@/lib/i18n/I18nContext';

// Drift = an act that's gone noticeably longer than its usual rhythm without
// being flagged as freshly "overdue" yet — a pattern shift, not a due date.
export default function DriftAlerts({ acts }) {
  const navigate = useNavigate();
  const { t } = useI18n();

  const drifting = useMemo(
    () =>
      acts.filter((a) => {
        const d = daysSince(a.lastCompleted);
        return d !== null && d - a.intervalDays >= 7;
      }),
    [acts]
  );

  if (drifting.length === 0) return null;

  return (
    <div className="px-5 mt-3">
      <button
        onClick={() => navigate('/acts')}
        className="w-full text-left rounded-2xl px-4 py-3.5 border ks-card-tint"
      >
        <div className="flex items-center gap-1.5 mb-1.5">
          <Radar size={15} className="text-accent" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('home.noticed')}</span>
        </div>
        <p className="text-sm leading-snug">
          {drifting.length === 1
            ? t('home.driftSingle', { name: drifting[0].name })
            : drifting.length === 2
              ? t('home.driftPluralOne', { name: drifting[0].name })
              : t('home.driftPlural', { name: drifting[0].name, count: drifting.length - 1 })}
        </p>
      </button>
    </div>
  );
}