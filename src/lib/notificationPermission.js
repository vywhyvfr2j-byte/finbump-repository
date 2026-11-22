import { trackEvent } from '@/hooks/useFeatureTracking';

// Notification permission is the gate on FinBump's core value: without it no
// reminder is ever delivered. The outcome is therefore recorded as an analytics
// event (state only — never a name, a title or a reminder's text), once per
// session per state, so the daily permission rate stays accurate without
// flooding the events table.
let lastReported = null;

function report(state) {
  if (lastReported === state) return;
  lastReported = state;
  trackEvent('notification_permission', 'notifications', { result: state });
}

export function supportsNotifications() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function currentNotificationPermission() {
  if (!supportsNotifications()) return 'unsupported';
  const perm = window.Notification.permission;
  return perm === 'granted' || perm === 'denied' ? perm : 'default';
}

// Records the permission a session starts with, so the rate counts every
// active user — not only the ones who happened to be prompted that day.
export function recordNotificationPermission() {
  report(currentNotificationPermission());
}

// Single entry point for asking permission: records the answer, then behaves
// exactly like Notification.requestPermission().
export function requestNotificationPermission() {
  if (!supportsNotifications() || typeof window.Notification.requestPermission !== 'function') {
    report('unsupported');
    return Promise.resolve('unsupported');
  }
  return window.Notification.requestPermission()
    .then((result) => {
      const state = result === 'granted' || result === 'denied' ? result : 'default';
      report(state);
      return result;
    })
    .catch(() => {
      report(currentNotificationPermission());
      return currentNotificationPermission();
    });
}