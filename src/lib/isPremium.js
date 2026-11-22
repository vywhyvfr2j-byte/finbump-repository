// One definition of "on Premium", so FeatureGate and the Home header can never
// disagree about who gets a paid feature. Admins always pass; a lifetime tier
// other than the basic one counts as Premium.
export function isPremiumUser(user) {
  if (!user) return false;
  return (
    user.role === 'admin' ||
    user.plan === 'premium' ||
    (!!user.lifetimeTier && user.lifetimeTier !== 'lifetime-basic')
  );
}