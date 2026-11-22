import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { checkAndRecordAttempt } from '../../shared/codeAttemptLimit.ts';
import { sanitizeAnalyticsEvent } from '../../shared/analyticsPrivacy.ts';

// Writes a single AnalyticsEvent with identity stamped server-side from the
// authenticated session. Client-supplied userId/userEmail are never trusted, so
// admin usage metrics cannot be forged by attributing events to other users.
// AnalyticsEvent create is admin-only under RLS, so this service-role function
// is the only path that can create events — a user calling AnalyticsEvent.create
// directly through the SDK is rejected by RLS. A per-user write budget bounds
// flooding.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));

    // Privacy gate. Only declared events are accepted, and each one may carry
    // only the fields it declares. Names, notes, message text, prayer and
    // health details, emails and any other free text are dropped here, so they
    // can never reach the events table whatever a call site sends.
    const clean = sanitizeAnalyticsEvent(body.eventName, body.feature, body.metadata);
    if (!clean.ok) {
      return Response.json({ error: clean.reason }, { status: 400 });
    }
    const { eventName, feature, metadata } = clean;
    if (clean.dropped.length) {
      console.warn('analytics metadata dropped', clean.dropped.join(','));
    }

    // Per-user write budget so one account cannot flood the events table.
    const attempt = await checkAndRecordAttempt(base44, user.id, 'analytics-event', 1000, 60);
    if (!attempt.allowed) {
      return Response.json(
        { error: 'Too many events. Please try again later.' },
        { status: 429,
          headers: { 'Retry-After': String(attempt.retryAfterSeconds) } },
      );
    }

    // Identity is derived server-side from the session; the client cannot
    // choose it, so active-user counts and feature rankings stay authentic.
    await base44.asServiceRole.entities.AnalyticsEvent.create({
      eventName,
      feature,
      userId: user.id,
      userEmail: user.email || '',
      metadata,
    });
    return Response.json({ ok: true });
  } catch (error: any) {
    console.error('track-analytics-event error', error?.message || error);
    return Response.json({ error: 'Could not track event' }, { status: 500 });
  }
}