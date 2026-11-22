// The AI Trip Ideas card keeps its search results in component state, which is
// lost when the planner route unmounts (e.g. navigating to the review page).
// These helpers persist that transient state to sessionStorage so the planner
// still shows the user's ideas when they come back, and so the review page can
// mark an idea "added" before returning.

export const TRIP_IDEA_STORAGE_KEY = 'ks_ai_trip_ideas';

export function readTripIdeaState() {
  try {
    return JSON.parse(sessionStorage.getItem(TRIP_IDEA_STORAGE_KEY) || 'null') || null;
  } catch {
    return null;
  }
}

export function writeTripIdeaState(patch) {
  try {
    const cur = readTripIdeaState() || {};
    sessionStorage.setItem(TRIP_IDEA_STORAGE_KEY, JSON.stringify({ ...cur, ...patch }));
  } catch {
    /* storage unavailable — non-fatal */
  }
}