import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { daysSince, daysUntil, actStatus } from '@/lib/keepsakeUtils';
import { useI18n } from '@/lib/i18n/I18nContext';

// How many days an act has been overdue (i.e. "showing up" on Home without
// being resolved). For recurring acts this is days past the interval; for
// one-time/scheduled acts it's days past the target date; for never-done
// recurring acts it's days since creation.
function daysOverdue(act) {
  if (act.repeat === false && act.nextDue) {
    return Math.max(0, -daysUntil(act.nextDue));
  }
  if (act.nextDue && !act.lastCompleted) {
    return Math.max(0, -daysUntil(act.nextDue));
  }
  if (!act.lastCompleted) {
    return daysSince(act.created_date) ?? 0;
  }
  return Math.max(0, daysSince(act.lastCompleted) - (act.intervalDays || 0));
}

const THRESHOLD = 3;

export default function StaleActAlert() {
  const { acts, deleteAct } = useKeepsake();
  const { t } = useI18n();
  const [dismissed, setDismissed] = useState(() => new Set());
  const [removingId, setRemovingId] = useState(null);

  const staleActs = useMemo(() => {
    return acts
      .filter((a) => {
        if (dismissed.has(a.id)) return false;
        const status = actStatus(a);
        if (status !== 'overdue' && status !== 'idle') return false;
        return daysOverdue(a) >= THRESHOLD;
      })
      .sort((a, b) => daysOverdue(b) - daysOverdue(a));
  }, [acts, dismissed]);

  const handleRemove = (act) => {
    setRemovingId(act.id);
    setDismissed((prev) => new Set(prev).add(act.id));
    deleteAct(act.id);
    setRemovingId(null);
  };

  const handleDismiss = (actId) => {
    setDismissed((prev) => new Set(prev).add(actId));
  };

  if (staleActs.length === 0) return null;

  return (
    <div className="px-5 mt-3 space-y-2">
      <AnimatePresence>
        {staleActs.map((act) => {
          const days = daysOverdue(act);
          const categoryLabel =
            act.category === 'prayer' ? t('home.staleCategoryPrayer') :
            act.category === 'health' ? t('home.staleCategoryCheckIn') :
            act.category === 'other' ? t('home.staleCategoryReminder') : t('home.staleCategoryAct');
          return (
            <motion.div
              key={act.id}
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              className="relative overflow-hidden rounded-2xl border border-destructive/30 bg-destructive/8 px-4 py-3.5 shadow-card"
            >
              <motion.div
                className="absolute inset-0 rounded-2xl border-2 border-destructive/20 pointer-events-none"
                animate={{ opacity: [0.15, 0.5, 0.15] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <div className="relative flex items-start gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-destructive/15 shrink-0">
                  <AlertTriangle size={20} className="text-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-destructive uppercase tracking-wide leading-none mb-1">
                    {days === 1 ? t('home.staleOverdueSingle', { category: categoryLabel, days }) : t('home.staleOverduePlural', { category: categoryLabel, days })}
                  </p>
                  <p className="text-sm font-semibold text-foreground leading-tight">
                    {t('home.staleStillWaiting', { name: act.name })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 leading-snug">
                    {days === 1 ? t('home.staleNaggingSingle', { days }) : t('home.staleNaggingPlural', { days })}
                  </p>
                  <div className="flex items-center gap-2 mt-2.5">
                    <button
                      onClick={() => handleRemove(act)}
                      disabled={removingId === act.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-destructive text-destructive-foreground text-xs font-medium active:scale-95 transition-transform disabled:opacity-50"
                    >
                      <Trash2 size={13} /> {t('common.remove')}
                    </button>
                    <button
                      onClick={() => handleDismiss(act.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-xs font-medium active:scale-95 transition-transform"
                    >
                      <X size={13} /> {t('home.notNow')}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}