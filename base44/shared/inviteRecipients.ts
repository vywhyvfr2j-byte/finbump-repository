// Who the app may email on a host's behalf for a meal or trip invitation.
//
// The invitee list arrives in the request body, and an invitation carries the
// host's own words on FinBump's sending domain. So the auto-send path must not
// trust anything the caller can simply assert. A saved Person record used to be
// enough — which meant any account could add a contact for a stranger's address
// and have FinBump mail it, at up to a dozen addresses per gathering.
//
// An address is now emailed only when the app can confirm the recipient really
// is connected to this host:
//
//   1. the host's own address;
//   2. the host's paired partner (the pairing is mutual and code-confirmed);
//   3. a saved connection of the host whose address belongs to a real FinBump
//      account — a registered account is the only thing that cannot be typed in.
//
// Everyone else is still invited: the record and its private link are created
// either way, and both the meal and trip screens offer a copy button per person,
// so the host shares the link themselves. Contacts are read by owner id rather
// than through the caller's row-level scope, so an admin account cannot widen
// this to other people's address books.
//
// Addresses that do not appear in the host's connections are never even looked
// up. Ownership alone is friction rather than a guarantee — a harvested address
// can simply be saved as a contact first — so the account question itself is
// bounded by the shared EmailProbe ledger (shared/emailProbeBudget.ts) and the
// 24-hour contact-age gate wherever it is answered for a caller.

function normalise(email: unknown): string {
  return String(email ?? '').trim().toLowerCase();
}

export type InviteTrust = {
  ownEmail: string;
  partnerEmail: string;
  contactEmails: Set<string>;
  isRegistered: (email: string) => Promise<boolean>;
};

async function buildTrust(svc: any, owner: any): Promise<InviteTrust> {
  const ownEmail = normalise(owner?.email);
  let partnerEmail = '';
  const contactEmails = new Set<string>();

  // The host's own saved connections, pinned to their owner id.
  try {
    const people = await svc.entities.Person.filter({ created_by_id: owner?.id });
    for (const person of people || []) {
      const email = normalise(person?.email);
      if (email) contactEmails.add(email);
    }
  } catch (err: any) {
    console.error('inviteTrust: could not read connections:', err?.message || err);
  }

  // A paired partner is a real, mutually confirmed connection. Both sides must
  // still point at each other, so a stale one-sided link grants nothing.
  try {
    const record = await svc.entities.User.get(owner?.id);
    const partnerId = record?.partnerUserId;
    if (partnerId) {
      const partner = await svc.entities.User.get(partnerId);
      if (partner?.partnerUserId === owner?.id) partnerEmail = normalise(partner.email);
    }
  } catch (err: any) {
    console.error('inviteTrust: could not read the paired partner:', err?.message || err);
  }

  const cache = new Map<string, boolean>();
  const isRegistered = async (email: string): Promise<boolean> => {
    if (cache.has(email)) return cache.get(email) as boolean;
    let found = false;
    try {
      const matches = await svc.entities.User.filter({ email });
      found = Array.isArray(matches) && matches.length > 0;
    } catch (err: any) {
      // Without a confirmed account nothing is auto-sent — the host still has links.
      console.error('inviteTrust: could not check an address:', err?.message || err);
    }
    cache.set(email, found);
    return found;
  };

  return { ownEmail, partnerEmail, contactEmails, isRegistered };
}

// For a request made by the host themselves.
export async function inviteTrustForCaller(base44: any, user: any): Promise<InviteTrust> {
  return buildTrust(base44?.asServiceRole || base44, user);
}

// For a background job working on someone else's gathering.
export async function inviteTrustForOwner(db: any, ownerId: string): Promise<InviteTrust> {
  const svc = db?.asServiceRole || db;
  let owner: any = null;
  try {
    owner = await svc.entities.User.get(ownerId);
  } catch (err: any) {
    console.error('inviteTrustForOwner: could not read the host:', err?.message || err);
  }
  return buildTrust(svc, owner || { id: ownerId });
}

// True only for an address the host actually has as a connection — their own,
// their paired partner's, or one saved on their Person records. Invitations are
// refused for anything else, so a typed-in stranger can never be invited.
export function isInviteable(trust: InviteTrust, email: unknown): boolean {
  const value = normalise(email);
  if (!value) return false;
  return value === trust.ownEmail || value === trust.partnerEmail || trust.contactEmails.has(value);
}

// The host-facing reason an invitation was refused outright.
export function contactsOnlyError(names: string[]): string {
  const shown = names.filter(Boolean).slice(0, 3).join(', ');
  return names.length === 1
    ? `${shown || 'That person'} isn't in your connections yet. Add them under People, then invite them.`
    : `${names.length} people (${shown}${names.length > 3 ? ', …' : ''}) aren't in your connections yet. Add them under People, then invite them.`;
}

// True only when the app can confirm this address is connected to the host.
export async function canEmailInvite(trust: InviteTrust, email: unknown): Promise<boolean> {
  const value = normalise(email);
  if (!value) return false;
  if (value === trust.ownEmail) return true;
  if (value === trust.partnerEmail) return true;
  // A saved connection counts only once it resolves to a real account.
  if (!trust.contactEmails.has(value)) return false;
  return trust.isRegistered(value);
}

// Explains, in the host's terms, why some invitations were saved but not mailed.
export function notEmailedWarning(count: number, kind: 'meal' | 'trip'): string {
  if (count < 1) return '';
  const who = kind === 'meal' ? 'guest' : 'traveler';
  const reason = 'FinBump only emails addresses it can confirm belong to someone you are connected to on FinBump.';
  return count === 1
    ? `1 ${who} was invited but not emailed — ${reason} Copy their private link from this ${kind} and send it to them yourself.`
    : `${count} ${who}s were invited but not emailed — ${reason} Copy their private links from this ${kind} and send them yourself.`;
}