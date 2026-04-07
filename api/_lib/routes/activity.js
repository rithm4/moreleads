import { Router } from 'express';
import sql from '../db.js';
import { auth } from '../middleware.js';

const router = Router();
router.use(auth);

router.get('/', async (req, res) => {
  const rows = await sql`
    SELECT a.*, u.name as user_name FROM activity_log a
    JOIN users u ON u.id = a.user_id
    ORDER BY a.created_at DESC LIMIT 30
  `;
  res.json(rows);
});

export default router;
