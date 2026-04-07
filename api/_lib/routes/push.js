import { Router } from 'express';
import sql from '../db.js';
import { auth } from '../middleware.js';

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

export default router;
