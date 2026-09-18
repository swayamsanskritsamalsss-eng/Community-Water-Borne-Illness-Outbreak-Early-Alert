const CACHE_NAME = "aarogya-v1";

const STATIC_ASSETS = [
  "/",
  "/login",
  "/icon-192.png"
];


self.addEventListener(
  "install",
  (event) => {

    event.waitUntil(
      caches.open(CACHE_NAME)
        .then((cache) =>
          cache.addAll(
            STATIC_ASSETS
          )
        )
        .catch(() => {
          // Cache failure should not
          // prevent service worker install.
        })
    );

    self.skipWaiting();
  }
);


self.addEventListener(
  "activate",
  (event) => {

    event.waitUntil(
      caches.keys()
        .then((cacheNames) =>
          Promise.all(
            cacheNames
              .filter(
                (name) =>
                  name !== CACHE_NAME
              )
              .map((name) =>
                caches.delete(name)
              )
          )
        )
    );

    self.clients.claim();
  }
);


/* ============================================================
   PUSH NOTIFICATION
   ============================================================ */

self.addEventListener(
  "push",
  (event) => {

    let data = {
      title: "Aarogya Alert",
      message:
        "A new Aarogya alert requires attention.",
      url: "/authority/alerts"
    };


    if (event.data) {

      try {

        data =
          event.data.json();

      } catch {

        data.message =
          event.data.text();
      }
    }


    const title =
      data.title ||
      "Aarogya Alert";


    const options = {
      body:
        data.message ||
        "New Aarogya alert.",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: "aarogya-alert",
      renotify: true,
      requireInteraction: true,
      data: {
        url:
          data.url ||
          "/authority/alerts"
      }
    };


    event.waitUntil(
      self.registration.showNotification(
        title,
        options
      )
    );
  }
);


/* ============================================================
   NOTIFICATION CLICK
   ============================================================ */

self.addEventListener(
  "notificationclick",
  (event) => {

    event.notification.close();


    const targetUrl =
      event.notification?.data?.url ||
      "/authority/alerts";


    event.waitUntil(

      clients.matchAll({
        type: "window",
        includeUncontrolled: true
      })
      .then((clientList) => {

        for (
          const client of clientList
        ) {

          if (
            "focus" in client
          ) {

            client.navigate(
              targetUrl
            );

            return client.focus();
          }
        }


        if (
          clients.openWindow
        ) {

          return clients.openWindow(
            targetUrl
          );
        }

      })

    );
  }
);


/* ============================================================
   BASIC FETCH CACHE
   ============================================================ */

self.addEventListener(
  "fetch",
  (event) => {

    if (
      event.request.method !==
      "GET"
    ) {
      return;
    }


    event.respondWith(

      fetch(event.request)
        .then((response) => {

          const cloned =
            response.clone();

          caches.open(
            CACHE_NAME
          ).then((cache) => {

            cache.put(
              event.request,
              cloned
            );

          });

          return response;

        })
        .catch(() =>
          caches.match(
            event.request
          )
        )

    );
  }
);