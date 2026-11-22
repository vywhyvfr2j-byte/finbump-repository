import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Removes a reservation suggestion from a trip's shared list. The host (owner)
// can remove any suggestion; a traveler can remove only the ones they added.
// Travelers authenticate with their private invite token, the host with login.

function clean(value: unknown, max: number): string {
  return String(value ?? '').trim().slice(0, max);
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const tripId = clean(body.tripId, 64);
    const token = clean(body.token, 128);
    const reservationId = clean(body.reservationId, 64);
    if (!tripId || !reservationId) {
      return Response.json({ error: 'A trip and reservation are required' }, { status: 400 });
    }

    const existing = await base44.asServiceRole.entities.Trip.filter({ tripId });
    const trip = existing[0];
    if (!trip) return Response.json({ error: 'This trip is not available' }, { status: 404 });

    let isHost = false;
    let travelerId = '';
    let travelerName = '';
    let nameIsUnique = true;
    if (token && token.length >= 32) {
      const traveler = (trip.travelers || []).find((t: any) => t.token === token);
      if (!traveler) return Response.json({ error: 'This invite link is no longer valid' }, { status: 404 });
      travelerId = traveler.id || '';
      travelerName = traveler.name || '';
      // Only a name shared by no other traveler can identify a legacy suggestion.
      nameIsUnique = (trip.travelers || []).filter((t: any) => (t.name || '') === travelerName).length <= 1;
      isHost = false;
    } else {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      if (trip.created_by_id !== user.id && user.role !== 'admin') {
        return Response.json({ error: 'Only the owner can remove a reservation here' }, { status: 403 });
      }
      isHost = true;
    }

    const reservations = trip.reservations || [];
    // A traveler's suggestion is matched on the traveler id stored with it. Only
    // suggestions saved before that id existed fall back to the display name, and
    // only while that name belongs to a single traveler — so two travelers who
    // share a name can never remove each other's suggestions.
    const target = isHost
      ? reservations.find((r: any) => r.id === reservationId)
      : reservations.find(
          (r: any) =>
            r.id === reservationId &&
            !r.byHost &&
            (r.travelerId
              ? r.travelerId === travelerId
              : nameIsUnique && r.suggestedBy === travelerName),
        );
    if (!target) {
      return Response.json({ error: 'You can only remove your own suggestions' }, { status: 403 });
    }

    const filtered = reservations.filter((r: any) => r.id !== reservationId);
    await base44.asServiceRole.entities.Trip.update(trip.id, { reservations: filtered });
    return Response.json({ ok: true, reservations: filtered });
  } catch (error: any) {
    console.error('remove-trip-reservation failed:', error?.message || error);
    return Response.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}