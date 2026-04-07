import { Router } from 'express';
import sql from '../db.js';
import { auth } from '../middleware.js';
import { logActivity } from '../logActivity.js';

const router = Router();
router.use(auth);

router.get('/', async (req, res) => {
  const rows = await sql`
    SELECT d.*, c.name as contact_name, c.company as contact_company, u.name as assigned_name
    FROM deals d
    LEFT JOIN contacts c ON c.id = d.contact_id
    LEFT JOIN users u ON u.id = d.assigned_to
    ORDER BY d.stage, d.position
  `;
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { title, value, stage, contact_id, assigned_to, notes } = req.body;
  if (!title) return res.status(400).json({ error: 'Titlul este obligatoriu' });
  const maxPos = await sql`SELECT MAX(position) as m FROM deals WHERE stage=${stage||'lead'}`;
  const position = (maxPos[0].m ?? -1) + 1;
  const rows = await sql`
    INSERT INTO deals (title, value, stage, position, contact_id, assigned_to, notes, created_by)
    VALUES (${title}, ${value||0}, ${stage||'lead'}, ${position}, ${contact_id||null}, ${assigned_to||null}, ${notes||null}, ${req.user.id})
    RETURNING *
  `;
  const deal = await sql`
    SELECT d.*, c.name as contact_name, c.company as contact_company, u.name as assigned_name
    FROM deals d LEFT JOIN contacts c ON c.id = d.contact_id LEFT JOIN users u ON u.id = d.assigned_to
    WHERE d.id=${rows[0].id}
  `;
  logActivity(req.user.id, 'created', 'deal', deal[0].id, deal[0].title);
  res.status(201).json(deal[0]);
});

router.put('/:id', async (req, res) => {
  const { title, value, contact_id, assigned_to, notes } = req.body;
  await sql`
    UPDATE deals SET title=${title}, value=${value||0}, contact_id=${contact_id||null},
    assigned_to=${assigned_to||null}, notes=${notes||null}, updated_at=NOW()
    WHERE id=${req.params.id}
  `;
  const deal = await sql`
    SELECT d.*, c.name as contact_name, c.company as contact_company, u.name as assigned_name
    FROM deals d LEFT JOIN contacts c ON c.id = d.contact_id LEFT JOIN users u ON u.id = d.assigned_to
    WHERE d.id=${req.params.id}
  `;
  res.json(deal[0]);
});

router.patch('/:id/move', async (req, res) => {
  const { stage, position } = req.body;
  const valid = ['lead', 'contacted', 'proposal', 'negotiation', 'won', 'lost'];
  if (!valid.includes(stage)) return res.status(400).json({ error: 'Stage invalid' });
  const existing = await sql`SELECT title FROM deals WHERE id=${req.params.id}`;
  await sql`UPDATE deals SET stage=${stage}, position=${position}, updated_at=NOW() WHERE id=${req.params.id}`;
  logActivity(req.user.id, 'moved', 'deal', parseInt(req.params.id), `${existing[0]?.title} → ${stage}`);
  res.json({ ok: true });
});

router.delete('/:id', async (req, res) => {
  await sql`DELETE FROM deals WHERE id=${req.params.id}`;
  res.json({ ok: true });
});

export default router;
