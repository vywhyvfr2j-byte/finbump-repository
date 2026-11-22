import React from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n/I18nContext';
import {
  DEFAULT_QUIET_START,
  DEFAULT_QUIET_END,
  formatClock,
  isWithinWindow,
  quietClockMinutes,
  quietWindowLabel,
} from '@/lib/quietHours';

// Quiet hours: the window the user never wants to be nudged in. While it is
// open nothing is delivered — the scheduled push and email jobs check the same
// window server-side, and the in-app reminders hold until it closes. Times are
// US Central, the clock the whole reminder schedule runs on.
export default function QuietHoursSetting() {
  const { t } = useI18n();
  const { myPreferences, updateMyPreferences } = useKeepsake();

  const enabled = myPreferences?.quietHoursEnabled === true;
  const start = myPreferences?.quietHoursStart || DEFAULT_QUIET_START;
  const end = myPreferences?.quietHoursEnd || DEFAULT_QUIET_END;
  const quietNow = enabled && isWithinWindow(start, end, quietClockMinutes());

  return (
    <div className="rounded-2xl bg-card border border-border">
      <div className="flex items-center justify-between p-4">
        <div>
          <p className="text-sm font-medium">{t('settings.quietHours')}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t('settings.quietHoursHint')}</p>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={(v) => updateMyPreferences({ quietHoursEnabled: v })}
          aria-label={t('settings.quietHours')}
        />
      </div>

      {enabled && (
        <div className="px-4 pb-4 space-y-3">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label htmlFor="quiet-hours-start" className="text-xs font-medium text-muted-foreground mb-1.5 block">
                {t('settings.quietHoursFrom')}
              </label>
              <Input
                id="quiet-hours-start"
                type="time"
                value={start}
                onChange={(e) => updateMyPreferences({ quietHoursStart: e.target.value || DEFAULT_QUIET_START })}
                className="h-11"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="quiet-hours-end" className="text-xs font-medium text-muted-foreground mb-1.5 block">
                {t('settings.quietHoursTo')}
              </label>
              <Input
                id="quiet-hours-end"
                type="time"
                value={end}
                onChange={(e) => updateMyPreferences({ quietHoursEnd: e.target.value || DEFAULT_QUIET_END })}
                className="h-11"
              />
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {quietNow
              ? t('settings.quietHoursNow', { time: formatClock(end) })
              : t('settings.quietHoursIdle', { window: quietWindowLabel(start, end) })}
          </p>
        </div>
      )}
    </div>
  );
}