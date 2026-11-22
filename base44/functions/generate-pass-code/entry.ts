import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Called by a purchaser who bought a family package. Generates a shareable
// pass code and decrements their remaining pass credits. The purchaser shares
// the code with a friend/family member, who redeems it via `redeem-pass-code`.
//
// passType: "annual" (1-year Premium) or "monthly" (1-month Premium).
// label: optional note about who the pass is for.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in to continue.' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const passType = body?.passType;
    const label = (body?.label || '').trim();

    if (passType !== 'annual' && passType !== 'monthly') {
      return Response.json({ error: 'Pick a pass type.' }, { status: 400 });
    }

    // Atomically claim one available pass credit from the ledger. The PassCredit
    // ledger (one row per purchased credit) is the single source of truth because
    // the built-in User entity does not support atomic conditional decrements —
    // a counter on User would let two concurrent requests both pass the check and
    // each generate a code from a single credit. Each row is claimed with a
    // conditional updateMany (status still "available"), so at most one request
    // wins each row; we try candidate rows in turn until one is claimed.
    const available = await base44.asServiceRole.entities.PassCredit.filter({
      ownerId: user.id, passType, status: 'available',
    });
    if (!available?.length) {
      return Response.json({ error: `You have no ${passType} passes left to share.` }, { status: 400 });
    }
    const now = new Date().toISOString();
    let claimed = false;
    for (const row of available) {
      const res = await base44.asServiceRole.entities.PassCredit.updateMany(
        { id: row.id, status: 'available' },
        { $set: { status: 'consumed', consumedBy: user.id, consumedAt: now } },
      );
      if (Number(res?.updated ?? 0) >= 1) { claimed = true; break; }
    }
    if (!claimed) {
      // Every candidate row was consumed by a concurrent request.
      return Response.json({ error: `You have no ${passType} passes left to share.` }, { status: 400 });
    }

    // Generate a human-readable, unambiguous code (no O/0/I/1) with a CSPRNG:
    // the code grants Premium on redemption, so it must not be predictable from
    // previously issued codes. The alphabet is exactly 32 characters, so
    // `byte % 32` over the 256 possible byte values is uniform — no modulo bias.
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = crypto.getRandomValues(new Uint8Array(6));
    let suffix = '';
    for (let i = 0; i < 6; i++) suffix += chars[bytes[i] % chars.length];
    const code = `KS-${suffix}`;

    // Persist the pass code record (credit already consumed atomically above).
    await base44.asServiceRole.entities.PassCode.create({
      code,
      passType,
      packageId: body?.packageId || null,
      purchaserId: user.id,
      purchaserEmail: user.email || null,
      label: label || null,
    });

    // Remaining available credits for the response.
    const remainingRows = await base44.asServiceRole.entities.PassCredit.filter({
      ownerId: user.id, passType, status: 'available',
    });
    const remaining = remainingRows?.length ?? 0;

    return Response.json({ ok: true, code, passType, remaining });
  } catch (error) {
    console.error('generate-pass-code error', error?.message || error);
    return Response.json({ error: error?.message || 'Could not generate pass code.' }, { status: 500 });
  }
}