import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Upserts a shared trip by its stable client id (`tripId`). Either partner in a
// pair can edit: the record is looked up with the service role (by tripId) so a
// partner can update a trip the other one created, keeping the itinerary in sync.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { tripId, name, destination, startDate, endDate, who, budgetLimit, categories, itinerary, flights, hotels, packingList, locations, linkedGiftIds, fromPartner } = body;
    if (!tripId || !name) return Response.json({ error: 'tripId and name are required' }, { status: 400 });

    const existing = await base44.asServiceRole.entities.Trip.filter({ tripId });

    // A partner's copy of a trip must never re-create a record whose owner has
    // stopped sharing it — otherwise unsharing would be undone the next time the
    // partner's app touched that trip.
    if (existing.length === 0 && fromPartner) {
      return Response.json({ error: 'This trip is no longer shared with you.' }, { status: 403 });
    }

    const payload = {
      name,
      destination: destination || '',
      startDate: startDate || '',
      endDate: endDate || '',
      who: who || 'both',
      shared: true,
      budgetLimit: budgetLimit != null ? budgetLimit : null,
      categories: Array.isArray(categories) ? categories : [],
      itinerary: Array.isArray(itinerary) ? itinerary : [],
      flights: Array.isArray(flights) ? flights : [],
      hotels: Array.isArray(hotels) ? hotels : [],
      packingList: Array.isArray(packingList) ? packingList : [],
      locations: Array.isArray(locations) ? locations : [],
      linkedGiftIds: Array.isArray(linkedGiftIds) ? linkedGiftIds : [],
    };

    if (existing.length) {
      const trip = existing[0];
      const owner = trip.created_by_id;
      const partnerId = user.partnerUserId;
      if (owner !== user.id && owner !== partnerId) {
        return Response.json({ error: 'Forbidden: you can only edit trips created by you or your linked partner' }, { status: 403 });
      }
      // Reciprocal pairing consent: when editing a trip owned by the linked
      // partner, verify the partner has mutually linked back to this user.
      // Without this, a user could point partnerUserId at a victim and modify
      // that victim's trips.
      if (owner === partnerId) {
        const partner = await base44.asServiceRole.entities.User.get(partnerId);
        if (partner?.partnerUserId !== user.id) {
          return Response.json({ error: 'Forbidden: partner has not confirmed pairing' }, { status: 403 });
        }
        // The owner revoked sharing: the partner may no longer read or edit it.
        if (trip.shared === false) {
          return Response.json({ error: 'This trip is no longer shared with you.' }, { status: 403 });
        }
      }
      // Only the owner controls sharing: a partner's edit keeps the record's
      // current value, so it can never turn sharing back on by editing.
      const update = owner === user.id ? payload : { ...payload, shared: trip.shared !== false };
      const updated = await base44.asServiceRole.entities.Trip.update(trip.id, update);
      return Response.json({ id: updated.id });
    }

    const created = await base44.entities.Trip.create({ tripId, ...payload });
    return Response.json({ id: created.id });
  } catch (error) {
    console.error('saveSharedTrip error', error?.message || error);
    return Response.json({ error: 'Could not save this trip.' }, { status: 500 });
  }
});