import React from 'react';
import { useI18n } from '@/lib/i18n/I18nContext';

// All / Milestones / Notes switch across the top of the timeline, with counts.
export default function TimelineFilters({ value, onChange, counts }) {
  const { t } = useI18n();
  const options = [
    { key: 'all', label: t('timeline.filterAll'), count: counts.all },
    { key: 'milestone', label: t('timeline.filterMilestones'), count: counts.milestone },
    { key: 'note', label: t('timeline.filterNotes'), count: counts.note },
  ];

  return (
    <div className="flex gap-1.5 mb-4 bg-secondary/60 rounded-2xl p-1">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          className={`flex-1 h-10 rounded-xl text-sm font-medium transition-colors ${
            value === o.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
          }`}
        >
          {o.label} ({o.count})
        </button>
      ))}
    </div>
  );
}