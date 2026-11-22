import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { checkPremiumEntitlement } from '../../shared/entitlement.ts';

// Adds a reservation suggestion to a trip's shared list. Reached two ways:
//   - Traveler: authenticated by their private invite token (no login).
//   - Host: authenticated as the trip's owner (premium, access approved).
// Either way the suggestion is appended to the single shared `reservations`
// array on the Trip record, so everyone invited sees the same list.

const MAX_RESERVATIONS = 60;
const TYPES = ['restaurant', 'activity', 'stay', 'transport', 'other'];

function clean(value: unknown, max: number): string {
  return String(value ?? '').trim().slice(0, max);
}
function isoOrEmpty(value: unknown): string {
  if (!value) return '';
  const d = new Date(value as string);
  return Number.isNaN(d.getTime()) ? '' : (value as string);
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const tripId = clean(body.tripId, 64);
    const token = clean(body.token, 128);
    if (!tripId) return Response.json({ error: 'A trip is required' }, { status: 400 });

    const existing = await base44.asServiceRole.entities.Trip.filter({ tripId });
    const trip = existing[0];
    // A traveler's link only exists once the host has sent invites, so a missing
    // record means the link is invalid. The host path below creates the record
    // if needed so they can start collecting suggestions before inviting anyone.
    if (trip && trip.status === 'cancelled') {
      return Response.json({ error: 'This trip was cancelled' }, { status: 409 });
    }

    let suggestedBy = '';
    let travelerId = '';
    let byHost = false;

    if (token && token.length >= 32) {
      if (!trip) return Response.json({ error: 'This invite link is no longer valid' }, { status: 404 });
      const traveler = (trip.travelers || []).find((t: any) => t.token === token);
      if (!traveler) return Response.json({ error: 'This invite link is no longer valid' }, { status: 404 });
      suggestedBy = traveler.name || 'Traveler';
      // The traveler's unique id is stored with the suggestion so it can be
      // matched back to its author later, even when two travelers share a name.
      travelerId = traveler.id || '';
      byHost = false;
    } else {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      if (user.role !== 'admin') {
        const { isPremium } = await checkPremiumEntitlement(base44.asServiceRole, user.id, user.email);
        if (!isPremium) return Response.json({ error: 'Premium required' }, { status: 403 });
      }
      if (trip && trip.created_by_id !== user.id && user.role !== 'admin') {
        return Response.json({ error: 'Only the owner can add a reservation here' }, { status: 403 });
      }
      suggestedBy = user.full_name || 'Host';
      byHost = true;
    }

    const incoming = body.reservation || {};
    const name = clean(incoming.name, 120);
    if (!name) return Response.json({ error: 'Add a name for this reservation' }, { status: 400 });
    const typeRaw = clean(incoming.type, 20);
    const type = TYPES.includes(typeRaw) ? typeRaw : 'restaurant';
    const dateTime = isoOrEmpty(incoming.dateTime);
    const partySize =
      Number.isFinite(incoming.partySize) && (incoming.partySize as number) > 0
        ? Math.min(Math.floor(incoming.partySize as number), 50)
        : 0;
    const location = clean(incoming.location, 200);
    const notes = clean(incoming.notes, 600);

    const reservation = {
      id: 'rs_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
      type,
      name,
      dateTime,
      partySize,
      location,
      notes,
      suggestedBy,
      travelerId,
      byHost,
      createdAt: new Date().toISOString(),
    };

    if (trip) {
      const reservations = [...(trip.reservations || []), reservation];
      if (reservations.length > MAX_RESERVATIONS) {
        return Response.json({ error: 'This trip already has the maximum number of reservation suggestions.' }, { status: 400 });
      }
      await base44.asServiceRole.entities.Trip.update(trip.id, { reservations });
      return Response.json({ ok: true, reservation, reservations });
    }

    // Host, no backend record yet: create one carrying the trip basics plus
    // this first suggestion, mirroring create-trip-invites' create branch.
    const created = await base44.entities.Trip.create({
      tripId,
      name: clean(body.name, 120),
      destination: clean(body.destination, 200),
      startDate: isoOrEmpty(body.startDate),
      endDate: isoOrEmpty(body.endDate),
      notes: clean(body.notes, 1000),
      hostName: suggestedBy,
      status: 'planning',
      travelers: [],
      reservations: [reservation],
    });
    return Response.json({ ok: true, reservation, reservations: [reservation], id: created.id });
  } catch (error: any) {
    console.error('add-trip-reservation failed:', error?.message || error);
    return Response.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}