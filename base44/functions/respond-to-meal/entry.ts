import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

// Public endpoint the invitee's personal link posts to. Authenticated by the
// per-invitee token (the token is the shared secret), so it runs as service
// role and writes only that one participant's answer onto the meal.
//
// Every incoming value is bounded and truncated before it is stored — this is
// unauthenticated input.

const MAX_SLOTS = 6;
const MAX_CUISINES = 8;
const MAX_AREAS = 4;

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

    const mealId = clean(body.mealId, 64);
    const token = clean(body.token, 128);
    if (!mealId || token.length < 32) {
      return Response.json({ error: 'This invite link is not valid' }, { status: 400 });
    }

    const meal = await base44.asServiceRole.entities.Meal.get(mealId).catch(() => null);
    if (!meal) return Response.json({ error: 'This invite link is no longer valid' }, { status: 404 });

    // The per-invitee token is the only credential here, so it is checked before
    // anything about the meal (including its status) is disclosed or written.
    const participants = [...(meal.participants || [])];
    const index = participants.findIndex((p: any) => p.token === token);
    if (index === -1) return Response.json({ error: 'This invite link is no longer valid' }, { status: 404 });
    if (meal.status === 'cancelled') {
      return Response.json({ error: 'This meal was cancelled' }, { status: 409 });
    }

    const incoming = body.response || {};
    const slots = (Array.isArray(incoming.slots) ? incoming.slots : [])
      .slice(0, MAX_SLOTS)
      .map((s: any) => ({ date: clean(s?.date, 40), time: clean(s?.time, 30) }))
      .filter((s: any) => s.date);

    // RSVP — an invitee saying whether they can make it. Anything else (or a
    // missing value) is stored as no RSVP at all.
    const comingRaw = clean(incoming.coming, 10);
    const coming = comingRaw === 'yes' || comingRaw === 'maybe' || comingRaw === 'no' ? comingRaw : '';

    const response = {
      coming,
      slots,
      cuisines: cleanList(incoming.cuisines, MAX_CUISINES, 40),
      areas: cleanList(incoming.areas, MAX_AREAS, 80),
      budget: clean(incoming.budget, 40),
      dietary: clean(incoming.dietary, 300),
      notes: clean(incoming.notes, 500),
    };

    const current = participants[index];
    const updated: any = {
      ...current,
      response,
      respondedAt: new Date().toISOString(),
    };
    if (typeof incoming.reminderOptOut === 'boolean') {
      updated.reminderOptOut = incoming.reminderOptOut;
    }
    participants[index] = updated;

    await base44.asServiceRole.entities.Meal.update(mealId, { participants });

    return Response.json({
      ok: true,
      totalCount: participants.length,
      respondedCount: participants.filter((p: any) => p.respondedAt).length,
    });
  } catch (error: any) {
    console.error('respond-to-meal failed:', error?.message || error);
    return Response.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}