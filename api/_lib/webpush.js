import webpush from 'web-push';
import sql from './db.js';

const VAPID_PUBLIC  = (process.env.VAPID_PUBLIC_KEY  || '').replace(/[=\s]/g, '');
const VAPID_PRIVATE = (process.env.VAPID_PRIVATE_KEY || '').replace(/[=\s]/g, '');
if (VAPID_PUBLIC && VAPID_PRIVATE) {
  try {
    webpush.setVapidDetails('mailto:admin@moreleads.ro', VAPID_PUBLIC, VAPID_PRIVATE);
  } catch (e) {
    console.error('VAPID setup error:', e.message);
  }
}

export async function sendPushToUser(userId, payload) {
  if (!process.env.VAPID_PUBLIC_KEY) return;
  try {
    const subs = await sql`SELECT id, subscription FROM push_subscriptions WHERE user_id = ${userId}`;
    for (const row of subs) {
      try {
        await webpush.sendNotification(row.subscription, JSON.stringify(payload));
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await sql`DELETE FROM push_subscriptions WHERE id = ${row.id}`;
        }
      }
    }
  } catch {}
}
