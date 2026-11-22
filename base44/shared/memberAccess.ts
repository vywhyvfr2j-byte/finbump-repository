import { checkPremiumEntitlement } from "./entitlement.ts";

// The app's front door, for backend functions.
//
// Signing up alone does not unlock FinBump: the app shows the sign-up gate
// until a member starts the 7-day trial, pays for a plan, or redeems a
// complimentary code an admin issued. Those facts live only in the
// server-written ledger (Base44Purchase, written by the payment webhook) and in
// the admin-managed AccessCode entity — never in the client-writable User.plan
// field — so this check cannot be bypassed from the browser.
//
// This mirrors check-access, so a function guarded by it accepts exactly the
// accounts the app itself lets in. The AI endpoints use it so an account that
// never got past the sign-up gate cannot spend integration credits.
export async function hasMemberAccess(base44: any, user: any): Promise<boolean> {
  if (!user) return false;
  if (user.role === "admin") return true;

  const entitlement = await checkPremiumEntitlement(
    base44.asServiceRole,
    user.id,
    user.email,
  );
  if (entitlement.tier) return true;

  // Complimentary access: an admin-issued code redeemed by this account.
  const codes = await base44.asServiceRole.entities.AccessCode.filter({ usedBy: user.id });
  return (codes ?? []).some((c: any) => c.usedBy === user.id && c.usedAt);
}