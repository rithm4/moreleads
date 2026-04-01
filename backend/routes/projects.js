import { Router } from 'express';
import db from '../db/database.js';
import { auth } from '../middleware/auth.js';

const router = Router();

// GET all projects (flat list, client groups by parent_id)
router.get('/', auth, (req, res) => {
  const rows = db.prepare(`
    SELECT p.*, u.name as created_by_name
    FROM projects p
    JOIN users u ON u.id = p.created_by
    ORDER BY p.parent_id NULLS FIRST, p.created_at ASC
  `).all();
  res.json(rows);
});

// POST create project
router.post('/', auth, (req, res) => {
  const { name, description, color, parent_id } = req.body;
  if (!name) return res.status(400).json({ error: 'Numele este obligatoriu' });
  const result = db.prepare(`
    INSERT INTO projects (name, description, color, parent_id, created_by)
    VALUES (?, ?, ?, ?, ?)
  `).run(name, description || null, color || '#6366f1', parent_id || null, req.user.id);
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(project);
});

// PUT update project
router.put('/:id', auth, (req, res) => {
  const { name, description, color } = req.body;
  db.prepare(`
    UPDATE projects SET name=?, description=?, color=?, updated_at=datetime('now') WHERE id=?
  `).run(name, description || null, color || '#6366f1', req.params.id);
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  res.json(project);
});

// DELETE project
router.delete('/:id', auth, (req, res) => {
  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
