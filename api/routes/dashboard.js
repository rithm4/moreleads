import { Router } from 'express';
import sql from '../db.js';
import { auth } from '../middleware.js';

const router = Router();

router.get('/', auth, async (req, res) => {
  const [contacts, deals, tasks, notes, projects] = await Promise.all([
    sql`SELECT status, COUNT(*) as count FROM contacts GROUP BY status`,
    sql`SELECT stage, COUNT(*) as count, COALESCE(SUM(value),0) as total FROM deals GROUP BY stage`,
    sql`SELECT status, COUNT(*) as count FROM tasks GROUP BY status`,
    sql`SELECT COUNT(*) as count FROM notes`,
    sql`SELECT COUNT(*) as count FROM projects WHERE parent_id IS NULL`,
  ]);

  const recentDeals = await sql`
    SELECT d.*, c.name as contact_name, c.company as contact_company
    FROM deals d LEFT JOIN contacts c ON c.id = d.contact_id
    WHERE d.stage NOT IN ('won','lost')
    ORDER BY d.updated_at DESC LIMIT 5
  `;
  const recentTasks = await sql`
    SELECT t.*, u.name as assigned_name FROM tasks t
    LEFT JOIN users u ON u.id = t.assigned_to
    WHERE t.status != 'done'
    ORDER BY t.created_at DESC LIMIT 5
  `;

  res.json({ contacts, deals, tasks, notes: notes[0], projects: projects[0], recentDeals, recentTasks });
});

export default router;
