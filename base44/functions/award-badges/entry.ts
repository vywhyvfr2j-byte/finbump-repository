import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { BADGES } from '../../shared/badgeCatalog.ts';
import { sanitizeAnalyticsEvent } from '../../shared/analyticsPrivacy.ts';

// Awards the badges a member has earned and has not been given yet.
//
// Runs as the signed-in member: every measured value is read with their own
// token, so a caller can only ever award to themselves. The Badge entity's
// create/update/delete are admin-only, so this service-role write is the only
// path a badge record can come from — a client cannot insert one.
//
// Idempotent by design: existing badge ids are read first and skipped, so the
// function can be called on every profile open (which is also how members who
// arrived before the catalog existed get their history backfilled).
//
// Each newly earned badge writes one AnalyticsEvent, which the daily rollup
// folds into the app's tracked accomplishment metrics. Only the catalog id and
// shelf travel — never a name, a note or anything the member wrote.

const BADGE_READ_LIMIT = 200;

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e: any) => (e?.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // A missing relation (an entity with nothing in it, or a rule that hides it)
    // means zero for that measure — it must never break the whole shelf.
    const countOf = async (run: () => Promise<number>, cap: number): Promise<number> => {
      try {
        const value = await run();
        return Number.isFinite(value) ? Math.min(Number(value), cap) : 0;
      } catch {
        return 0;
      }
    };

    const rowsOf = async (run: () => Promise<any>, cap: number): Promise<any[]> => {
      try {
        const res = await run();
        const rows = Array.isArray(res) ? res : res?.items || [];
        return rows.slice(0, cap);
      } catch {
        return [];
      }
    };

    const [people, acts, memories, stepRows, memberRows, purchaseRows, existingRows] = await Promise.all([
      countOf(() => base44.entities.Person.count({}), 999),
      countOf(() => base44.entities.ActCompletion.count({}), 999),
      countOf(() => base44.entities.PersonalNote.count({ type: 'memory' }), 999),
      rowsOf(() => base44.entities.LittleStepsProgress.filter({ userId: user.id }, { limit: 1 }), 1),
      rowsOf(() => base44.entities.Member.filter({ userId: user.id }, { limit: 1 }), 1),
      rowsOf(() => base44.entities.Base44Purchase.filter({ appUserId: user.id, status: 'paid' }, { limit: 1 }), 1),
      rowsOf(() => base44.entities.Badge.filter({ userId: user.id }, { limit: BADGE_READ_LIMIT }), BADGE_READ_LIMIT),
    ]);

    const steps = stepRows[0];
    const metrics: Record<string, number> = {
      people,
      acts,
      memories,
      littleSteps: Array.isArray(steps?.completedDays) ? steps.completedDays.length : 0,
      memberNumber: memberRows.length ? 1 : 0,
      paidPurchase: purchaseRows.length ? 1 : 0,
    };

    const already = new Set(existingRows.map((row: any) => row.badgeId));
    const toCreate = BADGES.filter(
      (badge) => !already.has(badge.id) && (metrics[badge.metric] ?? 0) >= badge.target,
    );

    const earnedAt = new Date().toISOString();
    if (toCreate.length) {
      await base44.asServiceRole.entities.Badge.bulkCreate(
        toCreate.map((badge) => ({
          userId: user.id,
          badgeId: badge.id,
          shelf: badge.shelf,
          earnedAt,
        })),
      );

      // Tracked accomplishments. sanitizeAnalyticsEvent is the same gate every
      // other event passes through, so the id and shelf are the only fields kept.
      await Promise.all(
        toCreate.map(async (badge) => {
          const clean = sanitizeAnalyticsEvent('badge_earned', 'badges', {
            badge_id: badge.id,
            shelf: badge.shelf,
          });
          if (!clean.ok) {
            console.warn('award-badges: analytics rejected', clean.reason);
            return;
          }
          try {
            await base44.asServiceRole.entities.AnalyticsEvent.create({
              eventName: clean.eventName,
              feature: clean.feature,
              userId: user.id,
              userEmail: user.email || '',
              metadata: clean.metadata,
            });
          } catch (error: any) {
            // An unrecorded event must not cost the member their badge.
            console.error('award-badges: analytics write failed', error?.message || error);
          }
        }),
      );
    }

    const progress: Record<string, number> = {};
    for (const badge of BADGES) progress[badge.id] = Math.min(metrics[badge.metric] ?? 0, badge.target);

    const earned = [
      ...existingRows.map((row: any) => ({ badgeId: row.badgeId, earnedAt: row.earnedAt || row.created_date || '' })),
      ...toCreate.map((badge) => ({ badgeId: badge.id, earnedAt })),
    ];

    return Response.json({
      earned,
      newlyEarned: toCreate.map((badge) => badge.id),
      progress,
      total: BADGES.length,
    });
  } catch (error: any) {
    console.error('award-badges error', error?.message || error);
    return Response.json({ error: 'Could not award badges' }, { status: 500 });
  }
}