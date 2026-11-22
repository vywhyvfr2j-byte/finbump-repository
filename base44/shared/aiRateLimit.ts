// Per-user daily AI call cap. Prevents runaway integration-credit spend from
// a single user (intentional or accidental). Each AI backend function calls
// checkAiRateLimit() before forwarding to InvokeLLM; when the user has exhausted
// their daily allowance the caller returns a 429 immediately.
//
// All operations use asServiceRole so the AiUsageDaily entity can stay
// admin-only (users can't tamper with their own counters).

const FREE_DAILY_LIMIT = 20;
const PREMIUM_DAILY_LIMIT = 50;

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

// Atomically claims one slot of today's allowance for this user+feature. The
// `count < limit` filter makes the cap part of the write itself, so a parallel
// burst of requests cannot all read the same pre-limit count and slip past it —
// the read-modify-write pattern would let a user multiply their daily allowance
// simply by firing concurrent requests. Returns the number of rows actually
// incremented (0 = already at the limit, or no row yet for today).
async function claimSlot(
  base44: any,
  userId: string,
  date: string,
  feature: string,
  limit: number,
): Promise<number> {
  const res = await base44.asServiceRole.entities.AiUsageDaily.updateMany(
    { userId, date, feature, count: { $lt: limit } },
    { $inc: { count: 1 } },
  );
  return Number(res?.updated ?? 0);
}

// Checks the user's AI usage for today, claiming one slot when they are still
// under their cap. Returns { allowed, count, limit } — when allowed is false the
// caller should return a 429 immediately.
export async function checkAiRateLimit(
  base44: any,
  userId: string,
  feature: string,
  isPremium = false,
): Promise<{ allowed: boolean; count: number; limit: number }> {
  const limit = isPremium ? PREMIUM_DAILY_LIMIT : FREE_DAILY_LIMIT;
  const date = todayUTC();

  // 1. Claim the slot atomically — the common, race-safe path.
  if ((await claimSlot(base44, userId, date, feature, limit)) >= 1) {
    return { allowed: true, count: 0, limit };
  }

  // 2. Nothing claimed: either the counter is at the limit, or no row exists yet
  //    for today. Distinguish by reading.
  const existing = await base44.asServiceRole.entities.AiUsageDaily.filter({
    userId,
    date,
    feature,
  });

  if (existing?.length) {
    // A row exists. A concurrent create may have landed between our first claim
    // and this read, so retry the claim once before treating it as at-limit. The
    // counter is only ever incremented while it is still below the cap, so a
    // retry can never overshoot it.
    if ((await claimSlot(base44, userId, date, feature, limit)) >= 1) {
      return { allowed: true, count: 0, limit };
    }
    return { allowed: false, count: Number(existing[0].count || limit), limit };
  }

  // 3. First AI call today — create the counter row. Two simultaneous first
  //    calls can each create a row, which at worst inflates the day's allowance
  //    by the number of simultaneous first calls (the same residual as
  //    codeAttemptLimit.ts); the cap still holds for every later call.
  await base44.asServiceRole.entities.AiUsageDaily.create({ userId, date, feature, count: 1 });
  return { allowed: true, count: 1, limit };
}