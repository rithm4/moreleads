self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(clients.claim()));

self.addEventListener('push', event => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Moreleads', {
      body: data.body || '',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      vibrate: [200, 100, 200],
      data: { url: data.url || '/tasks' }
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if ('focus' in client) {
          client.focus();
          client.navigate(event.notification.data.url);
          return;
        }
      }
      return clients.openWindow(event.notification.data.url);
    })
  );
});
