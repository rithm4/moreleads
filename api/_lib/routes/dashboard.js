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

  // My tasks (assigned to current user, not done)
  const myTasks = await sql`
    SELECT t.*, u.name as assigned_name FROM tasks t
    LEFT JOIN users u ON u.id = t.assigned_to
    WHERE t.assigned_to = ${req.user.id} AND t.status != 'done'
    ORDER BY t.due_date ASC NULLS LAST, t.created_at DESC
    LIMIT 8
  `;

  // Deal trend — deals created in last 30 days grouped by day
  const dealTrend = await sql`
    SELECT DATE(created_at) as day, COUNT(*) as count, COALESCE(SUM(value),0) as value
    FROM deals
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(created_at)
    ORDER BY day ASC
  `;

  res.json({ contacts, deals, tasks, notes: notes[0], projects: projects[0], recentDeals, recentTasks, myTasks, dealTrend });
});

export default router;
