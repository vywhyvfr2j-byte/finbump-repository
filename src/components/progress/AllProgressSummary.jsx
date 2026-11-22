import React, { useMemo } from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { useEnsureEntities } from '@/hooks/useEnsureEntities';
import { Link } from 'react-router-dom';
import {
  Gift,
  StickyNote,
  Flag,
  CalendarHeart,
  HeartHandshake,
  HandHeart,
  Plane,
  Users,
  CheckCircle2,
} from 'lucide-react';

// Grid of progress stat cards covering every trackable area in the app that
// isn't already shown as a chart on the Progress page. Each card links to its
// source page so users can drill in.
export default function AllProgressSummary() {
  useEnsureEntities(['personalNotes', 'trips', 'personalNeeds', 'commLog']);
  const {
    history, goals, giftIdeas, personalNotes, milestones, events,
    people, pets, trips, personalNeeds,
  } = useKeepsake();

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = (arr, dateField) =>
      (arr || []).filter((x) => {
        const d = new Date(x[dateField] || x.created_date);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      }).length;

    const giftsPurchased = (giftIdeas || []).filter((g) => g.purchased).length;
    const giftsGifted = (giftIdeas || []).filter((g) => g.gifted).length;
    const appreciationNotes = (personalNotes || []).filter((n) => n.type === 'appreciation').length;
    const goalsDone = (goals || []).filter((g) => g.done).length;
    const goalsActive = (goals || []).length - goalsDone;

    // Care check-ins: people with any check-in logged in the last 30 days
    const thirtyAgo = new Date(now); thirtyAgo.setDate(thirtyAgo.getDate() - 30);
    const recentCheckIns = (people || []).filter((p) => {
      const last = p.lastHealthCheckIn || p.lastOtherCheckIn || p.lastReachedOutAt;
      return last && new Date(last) >= thirtyAgo;
    }).length;

    // Prayer: people with prayer enabled + personal needs shared
    const prayerPeople = (people || []).filter((p) => p.prayerEnabled).length;
    const prayerNeeds = (personalNeeds || []).filter((n) => n.category === 'prayer').length;

    return {
      actsThisMonth: thisMonth(history, 'completedAt'),
      actsTotal: (history || []).length,
      goalsDone,
      goalsActive,
      giftsPurchased,
      giftsGifted,
      giftsTotal: (giftIdeas || []).length,
      notesTotal: (personalNotes || []).length,
      appreciationNotes,
      milestonesTotal: (milestones || []).length,
      eventsTotal: (events || []).length,
      checkInsRecent: recentCheckIns,
      prayerPeople,
      prayerNeeds,
      tripsTotal: (trips || []).length,
      connections: (people || []).length + (pets || []).length,
    };
  }, [history, goals, giftIdeas, personalNotes, milestones, events, people, pets, trips, personalNeeds]);

  const cardClass = 'rounded-2xl border p-4 shadow-card flex flex-col gap-1 ks-card-tint';

  const cards = [
    { to: '/acts', icon: CheckCircle2, label: 'Acts completed', value: stats.actsTotal, sub: `${stats.actsThisMonth} this month` },
    { to: '/relationship-notes', icon: Flag, label: 'Goals', value: stats.goalsDone, sub: `${stats.goalsActive} active` },
    { to: '/gift-tracker', icon: Gift, label: 'Gifts purchased', value: stats.giftsPurchased, sub: `${stats.giftsGifted} gifted · ${stats.giftsTotal} total` },
    { to: '/personal-notes', icon: StickyNote, label: 'Personal notes', value: stats.notesTotal, sub: `${stats.appreciationNotes} appreciation` },
    { to: '/relationship-notes', icon: CalendarHeart, label: 'Milestones', value: stats.milestonesTotal, sub: 'recorded' },
    { to: '/calendar', icon: CalendarHeart, label: 'Special dates', value: stats.eventsTotal, sub: 'tracked' },
    { to: '/people', icon: HeartHandshake, label: 'Care check-ins', value: stats.checkInsRecent, sub: 'last 30 days' },
    { to: '/prayer', icon: HandHeart, label: 'Prayer', value: stats.prayerPeople, sub: `${stats.prayerNeeds} needs shared` },
    { to: '/vacation-planner', icon: Plane, label: 'Trips planned', value: stats.tripsTotal, sub: 'saved' },
    { to: '/people', icon: Users, label: 'Connections', value: stats.connections, sub: 'people & pets' },
  ];

  return (
    <div className="space-y-3">
      <h2 className="font-display text-base font-semibold px-1">All your progress</h2>
      <div className="grid grid-cols-2 gap-2.5">
        {cards.map(({ to, icon: Icon, label, value, sub }) => (
          <Link key={label} to={to} className={`${cardClass} hover:bg-secondary/40 transition-colors`}>
            <div className="flex items-center gap-2">
              <Icon size={16} className="text-primary shrink-0" />
              <p className="text-xs uppercase tracking-wide text-muted-foreground truncate">{label}</p>
            </div>
            <p className="font-display text-2xl font-semibold mt-0.5">{value}</p>
            <p className="text-[11px] text-muted-foreground">{sub}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}