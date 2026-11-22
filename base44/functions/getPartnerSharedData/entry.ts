import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    if (!user.partnerUserId) {
      return Response.json({
        partnerName: null,
        people: [],
        pets: [],
        movieIdeas: [],
        bookIdeas: [],
        seriesIdeas: [],
        treatIdeas: [],
        trips: [],
      });
    }

    const partner = await base44.asServiceRole.entities.User.get(user.partnerUserId);
    // Reciprocal pairing consent: only return shared data when the partner has
    // mutually linked back to this user. Without this, a user could set
    // partnerUserId to an arbitrary target and read that user's private records.
    if (partner?.partnerUserId !== user.id) {
      return Response.json({
        partnerName: null,
        people: [],
        pets: [],
        movieIdeas: [],
        bookIdeas: [],
        seriesIdeas: [],
        treatIdeas: [],
        trips: [],
      });
    }
    const [people, pets, movieIdeas, bookIdeas, seriesIdeas, treatIdeas, trips] = await Promise.all([
      base44.asServiceRole.entities.Person.filter({ created_by_id: user.partnerUserId }, '-created_date'),
      base44.asServiceRole.entities.Pet.filter({ created_by_id: user.partnerUserId }, '-created_date'),
      base44.asServiceRole.entities.MovieIdea.filter({ created_by_id: user.partnerUserId }, '-created_date'),
      base44.asServiceRole.entities.BookIdea.filter({ created_by_id: user.partnerUserId }, '-created_date'),
      base44.asServiceRole.entities.SeriesIdea.filter({ created_by_id: user.partnerUserId }, '-created_date'),
      base44.asServiceRole.entities.TreatIdea.filter({ created_by_id: user.partnerUserId }, '-created_date'),
      base44.asServiceRole.entities.Trip.filter({ created_by_id: user.partnerUserId }, '-created_date'),
    ]);

    // Honour each trip's own sharing choice. Switching the per-trip toggle off
    // persists shared:false on the trip, and those trips must never reach the
    // partner — the toggle promises "only you can see this trip". Trips saved
    // before the flag existed carry no value and stay shared, so nobody loses
    // access to something they already chose to share.
    const sharedTrips = trips.filter((t) => t.shared !== false);

    // Respect the partner's own sharing choices made when they approved pairing.
    const exclusions = partner?.sharingExclusions || {};
    const withoutExcluded = (items, key) => {
      const excludedIds = exclusions[key] || [];
      return items.filter((i) => !excludedIds.includes(i.id));
    };

    // Identity shown for shared data always comes from the immutable account record
    // (full_name), never a user-editable alias, so no one can misrepresent who they are.
    return Response.json({
      partnerName: partner?.full_name || 'your partner',
      people: withoutExcluded(people, 'people'),
      pets: withoutExcluded(pets, 'pets'),
      movieIdeas: withoutExcluded(movieIdeas, 'movieIdeas'),
      bookIdeas: withoutExcluded(bookIdeas, 'bookIdeas'),
      seriesIdeas: withoutExcluded(seriesIdeas, 'seriesIdeas'),
      treatIdeas: withoutExcluded(treatIdeas, 'treatIdeas'),
      trips: withoutExcluded(sharedTrips, 'trips'),
    });
  } catch (error) {
    console.error('getPartnerSharedData error', error?.message || error);
    return Response.json({ error: 'Could not load shared data.' }, { status: 500 });
  }
});