import React from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { Switch } from '@/components/ui/switch';
import { useI18n } from '@/lib/i18n/I18nContext';

// Evening check-in reminder: the daily nudge to capture a memory moment. It
// fires at 6pm, then follows up at 9pm (send-evening-memory-reminder) for anyone
// who still hasn't written theirs — so this is a single on/off choice.
export default function EveningReminderSetting() {
  const { t } = useI18n();
  const { myPreferences, updateMyPreferences } = useKeepsake();
  const enabled = myPreferences?.memoryReminderEnabled !== false;

  return (
    <div className="rounded-2xl bg-card border border-border">
      <div className="flex items-center justify-between p-4">
        <div>
          <p className="text-sm font-medium">{t('settings.memoryReminder')}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t('settings.memoryReminderHint')}</p>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={(v) => updateMyPreferences({ memoryReminderEnabled: v })}
          aria-label={t('settings.memoryReminder')}
        />
      </div>
    </div>
  );
}