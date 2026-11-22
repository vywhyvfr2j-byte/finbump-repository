import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cake, Heart, ChevronRight, Mail, Gift } from 'lucide-react';
import { formatDate } from '@/lib/keepsakeUtils';
import { PERSON_DATE_REMINDER_DAYS } from '@/hooks/usePersonDateReminders';
import OccasionCardPicker from '@/components/occasions/OccasionCardPicker';
import OccasionGiftSheet from '@/components/occasions/OccasionGiftSheet';
import { cardBuilderLink } from '@/lib/cardBuilderLink';
import { useI18n } from '@/lib/i18n/I18nContext';

function whenLabel(days, t) {
  if (days === 0) return t('time.today');
  if (days === 1) return t('time.tomorrow');
  return t('time.inDays', { days });
}

// In-app reminder banner for upcoming birthdays & anniversaries stored on
// Person profiles. Shown on Home for any occasion within the reminder window;
// entries landing exactly on a 18/7/3-day milestone are highlighted as the
// active reminder. Tapping a row opens the occasion-card picker, which
// generates tailored greeting-card messages for that person and occasion.
export default function PersonDateReminders({ reminders }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [cardReminder, setCardReminder] = useState(null);
  const [giftReminder, setGiftReminder] = useState(null);
  if (!reminders || reminders.length === 0) return null;
  return (
    <div className="px-5 mt-4">
      <div className="rounded-2xl border px-4 py-4 shadow-card space-y-2 ks-card-tint">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display text-lg font-semibold">{t('home.comingUp')}</h2>
          <button
            type="button"
            onClick={() => navigate('/occasions')}
            className="flex items-center gap-0.5 min-h-[44px] -my-2.5 text-xs font-medium text-primary hover:underline"
          >
            {t('occasions.viewAll')} <ChevronRight size={14} />
          </button>
        </div>
        {reminders.map((r) => {
          const Icon = r.kind === 'birthday' ? Cake : Heart;
          const isMilestone = PERSON_DATE_REMINDER_DAYS.includes(r.days);
          const occasionLabel = r.occasion || (r.kind === 'birthday' ? t('occasion.birthday') : t('occasion.anniversary'));
          return (
            <div
              key={r.key}
              className={`w-full flex items-center gap-2 rounded-2xl border px-4 py-3 transition-colors ${
                isMilestone ? 'bg-accent/15 border-accent/40' : 'bg-card border-border'
              }`}
            >
              <button
                onClick={() => setCardReminder(r)}
                className="flex items-center gap-3 flex-1 min-w-0 text-left rounded-xl hover:bg-secondary/50 -mx-1 px-1 py-1"
              >
                <div className="shrink-0 w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center">
                  <Icon size={18} className="text-accent-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight">{r.name}&rsquo;s {occasionLabel}</p>
                  <p className="text-xs text-muted-foreground leading-tight mt-0.5">{formatDate(r.date)}, {whenLabel(r.days, t)}</p>
                </div>
                {isMilestone && (
                  <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                    {t('home.reminder')}
                  </span>
                )}
              </button>
              <div className="shrink-0 flex items-center gap-1">
                <button
                  onClick={() => navigate(cardBuilderLink({
                    personId: r.personId,
                    personName: r.name,
                    occasion: r.kind === 'birthday' ? 'birthday' : 'anniversary',
                  }))}
                  title={t('home.sendCardToName', { name: r.name })}
                  aria-label={t('home.sendCardToName', { name: r.name })}
                  className="flex items-center justify-center w-11 h-11 -m-1.5 rounded-xl border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
                >
                  <Mail size={15} />
                </button>
                <button
                  onClick={() => setGiftReminder(r)}
                  title={t('occasions.sendGiftTo', { name: r.name })}
                  aria-label={t('occasions.sendGiftTo', { name: r.name })}
                  className="flex items-center justify-center w-11 h-11 -m-1.5 rounded-xl border border-accent/50 text-accent-foreground hover:bg-accent/20 transition-colors"
                >
                  <Gift size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <OccasionCardPicker
        reminder={cardReminder}
        open={!!cardReminder}
        onOpenChange={(o) => !o && setCardReminder(null)}
      />
      <OccasionGiftSheet
        occasion={giftReminder}
        open={!!giftReminder}
        onOpenChange={(o) => !o && setGiftReminder(null)}
      />
    </div>
  );
}