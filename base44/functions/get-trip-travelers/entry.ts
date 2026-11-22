import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Authenticated owner view of a trip's travelers: who's been invited, who has
// answered, and each traveler's shared preferences, plus the AI plan if one
// has been generated. The owner may read their own Trip record under RLS; this
// returns only the collaboration fields so the Travelers panel can render.

function clean(value: unknown, max: number): string {
  return String(value ?? '').trim().slice(0, max);
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const tripId = clean(body.tripId, 64);
    if (!tripId) return Response.json({ error: 'A trip is required' }, { status: 400 });

    const existing = await base44.entities.Trip.filter({ tripId });
    const trip = existing[0];
    if (!trip) return Response.json({ error: 'Trip not found' }, { status: 404 });
    if (trip.created_by_id !== user.id && user.role !== 'admin') {
      return Response.json({ error: 'Only the owner can view the travelers' }, { status: 403 });
    }

    const travelers = (trip.travelers || []).map((t: any) => ({
      id: t.id,
      name: t.name,
      email: t.email,
      role: t.role || 'editor',
      invitedAt: t.invitedAt || '',
      respondedAt: t.respondedAt || '',
      response: t.response || null,
    }));

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
      createdAt: r.createdAt || '',
    }));

    return Response.json({
      id: trip.id,
      status: trip.status || 'planning',
      travelers,
      reservations,
      aiPlan: trip.aiPlan || null,
      aiGeneratedAt: trip.aiGeneratedAt || '',
      respondedCount: travelers.filter((t: any) => t.respondedAt).length,
    });
  } catch (error: any) {
    console.error('get-trip-travelers failed:', error?.message || error);
    return Response.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}