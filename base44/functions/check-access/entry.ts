import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";
import { checkPremiumEntitlement } from "../../shared/entitlement.ts";

// The app's entry gate. Signing up alone does not unlock FinBump: a member must
// either start the 7-day free trial (card on file, first charge on day 8) or pay
// for a plan. Those facts live only in the server-written ledger, never in the
// client-writable User.plan field, so this check cannot be tampered with from the
// browser. Admins and redeemed access codes are let through.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    if (user.role === "admin") {
      return Response.json({ hasAccess: true, tier: "premium", isLifetime: true });
    }

    const entitlement = await checkPremiumEntitlement(base44.asServiceRole, user.id, user.email);
    if (entitlement.tier) {
      return Response.json({
        hasAccess: true,
        tier: entitlement.tier,
        isLifetime: entitlement.isLifetime,
      });
    }

    // Complimentary access: an admin-issued code redeemed by this account.
    const codes = await base44.asServiceRole.entities.AccessCode.filter({ usedBy: user.id });
    const redeemed = (codes ?? []).some((c) => c.usedBy === user.id && c.usedAt);
    if (redeemed) {
      return Response.json({ hasAccess: true, tier: null, accessCode: true });
    }

    return Response.json({ hasAccess: false, tier: null });
  } catch (error) {
    console.error("check-access error", error?.message || error);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}