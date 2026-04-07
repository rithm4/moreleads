import { useState, useEffect } from 'react';
import api from '../api/axios';

const VAPID_PUBLIC_KEY = 'BPXKAkK9Y1-uKy8FZYh_lGDOGHnGIq_zyUP8yohRtJsjgTPZknRFv7jCKOCxc9yK8vWBX3LaJdYOFbMBeO3SLSI';

function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - base64.length % 4) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(b64);
  return new Uint8Array([...raw].map(c => c.charCodeAt(0)));
}

export function usePushNotifications() {
  const [status, setStatus] = useState('default'); // 'default' | 'granted' | 'denied' | 'unsupported'

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported');
      return;
    }
    setStatus(Notification.permission);
  }, []);

  const subscribe = async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const permission = await Notification.requestPermission();
      setStatus(permission);
      if (permission !== 'granted') return;

      const existing = await reg.pushManager.getSubscription();
      if (existing) await existing.unsubscribe();

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      await api.post('/push/subscribe', sub);
    } catch (err) {
      console.error('Push error:', err);
    }
  };

  const unsubscribe = async () => {
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js');
      const sub = await reg?.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      await api.delete('/push/subscribe');
      setStatus('default');
    } catch {}
  };

  return { status, subscribe, unsubscribe };
}
