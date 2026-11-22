// Single source of truth for all purchaseable products. Imported by both
// create-checkout (to build the Wix checkout session) and payments-webhook
// (to know what to grant on ORDER_APPROVED). Adding or changing a product
// here is the only edit needed — both functions read from this map.

export interface ProductDef {
  name: string;
  price: string;
  currency: string;
  frequency: "YEAR" | "MONTH";
  interval?: number;
  title: string;
  description: string;
  trial: boolean;
  tier: "basic" | "premium";
  passCreditsAnnual: number;
  passCreditsMonthly: number;
  renewalDiscount?: number;
  lifetime?: boolean;
  lifetimeTier?: string;
  passCreditsLifetime?: number;
  // A seat bought for someone else (an extra person on a family plan). It grants
  // a shareable pass and never unlocks access for the buyer, so neither the
  // webhook nor the entitlement check may set a plan or lifetime tier for it.
  addOn?: boolean;
}

export const PRODUCTS: Record<string, ProductDef> = {
  // ---- Basic tier (individual) ----
  "keepsake-basic-monthly": {
    name: "FinBump Basic", price: "2.99", currency: "USD",
    frequency: "MONTH", interval: 3,
    title: "FinBump Basic (Quarterly)",
    description: "FinBump Basic — 7-day free trial, then $2.99/quarter.",
    trial: true,
    tier: "basic",
    passCreditsAnnual: 0, passCreditsMonthly: 0,
  },
  "keepsake-basic-yearly": {
    name: "FinBump Basic", price: "9.49", currency: "USD",
    frequency: "YEAR",
    title: "FinBump Basic (Annual)",
    description: "FinBump Basic — 7-day free trial, then $9.49/year.",
    trial: true,
    tier: "basic",
    passCreditsAnnual: 0, passCreditsMonthly: 0,
  },
  "keepsake-basic-lifetime": {
    name: "FinBump Basic Lifetime", price: "29.99", currency: "USD",
    frequency: "YEAR",
    title: "FinBump Basic Lifetime",
    description: "Lifetime Basic for you — one-time payment, never renews.",
    trial: false,
    tier: "basic",
    passCreditsAnnual: 0, passCreditsMonthly: 0,
    lifetime: true,
    lifetimeTier: "lifetime-basic",
  },
  // ---- Premium tier (individual) ----
  "keepsake-premium-monthly": {
    name: "FinBump Premium", price: "5.99", currency: "USD",
    frequency: "MONTH", interval: 3,
    title: "FinBump Premium (Quarterly)",
    description: "FinBump Premium — 7-day free trial, then $5.99/quarter.",
    trial: true,
    tier: "premium",
    passCreditsAnnual: 0, passCreditsMonthly: 0,
  },
  "keepsake-premium-yearly": {
    name: "FinBump Premium", price: "18.99", currency: "USD",
    frequency: "YEAR",
    title: "FinBump Premium (Annual)",
    description: "FinBump Premium — 7-day free trial, then $18.99/year.",
    trial: true,
    tier: "premium",
    passCreditsAnnual: 0, passCreditsMonthly: 0,
  },
  "keepsake-premium-lifetime": {
    name: "FinBump Premium Lifetime", price: "59.99", currency: "USD",
    frequency: "YEAR",
    title: "FinBump Premium Lifetime",
    description: "Lifetime Premium for you — one-time payment, never renews.",
    trial: false,
    tier: "premium",
    passCreditsAnnual: 0, passCreditsMonthly: 0,
    lifetime: true,
    lifetimeTier: "lifetime-premium-individual",
  },
  // ---- Quarterly (kept for existing subscribers; not shown in new UI) ----
  "keepsake-premium-quarterly": {
    name: "FinBump Premium", price: "6.99", currency: "USD",
    frequency: "MONTH", interval: 3,
    title: "FinBump Premium (Quarterly)",
    description: "FinBump Premium — 7-day free trial, then $6.99/quarter.",
    trial: true,
    tier: "premium",
    passCreditsAnnual: 0, passCreditsMonthly: 0,
  },
  // ---- Family packages — annual subscription for the purchaser + shareable passes ----
  "keepsake-family-starter": {
    name: "Family Starter", price: "29.99", currency: "USD",
    frequency: "YEAR",
    title: "FinBump Family Starter",
    description: "Annual Premium for you + 1 annual pass to share.",
    trial: false,
    tier: "premium",
    passCreditsAnnual: 1, passCreditsMonthly: 0,
    renewalDiscount: 0.15,
  },
  "keepsake-family-package": {
    name: "Family Package", price: "44.99", currency: "USD",
    frequency: "YEAR",
    title: "FinBump Family Package",
    description: "Annual Premium for you + 3 annual passes to share.",
    trial: false,
    tier: "premium",
    passCreditsAnnual: 3, passCreditsMonthly: 0,
    renewalDiscount: 0.15,
  },
  "keepsake-super-family": {
    name: "Super Family Pass", price: "49.99", currency: "USD",
    frequency: "YEAR",
    title: "FinBump Super Family Pass",
    description: "Annual Premium for you + 4 annual passes to share.",
    trial: false,
    tier: "premium",
    passCreditsAnnual: 4, passCreditsMonthly: 0,
    renewalDiscount: 0.15,
  },
  // ---- Lifetime family passes — one-time charge, permanent access + shareable passes ----
  "keepsake-lifetime-essential": {
    name: "Lifetime Essential", price: "79.99", currency: "USD",
    frequency: "YEAR",
    title: "FinBump Lifetime Essential",
    description: "Lifetime Premium for you — one-time payment, never renews.",
    trial: false,
    tier: "premium",
    passCreditsAnnual: 0, passCreditsMonthly: 0,
    lifetime: true,
    lifetimeTier: "lifetime-essential",
  },
  "keepsake-lifetime-plus": {
    name: "Lifetime Plus", price: "119.99", currency: "USD",
    frequency: "YEAR",
    title: "FinBump Lifetime Plus",
    description: "Lifetime Premium for you + 2 annual passes to share — one-time payment, never renews.",
    trial: false,
    tier: "premium",
    passCreditsAnnual: 0, passCreditsMonthly: 0,
    lifetime: true,
    lifetimeTier: "lifetime-plus",
    passCreditsLifetime: 2,
  },
  "keepsake-lifetime-premium": {
    name: "Lifetime Premium Family", price: "179.99", currency: "USD",
    frequency: "YEAR",
    title: "FinBump Lifetime Premium Family",
    description: "Lifetime Premium for you + 4 annual passes to share — one-time payment, never renews.",
    trial: false,
    tier: "premium",
    passCreditsAnnual: 0, passCreditsMonthly: 0,
    lifetime: true,
    lifetimeTier: "lifetime-premium",
    passCreditsLifetime: 4,
  },
  "keepsake-lifetime-family": {
    name: "Lifetime Family", price: "199.99", currency: "USD",
    frequency: "YEAR",
    title: "FinBump Lifetime Family",
    description: "Lifetime Premium for you + 6 annual passes to share — one-time payment, never renews.",
    trial: false,
    tier: "premium",
    passCreditsAnnual: 0, passCreditsMonthly: 0,
    lifetime: true,
    lifetimeTier: "lifetime-family",
    passCreditsLifetime: 6,
  },
  // ---- Add-on: extra person for the Lifetime Family/Group Plan — $10 each, no limit ----
  "keepsake-extra-person": {
    name: "FinBump Extra Person", price: "10.00", currency: "USD",
    frequency: "YEAR",
    title: "FinBump Extra Person Pass",
    description: "Add one extra person to your Lifetime Family/Group Plan — $10, one-time, never renews.",
    trial: false,
    tier: "premium",
    passCreditsAnnual: 0, passCreditsMonthly: 0,
    lifetime: true,
    lifetimeTier: "lifetime-extra-person",
    passCreditsLifetime: 1,
    addOn: true,
  },
};

// Ordered lifetime tiers by value (lowest to highest) — used for upgrade
// difference calculations. Maps tier id to its full price.
export const LIFETIME_TIERS: Array<{ id: string; productId: string; price: number; label: string }> = [
  { id: "lifetime-basic", productId: "keepsake-basic-lifetime", price: 29.99, label: "Lifetime Basic" },
  { id: "lifetime-premium-individual", productId: "keepsake-premium-lifetime", price: 59.99, label: "Lifetime Premium" },
  { id: "lifetime-essential", productId: "keepsake-lifetime-essential", price: 79.99, label: "Lifetime Essential" },
  { id: "lifetime-plus", productId: "keepsake-lifetime-plus", price: 119.99, label: "Lifetime Plus" },
  { id: "lifetime-premium", productId: "keepsake-lifetime-premium", price: 179.99, label: "Lifetime Premium Family" },
  { id: "lifetime-family", productId: "keepsake-lifetime-family", price: 199.99, label: "Lifetime Family" },
];

// Upgrade window: a monthly subscriber can upgrade to a lifetime pass within
// 60 days of their most recent payment and pay only the difference between the
// lifetime price and what they've already paid (capped at the lifetime price).
export const UPGRADE_WINDOW_DAYS = 60;