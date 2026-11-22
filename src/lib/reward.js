// The payoff for checking something off. A completed act is the moment the
// habit is built, so it gets an immediate, physical-feeling response: a short
// haptic tap where the device supports it. The visual part is the
// `.ks-check-pop` animation, which the global reduce-motion rule already
// disables for anyone who asked for less movement.
export function pulseCheck() {
  try {
    navigator.vibrate?.(12);
  } catch {
    // No haptics on this device — the animation still plays.
  }
}