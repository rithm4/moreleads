import { Router } from 'express';
import db from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const tasks = db.prepare(`
    SELECT t.*, u.name as assigned_name, c.name as creator_name
    FROM tasks t
    LEFT JOIN users u ON t.assigned_to = u.id
    LEFT JOIN users c ON t.created_by = c.id
    ORDER BY t.status, t.position
  `).all();
  res.json(tasks);
});

router.post('/', (req, res) => {
  const { title, description, assigned_to } = req.body;
  if (!title) return res.status(400).json({ error: 'Titlul este obligatoriu' });

  const maxPos = db.prepare("SELECT MAX(position) as m FROM tasks WHERE status = 'todo'").get();
  const position = (maxPos.m ?? -1) + 1;

  const result = db.prepare(
    'INSERT INTO tasks (title, description, assigned_to, created_by, position) VALUES (?, ?, ?, ?, ?)'
  ).run(title, description || null, assigned_to || null, req.user.id, position);

  const task = db.prepare(`
    SELECT t.*, u.name as assigned_name, c.name as creator_name
    FROM tasks t
    LEFT JOIN users u ON t.assigned_to = u.id
    LEFT JOIN users c ON t.created_by = c.id
    WHERE t.id = ?
  `).get(result.lastInsertRowid);

  res.json(task);
});

router.put('/:id', (req, res) => {
  const { title, description, assigned_to } = req.body;
  db.prepare(
    "UPDATE tasks SET title=?, description=?, assigned_to=?, updated_at=datetime('now') WHERE id=?"
  ).run(title, description || null, assigned_to || null, req.params.id);

  const task = db.prepare(`
    SELECT t.*, u.name as assigned_name, c.name as creator_name
    FROM tasks t
    LEFT JOIN users u ON t.assigned_to = u.id
    LEFT JOIN users c ON t.created_by = c.id
    WHERE t.id = ?
  `).get(req.params.id);

  res.json(task);
});

router.patch('/:id/move', (req, res) => {
  const { status, position } = req.body;
  const validStatuses = ['todo', 'inprogress', 'done'];
  if (!validStatuses.includes(status))
    return res.status(400).json({ error: 'Status invalid' });

  db.prepare(
    "UPDATE tasks SET status=?, position=?, updated_at=datetime('now') WHERE id=?"
  ).run(status, position, req.params.id);

  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
