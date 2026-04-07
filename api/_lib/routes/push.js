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

// Test endpoint — trimite o notificare de test către tine însuți
router.post('/test', async (req, res) => {
  const subs = await sql`SELECT id FROM push_subscriptions WHERE user_id = ${req.user.id}`;
  if (subs.length === 0) return res.status(400).json({ error: 'Nu ai nicio subscripție salvată. Apasă pe clopoțel mai întâi.' });
  await sendPushToUser(req.user.id, {
    title: 'Test notificare',
    body: 'Dacă vezi asta, push notifications funcționează!',
    url: '/dashboard'
  });
  res.json({ ok: true, subs: subs.length });
});

export default router;
