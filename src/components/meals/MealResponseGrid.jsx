import React from 'react';
import { useI18n } from '@/lib/i18n/I18nContext';
import { mealResponseSummary } from '@/lib/mealConstants';
import { Check, Clock, Users } from 'lucide-react';

// Shows what the group has actually said: the places where they already agree,
// then each person's answer in full so the host can see who to accommodate.
export default function MealResponseGrid({ participants = [] }) {
  const { t } = useI18n();
  const summary = mealResponseSummary(participants);

  if (!participants.length) return null;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
        <div className="flex items-center gap-2 mb-3">
          <Users size={15} />
          <p className="text-sm font-medium">
            {t('meal.respondedCount', { done: summary.responded, total: summary.total })}
          </p>
        </div>

        {summary.responded === 0 ? (
          <p className="text-sm text-muted-foreground">{t('meal.noAnswersYet')}</p>
        ) : (
          <div className="space-y-3">
            {summary.topCuisines.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">{t('meal.foodAgreement')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {summary.topCuisines.slice(0, 5).map((c) => (
                    <span
                      key={c.value}
                      className={`px-2.5 h-7 rounded-full text-xs inline-flex items-center ${
                        c.count > 1 ? 'bg-primary/15 font-medium' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {c.value}{c.count > 1 ? ` · ${c.count}` : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {summary.topAreas.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">{t('meal.areaAgreement')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {summary.topAreas.slice(0, 4).map((a) => (
                    <span
                      key={a.value}
                      className={`px-2.5 h-7 rounded-full text-xs inline-flex items-center ${
                        a.count > 1 ? 'bg-primary/15 font-medium' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {a.value}{a.count > 1 ? ` · ${a.count}` : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {summary.topSlots.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">{t('meal.timeAgreement')}</p>
                <div className="space-y-1">
                  {summary.topSlots.slice(0, 5).map((s) => (
                    <div key={s.value} className="flex items-center gap-2 text-sm">
                      <Clock size={14} className={s.count > 1 ? 'text-primary' : 'text-muted-foreground'} />
                      <span className={s.count > 1 ? 'font-medium' : ''}>{s.value}</span>
                      <span className="text-xs text-muted-foreground">
                        {t('meal.peopleCount', { count: s.count })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2.5">
        {participants.map((p) => {
          const r = p.response || {};
          const slotText = (r.slots || [])
            .map((s) => `${s.date}${s.time ? ` · ${s.time}` : ''}`)
            .join(', ');
          return (
            <div key={p.id || p.email} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="font-medium text-sm">{p.name}</p>
                {p.respondedAt ? (
                  <span className="text-[10px] uppercase tracking-wide text-primary flex items-center gap-1">
                    <Check size={12} /> {t('meal.answered')}
                  </span>
                ) : (
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {t('meal.waiting')}
                  </span>
                )}
              </div>
              {p.respondedAt ? (
                <dl className="text-xs space-y-1.5">
                  {slotText && (
                    <div className="flex gap-2">
                      <dt className="text-muted-foreground w-20 shrink-0">{t('meal.available')}</dt>
                      <dd>{slotText}</dd>
                    </div>
                  )}
                  {(r.cuisines || []).length > 0 && (
                    <div className="flex gap-2">
                      <dt className="text-muted-foreground w-20 shrink-0">{t('meal.foodLabel')}</dt>
                      <dd>{r.cuisines.join(', ')}</dd>
                    </div>
                  )}
                  {(r.areas || []).length > 0 && (
                    <div className="flex gap-2">
                      <dt className="text-muted-foreground w-20 shrink-0">{t('meal.areaPref')}</dt>
                      <dd>{r.areas.join(', ')}</dd>
                    </div>
                  )}
                  {r.budget && (
                    <div className="flex gap-2">
                      <dt className="text-muted-foreground w-20 shrink-0">{t('meal.budgetLabel')}</dt>
                      <dd>{r.budget}</dd>
                    </div>
                  )}
                  {r.dietary && (
                    <div className="flex gap-2">
                      <dt className="text-muted-foreground w-20 shrink-0">{t('meal.dietary')}</dt>
                      <dd>{r.dietary}</dd>
                    </div>
                  )}
                  {r.notes && (
                    <div className="flex gap-2">
                      <dt className="text-muted-foreground w-20 shrink-0">{t('meal.notesShort')}</dt>
                      <dd>{r.notes}</dd>
                    </div>
                  )}
                </dl>
              ) : (
                <p className="text-xs text-muted-foreground">{t('meal.noAnswerYet')}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}