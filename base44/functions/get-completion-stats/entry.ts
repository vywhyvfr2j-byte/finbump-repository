import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Server-side counts of the caller's OWN ActCompletion records for the four
// calendar boundaries the Home screen shows.
//
// Home used to download ~13 months of completions on every app open purely to
// count them — thousands of rows per open, per user. Four count() calls return
// the same four numbers without reading a single record.
//
// The client sends the boundary timestamps because each counter resets at the
// user's LOCAL midnight / Monday morning / 1st / Jan 1, which the server cannot
// infer. Boundaries are only ever in the past, so anything later than "now" is
// rejected rather than trusted.

function toBoundaryIso(value) {
  const t = typeof value === 'number' ? value : Date.parse(String(value || ''));
  if (!Number.isFinite(t) || t <= 0 || t > Date.now()) return null;
  return new Date(t).toISOString();
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const todayStart = toBoundaryIso(body?.todayStart);
    const weekStart = toBoundaryIso(body?.weekStart);
    const monthStart = toBoundaryIso(body?.monthStart);
    const yearStart = toBoundaryIso(body?.yearStart);
    if (!todayStart || !weekStart || !monthStart || !yearStart) {
      return Response.json(
        { error: 'todayStart, weekStart, monthStart and yearStart are required' },
        { status: 400 },
      );
    }

    // Filtering by created_by_id as well as the RLS-scoped client keeps this
    // strictly to the caller's own completions.
    const countSince = (iso) =>
      base44.entities.ActCompletion.count({
        created_by_id: user.id,
        completedAt: { $gte: iso },
      });

    const [today, week, month, year] = await Promise.all([
      countSince(todayStart),
      countSince(weekStart),
      countSince(monthStart),
      countSince(yearStart),
    ]);

    return Response.json({
      today: Number(today) || 0,
      week: Number(week) || 0,
      month: Number(month) || 0,
      year: Number(year) || 0,
    });
  } catch (error) {
    console.error('get-completion-stats failed:', error?.message || error);
    return Response.json({ error: 'Could not load completion stats.' }, { status: 500 });
  }
}