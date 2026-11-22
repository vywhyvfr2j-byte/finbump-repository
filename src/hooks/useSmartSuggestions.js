import { useMemo } from 'react';
import { useKeepsake } from '@/lib/keepsakeStore';
import { daysSince, actStatus, daysUntil, showsOnHomeRhythm } from '@/lib/keepsakeUtils';

// Generates proactive suggestions for new acts based on the user's
// patterns and gaps. Each suggestion explains why it's being shown and
// includes a pre-filled act template the user can add with one tap.
//
// Suggestion types:
// 1. Neglected connection — a person with no acts, or all acts overdue.
// 2. Stale cadence — an act not done in 2+ intervals (suggest a shorter cadence).
// 3. Missing reach-out — a person with no "reach out" or "call" act.
// 4. Upcoming occasion — a birthday/anniversary at the 18/7/3-day Home rhythm
//    (and the final days before it) with no gift idea.
export function useSmartSuggestions() {
  const { acts, people, events, giftIdeas } = useKeepsake();

  return useMemo(() => {
    const suggestions = [];
    const now = new Date();

    // 1. Neglected connections: people with no acts at all, or all acts overdue.
    for (const person of people) {
      const personActs = acts.filter(
        (a) => a.personId === person.id || a.person === person.name
      );
      if (personActs.length === 0) {
        suggestions.push({
          id: `neglect-${person.id}`,
          type: 'neglected',
          person,
          title: `Add a reminder for ${person.preferredName || person.name}`,
          reason: `You don't have any acts of support set up for ${person.preferredName || person.name} yet.`,
          actTemplate: {
            name: `Check in on ${person.preferredName || person.name}`,
            emoji: '💛',
            tag: 'weekly',
            intervalDays: 7,
            personId: person.id,
            person: person.name,
          },
        });
      } else {
        const overdueCount = personActs.filter((a) => {
          const status = actStatus(a);
          return status === 'overdue' || status === 'idle';
        }).length;
        if (overdueCount === personActs.length && personActs.length > 0) {
          suggestions.push({
            id: `overdue-${person.id}`,
            type: 'overdue-all',
            person,
            title: `${person.preferredName || person.name} needs some attention`,
            reason: `All ${personActs.length} act${personActs.length === 1 ? '' : 's'} for ${person.preferredName || person.name} are overdue.`,
            actTemplate: {
              name: `Reach out to ${person.preferredName || person.name}`,
              emoji: '🤍',
              tag: 'daily',
              intervalDays: 3,
              personId: person.id,
              person: person.name,
            },
          });
        }
      }
    }

    // 2. Stale cadence: acts not done in 2+ intervals.
    for (const act of acts) {
      if (!act.intervalDays || act.intervalDays <= 0) continue;
      const d = daysSince(act.lastCompleted);
      if (d !== null && d >= act.intervalDays * 2) {
        const personName = act.person || 'this person';
        suggestions.push({
          id: `stale-${act.id}`,
          type: 'stale',
          act,
          title: `"${act.name}" keeps slipping`,
          reason: `It's been ${d} days — the cadence is every ${act.intervalDays} days. Try a longer interval so it's achievable.`,
          actTemplate: {
            ...act,
            intervalDays: Math.round(act.intervalDays * 1.5),
          },
        });
      }
    }

    // 3. Missing reach-out: people with no "call", "text", or "reach" act.
    const reachKeywords = ['call', 'text', 'reach', 'check in', 'check-in'];
    for (const person of people) {
      const hasReachOut = acts.some((a) => {
        if (a.personId !== person.id && a.person !== person.name) return false;
        const name = (a.name || '').toLowerCase();
        return reachKeywords.some((kw) => name.includes(kw));
      });
      if (!hasReachOut && acts.filter((a) => a.personId === person.id || a.person === person.name).length > 0) {
        suggestions.push({
          id: `reachout-${person.id}`,
          type: 'reach-out',
          person,
          title: `Add a "reach out" reminder for ${person.preferredName || person.name}`,
          reason: `You have acts for ${person.preferredName || person.name}, but no regular "call" or "check in" reminder.`,
          actTemplate: {
            name: `Call ${person.preferredName || person.name}`,
            emoji: '📞',
            tag: 'weekly',
            intervalDays: 7,
            personId: person.id,
            person: person.name,
          },
        });
      }
    }

    // 4. Upcoming occasion with no gift idea — kept to the same Home rhythm as
    // the countdown (18/7/3 days out, then daily through the day itself) so one
    // birthday never appears here earlier than any other contact's.
    for (const ev of events) {
      if (!ev.date || ev.notify === false) continue;
      const evDate = new Date(ev.date);
      if (Number.isNaN(evDate.getTime())) continue;
      if (!showsOnHomeRhythm(daysUntil(ev.date))) continue;

      // Check if there's already a gift idea linked to this event's person.
      const evPersonName = (ev.name || '').split("'s")[0].trim();
      const hasGift = giftIdeas.some((g) =>
        g.person === evPersonName || g.occasion === ev.type
      );
      if (!hasGift && evPersonName) {
        suggestions.push({
          id: `gift-${ev.id}`,
          type: 'gift-gap',
          event: ev,
          title: `${ev.name} is coming up — no gift idea yet`,
          reason: `${ev.name} is on ${evDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}. Add a gift idea so you're ready.`,
          actTemplate: null, // no act template — links to gift tracker
          route: '/gift-tracker',
        });
      }
    }

    // Never show the same thing twice: two contact records can display the same
    // name (e.g. a duplicate "Alex"), and the same birthday can exist as two
    // calendar entries. Keep the first row per person, act, or occasion, then
    // limit to the top 3 most actionable suggestions — de-duplicated, so
    // duplicates can't eat the slots.
    const seen = new Set();
    const unique = suggestions.filter((s) => {
      const key = s.person
        ? `person:${(s.person.preferredName || s.person.name || '').trim().toLowerCase()}`
        : s.act
          ? `act:${s.act.id}`
          : `occ:${(s.event?.name || '').trim().toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return unique.slice(0, 3);
  }, [acts, people, events, giftIdeas]);
}