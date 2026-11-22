import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { listAll, filterAll } from "../../shared/batchProcess.ts";
import { checkAndRecordAttempt } from "../../shared/codeAttemptLimit.ts";
import { chargeEmailLookups } from "../../shared/emailProbeBudget.ts";

const MAX_EMAILS_PER_CALL = 50;
const MAX_CALLS_PER_HOUR = 20;
// A contact must have existed this long before its email can be probed, so an
// attacker cannot bulk-create Person contacts with harvested addresses and
// query them in the same burst. Real contacts are already far older than this.
const MIN_CONTACT_AGE_MS = 24 * 60 * 60 * 1000;

// Lookup: given a list of the caller's OWN contact emails, returns which of
// those emails belong to existing FinBump users.
//
// A contact must also have existed for at least 24 hours before it can be
// probed, so an attacker cannot bulk-create Person contacts with harvested
// addresses and query them in the same burst. What further bounds the exposure
// are the budgets in
// shared/emailProbeBudget.ts — an hourly one that counts NEW addresses rather
// than calls, and an all-time one on the total number of distinct addresses an
// account may ever check. That ledger is shared with send-card, which asks the
// same account-existence question for a single contact, so splitting a sweep
// across both paths buys nothing. A real user re-checking their own contact
// list is never blocked.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in to continue.' }, { status: 401 });

    // Rate limit: cap calls per user per hour to prevent enumeration sweeps.
    const attempt = await checkAndRecordAttempt(
      base44, user.id, 'check-keepsake-users', MAX_CALLS_PER_HOUR, 60,
    );
    if (!attempt.allowed) {
      return Response.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(attempt.retryAfterSeconds) } },
      );
    }

    const body = await req.json().catch(() => ({}));
    const emails = Array.isArray(body?.emails) ? body.emails : [];
    const normalized = emails
      .map((e) => (e || '').trim().toLowerCase())
      .filter(Boolean)
      .slice(0, MAX_EMAILS_PER_CALL);
    if (!normalized.length) return Response.json({ users: {} });

    // Resolve the caller's OWN Person contacts first, and only ever budget or
    // look up addresses that belong to one of them, AND only contacts that have
    // existed for at least MIN_CONTACT_AGE_MS. The age gate means an attacker
    // who bulk-creates Person contacts with harvested addresses must wait a day
    // before any of them can be probed — see the note above the constants.
    const myPeople = await listAll(base44.entities.Person);
    const contactByEmail = new Map<string, any>();
    for (const p of myPeople) {
      const e = (p.email || '').trim().toLowerCase();
      if (e) contactByEmail.set(e, p);
    }
    const nowMs = Date.now();
    const allowed = normalized.filter((e) => {
      const p = contactByEmail.get(e);
      if (!p) return false;
      const created = p.created_date ? new Date(p.created_date).getTime() : 0;
      return nowMs - created >= MIN_CONTACT_AGE_MS;
    });
    if (!allowed.length) return Response.json({ users: {} });

    // Charge these addresses against the account's shared lookup budget — the
    // same ledger send-card draws on — BEFORE anything is looked up, so a burst
    // of parallel calls cannot each read an unchanged budget and slip past it.
    const charge = await chargeEmailLookups(
      base44,
      user.id,
      allowed.map((e) => contactByEmail.get(e)),
    );
    if (!charge.allowed) {
      return Response.json(
        { error: charge.error },
        {
          status: 429,
          ...(charge.retryAfterSeconds
            ? { headers: { 'Retry-After': String(charge.retryAfterSeconds) } }
            : {}),
        },
      );
    }

    // Check which of the caller's own contact emails belong to FinBump users.
    // Filter by email instead of loading the entire user table to avoid a
    // performance/DoS vector at scale.
    const matched = await filterAll(base44.asServiceRole.entities.User, {
      email: { $in: allowed },
    });
    const users = {};
    for (const u of matched) {
      const e = (u.email || '').trim().toLowerCase();
      if (e) users[e] = true;
    }
    return Response.json({ users });
  } catch (error) {
    console.error('check-keepsake-users error', error?.message || error);
    return Response.json({ error: 'Could not check users.' }, { status: 500 });
  }
}