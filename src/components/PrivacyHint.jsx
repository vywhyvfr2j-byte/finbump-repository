import React from 'react';
import { Lock } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';

// A one-line reassurance that the field it sits above is private to the user.
// Placed above the most sensitive freeform fields (health notes, prayer
// requests, relationship notes, quick capture) so people don't hesitate
// before typing something real.
export default function PrivacyHint({ className = '' }) {
  const { language } = useI18n();
  const text = language === 'es' ? 'Solo tú puedes ver esto.' : 'Only you can see this.';
  return (
    <p className={`flex items-center gap-1.5 text-[11px] text-muted-foreground ${className}`}>
      <Lock size={11} className="shrink-0" />
      <span>{text}</span>
    </p>
  );
}