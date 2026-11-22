import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ChevronRight } from 'lucide-react';
import { formatDate } from '@/lib/keepsakeUtils';
import { cardBuilderLink } from '@/lib/cardBuilderLink';
import { useI18n } from '@/lib/i18n/I18nContext';

function whenLabel(days, t) {
  if (days === 0) return t('time.today');
  if (days === 1) return t('time.tomorrow');
  return t('time.inDays', { days });
}

// "Send a card" reminder list shown on the Home acts-of-support page.
// Each entry reads, e.g., "Send Birthday Card to Alex - birthday (09/13)".
// Tapping a row opens the Card Builder pre-filled with the person + occasion.
export default function SendCardReminders({ reminders }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  if (!reminders || reminders.length === 0) return null;
  return (
    <div className="px-5 mt-4">
      <div className="rounded-2xl border px-4 py-4 shadow-card space-y-2 ks-card-tint">
        <h2 className="font-display text-lg font-semibold mb-1">{t('home.sendACard')}</h2>
        {reminders.map((r) => {
          const cardType = r.kind === 'birthday' ? t('occasion.birthdayCap') : t('occasion.anniversaryCap');
          return (
            <button
              key={r.key}
              onClick={() => navigate(cardBuilderLink({
                personId: r.personId,
                personName: r.name,
                occasion: r.kind === 'birthday' ? 'birthday' : 'anniversary',
              }))}
              className="w-full flex items-center gap-3 rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-left hover:bg-accent/20 transition-colors"
            >
              <div className="shrink-0 w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center">
                <Mail size={18} className="text-accent-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight">{t('home.sendCardToNameType', { type: cardType, name: r.name })}</p>
                <p className="text-xs text-muted-foreground leading-tight mt-0.5">{r.occasion}, {formatDate(r.date)}, {whenLabel(r.days, t)}</p>
              </div>
              <ChevronRight size={16} className="shrink-0 text-muted-foreground" />
            </button>
          );
        })}
      </div>
    </div>
  );
}