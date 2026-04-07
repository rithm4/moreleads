import { Router } from 'express';
import sql from '../db.js';
import { auth } from '../middleware.js';

const router = Router();
router.use(auth);

router.get('/:taskId', async (req, res) => {
  const comments = await sql`
    SELECT c.*, u.name as user_name FROM task_comments c
    JOIN users u ON u.id = c.user_id
    WHERE c.task_id = ${req.params.taskId}
    ORDER BY c.created_at ASC
  `;
  res.json(comments);
});

router.post('/:taskId', async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'Textul este obligatoriu' });
  const rows = await sql`
    INSERT INTO task_comments (task_id, user_id, text)
    VALUES (${req.params.taskId}, ${req.user.id}, ${text.trim()})
    RETURNING *
  `;
  const comment = await sql`
    SELECT c.*, u.name as user_name FROM task_comments c
    JOIN users u ON u.id = c.user_id WHERE c.id = ${rows[0].id}
  `;
  res.json(comment[0]);
});

router.delete('/:id', async (req, res) => {
  const existing = await sql`SELECT * FROM task_comments WHERE id=${req.params.id}`;
  if (!existing.length) return res.status(404).json({ error: 'Comentariul nu există' });
  if (existing[0].user_id !== req.user.id && req.user.role !== 'admin')
    return res.status(403).json({ error: 'Acces interzis' });
  await sql`DELETE FROM task_comments WHERE id=${req.params.id}`;
  res.json({ ok: true });
});

export default router;
