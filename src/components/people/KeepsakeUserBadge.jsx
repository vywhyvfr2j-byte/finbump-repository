import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';

// "App user" indicator shown on contacts whose email matches an app account.
// variant="dot"  — compact checkmark for list bubbles (recolors when selected).
// variant="pill" — labeled badge for profile panels.
export default function KeepsakeUserBadge({ variant = 'pill', selected = false }) {
  const { t } = useI18n();
  const stroke = selected ? 'hsl(var(--primary-foreground))' : 'hsl(var(--primary))';
  if (variant === 'dot') {
    return (
      <CheckCircle2
        size={13}
        className="shrink-0"
        style={{ stroke }}
        aria-label={t('app.user')}
      />
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-medium rounded-full px-2 py-0.5"
      style={{ color: 'hsl(var(--primary))', background: 'hsl(var(--primary) / 0.12)' }}
    >
      <CheckCircle2 size={11} style={{ stroke }} />
      {t('app.user')}
    </span>
  );
}