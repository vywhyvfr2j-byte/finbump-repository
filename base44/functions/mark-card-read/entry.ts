import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Marks a received card as read by its recipient. Runs as service role because
// the Card entity's update RLS is creator-only — a recipient cannot update the
// record directly. This narrow endpoint verifies the caller is the intended
// recipient before stamping readAt, so only the recipient can mark their own
// incoming cards read.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const cardId = String(body.cardId || '').trim();
    if (!cardId) return Response.json({ error: 'cardId is required' }, { status: 400 });

    const card = await base44.asServiceRole.entities.Card.get(cardId);
    if (!card) return Response.json({ error: 'Card not found' }, { status: 404 });
    if (String(card.recipientUserId) !== String(user.id)) {
      return Response.json({ error: 'Not your card' }, { status: 403 });
    }

    let readAt = card.readAt;
    if (!readAt) {
      readAt = new Date().toISOString();
      await base44.asServiceRole.entities.Card.update(cardId, { readAt });
    }
    return Response.json({ ok: true, readAt });
  } catch (error) {
    console.error('mark-card-read failed:', error?.message || error);
    return Response.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}