// Brute-force protection for code redemption / validation endpoints
// (connectPairing, redeem-pass-code, validate-access-code). Each call records
// an attempt in a fixed time bucket per (user, feature); once the bucket's
// count reaches the limit, further attempts are rejected with 429 until the
// bucket rolls over.
//
// All DB access uses asServiceRole so the CodeAttempt entity can stay
// admin-only — users cannot read or tamper with their own attempt counters.
//
// The increment is done atomically via updateMany with a `count < limit`
// filter, so a parallel burst of requests cannot all read the same counter
// and slip past the limit (the read-modify-write pattern would let an
// attacker bypass the cap simply by sending concurrent requests). The only
// residual race is duplicate row creation on the very first attempt of a
// window under concurrency, which at worst inflates the effective limit by
// the number of concurrent first-attempts — still far too small to make
// brute-forcing a 6+ character code space feasible.

export interface AttemptResult {
  allowed: boolean;
  count: number;
  limit: number;
  retryAfterSeconds: number;
}

// Atomically increments the attempt counter only when it is below the limit.
// Returns the number of rows actually incremented (0 = at-limit or no row yet).
async function conditionalIncrement(
  base44: any,
  userId: string,
  feature: string,
  windowKey: string,
  limit: number,
): Promise<number> {
  const res = await base44.asServiceRole.entities.CodeAttempt.updateMany(
    { userId, feature, windowKey, count: { $lt: limit } },
    { $inc: { count: 1 } },
  );
  return Number(res?.updated ?? 0);
}

// Records an attempt and tells the caller whether the user is still within
// the allowed limit for the current window. Call this BEFORE doing the code
// lookup so that every attempt — valid or invalid — consumes budget.
export async function checkAndRecordAttempt(
  base44: any,
  userId: string,
  feature: string,
  limit: number,
  windowMinutes = 60,
): Promise<AttemptResult> {
  const windowMs = windowMinutes * 60 * 1000;
  const windowKey = Math.floor(Date.now() / windowMs).toString();
  const retryAfterSeconds = Math.ceil((windowMs - (Date.now() % windowMs)) / 1000);

  // 1. Try the atomic conditional increment first — the common, race-safe path.
  if ((await conditionalIncrement(base44, userId, feature, windowKey, limit)) >= 1) {
    return { allowed: true, count: 0, limit, retryAfterSeconds };
  }

  // 2. Nothing incremented: either the counter is at the limit, or no row
  //    exists yet for this window. Distinguish by reading.
  const existing = await base44.asServiceRole.entities.CodeAttempt.filter({
    userId,
    feature,
    windowKey,
  });

  if (existing?.length) {
    // A row exists. A concurrent create may have landed between our first
    // increment and this read, so retry the conditional increment once before
    // treating it as at-limit.
    if ((await conditionalIncrement(base44, userId, feature, windowKey, limit)) >= 1) {
      return { allowed: true, count: 0, limit, retryAfterSeconds };
    }
    return { allowed: false, count: 0, limit, retryAfterSeconds };
  }

  // 3. First attempt in this window — create the counter row.
  await base44.asServiceRole.entities.CodeAttempt.create({
    userId,
    feature,
    windowKey,
    count: 1,
  });
  return { allowed: true, count: 1, limit, retryAfterSeconds };
}