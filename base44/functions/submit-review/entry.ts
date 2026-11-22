import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

// Records an in-app review.
//
// The source is stamped HERE and never accepted from the client: a review
// submitted by a user can only ever be 'in_app'. Reviews attributed to the
// Apple App Store or Google Play are admin-only manual imports on the admin
// Reviews page, so nobody can forge a store review to skew the public rating
// aggregate. The reviewer's name, email and user id come from the session too,
// not from the payload.

const MAX_TEXT = 2000;

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const rating = Number(body.rating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return Response.json({ error: 'Pick a rating between 1 and 5.' }, { status: 400 });
    }

    const fields = {
      rating: Math.round(rating),
      reviewText: String(body.reviewText ?? '').trim().slice(0, MAX_TEXT),
      source: 'in_app',
      isManual: false,
      status: 'new',
      reviewerUserId: user.id,
      reviewerName: user.full_name || '',
      reviewerEmail: user.email || '',
    };

    // One in-app review per account, ever. The public rating averages every row,
    // so without this a single account could script thousands of reviews and shift
    // the app-wide average to whatever it liked. A returning reviewer updates the
    // review they already have instead of adding another one.
    const mine = await base44.asServiceRole.entities.AppReview.filter({
      reviewerUserId: user.id,
      source: 'in_app',
    });
    const rows = Array.isArray(mine) ? mine : (mine?.items || []);
    const prior = rows[0];

    const review = prior
      ? await base44.asServiceRole.entities.AppReview.update(prior.id, fields)
      : await base44.asServiceRole.entities.AppReview.create(fields);

    // Two simultaneous first submissions can still each create a row; keep only
    // the newest so the one-review-per-account rule holds even after a burst.
    // This is housekeeping, not the save: if two calls race here, the submit that
    // already wrote its review must still succeed (the public rating only ever
    // counts one row per account, so a lost cleanup cannot skew it).
    await keepNewestReviewOnly(base44, user.id).catch((e: any) => {
      console.error('submit-review cleanup skipped:', e?.message || e);
    });

    return Response.json({ review, updated: !!prior });
  } catch (error: any) {
    console.error('submit-review failed:', error?.message || error);
    return Response.json({ error: error?.message || 'Could not save your review' }, { status: 500 });
  }
}

// Removes this reviewer's extra in-app review rows, leaving their newest one.
// Keeping the newest (rather than whichever row the current call wrote) means
// simultaneous submissions all agree on the same survivor and can never delete
// the review away entirely.
async function keepNewestReviewOnly(base44: any, userId: string): Promise<number> {
  const res = await base44.asServiceRole.entities.AppReview.filter({
    reviewerUserId: userId,
    source: 'in_app',
  });
  const rows = Array.isArray(res) ? res : (res?.items || []);
  if (rows.length <= 1) return 0;
  const stampOf = (r: any) => new Date(r.updated_date || r.created_date || 0).getTime();
  const newest = rows.reduce((a: any, b: any) => (stampOf(b) >= stampOf(a) ? b : a));
  const extras = rows.filter((r: any) => r.id !== newest.id);
  for (const extra of extras) {
    await base44.asServiceRole.entities.AppReview.delete(extra.id);
  }
  return extras.length;
}