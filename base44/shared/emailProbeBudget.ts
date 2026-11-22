// Shared account-lookup budget for the places that ask whether a contact's
// email belongs to a registered FinBump account: check-keepsake-users (a batch
// of the caller's own contacts), send-card (one contact) and verify-invitees
// (the list in front of a meal or trip invitation). All draw on the SAME ledger,
// so a sweep cannot spend one path's allowance and then turn to another for a
// fresh one.
//
// Nothing stops a determined attacker from adding harvested addresses as their
// own contacts first, so contact ownership is friction rather than a guarantee.
// What actually bounds the exposure is the pair of budgets below: an hourly one
// that counts NEW addresses rather than calls, and an all-time one on the total
// number of distinct addresses an account may ever check. Each address is
// charged once and remembered on the contact record, so re-checking an address
// the user already checked is free and a real contact list never comes close to
// the ceiling.
//
// CONCURRENCY: both budgets are enforced by the write itself, never by a
// read-then-write comparison. A claim is a conditional updateMany whose filter
// carries the remaining allowance and which moves the counter with $inc, so
// parallel callers cannot each read the same unspent budget and each take a full
// slice of it. The earlier read-modify-write version let a burst of parallel
// calls take several times the hourly allowance, and because it wrote back the
// whole list it also erased the charges other calls in the same burst had made.
//
// Both counters live on ONE row per account (windowKey 'lifetime'), so the
// hourly counter has a stable home: a new hour moves the same row forward
// instead of needing a row of its own, and no burst can reset or multiply the
// allowance by creating one. The single residual is the platform's lack of a
// conditional insert — on an account's very FIRST lookup, simultaneous callers
// can each create a ledger row, and each carries its own counter. The all-time
// ceiling bounds what that can yield, and it cannot recur once a row exists.
// codeAttemptLimit.ts and aiRateLimit.ts carry the same residual.

export const MAX_EMAILS_PER_CALL = 50;
export const MAX_NEW_EMAILS_PER_HOUR = 250;
export const PROBE_WINDOW_MINUTES = 60;
export const MAX_LIFETIME_EMAILS = 2000;
export const LIFETIME_KEY = 'lifetime';

export const HOURLY_BUDGET_MESSAGE =
  'You have checked a lot of addresses this hour. Please try again later.';
export const LIFETIME_BUDGET_MESSAGE =
  'This account has checked as many addresses as it can. Please contact support if you need more.';

export type ProbeContact = {
  id?: string;
  email?: string;
  accountCheckCharged?: boolean;
};

export type ProbeResult =
  | { allowed: true }
  | { allowed: false; error: string; retryAfterSeconds?: number };

// Charges these of the caller's OWN contacts against their lookup budget, and
// reports whether the lookup may proceed.
export async function chargeEmailLookups(
  base44: any,
  userId: string,
  contacts: ProbeContact[],
): Promise<ProbeResult> {
  const emails = Array.from(
    new Set(contacts.map((c) => (c.email || '').trim().toLowerCase()).filter(Boolean)),
  );
  if (!emails.length) return { allowed: true };

  const windowMs = PROBE_WINDOW_MINUTES * 60 * 1000;
  const windowKey = Math.floor(Date.now() / windowMs).toString();
  const retryAfterSeconds = Math.ceil((windowMs - (Date.now() % windowMs)) / 1000);

  // Both budgets are claimed on the account's single ledger row, so nothing
  // below trusts a value it read: a read only decides what to attempt, and the
  // conditional write does the enforcing.
  const readLedger = () =>
    base44.asServiceRole.entities.EmailProbe.filter({ userId, windowKey: LIFETIME_KEY });
  const rows = (await readLedger()) || [];
  let ledgerExists = rows.length > 0;

  // Hourly budget on new addresses, counted per address rather than per call.
  // The remembered list is only trusted while it belongs to the current hour, so
  // a new hour starts from a clean slate.
  const alreadyProbed = new Set<string>(
    (rows.find((r: any) => String(r.hourlyWindowKey ?? '') === windowKey)?.probedEmails || []).map(
      (e: any) => String(e).trim().toLowerCase(),
    ),
  );
  const newlyProbed = emails.filter((e) => !alreadyProbed.has(e));

  if (newlyProbed.length) {
    const n = newlyProbed.length;

    // A read check first, so an hour that is already spent is refused without a
    // write. It is deliberately NOT the enforcement — see the note at the top.
    const hourlyCharged = rows
      .filter((r: any) => String(r.hourlyWindowKey ?? '') === windowKey)
      .reduce((sum: number, r: any) => sum + Number(r.hourlyCount || 0), 0);
    if (hourlyCharged + n > MAX_NEW_EMAILS_PER_HOUR) {
      return { allowed: false, error: HOURLY_BUDGET_MESSAGE, retryAfterSeconds };
    }

    // Increments only rows with room left, so the cap is part of the write.
    const claimHourly = () =>
      base44.asServiceRole.entities.EmailProbe.updateMany(
        {
          userId,
          windowKey: LIFETIME_KEY,
          hourlyWindowKey: windowKey,
          hourlyCount: { $lte: MAX_NEW_EMAILS_PER_HOUR - n },
        },
        { $inc: { hourlyCount: n } },
      );
    // Adds to the remembered addresses rather than replacing the stored list, so
    // callers running in parallel each contribute their own addresses instead of
    // overwriting one another. A replaced list would forget addresses this hour
    // already paid for, and those would then be charged — and refused — again.
    const rememberProbedAddresses = () =>
      base44.asServiceRole.entities.EmailProbe.updateMany(
        { userId, windowKey: LIFETIME_KEY, hourlyWindowKey: windowKey },
        { $addToSet: { probedEmails: { $each: newlyProbed } } },
      );
    const updatedCount = async (write: Promise<any>) => Number((await write)?.updated ?? 0);

    // 1. The hour is open — take the batch.
    let claimed = await updatedCount(claimHourly());

    if (!claimed) {
      // 2. A new hour (or this account's first lookup): move the row into the
      //    new hour. This writes constant values only, so an opener landing after
      //    another caller's charge can at worst discard that charge — never carry
      //    a batch size it never charged — and only the first opener matches.
      const opened = await updatedCount(
        base44.asServiceRole.entities.EmailProbe.updateMany(
          { userId, windowKey: LIFETIME_KEY, hourlyWindowKey: { $ne: windowKey } },
          { $set: { hourlyWindowKey: windowKey, hourlyCount: 0, probedEmails: [] } },
        ),
      );
      if (opened) {
        ledgerExists = true;
        claimed = await updatedCount(claimHourly());
      }
    }

    if (claimed) {
      // Charge BEFORE the lookup, so nothing is ever looked up unpaid.
      await rememberProbedAddresses();
    } else {
      // 3. Nothing claimed: either the hour is spent, or no ledger row exists
      //    yet. Re-read to tell the two apart — a concurrent first caller may
      //    have created the row since our read — and retry the claim once.
      const retryRows = (await readLedger()) || [];
      if (retryRows.length) ledgerExists = true;
      claimed = retryRows.length ? await updatedCount(claimHourly()) : 0;
      if (claimed) {
        await rememberProbedAddresses();
      } else if (ledgerExists) {
        return { allowed: false, error: HOURLY_BUDGET_MESSAGE, retryAfterSeconds };
      } else {
        // First use on this account — open the ledger with this hour's batch.
        await base44.asServiceRole.entities.EmailProbe.create({
          userId,
          windowKey: LIFETIME_KEY,
          hourlyWindowKey: windowKey,
          hourlyCount: n,
          chargedCount: 0,
          probedEmails: newlyProbed,
        });
        ledgerExists = true;
      }
    }
  }

  // All-time ceiling on distinct addresses, so a sweep cannot simply continue
  // hour after hour. Each address is charged once, recorded on the caller's own
  // contact record, so re-checking an address already checked is free.
  const chargedSoFar = rows.reduce(
    (sum: number, r: any) => sum + Number(r.chargedCount || 0),
    0,
  );
  const uncharged = contacts.filter(
    (c) => (c.email || '').trim() && c.accountCheckCharged !== true && c.id,
  );
  if (uncharged.length) {
    if (chargedSoFar + uncharged.length > MAX_LIFETIME_EMAILS) {
      return { allowed: false, error: LIFETIME_BUDGET_MESSAGE };
    }
    // Charge before the lookup, and only while the remaining all-time budget
    // covers it, so parallel calls cannot each read the same total.
    if (ledgerExists) {
      const bumped = await base44.asServiceRole.entities.EmailProbe.updateMany(
        {
          userId,
          windowKey: LIFETIME_KEY,
          chargedCount: { $lte: MAX_LIFETIME_EMAILS - uncharged.length },
        },
        { $inc: { chargedCount: uncharged.length } },
      );
      if (!Number(bumped?.updated ?? 0)) {
        return { allowed: false, error: LIFETIME_BUDGET_MESSAGE };
      }
    } else {
      await base44.asServiceRole.entities.EmailProbe.create({
        userId,
        windowKey: LIFETIME_KEY,
        chargedCount: uncharged.length,
      });
    }
    await base44.entities.Person.bulkUpdate(
      uncharged.map((p) => ({ id: p.id, accountCheckCharged: true })),
    );
  }

  return { allowed: true };
}