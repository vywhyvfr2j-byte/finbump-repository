import { actStatus, daysUntil, collectOccasions } from '@/lib/keepsakeUtils';
import { nextRemembrance, remembranceLeadDays } from '@/lib/remembrance';

const DEFAULT_REMINDER_DAYS = [30, 7, 3];
const DEFAULT_GIFT_SEARCH_DAYS = [30, 14, 7];
const GIFT_SEARCH_IDEA_THRESHOLD = 3;
// Hour the evening memory question starts being asked — the first reminder. The
// evening push repeats it at 9pm (21:00) if the moment is still unwritten.
const EVENING_HOUR = 18;

function localDayStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// The date an act is meant to be done by: one-time scheduled acts use their
// explicit nextDue date; recurring acts roll to lastCompleted + intervalDays.
function actDueDate(act) {
  if (act.nextDue && act.repeat === false) {
    const d = new Date(act.nextDue);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (act.nextDue && !act.lastCompleted) {
    const d = new Date(act.nextDue);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (act.lastCompleted && act.intervalDays) {
    const d = new Date(act.lastCompleted);
    if (Number.isNaN(d.getTime())) return null;
    d.setDate(d.getDate() + Number(act.intervalDays));
    return d;
  }
  return null;
}

// Resolves the person linked to an event (by personId, then by name match) so
// per-person notify flags and gift info can be applied to any event type.
function resolvePerson(event, people) {
  if (!people || people.length === 0) return null;
  if (event.personId) {
    const byId = people.find((p) => String(p.id) === String(event.personId));
    if (byId) return byId;
  }
  const name = event.name || '';
  const stripped = name
    .replace(/'s (Birthday|Anniversary)$/i, '')
    .replace(/\s*\((.+?)\)\s*$/, '')
    .trim();
  if (stripped) {
    const byName = people.find((p) => p.name === stripped);
    if (byName) return byName;
  }
  const contains = people.find((p) => p.name && name.includes(p.name));
  return contains || null;
}

// Builds the full set of current notifications from the user's data, respecting
// global settings toggles AND per-item/per-person `notify` flags (undefined or
// true = on; false = off). Each notification has a stable id so the hook can
// dedup and only fire browser notifications for new items once per day.
export function buildNotifications({ acts, events, milestones, giftIdeas, people, pets, profile, settings, dailyEncouragementContent, memoryRefreshes, personalNotes, myPreferences, adminInsights, littleStep }) {
  const out = [];
  const now = new Date();
  const today = localDayStr(now);
  const peopleList = [...(people || []), ...(pets || [])];

  if (settings.notifyOverdue) {
    acts.forEach((act) => {
      if (act.notify === false) return;
      const status = actStatus(act);
      if (status !== 'overdue' && status !== 'idle') return;
      const person = act.person ? peopleList.find((p) => p.name === act.person) : null;
      if (person && person.notify === false) return;
      const isIdle = status === 'idle';
      out.push({
        id: `${isIdle ? 'idle' : 'overdue'}-${act.id}`,
        title: isIdle ? 'Not started yet' : "It's been a while",
        body: `${act.emoji ? act.emoji + ' ' : ''}${act.name}${person ? ` for ${person.name}` : ''} ${isIdle ? "hasn't been done yet." : "hasn't been done in a bit."}`,
        type: 'overdue', itemId: act.id, personId: person?.id, personName: person?.name || act.person || null,
        severity: isIdle ? 'medium' : 'high', createdAt: now.toISOString(),
        dueDate: actDueDate(act)?.toISOString() || null,
      });
    });
  }

  if (settings.notifyScheduledActs) {
    acts.forEach((act) => {
      if (act.notify === false) return;
      const due = actDueDate(act);
      if (!due || localDayStr(due) !== today) return;
      const person = act.person ? peopleList.find((p) => p.name === act.person) : null;
      if (person && person.notify === false) return;
      out.push({
        id: `due-${act.id}`,
        title: 'Act due today',
        body: `${act.emoji ? act.emoji + ' ' : ''}${act.name}${person ? ` for ${person.name}` : ''} is on for today.`,
        type: 'due', itemId: act.id, personId: person?.id, personName: person?.name || act.person || null,
        severity: 'medium', createdAt: now.toISOString(),
        dueDate: due.toISOString(),
      });
    });

    // Advance reminders for one-time scheduled acts at 30, 10, 3 days out
    // and day-of. Each milestone produces its own notification so the feed
    // surfaces the approaching event as it crosses each threshold.
    const ONE_TIME_ADVANCE_DAYS = [30, 10, 3];
    acts.forEach((act) => {
      if (act.notify === false) return;
      if (act.repeat !== false || !act.nextDue) return;
      const due = new Date(act.nextDue);
      if (Number.isNaN(due.getTime())) return;
      const days = Math.round((due.getTime() - now.getTime()) / 86400000);
      if (!ONE_TIME_ADVANCE_DAYS.includes(days)) return;
      const person = act.person ? peopleList.find((p) => p.name === act.person) : null;
      if (person && person.notify === false) return;
      const when = days === 0 ? 'today' : `in ${days} day${days === 1 ? '' : 's'}`;
      out.push({
        id: `onetime-${act.id}-${days}`,
        title: days === 0 ? 'One-time act today' : 'Coming up',
        body: `${act.emoji ? act.emoji + ' ' : ''}${act.name} ${person ? `(${person.name}) ` : ''}${when}.`,
        type: 'due', itemId: act.id, personId: person?.id, personName: person?.name || act.person || null,
        route: '/acts',
        severity: days <= 3 ? 'high' : 'medium', createdAt: now.toISOString(),
        dueDate: due.toISOString(),
      });
    });
  }

  // Daily prayer list reminder: fires once per day when there are any people
  // with prayer enabled, so the user is nudged to open the prayer list even if
  // no individual cadence has elapsed yet.
  const prayerPeople =
    settings.prayerEnabled !== false
      ? peopleList.filter((p) => p.prayerEnabled && p.notify !== false && !p.remembering)
      : [];
  if (prayerPeople.length > 0) {
    const entry = (p) => {
      const name = p.prayerNames || p.name;
      return p.prayerReason ? `${name} — ${p.prayerReason}` : name;
    };
    const body =
      prayerPeople.length === 1
        ? `Pray for ${entry(prayerPeople[0])} today.`
        : `Pray for: ${prayerPeople.map(entry).join('; ')}.`;
    out.push({
      id: `prayer-daily-${today}`,
      title: 'Time to pray',
      body,
      type: 'prayer', itemId: 'prayer-list', personId: null,
      severity: 'medium', createdAt: now.toISOString(),
    });
  }

  // Person-based care reminders — consolidated per person so each person
  // appears at most once in the feed. Fires when any care cadence (health or
  // other) is set and enough days have elapsed since the last logged action.
  // Shows how many days since the last check-in. Respects person.notify.
  peopleList.forEach((person) => {
    // Someone being remembered has no check-in cadence to keep.
    if (person.notify === false || person.remembering) return;
    const checkDue = (days, lastField) => {
      if (!days || days <= 0) return false;
      if (!person[lastField]) return true;
      const last = new Date(person[lastField]);
      if (Number.isNaN(last.getTime())) return true;
      return Math.floor((now.getTime() - last.getTime()) / 86400000) >= days;
    };
    const ended = (endField) => {
      if (!person[endField]) return false;
      const end = new Date(person[endField]);
      if (Number.isNaN(end.getTime())) return false;
      // End date is inclusive — reminders stop the day after.
      end.setHours(23, 59, 59, 999);
      return now.getTime() > end.getTime();
    };

    const dueCare = [];
    if (!ended('healthReminderEndDate') && checkDue(person.healthReminderDays, 'lastHealthCheckIn')) {
      dueCare.push({ type: 'health', lastField: 'lastHealthCheckIn' });
    }
    if (!ended('otherReminderEndDate') && checkDue(person.otherReminderDays, 'lastOtherCheckIn')) {
      dueCare.push({ type: 'other', lastField: 'lastOtherCheckIn' });
    }

    if (dueCare.length > 0) {
      // Days since the most recent care check-in was logged.
      const lastTimes = dueCare
        .map((d) => person[d.lastField])
        .filter(Boolean)
        .map((d) => new Date(d).getTime())
        .filter((t) => !Number.isNaN(t));
      const daysSince = lastTimes.length > 0
        ? Math.floor((now.getTime() - Math.max(...lastTimes)) / 86400000)
        : null;
      const dayLabel = daysSince != null
        ? `${daysSince} day${daysSince === 1 ? '' : 's'} since last check-in`
        : 'No check-in logged yet';
      const notes = person.healthNotes || person.otherNotes;

      const careDueDates = dueCare.map((d) => {
        const last = person[d.lastField] ? new Date(person[d.lastField]).getTime() : null;
        if (last == null || Number.isNaN(last)) return null;
        const days = d.type === 'health' ? person.healthReminderDays : person.otherReminderDays;
        if (!days) return null;
        return new Date(last + days * 86400000).toISOString();
      }).filter(Boolean).sort();
      const careDueDate = careDueDates[0] || null;

      out.push({
        id: `care-${person.id}`,
        title: 'Check in on them',
        body: `${person.name} — ${dayLabel}${notes ? ` (${notes})` : ''}.`,
        type: 'care', itemId: person.id, personId: person.id, personName: person.name,
        careTypes: dueCare.map((d) => d.type),
        severity: 'medium', createdAt: now.toISOString(),
        dueDate: careDueDate,
      });
    }
  });

  // Birthday, anniversary & pet Gotcha Day reminders — fires both the day
  // before (pre-reminder) and on the actual day, covering the partner profile,
  // people, and pets. Respects per-person `notify` flags and the global events
  // notification toggle.
  if (settings.notifyEvents !== false) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    collectOccasions(profile, people, pets).forEach((occ) => {
      if (occ.notify === false) return;
      // Remembrance days lead in by the contact's own window (default 3 days)
      // instead of the day-before/day-of pattern used for celebrations.
      if (occ.kind === 'remembrance') {
        const next = nextRemembrance(occ.dateStr);
        if (!next) return;
        if (next.days < 0 || next.days > remembranceLeadDays({ remembranceLeadDays: occ.leadDays })) return;
        const remembranceDate = next.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        out.push({
          id: `remembrance-${occ.id}-${today}`,
          title: next.days === 0 ? `Remembering ${occ.name}` : `Remembering ${occ.name} soon`,
          body: next.days === 0
            ? `${occ.name}'s remembrance day is today (${remembranceDate}). Take a quiet moment if you'd like.`
            : `${occ.name}'s remembrance day is in ${next.days} day${next.days === 1 ? '' : 's'} (${remembranceDate}).`,
          type: 'occasion', itemId: occ.id, personId: null, personName: occ.name,
          route: '/occasions',
          severity: next.days === 0 ? 'medium' : 'low',
          createdAt: now.toISOString(),
          dueDate: next.date.toISOString(),
        });
        return;
      }
      const dateNote = new Date(now.getFullYear(), occ.month, occ.day)
        .toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      // Day-of reminder
      if (now.getMonth() === occ.month && now.getDate() === occ.day) {
        out.push({
          id: `occasion-${occ.id}-${today}`,
          title: occ.label,
          body: `${occ.label} is today (${dateNote}).`,
          type: 'occasion', itemId: occ.id, personId: null, personName: occ.name,
          route: '/calendar',
          severity: 'high', createdAt: now.toISOString(),
          dueDate: new Date(now.getFullYear(), occ.month, occ.day).toISOString(),
        });
      }
      // Day-before pre-reminder
      if (tomorrow.getMonth() === occ.month && tomorrow.getDate() === occ.day) {
        out.push({
          id: `occasion-pre-${occ.id}-${today}`,
          title: occ.label,
          body: `${occ.label} is tomorrow (${dateNote}).`,
          type: 'occasion', itemId: occ.id, personId: null, personName: occ.name,
          route: '/calendar',
          severity: 'medium', createdAt: now.toISOString(),
          dueDate: new Date(now.getFullYear(), occ.month, occ.day).toISOString(),
        });
      }
    });
  }

  // Memory refresh reminders — surface when the user-set refresh date has
  // arrived. Pure date math, no AI. Each due & un-done reminder becomes one
  // feed entry so the user is gently nudged to revisit a memory.
  (memoryRefreshes || []).forEach((mr) => {
    if (mr.done) return;
    if (!mr.refreshAt) return;
    const refreshDate = new Date(mr.refreshAt);
    if (Number.isNaN(refreshDate.getTime())) return;
    if (refreshDate.getTime() > now.getTime()) return;
    const person = peopleList.find((p) => String(p.id) === String(mr.personId));
    out.push({
      id: `memory-refresh-${mr.id}`,
      title: 'A memory to revisit',
      body: `${mr.label}${person ? ` — ${person.name}` : ''}`,
      type: 'memory_refresh', itemId: mr.id, personId: mr.personId, personName: person?.name || null,
        route: '/people',
        severity: 'low', createdAt: now.toISOString(),
        dueDate: mr.refreshAt,
      });
  });

  // A brand-new account has nothing scheduled yet (no people, no acts), so the
  // feed opens with one nudge to begin: add the first person they want to show
  // up for. It disappears on its own the moment a connection or an act exists.
  if (peopleList.length === 0 && acts.length === 0) {
    out.push({
      id: `start-journey-${today}`,
      title: 'Start your journey',
      body: 'Add the first person you want to show up for. Your scripture, story and encouragement are already waiting, and Little Steps guides you whenever you want.',
      type: 'other', itemId: 'start-journey', personId: null,
      route: '/people',
      severity: 'medium', createdAt: now.toISOString(),
    });
  }

  // Daily personal notes reminder — a gentle once-per-day nudge to jot down a
  // memory or feeling, with a direct link to the Personal Notes page.
  if (settings.notifyPersonalNotes !== false) {
    out.push({
      id: `personal-notes-daily-${today}`,
      title: 'Write a personal note',
      body: 'Take a moment to jot down a memory, feeling, or message for them.',
      type: 'other', itemId: 'personal-notes', personId: null,
      route: '/personal-notes',
      severity: 'low', createdAt: now.toISOString(),
    });
  }

  // Daily encouragement (scripture, a true story, an encouraging word) — on by
  // default, and switchable off in Settings. Content is picked once per day and
  // never repeated.
  if (settings.dailyEncouragement && dailyEncouragementContent) {
    const today = localDayStr(now);
    if (settings.encouragementStory !== false && dailyEncouragementContent.story) {
      out.push({
        id: `encouragement-story-${today}`,
        title: 'A true story',
        body: dailyEncouragementContent.storySource
          ? `${dailyEncouragementContent.story}\n\nSource: ${dailyEncouragementContent.storySource}`
          : dailyEncouragementContent.story,
        type: 'encouragement', itemId: 'encouragement-story', personId: null,
        severity: 'low', createdAt: now.toISOString(),
      });
    }
    if (settings.encouragementMessage !== false && dailyEncouragementContent.encouragement) {
      out.push({
        id: `encouragement-message-${today}`,
        title: dailyEncouragementContent.encouragementIsQuote ? 'A quote to keep' : 'Daily encouragement',
        body: dailyEncouragementContent.encouragementSource
          ? `${dailyEncouragementContent.encouragement}\n\nSource: ${dailyEncouragementContent.encouragementSource}`
          : dailyEncouragementContent.encouragement,
        type: 'encouragement', itemId: 'encouragement-message', personId: null,
        severity: 'low', createdAt: now.toISOString(),
      });
    }
    if (settings.encouragementScripture !== false && dailyEncouragementContent.scripture) {
      out.push({
        id: `encouragement-scripture-${today}`,
        title: 'Scripture of the day',
        body: `${dailyEncouragementContent.scripture}${dailyEncouragementContent.scriptureExplanation ? `\n\n${dailyEncouragementContent.scriptureExplanation}` : ''}`,
        type: 'encouragement', itemId: 'encouragement-scripture', personId: null,
        severity: 'low', createdAt: now.toISOString(),
      });
    }
  }

  // Evening memory prompt — one in-app message each evening asking for a single
  // moment worth remembering. It appears from 6pm (the first reminder, echoed by
  // the 9pm follow-up push) and stays until today's answer is saved, so it is
  // still standing as the second nudge. The Settings toggle silences it.
  if (myPreferences?.memoryReminderEnabled !== false && now.getHours() >= EVENING_HOUR) {
    const answeredToday =
      myPreferences?.lastMemoryDate === today ||
      (Array.isArray(personalNotes) ? personalNotes : []).some(
        (n) => n.type === 'memory' && (n.memoryDate || String(n.created_date || '').slice(0, 10)) === today
      );
    if (!answeredToday) {
      out.push({
        id: `memory-prompt-${today}`,
        title: 'A moment to remember',
        body: 'What\u2019s one moment today you\u2019d want to remember? Tap to answer it in your own words.',
        type: 'memory', itemId: 'memory-moments', personId: null,
        route: '/memory',
        severity: 'medium', createdAt: now.toISOString(),
      });
    }
  }

  // Bi-weekly AI improvement prompt for the admin. Surfaces for ~14 days after
  // generation (through the next cycle) until the admin opens it (readAt is set
  // on the admin page), so the nudge persists until acknowledged rather than
  // vanishing mid-cycle. Non-admins never have adminInsights (RLS), so this is a
  // no-op for them.
  (adminInsights || []).forEach((insight) => {
    if (insight.readAt) return;
    const created = new Date(insight.created_date || insight.weekOf);
    if (Number.isNaN(created.getTime())) return;
    if (now.getTime() - created.getTime() > 14 * 86400000) return;
    out.push({
      id: `admin-insight-${insight.id}`,
      title: 'Bi-weekly app improvement ideas',
      body: insight.summary || insight.title,
      type: 'admin_insight', itemId: insight.id, personId: null,
      route: '/admin-insights',
      severity: 'low', createdAt: now.toISOString(),
    });
  });

  // Little Steps — while the lesson emails are paused, the series is taught in
  // the app itself: the lesson that is due waits in the feed when the app is
  // opened, and tapping it opens the screen the lesson asks the user to try.
  if (littleStep) {
    out.push({
      id: `little-steps-${littleStep.day}`,
      title: `Little Steps · Lesson ${littleStep.number} of ${littleStep.total}`,
      body: `${littleStep.title}. ${littleStep.body}`,
      type: 'little_steps', itemId: 'little-steps', personId: null,
      route: littleStep.route,
      severity: 'low', createdAt: now.toISOString(),
    });
  }

  return out.map((n) => ({ ...n, dayKey: today, completed: false }));
}