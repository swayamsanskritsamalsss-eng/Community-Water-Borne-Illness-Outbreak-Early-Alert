Aarogya - static assets
=======================

manifest.webmanifest  PWA manifest (app name, icons, theme).
sw.js                 Service worker: push notification handling,
                      notification click routing, basic offline cache.
icon-192.png          App icon (192x192, also used as maskable icon).

Service worker notes:
- The service worker caches visited GET responses for basic
  offline fallback. Authentication is handled by the app itself;
  API calls always go to the backend when online.
- Push notifications use VAPID keys configured on the backend.
  If the backend has no VAPID private key, alerts still work in
  the dashboards but no push notifications are delivered.
