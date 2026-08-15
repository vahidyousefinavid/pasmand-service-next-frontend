/**
 * The push half of the service worker.
 *
 * next-pwa builds the caching worker from workbox and importScripts this file
 * into it, so everything push-related lives here rather than in generated code.
 *
 * The server (Utils/Notify.js) sends { title, body, url }. `url` is the screen
 * the notification is about — a new job goes to /new-requests, a message goes
 * to the job list — and tapping the notification has to land there, otherwise
 * the collector gets told something happened and then has to go find it.
 */

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    // A push whose body is not JSON is still worth showing.
    payload = { body: event.data ? event.data.text() : '' };
  }

  const title = payload.title || 'شهر شهر';
  const url = payload.url || '/';

  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || '',
      icon: payload.icon || '/icons/icon-192.png',
      badge: '/icons/icon-128.png',
      dir: 'rtl',
      lang: 'fa',
      // Same tag replaces an unread notification about the same screen instead
      // of stacking five of them while the phone is in a pocket.
      tag: url,
      renotify: true,
      data: { url },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const target = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      // Reuse a tab that is already on this origin — the old code compared the
      // full href to "/" and so never matched, opening a new window every time.
      for (const client of list) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          if ('navigate' in client) client.navigate(target).catch(() => {});
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
      return undefined;
    }),
  );
});
