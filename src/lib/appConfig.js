// App-wide operational resilience constants and helpers.

// Current app version — bump this with every release. The MinimumVersionGate
// compares it against the server-side AppConfig.minimumVersion field.
export const APP_VERSION = '1.0.2';

// localStorage cache key for the last-known-good AppConfig (offline fallback).
export const APP_CONFIG_CACHE_KEY = 'keepsake_app_config_v1';

// Stable per-client id used for rollout-percentage bucketing.
export const CLIENT_ID_KEY = 'keepsake_client_id';

// Default config when no AppConfig record exists yet (everything on, no banner).
export const DEFAULT_APP_CONFIG = {
  featureFlags: {},
  statusMessage: '',
  statusLevel: 'info',
  minimumVersion: '',
  maintenanceMode: false,
  rolloutPercentage: 100,
};

// Non-core features that can be remotely disabled via the kill switch.
// Core features (Home, Acts, People, Events, Settings) are never gated.
export const FEATURE_FLAGS = {
  aiMessageWriter: { label: 'AI Message Writer', description: 'AI-assisted message composition' },
  aiGiftFinder: { label: 'AI Gift Finder', description: 'AI-powered gift suggestions and recommendations page' },
  aiTripIdeas: { label: 'AI Trip Ideas', description: 'AI-generated vacation suggestions' },
  dailyEncouragement: { label: 'Daily Encouragement', description: 'Stories and scripture in notifications' },
  vacationPlanner: { label: 'Vacation Planner', description: 'Trip planning with shared partner sync' },
  giftTracker: { label: 'Gift Tracker', description: 'Gift ideas, budgets, and purchase tracking' },
  prayerPage: { label: 'Care & Prayer', description: 'Prayer and health check-in reminders' },
  milestones: { label: 'Milestones', description: 'Relationship milestone tracking' },
  personalNotes: { label: 'Personal Notes', description: 'Private note-taking' },
  relationshipGoals: { label: 'Relationship Goals', description: 'Goal tracking' },
  progressChart: { label: 'Progress Analytics', description: 'Support progress charts and stats' },
  scheduleCalendar: { label: 'Schedule Calendar', description: 'Calendar view of scheduled acts' },
  chatAssistant: { label: 'Chat Assistant', description: 'In-app AI chat helper' },
  partnerSync: { label: 'Partner Sync', description: 'Pairing and partner data sharing' },
  friendConnections: { label: 'Friend Connections', description: 'Friend code sharing and connection management' },
  groupMeals: { label: 'Grab a Meal', description: 'Group meal planning with AI venue suggestions and reminders' },
  remembrance: { label: 'Remembrance', description: 'Yearly remembrance dates with private photos' },
  memorySummary: { label: 'Year in Moments', description: 'A year-in-review of saved memory moments' },
};

// Compares two semver strings. Returns -1, 0, or 1.
export function compareVersions(v1, v2) {
  if (!v1) return v2 ? -1 : 0;
  if (!v2) return 1;
  const p1 = v1.split('.').map(Number);
  const p2 = v2.split('.').map(Number);
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const a = p1[i] || 0;
    const b = p2[i] || 0;
    if (a < b) return -1;
    if (a > b) return 1;
  }
  return 0;
}

// Returns a stable per-client id (created once, stored in localStorage).
export function getClientId() {
  try {
    let id = localStorage.getItem(CLIENT_ID_KEY);
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(CLIENT_ID_KEY, id);
    }
    return id;
  } catch {
    return 'fallback-client';
  }
}

// Deterministically decides whether this client is included in a rollout bucket.
export function isClientInRollout(percentage) {
  if (percentage >= 100) return true;
  if (percentage <= 0) return false;
  const id = getClientId();
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return (Math.abs(hash) % 100) < percentage;
}