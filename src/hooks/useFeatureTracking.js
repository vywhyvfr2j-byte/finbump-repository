import { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";

// Logs a single page_view event for the given feature when the component mounts.
// Fire-and-forget — analytics should never block the UI or break a page.
export function useFeatureTracking(feature, eventName = "page_view", metadata = {}) {
  const trackedRef = useRef(false);
  useEffect(() => {
    if (trackedRef.current) return;
    trackedRef.current = true;
    trackEvent(eventName, feature, metadata);
  }, [feature, eventName]);
}

// Central tracking helper. Uses the built-in analytics.track() plus writes an
// AnalyticsEvent through a backend function that stamps identity server-side,
// so admin usage metrics cannot be forged by the client (userId/userEmail are
// derived from the session in the function, never read from the client).
export async function trackEvent(eventName, feature, metadata = {}) {
  try {
    base44.analytics.track({ eventName, properties: { feature, ...metadata } });
  } catch {
    // ignore — analytics must never break the app
  }
  try {
    await base44.functions.invoke("track-analytics-event", { eventName, feature, metadata });
  } catch {
    // ignore — fire and forget
  }
}