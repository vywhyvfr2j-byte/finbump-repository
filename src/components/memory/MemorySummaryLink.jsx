import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarRange, ChevronRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';

// Entry point from the memory-moment timeline into the month-by-month view.
export default function MemorySummaryLink() {
  const { t } = useI18n();

  return (
    <Link to="/memory-summary" className="flex items-center gap-3 rounded-xl border border-border p-3.5 mt-4">
      <CalendarRange size={18} className="text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{t('memorySummary.linkTitle')}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{t('memorySummary.linkDesc')}</p>
      </div>
      <ChevronRight size={16} className="text-muted-foreground shrink-0" />
    </Link>
  );
}