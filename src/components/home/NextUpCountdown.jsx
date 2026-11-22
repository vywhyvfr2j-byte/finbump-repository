import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useKeepsake } from '@/lib/keepsakeStore';
import { usePersonDateReminders } from '@/hooks/usePersonDateReminders';
import { daysUntil, showsOnHomeRhythm } from '@/lib/keepsakeUtils';
import { cardBuilderLink } from '@/lib/cardBuilderLink';
import { Cake, Heart, Gift, ChevronRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';

// Track which day-of occasions have already celebrated this session so
// confetti only fires once per occasion — not every time the user navigates
// back to Home.
const celebratedOccasions = new Set();

const OCCASION_META = {
  birthday: { emoji: '🎂', label: 'Birthday', icon: Cake, occasionKey: 'birthday' },
  anniversary: { emoji: '💐', label: 'Anniversary', icon: Heart, occasionKey: 'anniversary' },
  adoption: { emoji: '🐾', label: 'Gotcha Day', icon: Gift, occasionKey: 'justbecause' },
};

// Finds the single soonest upcoming occasion across person birthdays,
// anniversaries, pet gotcha days, and one-time/recurring Events. Returns null
// when nothing is within the next 30 days. The hero card only surfaces occasions
// that are still ahead (days >= 0); "today" (days === 0) is shown as "Today!".
const SOON_WINDOW = 30;

export default function NextUpCountdown() {
  const { profile, people, pets, events, settings } = useKeepsake();
  const navigate = useNavigate();
  const { t } = useI18n();
  const personReminders = usePersonDateReminders(profile, people, pets, settings.notifyEvents);

  const next = useMemo(() => {
    const candidates = [];
    const seen = new Set();
    const addCandidate = (c) => {
      const uMeta = OCCASION_META[c.kind] || { label: c.name };
      const label = c.kind === 'event' ? c.name : `${c.name}'s ${uMeta.label}`;
      // Same occasion on the same day → one row, whichever source it came from
      // (a contact's profile and its calendar entry can be spelled differently).
      const dedupKey = `${label.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()}|${c.days}`;
      if (seen.has(dedupKey)) return;
      seen.add(dedupKey);
      candidates.push(c);
    };

    // Person/pet date reminders — already filtered to the Home rhythm (18/7/3
    // days out, then daily through the day itself) and sorted soonest-first
    // with contacts ahead of pets on a shared day.
    personReminders.forEach((r) => {
      addCandidate({
        days: r.days,
        name: r.name,
        kind: r.kind,
        occasion: r.occasion,
        personId: r.personId === 'partner' ? null : r.personId,
        personName: r.name,
        date: r.date,
        isPet: r.relation === 'pet',
      });
    });

    // Events (one-time + recurring within the window). Birthday, anniversary and
    // Gotcha Day entries keep to the same 18/7/3 rhythm as contacts and pets, so
    // no occasion shows up earlier than another.
    const petIds = new Set((pets || []).map((p) => p.id));
    (events || []).forEach((ev) => {
      if (ev.notify === false) return;
      if (!ev.date) return;
      const d = daysUntil(ev.date);
      if (d < 0 || d > SOON_WINDOW) return;
      const isOccasion = /birthday|anniversary|gotcha|bday/i.test(`${ev.name || ''} ${ev.type || ''}`);
      if (isOccasion && !showsOnHomeRhythm(d)) return;
      addCandidate({
        days: d,
        name: ev.name,
        kind: 'event',
        occasion: ev.name,
        personId: null,
        personName: null,
        date: ev.date,
        isPet: !!ev.personId && petIds.has(ev.personId),
      });
    });

    if (candidates.length === 0) return null;
    // Soonest first; on the same day a contact outranks a pet.
    candidates.sort((a, b) => a.days - b.days || (a.isPet ? 1 : 0) - (b.isPet ? 1 : 0));
    return {
      next: candidates[0],
      upcoming: candidates.slice(1, 3),
    };
  }, [personReminders, events, pets]);

  // Celebrate day-of occasions with a confetti burst when the hero first
  // appears — reinforces the "never forget to show up" promise. Called before
  // the early return so the hook order stays stable across renders.
  const isToday = next?.next?.days === 0;
  useEffect(() => {
    if (!isToday) return;
    const occasionKey = `${next.next.kind}-${next.next.name}-${next.next.date}`;
    if (celebratedOccasions.has(occasionKey)) return;
    celebratedOccasions.add(occasionKey);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.35 },
      colors: ['#E87878', '#FFD93D', '#18A999', '#FF6B6B'],
      disableForReducedMotion: true,
      scalar: 0.8,
    });
  }, [isToday]);

  if (!next) return null;

  const { next: top, upcoming } = next;
  const occasion = top;

  const meta = OCCASION_META[occasion.kind] || { emoji: '🎉', label: 'Occasion', icon: Gift, occasionKey: 'justbecause' };
  const isTomorrow = occasion.days === 1;
  const Icon = meta.icon;

  // Card-sending occasions deep-link to the card builder pre-filled for the
  // person; generic events link to the calendar since there's no card to send.
  const isCardOccasion = ['birthday', 'anniversary', 'adoption'].includes(occasion.kind);
  const cardLink = isCardOccasion && occasion.personId
    ? cardBuilderLink({ personId: occasion.personId, personName: occasion.personName, occasion: meta.occasionKey })
    : (isCardOccasion || isToday) ? '/card-builder' : '/calendar';
  const ctaLabel = isCardOccasion || isToday ? t('home.sendCard') : t('home.open');

  const handleClick = () => navigate(cardLink);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mx-5 mt-3"
    >
      <button
        onClick={handleClick}
        className="relative w-full overflow-hidden rounded-3xl text-left shadow-xl active:scale-[0.98] transition-transform duration-150 ease-out"
        style={{
          background: 'linear-gradient(135deg, hsl(9 55% 45%), hsl(24 70% 38%))',
        }}
      >
        {/* Decorative tint overlay */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 85% 0%, rgba(0, 0, 0, 0.22), transparent 65%)' }} />

        <div className="relative flex items-center gap-4 px-5 py-5">
          {/* Countdown badge */}
          <div className="shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-black/25 backdrop-blur-sm border border-white/30 shadow-sm">
            {isToday ? (
              <span className="font-display text-lg font-bold text-white leading-tight text-center px-1">{t('home.todayExclaim')}</span>
            ) : (
              <>
                <span className="font-display text-3xl font-bold text-white leading-none drop-shadow-sm">{occasion.days}</span>
                <span className="text-[9px] font-medium text-white/90 uppercase tracking-wide mt-0.5">{t('home.days')}</span>
              </>
            )}
          </div>

          {/* Occasion info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Icon size={14} className="text-white/95" style={{ stroke: 'white' }} />
              <span className="text-[11px] font-semibold text-white/95 uppercase tracking-wider">
                {isToday ? t('home.itsToday') : isTomorrow ? t('home.tomorrowLabel') : t('home.comingUp')}
              </span>
            </div>
            <p className="font-display text-base font-semibold text-white leading-snug">
              {occasion.kind === 'event' ? occasion.name : `${occasion.name}'s ${meta.label}`}
            </p>
            <p className="text-xs text-white/90 mt-0.5 leading-snug">
              {isToday ? t('home.sendCardMakeDay') : isTomorrow ? t('home.sendCardBeforeSlips') : (occasion.days === 1 ? t('home.dayToGo') : t('home.daysToGo', { days: occasion.days }))}
            </p>
          </div>

          {/* CTA */}
          <div className="shrink-0 flex items-center gap-1 text-white">
            <span className="text-xs font-semibold">{ctaLabel}</span>
            <ChevronRight size={18} strokeWidth={2.5} style={{ stroke: 'white' }} />
          </div>
        </div>
      </button>

      {/* Upcoming occasions — full-width cards matching the hero above */}
      {upcoming.length > 0 && (
        <div className="space-y-2 mt-2">
          {upcoming.map((u) => {
            const uMeta = OCCASION_META[u.kind] || { emoji: '🎉', label: u.name, occasionKey: 'justbecause' };
            const uLink = ['birthday', 'anniversary', 'adoption'].includes(u.kind) && u.personId
              ? cardBuilderLink({ personId: u.personId, personName: u.personName, occasion: uMeta.occasionKey })
              : '/calendar';
            const UIcon = uMeta.icon || Gift;
            const uIsCard = ['birthday', 'anniversary', 'adoption'].includes(u.kind);
            return (
              <button
                key={`${u.kind}-${u.name}-${u.date}`}
                onClick={() => navigate(uLink)}
                className="relative w-full overflow-hidden rounded-2xl text-left shadow-lg active:scale-[0.98] transition-transform duration-150 ease-out"
                style={{
                  background: 'linear-gradient(135deg, hsl(9 45% 48%), hsl(24 62% 40%))',
                }}
              >
                <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 85% 0%, rgba(0, 0, 0, 0.18), transparent 65%)' }} />
                <div className="relative flex items-center gap-3 px-4 py-3">
                  <div className="shrink-0 flex items-center justify-center w-16 h-16 rounded-2xl bg-black/25 backdrop-blur-sm border border-white/30 shadow-sm">
                    <UIcon size={28} className="text-white" style={{ stroke: 'white' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-sm font-semibold text-white leading-snug">
                      {u.kind === 'event' ? u.name : `${u.name}'s ${uMeta.label}`}
                    </p>
                    <p className="text-[11px] text-white/90 leading-tight mt-0.5">
                      {u.days === 1 ? t('home.dayToGo') : t('home.daysToGo', { days: u.days })}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-1 text-white">
                    <span className="text-[11px] font-semibold">{uIsCard ? t('home.sendCard') : t('home.open')}</span>
                    <ChevronRight size={16} strokeWidth={2.5} style={{ stroke: 'white' }} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}