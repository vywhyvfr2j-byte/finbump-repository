// The hosted Base44 backend. Every API call must be built on this absolute
// address, never on a path relative to the page.
//
// In a browser the two are the same thing, because the app is served from
// Base44's own domain. The app also ships inside a native WebView (Capacitor),
// where the page origin is capacitor://localhost — and a relative /api/... call
// there resolves to the app's own bundled HTML instead of the API. That request
// comes back "successful" with an HTML document, so nothing looks broken, yet
// startup waits on data that never arrives.
export const API_BASE_URL = 'https://base44.app';