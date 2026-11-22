import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { listAll } from "../../shared/batchProcess.ts";

// Returns aggregate review stats (average + counts) to any authenticated
// user. Reads all reviews as service role but returns only numbers — no
// review text or reviewer info is exposed, so the public rating display
// doesn't leak other users' feedback.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const all = await listAll(base44.asServiceRole.entities.AppReview);

    // Only one in-app review per account counts toward the public rating: rows
    // piled up by a single account (submitted before per-account deduplication,
    // or by scripting the endpoint) must not keep shifting the average. Store
    // reviews are admin imports and always count.
    const latestByReviewer = new Map();
    const otherRows = [];
    const stampOf = (r) => new Date(r.updated_date || r.created_date || 0).getTime();
    for (const r of all) {
      if (r.source !== 'in_app' || !r.reviewerUserId) {
        otherRows.push(r);
        continue;
      }
      const previous = latestByReviewer.get(r.reviewerUserId);
      if (!previous || stampOf(r) >= stampOf(previous)) latestByReviewer.set(r.reviewerUserId, r);
    }
    const reviews = [...latestByReviewer.values(), ...otherRows];

    const total = reviews.length;
    const avg = total
      ? reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / total
      : 0;

    const bySource = (src) => {
      const subset = reviews.filter((r) => r.source === src);
      const count = subset.length;
      const average = count
        ? subset.reduce((s, r) => s + (Number(r.rating) || 0), 0) / count
        : 0;
      return { count, average: Math.round(average * 10) / 10 };
    };

    return Response.json({
      total,
      average: Math.round(avg * 10) / 10,
      inApp: bySource('in_app'),
      apple: bySource('apple'),
      google: bySource('google'),
    });
  } catch (error) {
    console.error('get-review-summary error', error?.message || error);
    return Response.json({ error: 'Could not load reviews.' }, { status: 500 });
  }
}