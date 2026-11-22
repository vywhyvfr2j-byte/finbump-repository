import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { listAll } from "../../shared/batchProcess.ts";
import { chicagoDayRange } from "../../shared/analyticsRollup.ts";

// Counts all user-facing entities once per night and stores the totals in a
// single EntityCountRollup row. The admin analytics report reads this row
// instead of running 13 full-table listAll calls, keeping the report under 3s
// at 15k customers. Scheduled nightly at 2am CT by the "Entity Count Rollup"
// workflow (before the 8am report).
//
// Security: admin-only via base44.auth.me(). The workflow's invoke_backend_function
// runs as the platform service role (admin-level auth context).
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const sr = base44.asServiceRole.entities;

    const [users, people, pets, acts, events, giftIdeas, groups, trips,
           prayerRequests, milestones, personalNotes, goals, reviews, purchases] = await Promise.all([
      listAll(sr.User),
      listAll(sr.Person),
      listAll(sr.Pet),
      listAll(sr.Act),
      listAll(sr.Event),
      listAll(sr.GiftIdea),
      listAll(sr.Group),
      listAll(sr.Trip),
      listAll(sr.PrayerRequest),
      listAll(sr.Milestone),
      listAll(sr.PersonalNote),
      listAll(sr.Goal),
      listAll(sr.AppReview),
      listAll(sr.Base44Purchase),
    ]);

    const totalReviews = reviews.length;
    const avgRating = totalReviews
      ? reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / totalReviews
      : 0;
    const activeSubscriptions = purchases.filter((p) =>
      p.status === 'paid' && !p.canceledAt
    ).length;

    const dateKey = chicagoDayRange(new Date()).dateKey;
    const payload = {
      dateKey,
      totalUsers: users.length,
      totalPeople: people.length,
      totalPets: pets.length,
      totalActs: acts.length,
      totalEvents: events.length,
      totalGiftIdeas: giftIdeas.length,
      totalGroups: groups.length,
      totalTrips: trips.length,
      totalPrayerRequests: prayerRequests.length,
      totalMilestones: milestones.length,
      totalPersonalNotes: personalNotes.length,
      totalGoals: goals.length,
      totalReviews,
      avgRating: Math.round(avgRating * 10) / 10,
      totalPurchases: purchases.length,
      activeSubscriptions,
      rolledUpAt: new Date().toISOString(),
    };

    // Upsert: one row per dateKey.
    const existing = await sr.EntityCountRollup.filter({ dateKey }, undefined, 1, 0);
    if (existing.length > 0) {
      await sr.EntityCountRollup.update(existing[0].id, payload);
    } else {
      await sr.EntityCountRollup.create(payload);
    }

    return Response.json({ ok: true, ...payload });
  } catch (error) {
    console.error('rollup-entity-counts error', error?.message || error);
    return Response.json({ error: 'Could not roll up entity counts.' }, { status: 500 });
  }
}