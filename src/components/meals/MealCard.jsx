import React from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/lib/i18n/I18nContext';
import { formatMealWhen } from '@/lib/mealConstants';
import { CalendarDays, MapPin, Users } from 'lucide-react';

const STATUS_STYLES = {
  proposed: 'bg-accent/20 text-foreground',
  confirmed: 'bg-primary/15 text-foreground',
  done: 'bg-muted text-muted-foreground',
  cancelled: 'bg-destructive/10 text-destructive',
};

const STATUS_KEYS = {
  proposed: 'meal.statusProposed',
  confirmed: 'meal.statusConfirmed',
  done: 'meal.statusDone',
  cancelled: 'meal.statusCancelled',
};

export default function MealCard({ meal }) {
  const { t } = useI18n();
  const participants = meal.participants || [];
  const responded = participants.filter((p) => p.respondedAt).length;
  const when = formatMealWhen(meal.confirmedDate || meal.proposedDate);
  const place = meal.venueName || meal.area;
  const status = meal.status || 'proposed';

  return (
    <Link
      to={`/meals/${meal.id}`}
      className="block rounded-2xl border border-border bg-card p-4 shadow-card"
    >
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <h3 className="font-display font-semibold leading-tight">{meal.title}</h3>
        <span className={`text-[10px] uppercase tracking-wide rounded-full px-2.5 py-1 shrink-0 ${STATUS_STYLES[status] || STATUS_STYLES.proposed}`}>
          {t(STATUS_KEYS[status] || STATUS_KEYS.proposed)}
        </span>
      </div>
      <div className="space-y-1 text-sm text-muted-foreground">
        {when && (
          <p className="flex items-center gap-2">
            <CalendarDays size={14} /> {when}
          </p>
        )}
        {place && (
          <p className="flex items-center gap-2">
            <MapPin size={14} /> {place}
          </p>
        )}
        <p className="flex items-center gap-2">
          <Users size={14} /> {t('meal.respondedCount', { done: responded, total: participants.length })}
        </p>
      </div>
    </Link>
  );
}