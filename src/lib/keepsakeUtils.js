export function daysSince(dateStr) {
  if (!dateStr) return null;
  const then = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

export function daysUntil(dateStr) {
  const d = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.ceil((d - now) / (1000 * 60 * 60 * 24));
}

// The milestone days for every birthday, anniversary and pet Gotcha Day: 18, 7
// and 3 days out, then daily through the day itself. These are the days a
// reminder notification fires and the days a row is highlighted in the Home
// "Coming up" list.
export const OCCASION_RHYTHM_DAYS = [18, 7, 3];

// How far ahead the Home "Coming up" list looks: every occasion inside this
// many days is listed, and stays listed daily through the day itself. Wider
// than the milestone rhythm above, so an occasion is never hidden in the gap
// between two milestones (a birthday 6 days out, for example).
export const HOME_OCCASION_WINDOW_DAYS = 7;

export function showsOnHomeRhythm(days) {
  if (!Number.isFinite(days) || days < 0) return false;
  return days <= 3 || OCCASION_RHYTHM_DAYS.includes(days);
}

// Whether an occasion belongs in the Home "Coming up" list.
export function showsInHomeComingUp(days) {
  if (!Number.isFinite(days) || days < 0) return false;
  return days <= HOME_OCCASION_WINDOW_DAYS;
}

export function formatDate(dateStr) {
  if (!dateStr) return 'Never';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function relativeLast(dateStr) {
  const d = daysSince(dateStr);
  if (d === null) return 'Not yet';
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  if (d < 7) return `${d} days ago`;
  if (d < 14) return 'A week ago';
  if (d < 30) return `${Math.floor(d / 7)} weeks ago`;
  return `${Math.floor(d / 30)} months ago`;
}

// urgency: 'overdue' | 'soon' | 'fresh' | 'idle'
export function actStatus(act) {
  // One-time scheduled act: urgency is driven by the target date, not the last completion.
  if (act.nextDue && act.repeat === false) {
    const d = daysUntil(act.nextDue);
    if (d < 0) return 'overdue';
    if (d <= 2) return 'soon';
    return 'fresh';
  }
  // Recurring act with a start date that hasn't been done yet: urgency is driven
  // by the start date, so a future-scheduled item isn't flagged as overdue.
  if (act.nextDue && !act.lastCompleted) {
    const d = daysUntil(act.nextDue);
    if (d < 0) return 'overdue';
    if (d <= 2) return 'soon';
    return 'fresh';
  }
  const d = daysSince(act.lastCompleted);
  if (d === null) return 'idle';
  if (d >= act.intervalDays) return 'overdue';
  // Clamp the "due soon" threshold to at least 1 day so daily and 2-day acts
  // show as fresh (green) when completed today instead of always "due soon".
  if (d >= Math.max(1, act.intervalDays - 2)) return 'soon';
  return 'fresh';
}

export function urgencyScore(act) {
  // One-time scheduled act: ranking by how far past/on its target date it is.
  if (act.nextDue && act.repeat === false) {
    return -daysUntil(act.nextDue);
  }
  // Recurring act with a start date, not yet done: rank by the start date.
  if (act.nextDue && !act.lastCompleted) {
    return -daysUntil(act.nextDue);
  }
  const d = daysSince(act.lastCompleted);
  // null = very overdue (treat as high)
  const overdue = d === null ? 999 : d - act.intervalDays;
  return overdue;
}

// Next due date for a repeating act (or a one-time scheduled act). null = due now.
export function nextDueDate(act) {
  if (act.repeat === false && act.nextDue) return act.nextDue;
  if (act.nextDue && !act.lastCompleted) return act.nextDue;
  if (!act.lastCompleted) return null;
  return new Date(new Date(act.lastCompleted).getTime() + (act.intervalDays || 0) * 86400000).toISOString();
}

// For recurring event types (birthday, anniversary, holiday), roll the stored
// date forward to the next occurrence if this year's has already passed.
// For one-time events (custom, trip), return the stored date unchanged.
const RECURRING_EVENT_TYPES = new Set(['birthday', 'anniversary', 'holiday']);

export function nextEventDate(dateStr, type) {
  if (!dateStr) return dateStr;
  if (!RECURRING_EVENT_TYPES.has(type)) return dateStr;
  const stored = new Date(dateStr);
  if (Number.isNaN(stored.getTime())) return dateStr;
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let next = new Date(now.getFullYear(), stored.getMonth(), stored.getDate());
  if (next < todayMidnight) {
    next = new Date(now.getFullYear() + 1, stored.getMonth(), stored.getDate());
  }
  return next.toISOString();
}

// Builds synthetic event entries from Person-profile birthdays & anniversaries
// (and the partner profile) so they can be surfaced on the Events "Upcoming" list
// even when no matching Event record was created. Deduplicates against existing
// events by matching the person's name + type.
export function buildPersonDateEntries(profile, people, events) {
  const entries = [];
  const push = (person, kind, dateStr) => {
    if (!dateStr) return;
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!m || !d) return;
    const now = new Date();
    let next = new Date(now.getFullYear(), m - 1, d);
    if (next < now) next = new Date(now.getFullYear() + 1, m - 1, d);
    const displayName = person.preferredName || person.name;
    const occasionLabel = kind === 'birthday' ? 'Birthday' : 'Anniversary';
    const name = `${displayName}'s ${occasionLabel}`;
    entries.push({
      id: `pdate-${person.id || 'partner'}-${kind}`,
      name,
      date: next.toISOString(),
      type: kind,
      note: '',
      relation: person.relation || '',
      _fromProfile: true,
    });
  };
  const partnerPerson = (people || []).find((p) => ['partner', 'spouse'].includes((p.relation || '').toLowerCase()));
  const partnerName = profile?.name?.trim() || partnerPerson?.name;
  const partnerBirthday = profile?.birthday || partnerPerson?.birthday;
  const partnerAnniversary = profile?.anniversary || partnerPerson?.anniversary;
  if (partnerName || partnerBirthday || partnerAnniversary) {
    push({ id: 'partner', name: partnerName || 'Partner', preferredName: partnerPerson?.preferredName }, 'birthday', partnerBirthday);
    push({ id: 'partner', name: partnerName || 'Partner', preferredName: partnerPerson?.preferredName }, 'anniversary', partnerAnniversary);
  }
  (people || []).forEach((p) => {
    if (partnerPerson && p.id === partnerPerson.id) return;
    if (partnerName && p.name === partnerName) return;
    push(p, 'birthday', p.birthday);
    push(p, 'anniversary', p.anniversary);
  });
  return entries;
}

// Should the act appear on the Home "to do" list? Completed acts are hidden from
// Home, then reappear one day before they're next due (or once past due).
export function isActDueOnHome(act) {
  if (act.repeat === false) {
    if (act.lastCompleted) return false; // one-time act already done
    return act.nextDue ? daysUntil(act.nextDue) <= 1 : true;
  }
  // Recurring act with a start date, not yet done: due on/after the start date.
  if (act.nextDue && !act.lastCompleted) {
    return daysUntil(act.nextDue) <= 1;
  }
  if (!act.lastCompleted) return true; // repeating, never done → due now
  const due = nextDueDate(act);
  if (!due) return true;
  return daysUntil(due) <= 1;
}

// Completed within the current cycle and therefore hidden from Home — these are
// the ones shown (editable) on the partner profile.
export function isActCompletedHidden(act) {
  return !!act.lastCompleted && !isActDueOnHome(act);
}

// Projects a scheduled act's occurrences that fall within [rangeStart, rangeEnd].
// - One-time acts (repeat === false with a nextDue) contribute their single date.
// - Recurring acts with a nextDue + intervalDays project forward from the start
//   date by the cadence, up to a 1-year horizon, so the calendar shows them "as
//   far out as they are scheduled".
// - Legacy recurring acts (no nextDue) fall back to a single next-due date.
export function actOccurrences(act, rangeStart, rangeEnd, horizonDays = 365) {
  const out = [];
  if (!act) return out;
  if (act.repeat === false && act.nextDue) {
    const d = new Date(act.nextDue);
    if (!Number.isNaN(d.getTime()) && d >= rangeStart && d <= rangeEnd) out.push(d);
    return out;
  }
  if (act.nextDue && act.intervalDays) {
    const start = new Date(act.nextDue);
    if (Number.isNaN(start.getTime())) return out;
    const cap = new Date(Math.min(rangeEnd.getTime(), start.getTime() + horizonDays * 86400000));
    let cur = new Date(start);
    while (cur <= cap) {
      if (cur >= rangeStart) out.push(new Date(cur));
      cur = new Date(cur.getTime() + act.intervalDays * 86400000);
    }
    return out;
  }
  if (act.intervalDays) {
    const due = act.lastCompleted
      ? new Date(new Date(act.lastCompleted).getTime() + act.intervalDays * 86400000)
      : new Date();
    if (Number.isNaN(due.getTime())) return out;
    // Project forward across the visible range so recurring acts without a
    // nextDue (legacy) still appear on every scheduled date this month.
    const cap = new Date(Math.min(rangeEnd.getTime(), due.getTime() + horizonDays * 86400000));
    let cur = new Date(due);
    while (cur <= cap) {
      if (cur >= rangeStart) out.push(new Date(cur));
      cur = new Date(cur.getTime() + act.intervalDays * 86400000);
    }
  }
  return out;
}

// Collects every birthday, anniversary, and pet adoption ("Gotcha Day") occasion
// from the partner profile, people, and pets. Returns a list of
// { id, name, kind, label, month, day, notify } where month is 0-indexed and day
// is the day-of-month. Used by the calendar (day-of + day-before pre-reminder
// dots) and the notification engine (day-of + day-before alerts).
export function collectOccasions(profile, people, pets) {
  const out = [];
  const push = (entity, kind, dateStr) => {
    if (!dateStr) return;
    // Date-only strings (YYYY-MM-DD) are parsed as UTC by JavaScript, which
    // shifts the local date back a day in timezones behind UTC. Parse manually
    // to preserve the correct local month/day.
    const parts = dateStr.split('-').map(Number);
    const d = parts.length === 3 && parts[0] && parts[1] && parts[2]
      ? new Date(parts[0], parts[1] - 1, parts[2])
      : new Date(dateStr);
    if (Number.isNaN(d.getTime())) return;
    const name = entity.preferredName || entity.name;
    const occasion = kind === 'birthday' ? 'Birthday' : kind === 'adoption' ? 'Gotcha Day' : kind === 'remembrance' ? 'Remembrance Day' : 'Anniversary';
    out.push({
      id: `${entity.id || 'partner'}-${kind}`,
      name,
      kind,
      label: `${name}'s ${occasion}`,
      month: d.getMonth(),
      day: d.getDate(),
      dateStr,
      leadDays: entity.remembranceLeadDays,
      notify: entity.notify !== false,
    });
  };
  const partnerPerson = (people || []).find((p) => ['partner', 'spouse'].includes((p.relation || '').toLowerCase()));
  const partnerName = profile?.name?.trim() || partnerPerson?.name;
  const partnerBirthday = profile?.birthday || partnerPerson?.birthday;
  const partnerAnniversary = profile?.anniversary || partnerPerson?.anniversary;
  if (partnerName || partnerBirthday || partnerAnniversary) {
    push({ id: 'partner', name: partnerName || 'Partner', preferredName: partnerPerson?.preferredName }, 'birthday', partnerBirthday);
    push({ id: 'partner', name: partnerName || 'Partner', preferredName: partnerPerson?.preferredName }, 'anniversary', partnerAnniversary);
  }
  (people || []).forEach((p) => {
    if (partnerPerson && p.id === partnerPerson.id) return;
    if (partnerName && p.name === partnerName) return;
    // A contact being remembered keeps one annual date instead of the
    // birthday/anniversary pair — no cards, gifts or celebrations.
    if (p.remembering) {
      push(p, 'remembrance', p.remembranceDate);
      return;
    }
    push(p, 'birthday', p.birthday);
    push(p, 'anniversary', p.anniversary);
  });
  (pets || []).forEach((pet) => {
    if (pet.remembering) {
      push(pet, 'remembrance', pet.remembranceDate);
      return;
    }
    push(pet, 'birthday', pet.birthday);
    push(pet, 'adoption', pet.adoptionDate);
  });
  return out;
}