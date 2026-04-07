import webpush from 'web-push';
import sql from './db.js';

webpush.setVapidDetails(
  'mailto:admin@moreleads.ro',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export async function sendPushToUser(userId, payload) {
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
