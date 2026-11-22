import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { buildRoster } from '../../shared/membership.ts';
import { batchMap } from '../../shared/batchProcess.ts';

// Assigns every member their founding-member number.
//
// The numbering lives entirely on the server: it is recomputed from the user
// records themselves (reserved founding emails first, then sign-up order from
// 101), so the value is the same on every run and a member can never pick their
// own. Each invocation reconciles the Member records with that roster, which
// means a member who signed up since the last run is numbered the moment their
// profile asks for one.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const svc = base44.asServiceRole;
    const [users, existing, reservations] = await Promise.all([
      svc.entities.User.list(),
      svc.entities.Member.list(),
      svc.entities.FoundingMemberReservation.list(),
    ]);

    // Reserved founding numbers come from the admin-managed entity and are matched
    // on user id only — never on an email address or a display name.
    const roster = buildRoster(
      Array.isArray(users) ? users : [],
      Array.isArray(reservations) ? reservations : [],
    );
    const byUser = new Map<string, any>();
    for (const m of Array.isArray(existing) ? existing : []) byUser.set(m.userId, m);

    // This rewrites everyone's Member record, so only an admin may run it across the
    // whole roster. Anyone else may only cause their own number to be issued — their
    // profile asks for it the first time it opens — so the caller's own row is the
    // single record a signed-in member can ever write here. The roster itself is read
    // from the user records (never returned), because a number is only correct relative
    // to the sign-up order.
    const targets = user.role === 'admin' ? roster : roster.filter((entry) => entry.userId === user.id);

    let created = 0;
    let updated = 0;

    const results = await batchMap(
      targets,
      async (entry) => {
        const fields = {
          userId: entry.userId,
          email: entry.email,
          fullName: entry.fullName,
          number: entry.number,
          joinedAt: entry.joinedAt,
        };
        const current = byUser.get(entry.userId);
        if (!current) {
          await svc.entities.Member.create(fields);
          created++;
          return;
        }
        if (
          current.number === entry.number &&
          current.joinedAt === entry.joinedAt &&
          current.fullName === entry.fullName &&
          current.email === entry.email
        ) {
          return; // already correct — leave the record untouched
        }
        await svc.entities.Member.update(current.id, fields);
        updated++;
      },
      6,
    );

    const failed = results.filter((r) => !r.ok).length;
    if (failed) console.error('assign-member-numbers: failed records', failed);

    return Response.json({ ok: true, members: roster.length, created, updated, failed });
  } catch (error) {
    console.error('assign-member-numbers failed:', error?.message || error);
    return Response.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}