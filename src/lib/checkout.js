import { base44 } from '@/api/base44Client';

// True when the app is inside a native wrapper, an installed PWA or the builder
// preview frame. Checkout must then end up in a top-level tab: the provider
// refuses to be framed (that surfaces as "refused to connect").
function needsTopLevelTab() {
  const standalone =
    (typeof window.matchMedia === 'function' &&
      window.matchMedia('(display-mode: standalone)').matches) ||
    window.navigator.standalone === true;
  let embedded = false;
  try {
    embedded = window.self !== window.top;
  } catch {
    embedded = true;
  }
  return standalone || embedded;
}

// Starts a Base44 Payments checkout and sends the buyer to it.
//
// The tab is opened on the click itself, because a tab opened after the network
// round-trip has lost the user gesture and is blocked as a popup — which is why
// a "Pay now" click could otherwise appear to do nothing at all. Once the
// session URL comes back, that same tab is pointed at it.
export async function startCheckout(productId, { payNow = false, quantity } = {}) {
  const topLevel = needsTopLevelTab();
  let tab = null;
  if (topLevel) {
    tab = window.open('about:blank', '_blank');
    if (tab) {
      try {
        tab.opener = null;
      } catch {
        /* some browsers refuse; harmless */
      }
    }
  }

  try {
    const res = await base44.functions.invoke('create-checkout', {
      productId,
      ...(payNow ? { payNow: true } : {}),
      ...(quantity ? { quantity } : {}),
    });
    const redirectUrl = res?.data?.redirectUrl || res?.redirectUrl;
    if (!redirectUrl) throw new Error('Checkout did not return a payment page');
    if (tab && !tab.closed) {
      tab.location.href = redirectUrl;
    } else if (topLevel && window.open(redirectUrl, '_blank')) {
      // The pre-opened tab was blocked; try once more now that we have the URL.
    } else {
      window.location.href = redirectUrl;
    }
    return true;
  } catch (error) {
    if (tab && !tab.closed) tab.close();
    throw error;
  }
}