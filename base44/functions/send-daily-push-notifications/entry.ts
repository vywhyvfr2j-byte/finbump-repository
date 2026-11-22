// 0.8.49+ is required: the cursor-paged filters in shared/batchProcess.ts pass
// an options object (filter(query, { sort, limit })). On older SDKs that object
// is sent as query filters, the API rejects it with 400, and every run failed.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { batchMap, filterAllByCursor } from "../../shared/batchProcess.ts";
import { isQuietHours } from "../../shared/quietHours.ts";
import { resolveShard } from "../../shared/shard.ts";
import { chicagoDayRange } from "../../shared/analyticsRollup.ts";

// Scheduled by the "Daily Push Notifications" workflow (8am CT daily). Runs as
// service role across every user, builds a per-reminder list of their
// overdue/due acts of support and prayer/health/care reminders, and sends one
// push notification per due reminder — each deep-linking to the specific act,
// the Prayer care hub, or the calendar. Respects per-act and per-person
// `notify` flags, and the user's `pushNotifications` preference on their
// UserPreference record. Capped at MAX_PER_USER reminders per user per cycle.
//
// Security: requires an authenticated admin via base44.auth.me(). The workflow's
// invoke_backend_function activity runs as the platform service role which
// provides an admin-level auth context.
//
// Note: SendPushNotification only delivers to a native iOS/Android build with
// push credentials configured. Users without a registered device token will
// fail silently (counted as `failed`) — this is expected, not an error.
//
// Paging: users are read one page at a time (500 per page), and each page's
// acts, people, pets, preferences and events are cursor-paged for just those
// users. Nothing from one page is held while the next is processed, so memory
// and data read stay flat as the base grows toward 100,000 accounts. Eligible
// users are then sent push notifications in parallel batches.

// --- Server-side replicas of the client-side keepsakeUtils logic ---
function daysSince(dateStr) {
  if (!dateStr) return null;
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return null;
  return Math.floor((Date.now() - then) / 86400000);
}

function daysUntil(dateStr) {
  const d = new Date(dateStr).getTime();
  if (Number.isNaN(d)) return NaN;
  return Math.ceil((d - Date.now()) / 86400000);
}

// Next annual occurrence of a month/day date (birthday, anniversary). Mirrors
// the client-side nextOccurrence in peopleConstants.js.
function nextOccurrence(dateStr) {
  if (!dateStr) return null;
  const parts = String(dateStr).split('-').map(Number);
  if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [, m, d] = parts;
  const now = new Date();
  let next = new Date(now.getFullYear(), m - 1, d);
  if (next < now) next = new Date(now.getFullYear() + 1, m - 1, d);
  return next.toISOString();
}

// Remembrance dates are compared by calendar day, so the date itself still
// counts as today for the whole day (nextOccurrence rolls a same-day date to
// next year). Mirrors nextRemembrance in src/lib/remembrance.js.
function nextRemembranceDay(dateStr) {
  if (!dateStr) return null;
  const parts = String(dateStr).split('-').map(Number);
  if (parts.length < 3 || parts.some(Number.isNaN)) return null;
  const [, m, d] = parts;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let next = new Date(today.getFullYear(), m - 1, d);
  if (Number.isNaN(next.getTime())) return null;
  if (next < today) next = new Date(today.getFullYear() + 1, m - 1, d);
  return { date: next, days: Math.round((next.getTime() - today.getTime()) / 86400000) };
}

// Lead window (in days) for event & "send a card" reminders in the daily push.
// Matches CARD_LEAD_DAYS in useSendCardReminders.js so push and in-app/browser
// reminders stay in sync.
const PUSH_LEAD_DAYS = 10;

// Counts upcoming events (within PUSH_LEAD_DAYS) and birthday/anniversary card
// reminders (next occurrence within PUSH_LEAD_DAYS). Respects per-event and
// per-person `notify` flags. The partner profile (UserPreference) birthday &
// anniversary are included so the user's spouse/partner occasions surface too.
function eventCardCount(events, people, partnerPref) {
  let upcomingEvents = 0;
  let cardReminders = 0;

  for (const ev of events || []) {
    if (ev.notify === false) continue;
    const d = daysUntil(ev.date);
    if (d >= 0 && d <= PUSH_LEAD_DAYS) upcomingEvents++;
  }

  const checkCard = (dateStr) => {
    if (!dateStr) return;
    const next = nextOccurrence(dateStr);
    if (!next) return;
    const d = daysUntil(next);
    if (d >= 0 && d <= PUSH_LEAD_DAYS) cardReminders++;
  };

  for (const p of people || []) {
    if (p.notify === false) continue;
    // Someone being remembered gets the annual remembrance nudge instead of cards.
    if (p.remembering) continue;
    checkCard(p.birthday);
    checkCard(p.anniversary);
  }
  if (partnerPref) {
    checkCard(partnerPref.birthday);
    checkCard(partnerPref.anniversary);
  }

  return { upcomingEvents, cardReminders };
}

// urgency: 'overdue' | 'soon' | 'fresh' | 'idle'
function actStatus(act) {
  if (act.nextDue && act.repeat === false) {
    const d = daysUntil(act.nextDue);
    if (d < 0) return 'overdue';
    if (d <= 2) return 'soon';
    return 'fresh';
  }
  if (act.nextDue && !act.lastCompleted) {
    const d = daysUntil(act.nextDue);
    if (d < 0) return 'overdue';
    if (d <= 2) return 'soon';
    return 'fresh';
  }
  const d = daysSince(act.lastCompleted);
  if (d === null) return 'idle';
  if (d >= act.intervalDays) return 'overdue';
  if (d >= act.intervalDays - 2) return 'soon';
  return 'fresh';
}

// Checks whether a care reminder (health, prayer, other) is due based on its
// cadence and the last logged action. Respects optional end dates.
function careDue(person, daysField, lastField, endField) {
  const days = person[daysField];
  if (!days || days <= 0) return false;
  if (person[endField]) {
    const end = new Date(person[endField]);
    if (!Number.isNaN(end.getTime())) {
      end.setHours(23, 59, 59, 999);
      if (Date.now() > end.getTime()) return false;
    }
  }
  if (!person[lastField]) return true;
  const last = new Date(person[lastField]);
  if (Number.isNaN(last.getTime())) return true;
  return Math.floor((Date.now() - last.getTime()) / 86400000) >= days;
}

// Builds a list of due reminders for one user, each with a deep link to the
// page where they can act on it. Care reminders (prayer/health/other) link to
// the Prayer care hub, due acts link to that specific act, and upcoming
// occasions link to the calendar. Capped at MAX_PER_USER so we never spam a
// user with many notifications in one push cycle.
const MAX_PER_USER = 5;

function personLabel(p) {
  return p.preferredName || p.name || 'them';
}

function buildReminders(acts, people, events, partnerPref) {
  const reminders = [];

  for (const act of acts) {
    if (act.notify === false) continue;
    const status = actStatus(act);
    if (status !== 'overdue' && status !== 'soon') continue;
    const person = people.find((p) => p.id === act.personId);
    const name = person ? personLabel(person) : (act.person || '');
    reminders.push({
      priority: status === 'overdue' ? 2 : 3,
      title: act.name,
      body: name ? `Show up for ${name} — this is ${status}.` : `This reminder is ${status}.`,
      action_url: `/acts/${act.id}`,
      action_label: 'Open',
    });
  }

  for (const person of people) {
    // Remembered contacts keep no prayer/health/other check-in cadence.
    if (person.notify === false || person.remembering) continue;
    const name = personLabel(person);
    if (person.prayerEnabled && careDue(person, 'prayerReminderDays', 'lastPrayedAt', 'prayerReminderEndDate')) {
      const since = daysSince(person.lastPrayedAt);
      reminders.push({
        priority: 1,
        title: `Pray for ${name}`,
        body: since ? `It's been ${since} day${since === 1 ? '' : 's'} since you last prayed.` : 'Time to lift them up in prayer.',
        action_url: '/prayer',
        action_label: 'Open',
      });
    }
    if (careDue(person, 'healthReminderDays', 'lastHealthCheckIn', 'healthReminderEndDate')) {
      const since = daysSince(person.lastHealthCheckIn);
      reminders.push({
        priority: 1,
        title: `Check in on ${name}`,
        body: since ? `It's been ${since} day${since === 1 ? '' : 's'} since your last check-in.` : 'A health check-in is due.',
        action_url: '/prayer',
        action_label: 'Open',
      });
    }
    if (careDue(person, 'otherReminderDays', 'lastOtherCheckIn', 'otherReminderEndDate')) {
      const since = daysSince(person.lastOtherCheckIn);
      reminders.push({
        priority: 1,
        title: `Check in on ${name}`,
        body: since ? `It's been ${since} day${since === 1 ? '' : 's'} since your last check-in.` : 'A care check-in is due.',
        action_url: '/prayer',
        action_label: 'Open',
      });
    }
  }

  // Remembrance days — the annual date the user keeps for someone who has
  // passed or is no longer in their life. The lead time is per contact
  // (default 3 days), and the nudge opens the contact, never a card.
  for (const p of people || []) {
    if (p.notify === false || !p.remembering || !p.remembranceDate) continue;
    const next = nextRemembranceDay(p.remembranceDate);
    if (!next) continue;
    const d = next.days;
    const lead = Number.isFinite(Number(p.remembranceLeadDays)) ? Number(p.remembranceLeadDays) : 3;
    if (d < 0 || d > lead) continue;
    const isPet = !!(p.species || p.adoptionDate);
    const label = personLabel(p);
    reminders.push({
      priority: d === 0 ? 0 : 4,
      title: d === 0 ? `Remembering ${label}` : `Remembering ${label} in ${d} day${d === 1 ? '' : 's'}`,
      body: d === 0 ? 'A day to hold them close, however you like.' : 'A date you keep is coming up.',
      action_url: isPet ? `/pets?pet=${p.id}` : `/people?person=${p.id}`,
      action_label: 'Open',
    });
  }

  // Surface occasions (events, birthdays, anniversaries) within the push lead
  // window. Day-of occasions get a warm, celebratory push (priority 0) that
  // deep-links to the card builder; upcoming (non-today) occasions get a single
  // "coming up" push for the soonest one, deep-linking to the calendar.
  const dayOfOccasions = [];
  const upcomingOccasions = [];
  for (const ev of events || []) {
    if (ev.notify === false) continue;
    const d = daysUntil(ev.date);
    if (d < 0 || d > PUSH_LEAD_DAYS) continue;
    const occ = { title: ev.name, date: new Date(ev.date), kind: 'event', personId: null };
    if (d === 0) dayOfOccasions.push(occ);
    else upcomingOccasions.push(occ);
  }
  const checkOcc = (dateStr, label, personId, kind) => {
    if (!dateStr) return;
    const next = nextOccurrence(dateStr);
    if (!next) return;
    const d = daysUntil(next);
    if (d < 0 || d > PUSH_LEAD_DAYS) return;
    const occ = { title: label, date: new Date(next), kind, personId };
    if (d === 0) dayOfOccasions.push(occ);
    else upcomingOccasions.push(occ);
  };
  for (const p of people || []) {
    if (p.notify === false) continue;
    // A remembered contact's only annual date is their remembrance day.
    if (p.remembering) continue;
    if (p.birthday) checkOcc(p.birthday, `${personLabel(p)}'s birthday`, p.id, 'birthday');
    if (p.anniversary) checkOcc(p.anniversary, `${personLabel(p)}'s anniversary`, p.id, 'anniversary');
  }
  if (partnerPref) {
    if (partnerPref.birthday) checkOcc(partnerPref.birthday, `${partnerPref.name || 'Partner'}'s birthday`, null, 'birthday');
    if (partnerPref.anniversary) checkOcc(partnerPref.anniversary, `${partnerPref.name || 'Partner'}'s anniversary`, null, 'anniversary');
  }
  // Day-of: one celebratory push per occasion happening today. Birthdays and
  // anniversaries deep-link to the card builder pre-filled for that person;
  // events link to the calendar.
  for (const occ of dayOfOccasions) {
    const emoji = occ.kind === 'birthday' ? '🎂' : occ.kind === 'anniversary' ? '💐' : '🎉';
    const occasionKey = occ.kind === 'birthday' ? 'birthday' : occ.kind === 'anniversary' ? 'anniversary' : 'justbecause';
    const actionUrl = occ.personId
      ? `/card-builder?personId=${occ.personId}&occasion=${occasionKey}`
      : '/calendar';
    reminders.push({
      priority: 0,
      title: `${emoji} It's ${occ.title} today!`,
      body: `Don't forget to reach out and make them feel special.`,
      action_url: actionUrl,
      action_label: 'Send a card',
    });
  }
  // Upcoming: single push for the soonest non-today occasion.
  if (upcomingOccasions.length > 0) {
    upcomingOccasions.sort((a, b) => a.date - b.date);
    const next = upcomingOccasions[0];
    const dateStr = next.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    reminders.push({
      priority: 4,
      title: `${next.title} is coming up`,
      body: `Coming up on ${dateStr}.`,
      action_url: '/calendar',
      action_label: 'Open',
    });
  }

  // Prioritize care reminders (1), then overdue acts (2), soon acts (3), occasions (4).
  reminders.sort((a, b) => a.priority - b.priority);
  return reminders.slice(0, MAX_PER_USER);
}

// Users per page. A page is loaded, processed and released before the next one
// is fetched, so no run ever holds the whole user base or anyone else's records.
const USER_PAGE = 500;

// Safety valve: 2,000 pages is a million users — far past any real base, and a
// hard stop if a page walk ever failed to advance.
const MAX_USER_PAGES = 2000;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const svc = base44.asServiceRole;

    // Sharding: the workflow runs this function N times in sequence, each with
    // { shard, totalShards }. Each invocation owns every Nth page of users, so
    // the runs partition the base between them and none of them loads it all.
    const body = await req.json().catch(() => ({}));
    const { shard, totalShards } = resolveShard(body);

    // Server-side date filter for events: only events inside the push lead
    // window are ever needed.
    const nowMs = Date.now();
    const eventDateStart = new Date(nowMs - 86400000).toISOString();
    const eventDateEnd = new Date(nowMs + (PUSH_LEAD_DAYS + 2) * 86400000).toISOString();

    // Index one page's records by owner so the per-user loop is O(1) lookups.
    const indexByUser = (records) => {
      const map = new Map();
      for (const r of records) {
        const arr = map.get(r.created_by_id);
        if (arr) arr.push(r);
        else map.set(r.created_by_id, [r]);
      }
      return map;
    };

    let sent = 0;
    let failed = 0;
    let skipped = 0;
    let noData = 0;
    let pages = 0;
    let usersSeen = 0;
    let probed = false;
    // True when the probe proved push cannot be delivered at all (no native
    // build with APNs/FCM credentials). That is a configuration state, not a
    // run failure: the run finishes cleanly so the schedule is never auto-paused
    // and it simply starts delivering the day the credentials exist.
    let notConfigured = false;

    const sendOne = async ({ user: recipient, reminders }: { user: any; reminders: any[] }) => {
      for (const r of reminders) {
        await svc.integrations.Core.SendPushNotification({
          user_id: recipient.id,
          title: r.title,
          content: r.body,
          action_label: r.action_label,
          action_url: r.action_url,
        });
      }
    };

    // Users are walked by skip (the built-in User entity has no cursor form).
    // Everything owned by those users IS cursor-paged, so a large collection is
    // followed to the end instead of being cut off at the 5000-record cap.
    for (
      let skip = shard * USER_PAGE;
      pages < MAX_USER_PAGES;
      skip += totalShards * USER_PAGE
    ) {
      const pageUsers = await svc.entities.User.list('-created_date', USER_PAGE, skip);
      if (pageUsers.length === 0) break;
      pages++;
      usersSeen += pageUsers.length;

      const ids = pageUsers.map((u) => u.id);

      // Only this page's records are loaded, walked to their last page by cursor.
      const [prefs, acts, people, pets, events] = await Promise.all([
        filterAllByCursor<any>(svc.entities.UserPreference, { created_by_id: { $in: ids } }),
        filterAllByCursor<any>(svc.entities.Act, { created_by_id: { $in: ids } }),
        filterAllByCursor<any>(svc.entities.Person, { created_by_id: { $in: ids } }),
        filterAllByCursor<any>(svc.entities.Pet, { created_by_id: { $in: ids } }),
        filterAllByCursor<any>(svc.entities.Event, {
          created_by_id: { $in: ids },
          date: { $gte: eventDateStart, $lte: eventDateEnd },
        }),
      ]);

      const prefsByUser = new Map();
      for (const p of prefs) prefsByUser.set(p.created_by_id, p);
      const actsByUser = indexByUser(acts);
      const peopleByUser = indexByUser(people);
      const petsByUser = indexByUser(pets);
      const eventsByUser = indexByUser(events);

      const eligible = [];
      for (const u of pageUsers) {
        const pref = prefsByUser.get(u.id);

        // Respect the user's push-notification opt-out.
        if (pref && pref.pushNotifications === false) {
          skipped++;
          continue;
        }

        // Quiet hours: nothing is pushed while the user's window is open. Their
        // reminders are rebuilt on the next run instead.
        if (isQuietHours(pref)) {
          skipped++;
          continue;
        }

        const userActs = actsByUser.get(u.id) || [];
        const userPeople = peopleByUser.get(u.id) || [];
        const userPets = petsByUser.get(u.id) || [];
        const userEvents = eventsByUser.get(u.id) || [];

        const reminders = buildReminders(userActs, [...userPeople, ...userPets], userEvents, pref);
        if (reminders.length === 0) {
          noData++;
          continue;
        }

        eligible.push({ user: u, reminders });
      }

      if (eligible.length > 0) {
        // Probe once, on the first page with anyone to notify: if every probe
        // push fails, push credentials (APNs/FCM) or the native mobile build are
        // almost certainly not configured — stop rather than churn through
        // thousands of failing API calls every morning. In-app notifications and
        // the daily digest email remain active fallbacks for these users.
        if (!probed) {
          const probeSize = Math.min(10, eligible.length);
          const probeResults = await batchMap(eligible.slice(0, probeSize), sendOne, 10);
          const probeFailed = probeResults.filter((r) => !r.ok).length;

          if (probeFailed === probeSize) {
            // Nobody can be reached: stop the run instead of churning through
            // failing API calls, but report it as a quiet skip rather than an
            // error. A failed run here would pause the workflow after a few
            // mornings, and it would stay paused on the day push starts working.
            for (const r of probeResults) {
              console.error('push probe failed', r.error?.message || r.error);
            }
            console.warn(
              'push_not_configured: every probe push failed — no native iOS/Android build with push credentials is configured. Recording the day as skipped; in-app notifications and the digest email cover these users. Push resumes by itself once credentials exist.'
            );
            skipped += probeSize;
            notConfigured = true;
            break;
          }

          probed = true;
          for (const r of probeResults) if (r.ok) sent++;
          failed += probeFailed;
          eligible.splice(0, probeSize);
        }

        // Push is live — send this page's remaining users in parallel batches.
        const restResults = await batchMap(eligible, sendOne, 200);
        for (const r of restResults) {
          if (r.ok) sent++;
          else {
            failed++;
            console.error('push failed', r.error?.message || r.error);
          }
        }
      }

      // A short page is the end of the user list.
      if (pageUsers.length < USER_PAGE) break;
    }

    // Record the run so reminder delivery can be reviewed over time: a day
    // where every probe fails means push is broken for everyone, and a slow
    // drift from sent to failed is visible before users stop showing up.
    // Bookkeeping must never fail the run, hence the guard.
    try {
      const dateKey = chicagoDayRange(new Date()).dateKey;
      const row = {
        dateKey,
        channel: 'push',
        shard,
        totalShards,
        sent,
        failed,
        skipped,
        noData,
        usersReached: usersSeen,
        recordedAt: new Date().toISOString(),
      };
      const existing = await svc.entities.ReminderDeliveryDaily.filter({
        dateKey,
        channel: 'push',
        shard,
        totalShards,
      });
      if (existing.length) await svc.entities.ReminderDeliveryDaily.update(existing[0].id, row);
      else await svc.entities.ReminderDeliveryDaily.create(row);
    } catch (error) {
      console.error('reminder delivery record failed', error?.message || error);
    }

    return Response.json({
      ok: true,
      sent,
      skipped,
      failed,
      noData,
      pages,
      usersSeen,
      probed,
      // Push not configured is reported, not thrown: the workflow keeps its
      // schedule and needs no manual re-activation later.
      pushNotConfigured: notConfigured,
      reason: notConfigured ? 'push_not_configured' : undefined,
      shard,
      totalShards,
    });
  } catch (error) {
    console.error(
      'send-daily-push-notifications error',
      error?.message || error,
      JSON.stringify(error?.response?.data || error?.data || {})
    );
    return Response.json({ error: 'Could not send push notifications.' }, { status: 500 });
  }
}