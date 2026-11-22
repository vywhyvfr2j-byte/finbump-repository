import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { PRODUCTS } from "../../shared/familyPackages.ts";

// Returns the lifetime pass price for a logged-in user. Lifetime upgrades are
// always charged at full price — no discount is applied to prior recurring
// payments. `eligible` is always false (no discount window), so the UI shows
// the full lifetime price. Kept for backwards compatibility with the UI that
// still calls this function to confirm the price.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const productId = String(body.productId ?? "");
    const product = PRODUCTS[productId];
    if (!product || !product.lifetime) {
      return Response.json({ error: "Not a lifetime product" }, { status: 400 });
    }

    const lifetimePrice = parseFloat(product.price);

    return Response.json({
      productId,
      productLabel: product.name,
      fullPrice: lifetimePrice,
      creditAmount: 0,
      upgradePrice: lifetimePrice,
      eligible: false,
      daysSincePayment: null,
      windowDays: 0,
    });
  } catch (err) {
    console.error("get-upgrade-price: unhandled error", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}