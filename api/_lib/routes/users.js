import { Router } from 'express';
import sql from '../db.js';
import { auth } from '../middleware.js';

const router = Router();

router.get('/', auth, async (req, res) => {
  const rows = await sql`SELECT id, name, email, role FROM users ORDER BY name`;
  res.json(rows);
});

export default router;
