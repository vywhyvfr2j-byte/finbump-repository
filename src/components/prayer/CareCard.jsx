import React from 'react';
import { useNavigate } from 'react-router-dom';
import { daysSince } from '@/lib/keepsakeUtils';
import { HandHeart, Heart, Check, Mail, Pencil, Trash2 } from 'lucide-react';
import { cardBuilderLink, CARE_OCCASION } from '@/lib/cardBuilderLink';
import { useI18n } from '@/lib/i18n/I18nContext';

// Unified care card for prayer, health, and other tabs. The tab prop drives
// which fields are read and which icon/labels are shown.
export default function CareCard({ person, tab, onCheckIn, onEdit, onDelete }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const TAB_CONFIG = {
    prayer: {
      title: (p) => p.prayerNames || p.name,
      subtitleField: 'prayerReason',
      lastDoneField: 'lastPrayedAt',
      reminderDaysField: 'prayerReminderDays',
      endDateField: 'prayerReminderEndDate',
      Icon: HandHeart,
      buttonText: t('careCard.prayed'),
      neverText: t('careCard.neverPrayed'),
      doneTodayText: t('careCard.prayedToday'),
      donePrefix: t('careCard.prayedPrefix'),
    },
    health: {
      title: (p) => p.name,
      subtitleField: 'healthNotes',
      lastDoneField: 'lastHealthCheckIn',
      reminderDaysField: 'healthReminderDays',
      endDateField: 'healthReminderEndDate',
      Icon: Heart,
      buttonText: t('careCard.checkedIn'),
      neverText: t('careCard.neverCheckedIn'),
      doneTodayText: t('careCard.checkedInToday'),
      donePrefix: t('careCard.checkedInPrefix'),
    },
    other: {
      title: (p) => p.name,
      subtitleField: 'otherNotes',
      lastDoneField: 'lastOtherCheckIn',
      reminderDaysField: 'otherReminderDays',
      endDateField: 'otherReminderEndDate',
      Icon: Check,
      buttonText: t('careCard.checkedIn'),
      neverText: t('careCard.neverCheckedIn'),
      doneTodayText: t('careCard.checkedInToday'),
      donePrefix: t('careCard.checkedInPrefix'),
    },
  };
  const cfg = TAB_CONFIG[tab];
  const days = daysSince(person[cfg.lastDoneField]);
  const endDateStr = person[cfg.endDateField];
  let ended = false;
  if (endDateStr) {
    const end = new Date(endDateStr);
    if (!Number.isNaN(end.getTime())) {
      end.setHours(23, 59, 59, 999);
      ended = Date.now() > end.getTime();
    }
  }
  const reminderDays = person[cfg.reminderDaysField] || 0;
  const overdue = !ended && reminderDays > 0 && (days === null || days >= reminderDays);
  const Icon = cfg.Icon;

  return (
    <div className={`rounded-2xl border p-4 ${ended ? 'border-border bg-muted/40' : overdue ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-semibold">{cfg.title(person)}</p>
          {person[cfg.subtitleField] && <p className="text-sm text-muted-foreground mt-0.5">{person[cfg.subtitleField]}</p>}
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            {reminderDays > 0 && <span>{reminderDays === 1 ? t('careCard.everyDay', { n: reminderDays }) : t('careCard.everyDays', { n: reminderDays })}</span>}
            {ended ? (
              <span className="text-muted-foreground/70">{t('careCard.remindersEnded', { date: endDateStr })}</span>
            ) : (
              <span>{days === null ? cfg.neverText : days === 0 ? cfg.doneTodayText : (days === 1 ? t('careCard.daysAgoSingle', { prefix: cfg.donePrefix, days }) : t('careCard.daysAgoPlural', { prefix: cfg.donePrefix, days }))}</span>
            )}
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(person)}
              title="Edit"
              aria-label="Edit"
              className="flex items-center justify-center w-11 h-11 -m-1 rounded-xl border border-border text-muted-foreground hover:bg-secondary/60 transition-colors"
            >
              <Pencil size={15} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(person)}
              title="Delete"
              aria-label="Delete"
              className="flex items-center justify-center w-11 h-11 -m-1 rounded-xl border border-border text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 size={15} />
            </button>
          )}
          <button
            onClick={() => navigate(cardBuilderLink({
              personId: person.id,
              personName: person.name,
              occasion: CARE_OCCASION[tab],
            }))}
            title={t('careCard.sendCard', { name: person.name })}
            aria-label={t('careCard.sendCard', { name: person.name })}
            className="flex items-center justify-center w-11 h-11 -m-1 rounded-xl border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
          >
            <Mail size={15} />
          </button>
          <button
            onClick={() => onCheckIn(person)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${ended ? 'bg-secondary text-muted-foreground' : overdue ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
          >
            <Icon size={15} />
            {cfg.buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}