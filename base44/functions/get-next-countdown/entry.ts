import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { daysUntil, nextOccurrence } from '../../shared/dateUtils.ts';

// Lightweight data feed for the native iOS home-screen widget. Returns the
// single soonest upcoming occasion (birthday, anniversary, pet gotcha day,
// milestone, or event) as compact JSON so a WidgetKit timeline entry can render
// a countdown without opening the app.
//
// The widget polls this endpoint on its refresh cadence (WidgetKit supports
// timelines up to ~every 5 minutes; for a daily-countdown widget, a refresh
// every 1-2 hours is plenty). The response is intentionally tiny — one object,
// a handful of fields — to keep the widget's network budget minimal.
//
// Auth: requires an authenticated user (base44.auth.me()). The native widget
// passes the user's session token in the request. Returns 401 if unauthenticated.
//
// Response shape:
//   { hasUpcoming: true, days: 3, label: "Mom's Birthday", emoji: "🎂",
//     kind: "birthday", date: "2026-09-18T...", deepLink: "/card-builder?..." }
//   { hasUpcoming: false }  — when nothing is within the 30-day window

const WINDOW_DAYS = 30;

const OCCASION_META = {
  birthday: { emoji: '🎂', occasionKey: 'birthday' },
  anniversary: { emoji: '💐', occasionKey: 'anniversary' },
  adoption: { emoji: '🐾', occasionKey: 'justbecause' },
  milestone: { emoji: '⭐', occasionKey: 'justbecause' },
  event: { emoji: '🎉', occasionKey: 'justbecause' },
};

function personLabel(p: any): string {
  return p.preferredName || p.name || 'them';
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Load the user's own data (user-scoped — RLS ensures only their records).
    const [people, pets, events, milestones] = await Promise.all([
      base44.entities.Person.list('-updated_date', 500),
      base44.entities.Pet.list('-updated_date', 500),
      base44.entities.Event.list('-updated_date', 500),
      base44.entities.Milestone.list('-updated_date', 500),
    ]);

    const candidates: Array<{
      days: number;
      label: string;
      kind: string;
      date: string;
      personId: string | null;
    }> = [];

    // Birthdays & anniversaries from people + pets.
    const addOccasion = (dateStr: string, label: string, kind: string, personId: string | null) => {
      if (!dateStr) return;
      const next = nextOccurrence(dateStr);
      if (!next) return;
      const d = daysUntil(next);
      if (d < 0 || d > WINDOW_DAYS) return;
      candidates.push({ days: d, label, kind, date: next, personId });
    };

    for (const p of people || []) {
      if (p.notify === false) continue;
      if (p.birthday) addOccasion(p.birthday, `${personLabel(p)}'s Birthday`, 'birthday', p.id);
      if (p.anniversary) addOccasion(p.anniversary, `${personLabel(p)}'s Anniversary`, 'anniversary', p.id);
    }
    for (const pet of pets || []) {
      if (pet.birthday) addOccasion(pet.birthday, `${pet.name || 'Pet'}'s Birthday`, 'birthday', null);
      if (pet.adoptionDate) addOccasion(pet.adoptionDate, `${pet.name || 'Pet'}'s Gotcha Day`, 'adoption', null);
    }

    // Milestones (one-time dates).
    for (const m of milestones || []) {
      if (!m.date) continue;
      const d = daysUntil(m.date);
      if (d < 0 || d > WINDOW_DAYS) continue;
      candidates.push({ days: d, label: m.title || 'Milestone', kind: 'milestone', date: m.date, personId: null });
    }

    // Events (one-time + recurring within the window).
    for (const ev of events || []) {
      if (ev.notify === false) continue;
      if (!ev.date) continue;
      const d = daysUntil(ev.date);
      if (d < 0 || d > WINDOW_DAYS) continue;
      candidates.push({ days: d, label: ev.name || 'Event', kind: 'event', date: ev.date, personId: null });
    }

    if (candidates.length === 0) {
      return Response.json({ hasUpcoming: false });
    }

    candidates.sort((a, b) => a.days - b.days);
    const next = candidates[0];
    const meta = OCCASION_META[next.kind] || OCCASION_META.event;

    // Deep link: birthdays/anniversaries jump to the card builder pre-filled
    // for that person; everything else goes to the calendar.
    const deepLink = next.personId
      ? `/card-builder?personId=${next.personId}&occasion=${meta.occasionKey}`
      : '/calendar';

    return Response.json({
      hasUpcoming: true,
      days: next.days,
      label: next.label,
      emoji: meta.emoji,
      kind: next.kind,
      date: next.date,
      deepLink,
    });
  } catch (error) {
    console.error('get-next-countdown error', error?.message || error);
    return Response.json({ error: 'Could not load your next occasion.' }, { status: 500 });
  }
}