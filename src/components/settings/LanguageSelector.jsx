import React from 'react';
import { useI18n } from '@/lib/i18n/I18nContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe } from 'lucide-react';

// Language selector for the Settings → Account tab. Reads and writes the
// active language through the I18nContext provider. The choice persists to
// localStorage (instant) and to the UserPreference entity (cross-device).
export default function LanguageSelector() {
  const { language, setLanguage, t } = useI18n();

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Globe size={16} className="text-muted-foreground shrink-0" />
        <div>
          <p className="text-sm font-medium">{t('settings.language')}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t('settings.languageDescription')}</p>
        </div>
      </div>
      <Select value={language} onValueChange={setLanguage}>
        <SelectTrigger className="h-11" aria-label={t('settings.language')}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">{t('settings.languageEnglish')}</SelectItem>
          <SelectItem value="es">{t('settings.languageSpanish')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}