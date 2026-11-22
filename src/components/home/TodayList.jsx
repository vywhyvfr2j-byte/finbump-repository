import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useKeepsake } from '@/lib/keepsakeStore';
import { useCareReminders } from '@/hooks/useCareReminders';
import { cardBuilderLink } from '@/lib/cardBuilderLink';
import { ChevronDown, HandHeart, Heart, Moon } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';
import { actStatus, HOME_OCCASION_WINDOW_DAYS } from '@/lib/keepsakeUtils';
import { pulseCheck } from '@/lib/reward';
import { useEnsureEntities } from '@/hooks/useEnsureEntities';
import TodayRow from '@/components/home/TodayRow';

// Occasions already celebrated this session — the confetti burst fires once per
// occasion, not every time the user comes back to Home.
const celebratedOccasions = new Set();

// How many rows Home shows before the rest wait behind one tap.
const VISIBLE_ROWS = 3;

// Local calendar day, so "already done today" matches the user's own day.
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dayKeyOf(note) {
  const d = new Date(note?.createdAt || note?.created_date);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// "What matters today" — the answer the top of Home gives: one list, ranked by
// how much it needs the user, each row one tap to done. Overdue work leads, then
// what is due today (a date today, acts, care check-ins), then tonight's memory
// habit once the day's work is clear, then anything coming later this week. The
// three most important show; the rest wait behind one tap instead of stacking
// down the page.
export default function TodayList({ acts = [], personReminders = [] }) {
  const { people, checkOffAct, personalNotes, myPreferences } = useKeepsake();
  // The two daily habits can only be judged against the notes themselves, so
  // load them when someone lands on Home rather than guessing they're still due.
  useEnsureEntities(['personalNotes']);
  const careItems = useCareReminders();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  // Acts marked done from here leave the list straight away. The store keeps a
  // just-completed act around for a couple of minutes so the green tick can be
  // seen in the Acts of support list, but a to-do row the user has just ticked
  // off must not linger in today's list.
  const [handledActIds, setHandledActIds] = useState(() => new Set());
  // The act just ticked off — its row holds for a moment so the reward lands.
  const [justDoneId, setJustDoneId] = useState(null);

  // One list, ranked: what is late comes first, then what is due today (today's
  // occasion, acts, care check-ins), then the two daily habits, then anything
  // coming later this week. Every row carries its priority and the chip its tier,
  // so the order on screen is the order of importance, not the order built.
  const items = useMemo(() => {
    const today = todayKey();
    // Until the notes have loaded, a habit can't be judged — so no habit row is
    // shown rather than nudging someone about a moment they already wrote.
    const notes = Array.isArray(personalNotes) ? personalNotes : null;

    const occasionRow = (r) => {
      const isBirthday = r.kind === 'birthday';
      const occasionLabel = isBirthday ? t('today.birthday') : r.kind === 'adoption' ? t('today.gotcha') : t('today.anniversary');
      const isToday = r.days === 0;
      return {
        key: `occ-${r.key}`,
        emoji: isBirthday ? '🎂' : r.kind === 'adoption' ? '🐾' : '💐',
        title: t('today.occasion', { name: r.name, occasion: occasionLabel }),
        subtitle: isToday ? t('today.today') : r.days === 1 ? t('today.tomorrow') : t('today.inDays', { days: r.days }),
        action: t('today.sendCard'),
        check: false,
        priority: isToday ? 100 : 40,
        tier: isToday ? 'today' : 'week',
        onAction: () => navigate(cardBuilderLink({
          personId: r.personId === 'partner' ? null : r.personId,
          personName: r.name,
          occasion: isBirthday ? 'birthday' : 'anniversary',
        })),
      };
    };

    const todayOccasions = personReminders.filter((r) => r.days === 0).map(occasionRow);

    const dueActs = (acts || [])
      // Held out of the list while the completion is stored, so undoing it from
      // the toast brings the reminder back.
      .filter((a) => !(handledActIds.has(a.id) && a.lastCompleted))
      .map((a) => {
        const person = people.find((p) => p.id === a.personId) || (a.person ? people.find((p) => p.name === a.person) : null);
        const who = person ? person.preferredName || person.name : a.person || '';
        const overdue = actStatus(a) === 'overdue';
        return {
          key: `act-${a.id}`,
          emoji: a.emoji || '💛',
          title: a.name,
          // Never leave the who-line blank — an act nobody is linked to is labelled
          // the same way the Acts page labels it.
          subtitle: who ? t('today.forName', { name: who }) : t('act.general'),
          action: t('today.markDone'),
          check: true,
          priority: overdue ? 96 : 86,
          tier: overdue ? 'overdue' : 'today',
          onAction: () => {
            pulseCheck();
            setJustDoneId(a.id);
            checkOffAct(a.id);
            // The row stays on screen while the tick pops, then clears itself.
            setTimeout(() => setHandledActIds((prev) => new Set(prev).add(a.id)), 700);
          },
        };
      });

    const care = careItems.map((item) => {
      // Never checked in is the most overdue a care reminder can be.
      const never = item.days === null;
      return {
        key: `care-${item.kind}-${item.id}-${item.icon}`,
        Icon: item.icon === 'prayer' ? HandHeart : Heart,
        title: item.icon === 'prayer' ? t('today.carePrayer', { name: item.contactName }) : t('today.careHealth', { name: item.contactName }),
        subtitle: never ? t('time.never') : item.days === 0 ? t('today.today') : t('time.daysAgo', { days: item.days }),
        action: item.icon === 'prayer' ? t('today.prayed') : t('today.checkedIn'),
        check: true,
        priority: never ? 92 : 84,
        tier: never ? 'overdue' : 'today',
        onAction: item.onComplete,
      };
    });

    // The two habits the app is built on, offered right where the day's work is:
    // one moment kept, and one thing appreciated.
    const habits = [];
    if (notes && myPreferences?.memoryReminderEnabled !== false
      && !notes.some((n) => n.type === 'memory' && (n.memoryDate === today || dayKeyOf(n) === today))) {
      habits.push({
        key: 'habit-memory',
        Icon: Moon,
        title: t('today.memoryTitle'),
        subtitle: t('today.memorySubtitle'),
        action: t('today.memoryAction'),
        check: false,
        priority: 70,
        tier: 'habit',
        onAction: () => navigate('/memory'),
      });
    }
    const soonOccasions = personReminders
      .filter((r) => r.days > 0 && r.days <= HOME_OCCASION_WINDOW_DAYS)
      .map(occasionRow);

    // Highest priority first; rows of equal priority keep the order built above.
    return [...todayOccasions, ...dueActs, ...care, ...habits, ...soonOccasions]
      .sort((a, b) => b.priority - a.priority);
  }, [acts, careItems, personReminders, people, checkOffAct, navigate, t, handledActIds, personalNotes, myPreferences]);

  // A birthday or anniversary happening today still gets its little burst of
  // confetti — it just fires from the Today list now.
  useEffect(() => {
    const dayOf = personReminders.find((r) => r.days === 0);
    if (!dayOf) return;
    const key = `${dayOf.key}-${dayOf.date}`;
    if (celebratedOccasions.has(key)) return;
    celebratedOccasions.add(key);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.35 },
      colors: ['#E87878', '#FFD93D', '#18A999', '#FF6B6B'],
      disableForReducedMotion: true,
      scalar: 0.8,
    });
  }, [personReminders]);

  const visible = expanded ? items : items.slice(0, VISIBLE_ROWS);

  return (
    <div className="px-5 mt-5">
      <div
        className="rounded-2xl border shadow-card overflow-hidden ks-card-tint"
      >
        <div className="px-4 pt-3.5 pb-2">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t('today.title')}</p>
            {items.length > 1 && (
              <p className="text-[10px] text-muted-foreground">{t('today.priorityHint')}</p>
            )}
          </div>
        </div>
        {items.length === 0 ? (
          <p className="px-4 pb-4 text-sm text-foreground">{t('today.none')}</p>
        ) : (
          <div className="px-3 pb-3 space-y-2">
            {visible.map((row) => (
              // The row just ticked off holds for a moment and turns green before
              // it leaves the list.
              <TodayRow
                key={row.key}
                row={row}
                doneNow={Boolean(justDoneId) && row.key === `act-${justDoneId}`}
                t={t}
              />
            ))}
            {items.length > VISIBLE_ROWS && (
              <button
                onClick={() => setExpanded((e) => !e)}
                aria-expanded={expanded}
                className="w-full flex items-center justify-center gap-1 min-h-[44px] -my-2 text-xs font-medium text-primary"
              >
                {expanded ? t('today.less') : t('today.more', { count: items.length - VISIBLE_ROWS })}
                <ChevronDown size={14} className={expanded ? 'rotate-180 transition-transform' : 'transition-transform'} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}