import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import TimelineEntry from './TimelineEntry';
import { useI18n } from '@/lib/i18n/I18nContext';

const INITIAL_LIMIT = 50;

// Timeline entries newest-first, grouped under month headings.
export default function TimelineFeed({ entries }) {
  const { t, language } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? entries : entries.slice(0, INITIAL_LIMIT);

  const months = [];
  visible.forEach((e) => {
    const d = new Date(e.at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    let group = months.find((g) => g.key === key);
    if (!group) {
      group = {
        key,
        label: d.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { month: 'long', year: 'numeric' }),
        items: [],
      };
      months.push(group);
    }
    group.items.push(e);
  });

  return (
    <div>
      {months.map((m) => (
        <div key={m.key} className="mb-6">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground pb-1.5 mb-3 border-b border-border/60">
            {m.label}
          </p>
          <ul className="relative space-y-5 pl-1">
            <span className="absolute left-[13px] top-2 bottom-2 w-px bg-border" aria-hidden="true" />
            {m.items.map((e) => (
              <TimelineEntry key={e.id} entry={e} />
            ))}
          </ul>
        </div>
      ))}

      {!expanded && entries.length > INITIAL_LIMIT && (
        <button
          onClick={() => setExpanded(true)}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-primary"
        >
          {t('timeline.showAll', { count: entries.length })} <ChevronDown size={16} />
        </button>
      )}
    </div>
  );
}