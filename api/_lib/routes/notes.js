import { Router } from 'express';
import sql from '../db.js';
import { auth } from '../middleware.js';

const router = Router();
router.use(auth);

router.get('/', async (req, res) => {
  const notes = await sql`
    SELECT n.*, u.name as owner_name FROM notes n
    LEFT JOIN users u ON n.owner_id = u.id
    WHERE n.visibility = 'public' OR n.owner_id = ${req.user.id}
    ORDER BY n.updated_at DESC
  `;
  res.json(notes);
});

router.post('/', async (req, res) => {
  const { title, body, visibility } = req.body;
  if (!title) return res.status(400).json({ error: 'Titlul este obligatoriu' });
  const vis = visibility === 'public' ? 'public' : 'private';
  const rows = await sql`
    INSERT INTO notes (title, body, visibility, owner_id) VALUES (${title}, ${body || null}, ${vis}, ${req.user.id}) RETURNING id
  `;
  const note = await sql`
    SELECT n.*, u.name as owner_name FROM notes n LEFT JOIN users u ON n.owner_id = u.id WHERE n.id = ${rows[0].id}
  `;
  res.json(note[0]);
});

router.put('/:id', async (req, res) => {
  const existing = await sql`SELECT * FROM notes WHERE id = ${req.params.id}`;
  if (!existing.length) return res.status(404).json({ error: 'Notița nu există' });
  if (existing[0].owner_id !== req.user.id && req.user.role !== 'admin')
    return res.status(403).json({ error: 'Acces interzis' });
  const { title, body, visibility } = req.body;
  const vis = visibility === 'public' ? 'public' : 'private';
  await sql`UPDATE notes SET title=${title}, body=${body || null}, visibility=${vis}, updated_at=NOW() WHERE id=${req.params.id}`;
  const note = await sql`
    SELECT n.*, u.name as owner_name FROM notes n LEFT JOIN users u ON n.owner_id = u.id WHERE n.id = ${req.params.id}
  `;
  res.json(note[0]);
});

router.delete('/:id', async (req, res) => {
  const existing = await sql`SELECT * FROM notes WHERE id = ${req.params.id}`;
  if (!existing.length) return res.status(404).json({ error: 'Notița nu există' });
  if (existing[0].owner_id !== req.user.id && req.user.role !== 'admin')
    return res.status(403).json({ error: 'Acces interzis' });
  await sql`DELETE FROM notes WHERE id = ${req.params.id}`;
  res.json({ ok: true });
});

export default router;
