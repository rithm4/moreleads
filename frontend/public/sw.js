// v4
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(clients.claim()));

self.addEventListener('push', event => {
  const data = event.data?.json() ?? {};

  event.waitUntil((async () => {
    await self.registration.showNotification(data.title || 'Moreleads', {
      body: data.body || '',
      icon: '/logo.png',
      badge: '/logo.png',
      vibrate: [200, 100, 200],
      data: { url: data.url || '/tasks' }
    });

    // Persist unread flag for when app was closed
    try {
      const cache = await caches.open('push-meta');
      await cache.put('unread', new Response('1'));
    } catch (e) {}

    // Notify any open app tabs
    try {
      const list = await self.clients.matchAll({ includeUncontrolled: true });
      list.forEach(c => c.postMessage({ type: 'push-received' }));
    } catch (e) {}

    // Set badge on app icon (iOS 16.4+ / Android Chrome)
    try {
      await self.navigator.setAppBadge(1);
    } catch (e) {}
  })());
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  event.waitUntil((async () => {
    // Clear badge and unread flag
    try { await self.navigator.clearAppBadge(); } catch (e) {}
    try {
      const cache = await caches.open('push-meta');
      await cache.delete('unread');
    } catch (e) {}

    const list = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of list) {
      if ('focus' in client) {
        await client.focus();
        client.navigate(event.notification.data.url);
        return;
      }
    }
    return clients.openWindow(event.notification.data.url);
  })());
});
