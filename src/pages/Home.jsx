import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useKeepsake } from '@/lib/keepsakeStore';
import { actStatus, urgencyScore, isActDueOnHome } from '@/lib/keepsakeUtils';
import ActRow from '@/components/ActRow';
import PullToRefresh from '@/components/PullToRefresh';
import DriftAlerts from '@/components/home/DriftAlerts';
import ActEditSheet from '@/components/acts/ActEditSheet';
import PersonDateReminders from '@/components/home/PersonDateReminders';
import OneTimeActReminders from '@/components/home/OneTimeActReminders';
import HomeCareReminders from '@/components/home/HomeCareReminders';
import HomeActFilters from '@/components/home/HomeActFilters';
import QuickReminderBox from '@/components/home/QuickReminderBox';
import SmartSuggestions from '@/components/home/SmartSuggestions';
import StaleActAlert from '@/components/home/StaleActAlert';
import { usePersonDateReminders } from '@/hooks/usePersonDateReminders';
import { useOneTimeActReminders } from '@/hooks/useOneTimeActReminders';
import { useSendCardReminders } from '@/hooks/useSendCardReminders';
import SendCardReminders from '@/components/home/SendCardReminders';
import NextUpCountdown from '@/components/home/NextUpCountdown';
import TodayList from '@/components/home/TodayList';
import MoreToNotice from '@/components/home/MoreToNotice';
import { LineChart, BellOff, Plus, Sparkles } from 'lucide-react';
import { KsHeart } from '@/components/icons/KsIcons';
import EmptyState from '@/components/EmptyState';
import SeasonalIcon from '@/components/SeasonalIcon';
import { SEASONAL_ICONS } from '@/components/SeasonalIcons';
import { getThemeById } from '@/lib/themes';
import NotificationBell from '@/components/notifications/NotificationBell';
import { useFeatureTracking } from '@/hooks/useFeatureTracking';
import { useI18n } from '@/lib/i18n/I18nContext';
import { useAuth } from '@/lib/AuthContext';
import { isPremiumUser } from '@/lib/isPremium';
import BrandLogo from '@/components/BrandLogo';
import QuickCapture from '@/components/home/QuickCapture';
import LittleStepsCard from '@/components/home/LittleStepsCard';
import HomeNotesCard from '@/components/home/HomeNotesCard';
import HomeUpcomingCard from '@/components/home/HomeUpcomingCard';
import { useCompletionStats } from '@/hooks/useCompletionStats';
import TrialSection from '@/components/profile/TrialSection';


export default function Home() {
  useFeatureTracking('home');
  const { t } = useI18n();
  const { user } = useAuth();
  const premiumUser = isPremiumUser(user);
  const { profile, myName, acts, history, checkOffAct, uncheckAct, updateAct, deleteAct, events, milestones, people, pets, settings, isLoaded } = useKeepsake();
  const navigate = useNavigate();
  const [editAct, setEditAct] = useState(null);
  const [filter, setFilter] = useState({ type: 'all' });
  const [showAll, setShowAll] = useState(false);
  const filterInitialized = useRef(false);

  const handleToggle = useCallback((a) => (actStatus(a) === 'fresh' ? uncheckAct(a.id) : checkOffAct(a.id)), [checkOffAct, uncheckAct]);
  const handleRowClick = useCallback((a) => setEditAct(a), []);

  const personDateReminders = usePersonDateReminders(profile, people, pets, settings.notifyEvents);
  const oneTimeActReminders = useOneTimeActReminders(acts, people, settings.notifyScheduledActs);
  const sendCardReminders = useSendCardReminders(profile, people, settings.notifyEvents);

  // Home is a to-do list: show overdue, idle, and due-soon acts, plus a
  // just-completed act for a 2-minute confirmation window so the user sees
  // the green checkmark. Up-to-date (fresh) acts are hidden — completing
  // one item no longer makes the whole list look completed.
  const homeActs = useMemo(
    () =>
      acts.filter((a) => {
        if (a.lastCompleted && Date.now() - new Date(a.lastCompleted).getTime() < 120000) return true;
        if (actStatus(a) === 'fresh') return false;
        return isActDueOnHome(a);
      }),
    [acts]
  );
  const sorted = useMemo(
    () => [...homeActs].sort((a, b) => urgencyScore(b) - urgencyScore(a)),
    [homeActs]
  );
  // #4: Default the acts filter to the partner/spouse on first load (once the
  // store is loaded). The user can still switch to All or another filter afterwards.
  useEffect(() => {
    if (filterInitialized.current || !isLoaded) return;
    filterInitialized.current = true;
    const partner = people.find((p) => ['partner', 'spouse'].includes((p.relation || '').toLowerCase()));
    if (partner && acts.some((a) => a.personId === partner.id || a.person === partner.name)) {
      setFilter({ type: 'person', personId: partner.id, name: partner.name });
    }
  }, [isLoaded, people, sorted]);
  const filtered = useMemo(() => {
    if (filter.type === 'person') {
      return sorted.filter((a) => a.personId === filter.personId || a.person === filter.name);
    }
    if (filter.type === 'category') {
      return sorted.filter((a) => (a.category || 'act') === filter.category);
    }
    return sorted;
  }, [sorted, filter]);

  // Nothing matching the current filter is a chance to add one: the link carries
  // that filter along, so the new act starts on the same person or category.
  const addActHref = useMemo(() => {
    if (filter.type === 'person') return `/add-act?personId=${encodeURIComponent(filter.personId)}`;
    if (filter.type === 'category') return `/add-act?category=${encodeURIComponent(filter.category)}`;
    return '/add-act';
  }, [filter]);

  const partner = people.find((p) => ['partner', 'spouse'].includes((p.relation || '').toLowerCase()));
  const noReminderCount = useMemo(
    () =>
      [...events, ...milestones].filter((i) => Array.isArray(i.reminderDays) && i.reminderDays.length === 0).length,
    [events, milestones]
  );

  // Calendar-boundary counts (local time), counted on the server. Home used to
  // download the whole completion history just to add it up; the counts come
  // from get-completion-stats instead. The revision (history length) re-runs the
  // count the moment an act is checked off.
  const completedStats = useCompletionStats(history?.length ?? 0) || { today: 0, week: 0, month: 0, year: 0 };

  // Group the displayed acts by person so each group has a clear header
  // stating who the acts are for (matches the Acts page grouping).
  const displayActs = showAll ? filtered : filtered.slice(0, 5);
  const actGroups = (() => {
    const map = new Map();
    for (const act of displayActs) {
      const person = people.find((p) => p.id === act.personId);
      const key = person ? (person.preferredName || person.name) : (act.person || 'General');
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(act);
    }
    return [...map.entries()].sort(([a], [b]) => (a === 'General' ? -1 : b === 'General' ? 1 : a.localeCompare(b)));
  })();

  const greetingName = profile.nickname || partner?.preferredName || profile.name || partner?.name || 'them';
  const activeTheme = getThemeById(settings.theme);
  const hasSeasonalIcon = Boolean(SEASONAL_ICONS[settings.theme]);

  // The screen opens on the person it is for, not on a logo block: a greeting
  // by time of day, then the one list of what is due today directly under it.
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('home.goodMorning') : hour < 18 ? t('home.goodAfternoon') : t('home.goodEvening');
  // Greet the person the way they asked to be called: the nickname saved on
  // their profile (My Profile → Nickname) comes first, then the first word of
  // their name, then no name at all.
  const nickname = (settings.nickname || '').trim();
  const firstName = nickname || (myName || '').trim().split(/\s+/)[0];

  return (
    <div className="min-h-[100dvh] bg-background max-w-[440px] mx-auto pb-[calc(5.5rem_+_env(safe-area-inset-bottom))]">
      <PullToRefresh>
      {/* Compact masthead: brand mark and shortcuts on one line, so the first
          screen belongs to the greeting and today's list. */}
      <div className="flex items-center justify-between gap-2 px-4 pt-[calc(14px+env(safe-area-inset-top))] pb-1">
        <div className="flex items-center gap-2">
          {hasSeasonalIcon && (
            <div
              className="flex items-center justify-center rounded-xl border border-border/60 shadow-card overflow-hidden"
              style={{
                width: 34,
                height: 34,
                background: `linear-gradient(135deg, ${activeTheme.gradient[0]}66, ${activeTheme.gradient[1]}44)`,
              }}
            >
              <SeasonalIcon size={26} />
            </div>
          )}
          <BrandLogo size={34} />
        </div>
        {/* Each shortcut is labelled: an unlabelled glyph reads as a guess, and
            the assistant only appears for people who actually have it. */}
        <div className="flex items-start gap-0.5">
          {premiumUser && (
            <Link
              to="/chat"
              className="flex flex-col items-center gap-0.5 w-16"
              aria-label={t('home.askFinbump')}
              title={t('home.askFinbump')}
            >
              <span className="flex items-center justify-center w-11 h-11 rounded-full bg-card border border-border text-primary">
                <Sparkles size={18} />
              </span>
              <span className="text-[10px] leading-[1.15] text-center text-muted-foreground">{t('home.navAsk')}</span>
            </Link>
          )}
          <div className="flex flex-col items-center gap-0.5 w-16">
            <NotificationBell size={18} className="flex items-center justify-center w-11 h-11 rounded-full bg-card border border-border" />
            <span className="text-[10px] leading-[1.15] text-center text-muted-foreground">{t('home.navAlerts')}</span>
          </div>
          <Link
            to="/progress"
            className="flex flex-col items-center gap-0.5 w-16"
            aria-label={t('home.progressSummary')}
            title={t('home.progressSummary')}
          >
            <span className="flex items-center justify-center w-11 h-11 rounded-full bg-card border border-border text-primary">
              <LineChart size={18} />
            </span>
            <span className="text-[10px] leading-[1.15] text-center text-muted-foreground">{t('home.navProgress')}</span>
          </Link>
        </div>
      </div>

      {/* Greeting, then the day's answer straight under it. */}
      <div className="px-5 pt-3 pb-0.5">
        <h1 className="font-display text-[26px] font-semibold leading-tight">
          {firstName ? t('home.greetingName', { greeting, name: firstName }) : greeting}
        </h1>
        {/* The motto reads as a deliberate brand statement, not as small print
            under the greeting: a tinted strip with a primary rule and the
            display face carry it on their own. */}
        <p className="mt-2 w-full rounded-md border-y border-primary/30 bg-primary/10 px-3 py-2 text-center font-display text-[13.5px] italic leading-snug text-foreground whitespace-pre-line">
          {t('home.tagline')}
        </p>
        {/* Motivation belongs near the top and in one line, not as a grid of
            four numbers at the bottom. */}
        {(completedStats.week > 0 || completedStats.month > 0) && (
          <p className="text-[12px] text-muted-foreground mt-2">
            {t('home.statLine', { today: completedStats.today, week: completedStats.week, month: completedStats.month })}
          </p>
        )}
      </div>

      {/* Trial status on the dashboard: how many days are left before the card
          is charged, and the way to cancel before then. */}
      <div className="px-5 mt-3">
        <TrialSection showUpsell={false} />
      </div>

      {/* What matters today: the one list of what is due — acts, today's
          occasions and due care check-ins, each one tap to done. */}
      <TodayList acts={sorted} personReminders={personDateReminders} />

      {/* One-tap quick capture, placed in flow so it is clearly labeled and
          never floats over other content. */}
      <div className="px-5 mt-3">
        <QuickCapture />
      </div>

      {/* Two clear groups instead of a long column: the relationship notes the
          user is keeping, and what is coming up on the calendar. Each is one
          card with its own small blocks, and each hides itself when empty. */}
      <HomeNotesCard milestones={milestones} people={people} />

      <HomeUpcomingCard events={events} />

      {/* Little Steps: the guided first month. One lesson at a time, always
          below the Today list so a lesson never hides something that is due. */}
      <LittleStepsCard />

      {/* Act list */}
      <div id="home-acts" className="px-5 mt-5">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">{t('home.dailyCheckIn')}</p>
        <div className="rounded-2xl border px-4 py-4 shadow-card ks-card-tint">
          <div className="flex items-center justify-between mb-3">
            <div className="min-w-0">
              <h2 className="font-display text-lg font-semibold">{t('home.actsOfSupport')}</h2>
              {sorted.length > 0 && (
                <p className="text-[11px] text-muted-foreground mt-0.5">{t('home.waitingCount', { count: sorted.length })}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/add-act')}
                className="flex items-center justify-center w-11 h-11 rounded-full text-primary hover:bg-secondary/60 transition-colors"
                aria-label={t('home.addActAria')}
              >
                <Plus size={18} />
              </button>
              <button onClick={() => navigate('/acts')} className="inline-flex items-center min-h-[44px] -my-2.5 text-xs font-medium text-primary">
                {t('home.viewAll')}
              </button>
            </div>
          </div>
          <QuickReminderBox onCreated={() => setFilter({ type: 'all' })} />
          <div className="mb-3">
            <HomeActFilters people={people} acts={acts} filter={filter} onChange={setFilter} />
          </div>
          <div className="space-y-4">
            {actGroups.map(([person, groupActs]) => (
              <div key={person}>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 px-1">{person}</h3>
                <div className="space-y-2">
                  {groupActs.map((act) => (
                    <ActRow
                      key={act.id}
                      act={act}
                      onToggle={handleToggle}
                      onClick={handleRowClick}
                      personName={person}
                    />
                  ))}
                </div>
              </div>
            ))}
            {sorted.length === 0 ? (
              <EmptyState
                icon={KsHeart}
                title={t('home.startShowingUp')}
                subtitle={t('home.startShowingUpSubtitle')}
                action={
                  <button
                    onClick={() => navigate('/add-act')}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-sm"
                  >
                    <Plus size={16} /> {t('home.addAct')}
                  </button>
                }
              />
            ) : filtered.length === 0 ? (
              /* Nothing under this filter is a question, not a dead end: ask
                 whether to add one, and hand the filter to the add screen. */
              <div className="text-center py-6 px-2">
                <p className="text-sm text-muted-foreground leading-snug max-w-[300px] mx-auto">
                  {filter.type === 'person'
                    ? t('home.noMatchAskPerson', { name: filter.name })
                    : t('home.noMatchAskCategory')}
                </p>
                <button
                  onClick={() => navigate(addActHref)}
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-sm"
                >
                  <Plus size={16} /> {t('home.addAct')}
                </button>
              </div>
            ) : null}
            {filtered.length > 5 && (
              <button
                onClick={() => setShowAll((s) => !s)}
                className="w-full text-center text-xs font-medium text-primary py-1.5"
              >
                {showAll ? t('common.showLess') : t('home.showMoreCount', { count: filtered.length - 5 })}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Everything else still runs exactly as before — the countdown, stale-act
          notices, care reminders, drift alerts, card prompts and suggestions
          simply wait behind one tap instead of stacking down the page. */}
      <MoreToNotice>
        {noReminderCount > 0 && (
          <div className="px-5 mt-3">
            <button
              onClick={() => navigate('/calendar')}
              className="w-full flex items-center gap-2.5 bg-destructive/10 text-destructive rounded-2xl px-4 py-3 text-left"
            >
              <BellOff size={18} className="shrink-0" />
              <p className="text-sm font-medium leading-snug">
                {noReminderCount === 1 ? t('home.noReminderSingle', { count: noReminderCount }) : t('home.noReminderPlural', { count: noReminderCount })}
              </p>
            </button>
          </div>
        )}

        {/* Ordered by what actually needs the user: care check-ins and dates
            first, then scheduled acts, then the informational notices. Only the
            first three render (MoreToNotice caps the rest). */}
        <HomeCareReminders />

        <PersonDateReminders reminders={personDateReminders} />

        <OneTimeActReminders reminders={oneTimeActReminders} />

        <NextUpCountdown />

        <StaleActAlert />

        <DriftAlerts acts={acts} />

        <SendCardReminders reminders={sendCardReminders} />

        <SmartSuggestions />
      </MoreToNotice>

      <ActEditSheet
        act={editAct}
        people={people}
        onClose={() => setEditAct(null)}
        onSave={updateAct}
        onDelete={deleteAct}
      />

      </PullToRefresh>
    </div>
  );
}