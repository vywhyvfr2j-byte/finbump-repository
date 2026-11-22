import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';
import { cn } from '@/lib/utils';

// The "no ads" promise, shown wherever the app introduces itself or asks for
// money: the onboarding welcome page and every priced plan card.
export default function NoAdsNote({ className }) {
  const { t } = useI18n();
  return (
    <p
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary',
        className
      )}
    >
      <ShieldCheck size={13} className="shrink-0" />
      {t('common.noAds')}
    </p>
  );
}