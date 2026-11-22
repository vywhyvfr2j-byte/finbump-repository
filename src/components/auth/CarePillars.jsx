import React from 'react';
import { useI18n } from '@/lib/i18n/I18nContext';

// The four C.A.R.E. pillars from the brand deck.
// Letter badges reinforce the mnemonic; descriptions anchor each pillar
// to a real app feature (People, Acts, Reminders, Calendar/Events).
const PILLARS = [
  { letter: 'C', key: 'connections' },
  { letter: 'A', key: 'acts' },
  { letter: 'R', key: 'reminders' },
  { letter: 'E', key: 'events' },
];

export default function CarePillars({ className = '' }) {
  const { t } = useI18n();
  return (
    <div className={`space-y-2 ${className}`}>
      {PILLARS.map(({ letter, key }) => (
        <div key={letter} className="flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary font-display font-bold text-base shrink-0">
            {letter}
          </span>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground leading-tight">{t(`care.${key}`)}</p>
            <p className="text-xs text-muted-foreground leading-tight">{t(`care.${key}Desc`)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}