import React, { useMemo, useState } from 'react';
import { ArrowDown, BellRing } from 'lucide-react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { actStatus } from '@/lib/keepsakeUtils';
import { isQuietHoursNow } from '@/lib/quietHours';
import { useI18n } from '@/lib/i18n/I18nContext';

// The daily nudge — one short prompt a day on Home, so the appreciation habit
// keeps its rhythm. It counts the acts already waiting on the list below, points
// at them, and can be put away for the rest of the day. Anything left waiting
// comes back tomorrow; the whole thing is switched off in Settings → Alerts.
const NUDGE_KEY = 'keepsake_daily_nudge_v1';

function localDayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dismissedToday() {
  try {
    return localStorage.getItem(NUDGE_KEY) === localDayStr();
  } catch {
    return false;
  }
}

export default function DailyActNudge({ acts = [], onShowActs }) {
  const { settings } = useKeepsake();
  const { t } = useI18n();
  const [hidden, setHidden] = useState(dismissedToday);

  // Acts shown fresh green (just done, or not due yet) are not nudges — only the
  // ones actually waiting count.
  const waiting = useMemo(() => acts.filter((a) => actStatus(a) !== 'fresh'), [acts]);

  // Quiet hours: held exactly like every other reminder, and nothing is marked
  // as put away — so the nudge is there once the window closes.
  if (settings.notifyDailyActNudge === false || hidden || waiting.length === 0 || isQuietHoursNow()) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(NUDGE_KEY, localDayStr());
    } catch {
      /* private mode: the nudge simply returns next render */
    }
    setHidden(true);
  };

  // The list is often filtered to one person, who may have nothing waiting — the
  // nudge is about everything that is due, so showing it clears that filter
  // before taking the user down to the list.
  const showActs = () => {
    onShowActs?.();
    document.getElementById('home-acts')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="px-5 mt-4">
      <div className="rounded-2xl border border-primary/30 shadow-card p-3.5 ks-card-tint">
        <div className="flex items-start gap-2.5">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary shrink-0">
            <BellRing size={16} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t('nudge.title')}</p>
            <p className="text-sm font-medium leading-snug mt-0.5">
              {waiting.length === 1 ? t('nudge.dueOne') : t('nudge.dueMany', { count: waiting.length })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{t('nudge.encouragement')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={showActs}
            className="flex-1 flex items-center justify-center gap-1.5 min-h-10 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-medium"
          >
            {t('nudge.cta')}
            <ArrowDown size={14} />
          </button>
          <button
            onClick={dismiss}
            className="min-h-10 px-3 rounded-xl border border-border bg-card text-xs font-medium text-muted-foreground"
          >
            {t('nudge.dismiss')}
          </button>
        </div>
      </div>
    </div>
  );
}