/**
 * PWA module shim for the Chrome extension build.
 *
 * The main app imports `virtual:pwa-register/react` (provided by vite-plugin-pwa)
 * to enable service-worker update notifications. The Chrome extension does not
 * use a PWA service worker, so we export no-op stubs to satisfy the import
 * without breaking the bundle.
 */

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function useRegisterSW() {
  return {
    needRefresh: [false, () => {}],
    offlineReady: [false, () => {}],
    updateServiceWorker: () => {},
  } as const;
}
