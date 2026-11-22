// The operator's address, for the scheduled jobs that mail one summary to the
// person running the app (upgrade ideas, launch checklist).
//
// These jobs used to load every account to find the first admin. That read is
// O(users) — a few hundred pages at 100k accounts, spent to recover a single
// email address. Asking for the admin role directly keeps the cost constant no
// matter how large the base gets.
//
// The User entity only takes the positional form (query, sort, limit, skip) and
// answers with an array — an options object is refused.
export async function findAdminWithEmail(base44: any): Promise<{ email: string } | null> {
  const admins: any[] = await base44.asServiceRole.entities.User.filter(
    { role: 'admin' },
    '-created_date',
    10,
    0,
  );
  return (admins || []).find((u: any) => u?.email) ?? null;
}