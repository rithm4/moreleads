import { Router } from 'express';
import sql from '../db.js';
import { auth } from '../middleware.js';

const router = Router();
router.use(auth);

// Get all nodes and edges for the user's workspace
router.get('/', async (req, res) => {
  const nodes = await sql`
    SELECT cn.*, u.name as created_by_name
    FROM canvas_nodes cn
    LEFT JOIN users u ON cn.created_by = u.id
    ORDER BY cn.created_at ASC
  `;
  const edges = await sql`
    SELECT * FROM canvas_edges ORDER BY created_at ASC
  `;
  res.json({ nodes, edges });
});

// Create a node
router.post('/nodes', async (req, res) => {
  const { type, title, body, pos_x, pos_y, entity_id, color } = req.body;
  if (!title) return res.status(400).json({ error: 'Titlul este obligatoriu' });
  const validTypes = ['note', 'contact', 'project', 'deal', 'task'];
  const nodeType = validTypes.includes(type) ? type : 'note';
  const rows = await sql`
    INSERT INTO canvas_nodes (type, title, body, pos_x, pos_y, entity_id, color, created_by)
    VALUES (${nodeType}, ${title}, ${body || null}, ${pos_x || 100}, ${pos_y || 100}, ${entity_id || null}, ${color || null}, ${req.user.id})
    RETURNING *
  `;
  res.json(rows[0]);
});

// Update a node (position, title, body)
router.patch('/nodes/:id', async (req, res) => {
  const existing = await sql`SELECT * FROM canvas_nodes WHERE id = ${req.params.id}`;
  if (!existing.length) return res.status(404).json({ error: 'Nodul nu există' });
  const node = existing[0];
  const pos_x = req.body.pos_x !== undefined ? req.body.pos_x : node.pos_x;
  const pos_y = req.body.pos_y !== undefined ? req.body.pos_y : node.pos_y;
  const title = req.body.title !== undefined ? req.body.title : node.title;
  const body  = req.body.body  !== undefined ? req.body.body  : node.body;
  const color = req.body.color !== undefined ? req.body.color : node.color;
  const updated = await sql`
    UPDATE canvas_nodes SET pos_x=${pos_x}, pos_y=${pos_y}, title=${title}, body=${body || null}, color=${color || null}, updated_at=NOW()
    WHERE id=${req.params.id} RETURNING *
  `;
  res.json(updated[0]);
});

// Delete a node (also cascade deletes its edges via DB)
router.delete('/nodes/:id', async (req, res) => {
  await sql`DELETE FROM canvas_edges WHERE source_id = ${req.params.id} OR target_id = ${req.params.id}`;
  await sql`DELETE FROM canvas_nodes WHERE id = ${req.params.id}`;
  res.json({ ok: true });
});

// Create an edge
router.post('/edges', async (req, res) => {
  const { source_id, target_id, label } = req.body;
  if (!source_id || !target_id) return res.status(400).json({ error: 'source_id și target_id sunt obligatorii' });
  // avoid duplicates
  const existing = await sql`
    SELECT id FROM canvas_edges WHERE source_id=${source_id} AND target_id=${target_id}
  `;
  if (existing.length) return res.json(existing[0]);
  const rows = await sql`
    INSERT INTO canvas_edges (source_id, target_id, label) VALUES (${source_id}, ${target_id}, ${label || null}) RETURNING *
  `;
  res.json(rows[0]);
});

// Delete an edge
router.delete('/edges/:id', async (req, res) => {
  await sql`DELETE FROM canvas_edges WHERE id = ${req.params.id}`;
  res.json({ ok: true });
});

export default router;
