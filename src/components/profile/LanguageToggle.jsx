import React from 'react';
import { useI18n } from '@/lib/i18n/I18nContext';
import { Switch } from '@/components/ui/switch';

// Compact English ↔ Español toggle for the top of the profile page.
// Checked = Spanish, unchecked = English.
export default function LanguageToggle() {
  const { language, setLanguage } = useI18n();
  const isSpanish = language === 'es';
  return (
    <div className="flex items-center justify-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <span className={`text-sm font-medium transition-colors ${!isSpanish ? 'text-foreground' : 'text-muted-foreground'}`}>English</span>
      <Switch
        checked={isSpanish}
        onCheckedChange={(v) => setLanguage(v ? 'es' : 'en')}
        aria-label="Toggle language between English and Spanish"
      />
      <span className={`text-sm font-medium transition-colors ${isSpanish ? 'text-foreground' : 'text-muted-foreground'}`}>Español</span>
    </div>
  );
}