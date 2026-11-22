// Quiet hours: the window a user never wants to be nudged in.
//
// The app's reminders all run on US Central Time (8am push, 6pm/9pm evening
// check-in, Monday digest), so the window is compared on that same clock — the
// one window governs pushes, reminder emails, and the in-app reminders below.
// The scheduled senders honour it server-side with the same maths
// (base44/shared/quietHours.ts); a change to one must be matched in the other.

export const DEFAULT_QUIET_START = '21:00';
export const DEFAULT_QUIET_END = '07:00';

const TIME_ZONE = 'America/Chicago';

export function minutesFromHHMM(value) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value ?? '').trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

// Minutes since midnight on the app's reminder clock.
export function quietClockMinutes(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const get = (type) => Number(parts.find((p) => p.type === type)?.value || 0);
  // Some locales render midnight as 24 — normalize it back to 0.
  return (get('hour') % 24) * 60 + get('minute');
}

// True when `minutes` falls inside the window. A window may cross midnight
// (21:00 → 07:00), in which case it covers both ends of the day.
export function isWithinWindow(startValue, endValue, minutes) {
  const start = minutesFromHHMM(startValue) ?? minutesFromHHMM(DEFAULT_QUIET_START);
  const end = minutesFromHHMM(endValue) ?? minutesFromHHMM(DEFAULT_QUIET_END);
  if (start === null || end === null || start === end) return false;
  return start < end ? minutes >= start && minutes < end : minutes >= start || minutes < end;
}

// A single "HH:MM" as a short clock label, e.g. "9:00 PM".
export function formatClock(value) {
  const minutes = minutesFromHHMM(value) ?? minutesFromHHMM(DEFAULT_QUIET_START);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const suffix = hours < 12 ? 'AM' : 'PM';
  const display = hours % 12 === 0 ? 12 : hours % 12;
  return `${display}:${String(mins).padStart(2, '0')} ${suffix}`;
}

// "9:00 PM – 7:00 AM"
export function quietWindowLabel(startValue, endValue) {
  return `${formatClock(startValue)} – ${formatClock(endValue)}`;
}

// The window the notification hooks check. It lives in a module cache so a
// reminder hook can consult it without the preference being threaded through
// every one of them; the app keeps it current from the signed-in user's
// preferences (see setQuietHoursPrefs in src/App.jsx).
let quietPrefs = null;

export function setQuietHoursPrefs(prefs) {
  quietPrefs = prefs || null;
}

export function isQuietHoursNow(now = new Date()) {
  if (!quietPrefs?.quietHoursEnabled) return false;
  return isWithinWindow(quietPrefs.quietHoursStart, quietPrefs.quietHoursEnd, quietClockMinutes(now));
}