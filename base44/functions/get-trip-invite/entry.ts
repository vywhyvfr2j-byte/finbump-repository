import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Public endpoint behind the trip invite link. Reached by people who may not
// have a FinBump account, so it authenticates on the per-traveler token alone
// and runs as service role. Returns only what the traveler needs: the trip's
// plan, their own saved answer, and the other travelers' names.

function clean(value: unknown, max: number): string {
  return String(value ?? '').trim().slice(0, max);
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const tripId = clean(body.tripId, 64);
    const token = clean(body.token, 128);
    if (!tripId || token.length < 32) {
      return Response.json({ error: 'This invite link is not valid' }, { status: 400 });
    }

    const existing = await base44.asServiceRole.entities.Trip.filter({ tripId });
    const trip = existing[0];
    if (!trip) return Response.json({ error: 'This invite link is no longer valid' }, { status: 404 });

    // The per-traveler token is the only credential here, so it is checked before
    // anything about the trip (including its status) is returned.
    const travelers = trip.travelers || [];
    const traveler = travelers.find((t: any) => t.token === token);
    if (!traveler) return Response.json({ error: 'This invite link is no longer valid' }, { status: 404 });
    if (trip.status === 'cancelled') {
      return Response.json({ error: 'This trip was cancelled' }, { status: 409 });
    }

    const reservations = (trip.reservations || []).map((r: any) => ({
      id: r.id,
      type: r.type || 'restaurant',
      name: r.name,
      dateTime: r.dateTime || '',
      partySize: r.partySize || 0,
      location: r.location || '',
      notes: r.notes || '',
      suggestedBy: r.suggestedBy || '',
      byHost: !!r.byHost,
      // Lets the traveler's page mark which ones they can remove.
      mine: !r.byHost && r.suggestedBy === (traveler.name || ''),
    }));

    return Response.json({
      trip: {
        name: trip.name,
        hostName: trip.hostName,
        status: trip.status,
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        notes: trip.notes,
      },
      // The AI-generated plan is shared read-only with the traveler so both
      // sides see the same destination ideas, itinerary, and suggestions.
      aiPlan: trip.aiPlan || null,
      reservations,
      you: {
        name: traveler.name,
        role: traveler.role || 'editor',
        respondedAt: traveler.respondedAt || '',
        reminderOptOut: !!traveler.reminderOptOut,
        response: traveler.response || null,
      },
      others: travelers
        .filter((t: any) => t.token !== token)
        .map((t: any) => ({ name: t.name, responded: !!t.respondedAt })),
      totalCount: travelers.length,
      respondedCount: travelers.filter((t: any) => t.respondedAt).length,
    });
  } catch (error: any) {
    console.error('get-trip-invite failed:', error?.message || error);
    return Response.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}