// Founding-member numbering.
//
// A member's number is derived from two things the server can verify about the
// account — which account it is (its user id) and when it was created — so
// nobody can choose their own number.
//   • a reserved number goes to the one account it is reserved for
//   • everyone else is numbered in sign-up order, from 101 upward
// Numbers are zero-padded to six digits (#000002).
//
// Reservations live in the FoundingMemberReservation entity (admin-managed) and
// are matched on user id alone: an email address or a display name can be changed
// or imitated, a user id cannot. No personal details are kept in source.

export const SEQUENTIAL_START = 101;
export const MAX_NUMBER = 999999;

export type Reservation = { userId: string; number: number };

export function formatMemberNumber(n: number): string {
  return String(n).padStart(6, '0');
}

function normalise(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

export type RosterEntry = {
  userId: string;
  email: string;
  fullName: string;
  number: string;
  joinedAt: string;
};

/**
 * Builds the full numbered roster from the user records themselves, so the same
 * list is produced on every run and a number never shifts once assigned.
 */
export function buildRoster(users: any[], reservations: Reservation[] = []): RosterEntry[] {
  const accounts = (users || []).filter((u) => u && u.id && !u.is_service);
  const roster: RosterEntry[] = [];
  const claimed = new Set<string>();

  const entryFor = (u: any, number: number): RosterEntry => ({
    userId: u.id,
    email: normalise(u.email),
    fullName: String(u.full_name ?? '').trim(),
    number: formatMemberNumber(number),
    joinedAt: u.created_date || '',
  });

  // Reserved numbers first, so the sequential pass can never take one. A number is
  // held for exactly the account its reservation names; a reservation for someone
  // who has not signed up yet simply waits in the entity.
  const reservedByUser = new Map<string, number>();
  for (const r of reservations || []) {
    const userId = String(r?.userId ?? '').trim();
    const number = Number(r?.number);
    if (!userId || !Number.isInteger(number) || number < 1 || number > MAX_NUMBER) continue;
    if (!reservedByUser.has(userId)) reservedByUser.set(userId, number);
  }
  for (const u of accounts) {
    const reserved = reservedByUser.get(u.id);
    if (reserved == null) continue;
    const key = formatMemberNumber(reserved);
    if (claimed.has(key)) continue;
    claimed.add(key);
    roster.push(entryFor(u, reserved));
  }

  const bySignup = accounts
    .filter((u) => !roster.some((r) => r.userId === u.id))
    .sort((a, b) => new Date(a.created_date || 0).getTime() - new Date(b.created_date || 0).getTime());

  let next = SEQUENTIAL_START;
  for (const u of bySignup) {
    while (claimed.has(formatMemberNumber(next))) next++;
    if (next > MAX_NUMBER) break;
    claimed.add(formatMemberNumber(next));
    roster.push(entryFor(u, next));
    next++;
  }

  return roster;
}