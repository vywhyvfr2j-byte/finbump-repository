// Quiet hours: the window a user never wants to be nudged in.
//
// Every scheduled reminder in this app fires on US Central Time (8am push,
// 6pm/9pm evening check-in, Monday digest), so the window is compared on that
// same clock and one window governs every channel for the user. The client
// mirrors this logic in src/lib/quietHours.js — a change to one must be matched
// in the other.
//
// Times live on UserPreference as "HH:MM" strings, so a window may cross
// midnight (21:00 → 07:00). A missing or zero-length window never blocks
// anything.

export const DEFAULT_QUIET_START = '21:00';
export const DEFAULT_QUIET_END = '07:00';

const TIME_ZONE = 'America/Chicago';

export function minutesFromHHMM(value: unknown): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value ?? '').trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function clockMinutes(now: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value || 0);
  // Some locales render midnight as 24 — normalize it back to 0.
  return (get('hour') % 24) * 60 + get('minute');
}

// True while the user's quiet window is open, so a sender should hold its nudge
// rather than deliver it. Anything held is picked up by the next run.
export function isQuietHours(pref: any, now: Date = new Date()): boolean {
  if (!pref?.quietHoursEnabled) return false;
  const start = minutesFromHHMM(pref.quietHoursStart) ?? minutesFromHHMM(DEFAULT_QUIET_START)!;
  const end = minutesFromHHMM(pref.quietHoursEnd) ?? minutesFromHHMM(DEFAULT_QUIET_END)!;
  if (start === end) return false;
  const minutes = clockMinutes(now);
  return start < end ? minutes >= start && minutes < end : minutes >= start || minutes < end;
}