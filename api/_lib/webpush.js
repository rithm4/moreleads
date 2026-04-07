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
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return { error: 'VAPID keys not configured' };
  const subs = await sql`SELECT id, subscription FROM push_subscriptions WHERE user_id = ${userId}`;
  const results = [];
  for (const row of subs) {
    try {
      await webpush.sendNotification(row.subscription, JSON.stringify(payload));
      results.push({ id: row.id, ok: true });
    } catch (err) {
      console.error('Push send error:', err.statusCode, err.message);
      results.push({ id: row.id, ok: false, status: err.statusCode, message: err.message });
      if (err.statusCode === 410 || err.statusCode === 404) {
        await sql`DELETE FROM push_subscriptions WHERE id = ${row.id}`;
      }
    }
  }
  return results;
}
