import React from 'react';
import { CalendarDays, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useI18n } from '@/lib/i18n/I18nContext';

// Month / year jump for the timeline, so any month or year of entries is one
// pick away. Years come from the timeline itself, so nothing empty is offered.
export default function TimelineDateFilter({ year, month, years, onChange }) {
  const { t, language } = useI18n();
  const locale = language === 'es' ? 'es-ES' : 'en-US';
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i),
    label: new Date(2024, i, 1).toLocaleDateString(locale, { month: 'long' }),
  }));
  const active = year !== 'all' || month !== 'all';

  if (!years.length) return null;

  return (
    <div className="flex items-center gap-2 mb-3">
      <CalendarDays size={15} className="shrink-0" />
      <Select value={year} onValueChange={(v) => onChange({ year: v, month })}>
        <SelectTrigger className="h-10 rounded-xl bg-card flex-1" aria-label={t('timeline.filterYearLabel')}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('timeline.yearAll')}</SelectItem>
          {years.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={month} onValueChange={(v) => onChange({ year, month: v })}>
        <SelectTrigger className="h-10 rounded-xl bg-card flex-1" aria-label={t('timeline.filterMonthLabel')}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('timeline.monthAll')}</SelectItem>
          {months.map((m) => (
            <SelectItem key={m.value} value={m.value}>
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {active && (
        <button
          type="button"
          onClick={() => onChange({ year: 'all', month: 'all' })}
          aria-label={t('timeline.clearDateFilter')}
          className="shrink-0 h-10 w-10 flex items-center justify-center rounded-xl text-primary hover:bg-secondary/60 transition-colors"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}