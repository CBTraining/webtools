import { registerSW } from 'virtual:pwa-register';

// Auto-update service worker immediately when a new deployment is detected
let refreshing = false;

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      console.log('[WebTools PWA] New service worker activated, reloading application for latest update...');
      window.location.reload();
    }
  });
}

export const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[WebTools PWA] New version available, applying update...');
    updateSW(true);
  },
  onOfflineReady() {
    console.log('[WebTools PWA] Application ready to work offline.');
  },
  onRegisteredSW(swUrl, registration) {
    if (!registration) return;

    console.log('[WebTools PWA] Service worker registered:', swUrl);

    // 1. Check for update immediately on page load
    registration.update().catch((err) => {
      console.warn('[WebTools PWA] Initial update check error:', err);
    });

    // 2. Check for update when user refocuses or brings tab to foreground
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        registration.update().catch(() => {});
      }
    });

    window.addEventListener('focus', () => {
      registration.update().catch(() => {});
    });

    // 3. Periodic background check every 30 minutes
    setInterval(() => {
      registration.update().catch(() => {});
    }, 30 * 60 * 1000);
  }
});
