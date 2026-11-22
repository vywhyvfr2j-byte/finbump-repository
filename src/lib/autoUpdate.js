// Registers the FinBump service worker and silently auto-updates the app
// when a new version is published. Only runs in production so dev-mode
// caching never interferes with hot-reload during development.

export function registerAutoUpdate() {
  if (!import.meta.env.PROD) return;
  if (!('serviceWorker' in navigator)) return;

  let reloading = false;

  // When the new SW finishes activating, it posts SW_UPDATED — reload once
  // so the user picks up the latest app shell immediately.
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'SW_UPDATED' && !reloading) {
      reloading = true;
      window.location.reload();
    }
  });

  // Also reload when a freshly installed SW takes control (covers the case
  // where the message fires before this listener is attached).
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!reloading) {
      reloading = true;
      window.location.reload();
    }
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // SW registration failure is non-fatal — the app still works online.
    });
  });
}