import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

// Public endpoint behind the email invite link. Reached by people who may not
// have a FinBump account, so it authenticates on the per-invitee token alone
// (the token IS the shared secret) and runs as service role.
//
// Returns only what the invitee needs: the meal's plan, their own saved answer,
// and the other invitees' names. Never their email addresses, never the host's
// other records.

function clean(value: unknown, max: number): string {
  return String(value ?? '').trim().slice(0, max);
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

    const participants = meal.participants || [];
    const participant = participants.find((p: any) => p.token === token);
    if (!participant) return Response.json({ error: 'This invite link is no longer valid' }, { status: 404 });

    return Response.json({
      meal: {
        title: meal.title,
        hostName: meal.hostName,
        status: meal.status,
        area: meal.area,
        cuisine: meal.cuisine,
        budget: meal.budget,
        proposedDate: meal.proposedDate,
        confirmedDate: meal.confirmedDate,
        venueName: meal.venueName,
        venueAddress: meal.venueAddress,
        notes: meal.notes,
      },
      you: {
        name: participant.name,
        respondedAt: participant.respondedAt || '',
        reminderOptOut: !!participant.reminderOptOut,
        // The invitee's own saved answer, so they can edit it rather than
        // start over. Only ever their own.
        response: participant.response || null,
      },
      others: participants
        .filter((p: any) => p.token !== token)
        .map((p: any) => ({ name: p.name, responded: !!p.respondedAt })),
      totalCount: participants.length,
      respondedCount: participants.filter((p: any) => p.respondedAt).length,
    });
  } catch (error: any) {
    console.error('get-meal-invite failed:', error?.message || error);
    return Response.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}