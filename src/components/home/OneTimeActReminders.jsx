import React from 'react';
import { Sparkles, ChevronRight } from 'lucide-react';
import { formatDate } from '@/lib/keepsakeUtils';
import { ONE_TIME_ACT_REMINDER_DAYS } from '@/hooks/useOneTimeActReminders';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n/I18nContext';

function whenLabel(days, t) {
  if (days === 0) return t('time.today');
  if (days === 1) return t('time.tomorrow');
  return t('time.inDays', { days });
}

// In-app "Coming up" banner for one-time scheduled acts (repeat === false with
// a nextDue). Shown on Home for any one-time act within the 30-day reminder
// window; entries landing exactly on a 30/10/3/0-day milestone are highlighted
// as the active reminder. Tapping a row navigates to the Acts page.
export default function OneTimeActReminders({ reminders }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  if (!reminders || reminders.length === 0) return null;
  return (
    <div className="px-5 mt-4">
      <div className="rounded-2xl border px-4 py-4 shadow-card space-y-2 ks-card-tint">
        <h2 className="font-display text-lg font-semibold mb-1">{t('home.comingUp')}</h2>
        {reminders.map((r) => {
          const isMilestone = ONE_TIME_ACT_REMINDER_DAYS.includes(r.days);
          return (
            <button
              key={r.key}
              onClick={() => navigate('/acts')}
              className={`w-full flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${
                isMilestone ? 'bg-accent/15 border-accent/40' : 'bg-card border-border'
              } hover:bg-secondary/50`}
            >
              <div className="shrink-0 w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-lg">
                {r.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight">{r.name}</p>
                <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                  {formatDate(r.date)}, {whenLabel(r.days, t)}
                  {r.personName ? ` · ${r.personName}` : ''}
                </p>
              </div>
              {isMilestone && (
                <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                  {t('home.reminder')}
                </span>
              )}
              <span className="shrink-0 flex items-center gap-0.5 text-xs text-muted-foreground">
                <Sparkles size={14} /> <ChevronRight size={14} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}