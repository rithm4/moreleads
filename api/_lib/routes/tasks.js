import { Router } from 'express';
import sql from '../db.js';
import { auth } from '../middleware.js';
import { logActivity } from '../logActivity.js';

const router = Router();
router.use(auth);

router.get('/', async (req, res) => {
  const tasks = await sql`
    SELECT t.*, u.name as assigned_name, c.name as creator_name
    FROM tasks t
    LEFT JOIN users u ON t.assigned_to = u.id
    LEFT JOIN users c ON t.created_by = c.id
    ORDER BY t.status, t.position
  `;
  res.json(tasks);
});

router.post('/', async (req, res) => {
  const { title, description, assigned_to, status, due_date } = req.body;
  if (!title) return res.status(400).json({ error: 'Titlul este obligatoriu' });
  const validStatus = ['todo', 'inprogress', 'done'];
  const taskStatus = validStatus.includes(status) ? status : 'todo';
  const maxPos = await sql`SELECT MAX(position) as m FROM tasks WHERE status = ${taskStatus}`;
  const position = (maxPos[0].m ?? -1) + 1;
  const rows = await sql`
    INSERT INTO tasks (title, description, assigned_to, created_by, status, position, due_date)
    VALUES (${title}, ${description || null}, ${assigned_to || null}, ${req.user.id}, ${taskStatus}, ${position}, ${due_date || null})
    RETURNING id
  `;
  const task = await sql`
    SELECT t.*, u.name as assigned_name, c.name as creator_name
    FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id LEFT JOIN users c ON t.created_by = c.id
    WHERE t.id = ${rows[0].id}
  `;
  logActivity(req.user.id, 'created', 'task', task[0].id, task[0].title);
  res.json(task[0]);
});

router.put('/:id', async (req, res) => {
  const { title, description, assigned_to, status, due_date } = req.body;
  const validStatus = ['todo', 'inprogress', 'done'];
  const taskStatus = validStatus.includes(status) ? status : 'todo';
  await sql`
    UPDATE tasks SET title=${title}, description=${description || null},
    assigned_to=${assigned_to || null}, status=${taskStatus},
    due_date=${due_date || null}, updated_at=NOW()
    WHERE id=${req.params.id}
  `;
  const task = await sql`
    SELECT t.*, u.name as assigned_name, c.name as creator_name
    FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id LEFT JOIN users c ON t.created_by = c.id
    WHERE t.id = ${req.params.id}
  `;
  res.json(task[0]);
});

router.patch('/:id/move', async (req, res) => {
  const { status, position } = req.body;
  const valid = ['todo', 'inprogress', 'done'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Status invalid' });
  await sql`UPDATE tasks SET status=${status}, position=${position}, updated_at=NOW() WHERE id=${req.params.id}`;
  res.json({ ok: true });
});

router.delete('/:id', async (req, res) => {
  await sql`DELETE FROM tasks WHERE id = ${req.params.id}`;
  res.json({ ok: true });
});

export default router;
