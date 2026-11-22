// Opens a Base44 Payments (Wix) checkout URL in the system browser when the app
// is running inside a native app wrapper or installed PWA, so Apple/Google do
// not treat the subscription purchase as in-app digital-goods billing (which
// would require StoreKit / Google Play Billing and trigger rejection).
//
// In a regular browser tab we keep the existing behavior — navigate in the
// same tab — since the web context is already an allowed checkout surface.
export function openCheckoutUrl(url) {
  if (!url) return;
  const isStandalone =
    (typeof window.matchMedia === "function" &&
      window.matchMedia("(display-mode: standalone)").matches) ||
    window.navigator.standalone === true;
  // True when the app is shown inside a frame (the builder preview embeds it).
  // Navigating that frame to the checkout page fails: the provider refuses to be
  // framed, which surfaces as "refused to connect". The checkout must always end
  // up top-level, in its own tab when we are framed.
  const isEmbedded = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();
  if (isStandalone || isEmbedded) {
    // Break out of the WebView / installed PWA / preview frame.
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (!opened) window.location.href = url;
  } else {
    window.location.href = url;
  }
}