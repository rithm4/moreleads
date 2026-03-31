import { Router } from 'express';
import db from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const notes = db.prepare(`
    SELECT n.*, u.name as owner_name
    FROM notes n
    LEFT JOIN users u ON n.owner_id = u.id
    WHERE n.visibility = 'public' OR n.owner_id = ?
    ORDER BY n.updated_at DESC
  `).all(req.user.id);
  res.json(notes);
});

router.post('/', (req, res) => {
  const { title, body, visibility } = req.body;
  if (!title) return res.status(400).json({ error: 'Titlul este obligatoriu' });

  const vis = visibility === 'public' ? 'public' : 'private';
  const result = db.prepare(
    'INSERT INTO notes (title, body, visibility, owner_id) VALUES (?, ?, ?, ?)'
  ).run(title, body || null, vis, req.user.id);

  const note = db.prepare(`
    SELECT n.*, u.name as owner_name FROM notes n
    LEFT JOIN users u ON n.owner_id = u.id WHERE n.id = ?
  `).get(result.lastInsertRowid);

  res.json(note);
});

router.put('/:id', (req, res) => {
  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id);
  if (!note) return res.status(404).json({ error: 'Notița nu există' });
  if (note.owner_id !== req.user.id && req.user.role !== 'admin')
    return res.status(403).json({ error: 'Acces interzis' });

  const { title, body, visibility } = req.body;
  const vis = visibility === 'public' ? 'public' : 'private';
  db.prepare(
    "UPDATE notes SET title=?, body=?, visibility=?, updated_at=datetime('now') WHERE id=?"
  ).run(title, body || null, vis, req.params.id);

  const updated = db.prepare(`
    SELECT n.*, u.name as owner_name FROM notes n
    LEFT JOIN users u ON n.owner_id = u.id WHERE n.id = ?
  `).get(req.params.id);

  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id);
  if (!note) return res.status(404).json({ error: 'Notița nu există' });
  if (note.owner_id !== req.user.id && req.user.role !== 'admin')
    return res.status(403).json({ error: 'Acces interzis' });

  db.prepare('DELETE FROM notes WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
