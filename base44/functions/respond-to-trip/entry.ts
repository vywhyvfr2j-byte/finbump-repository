import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Public endpoint the traveler's personal link posts to. Authenticated by the
// per-traveler token (the token is the shared secret), so it runs as service
// role and writes only that one traveler's answer onto the trip.
//
// Every incoming value is bounded and truncated before it is stored — this is
// unauthenticated input.

const MAX_DATES = 12;
const MAX_DESTINATIONS = 8;
const MAX_STYLE = 8;
const MAX_INTERESTS = 12;

function clean(value: unknown, max: number): string {
  return String(value ?? '').trim().slice(0, max);
}

function cleanList(value: unknown, maxItems: number, maxLen: number): string[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, maxItems).map((v) => clean(v, maxLen)).filter(Boolean);
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
    // anything about the trip (including its status) is disclosed or written.
    const travelers = [...(trip.travelers || [])];
    const index = travelers.findIndex((t: any) => t.token === token);
    if (index === -1) return Response.json({ error: 'This invite link is no longer valid' }, { status: 404 });
    if (trip.status === 'cancelled') {
      return Response.json({ error: 'This trip was cancelled' }, { status: 409 });
    }

    const incoming = body.response || {};
    const comingRaw = clean(incoming.coming, 10);
    const coming = comingRaw === 'yes' || comingRaw === 'maybe' || comingRaw === 'no' ? comingRaw : '';

    const response = {
      coming,
      dates: cleanList(incoming.dates, MAX_DATES, 20),
      destinations: cleanList(incoming.destinations, MAX_DESTINATIONS, 80),
      budget: clean(incoming.budget, 40),
      travelStyle: cleanList(incoming.travelStyle, MAX_STYLE, 40),
      dietary: clean(incoming.dietary, 300),
      interests: cleanList(incoming.interests, MAX_INTERESTS, 60),
      notes: clean(incoming.notes, 800),
    };

    const current = travelers[index];
    const updated: any = {
      ...current,
      response,
      respondedAt: new Date().toISOString(),
    };
    if (typeof incoming.reminderOptOut === 'boolean') {
      updated.reminderOptOut = incoming.reminderOptOut;
    }
    travelers[index] = updated;

    await base44.asServiceRole.entities.Trip.update(trip.id, { travelers });

    return Response.json({
      ok: true,
      totalCount: travelers.length,
      respondedCount: travelers.filter((t: any) => t.respondedAt).length,
    });
  } catch (error: any) {
    console.error('respond-to-trip failed:', error?.message || error);
    return Response.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}