import React from 'react';
import { Search, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';

// One query box for the whole Progress & History section. Whatever is typed
// here searches acts, gifts, milestones and notes together, so the user can
// pull up a specific piece of their history without hunting through tabs.
export default function SectionSearch({ value, onChange }) {
  const { t } = useI18n();

  return (
    <div className="relative mb-3">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('section.searchPlaceholder')}
        aria-label={t('section.searchAria')}
        className="w-full h-11 rounded-xl border border-border bg-card pl-9 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label={t('section.clear')}
          className="absolute right-0.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-11 h-11 rounded-full text-muted-foreground hover:bg-secondary/60"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}