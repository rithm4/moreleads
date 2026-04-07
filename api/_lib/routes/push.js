import { Router } from 'express';
import sql from '../db.js';
import { auth } from '../middleware.js';
import { sendPushToUser } from '../webpush.js';

const router = Router();
router.use(auth);

router.post('/subscribe', async (req, res) => {
  const sub = req.body;
  await sql`DELETE FROM push_subscriptions WHERE user_id = ${req.user.id}`;
  await sql`INSERT INTO push_subscriptions (user_id, subscription) VALUES (${req.user.id}, ${JSON.stringify(sub)})`;
  res.json({ ok: true });
});

router.delete('/subscribe', async (req, res) => {
  await sql`DELETE FROM push_subscriptions WHERE user_id = ${req.user.id}`;
  res.json({ ok: true });
});

// Debug — arată ce chei are serverul configurate
router.get('/debug', async (req, res) => {
  const pub = process.env.VAPID_PUBLIC_KEY || '';
  const priv = process.env.VAPID_PRIVATE_KEY || '';
  const sub = await sql`SELECT subscription FROM push_subscriptions WHERE user_id = ${req.user.id} LIMIT 1`;
  res.json({
    server_pub_key_start: pub.slice(0, 20) + '...',
    server_pub_key_length: pub.length,
    server_priv_configured: priv.length > 0,
    subscription_endpoint: sub[0]?.subscription?.endpoint?.slice(0, 60) + '...' || null,
  });
});

// Test endpoint — trimite o notificare de test și returnează eroarea dacă există
router.post('/test', async (req, res) => {
  const subs = await sql`SELECT id FROM push_subscriptions WHERE user_id = ${req.user.id}`;
  if (subs.length === 0) return res.status(400).json({ error: 'Nu ai nicio subscripție salvată. Apasă pe clopoțel mai întâi.' });
  const results = await sendPushToUser(req.user.id, {
    title: 'Test notificare',
    body: 'Dacă vezi asta, push notifications funcționează!',
    url: '/dashboard'
  });
  res.json({ results });
});

export default router;
