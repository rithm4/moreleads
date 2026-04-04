import { Router } from 'express';
import sql from '../db.js';
import { auth } from '../middleware.js';

const router = Router();
router.use(auth);

router.get('/', async (req, res) => {
  const rows = await sql`
    SELECT p.*, u.name as created_by_name FROM projects p
    JOIN users u ON u.id = p.created_by
    ORDER BY p.parent_id NULLS FIRST, p.created_at ASC
  `;
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { name, description, color, parent_id } = req.body;
  if (!name) return res.status(400).json({ error: 'Numele este obligatoriu' });
  const rows = await sql`
    INSERT INTO projects (name, description, color, parent_id, created_by)
    VALUES (${name}, ${description || null}, ${color || '#6366f1'}, ${parent_id || null}, ${req.user.id})
    RETURNING *
  `;
  res.status(201).json(rows[0]);
});

router.put('/:id', async (req, res) => {
  const { name, description, color } = req.body;
  const rows = await sql`
    UPDATE projects SET name=${name}, description=${description || null}, color=${color || '#6366f1'}, updated_at=NOW()
    WHERE id=${req.params.id} RETURNING *
  `;
  res.json(rows[0]);
});

router.delete('/:id', async (req, res) => {
  await sql`DELETE FROM projects WHERE id = ${req.params.id}`;
  res.json({ ok: true });
});

// ── Spreadsheets ──────────────────────────────────────────────

router.get('/:projectId/spreadsheets', async (req, res) => {
  const rows = await sql`SELECT * FROM spreadsheets WHERE project_id=${req.params.projectId} ORDER BY created_at ASC`;
  res.json(rows);
});

router.post('/:projectId/spreadsheets', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Numele este obligatoriu' });
  const rows = await sql`INSERT INTO spreadsheets (project_id, name, created_by) VALUES (${req.params.projectId}, ${name}, ${req.user.id}) RETURNING *`;
  res.status(201).json(rows[0]);
});

router.delete('/:projectId/spreadsheets/:sheetId', async (req, res) => {
  await sql`DELETE FROM spreadsheets WHERE id=${req.params.sheetId} AND project_id=${req.params.projectId}`;
  res.json({ ok: true });
});

router.get('/:projectId/spreadsheets/:sheetId', async (req, res) => {
  const sheet = await sql`SELECT * FROM spreadsheets WHERE id=${req.params.sheetId} AND project_id=${req.params.projectId}`;
  if (!sheet.length) return res.status(404).json({ error: 'Tabel negăsit' });
  const columns = await sql`SELECT * FROM spreadsheet_columns WHERE spreadsheet_id=${req.params.sheetId} ORDER BY position ASC`;
  const rows = await sql`SELECT * FROM spreadsheet_rows WHERE spreadsheet_id=${req.params.sheetId} ORDER BY position ASC`;
  res.json({ ...sheet[0], columns, rows });
});

router.post('/:projectId/spreadsheets/:sheetId/columns', async (req, res) => {
  const { name, col_type } = req.body;
  const maxPos = await sql`SELECT MAX(position) as m FROM spreadsheet_columns WHERE spreadsheet_id=${req.params.sheetId}`;
  const pos = (maxPos[0].m ?? -1) + 1;
  const rows = await sql`INSERT INTO spreadsheet_columns (spreadsheet_id, name, col_type, position) VALUES (${req.params.sheetId}, ${name}, ${col_type || 'text'}, ${pos}) RETURNING *`;
  res.status(201).json(rows[0]);
});

router.patch('/:projectId/spreadsheets/:sheetId/columns/:colId', async (req, res) => {
  const { name, col_type } = req.body;
  const rows = await sql`UPDATE spreadsheet_columns SET name=${name}, col_type=${col_type || 'text'} WHERE id=${req.params.colId} RETURNING *`;
  res.json(rows[0]);
});

router.delete('/:projectId/spreadsheets/:sheetId/columns/:colId', async (req, res) => {
  await sql`DELETE FROM spreadsheet_columns WHERE id=${req.params.colId}`;
  res.json({ ok: true });
});

router.post('/:projectId/spreadsheets/:sheetId/rows', async (req, res) => {
  const maxPos = await sql`SELECT MAX(position) as m FROM spreadsheet_rows WHERE spreadsheet_id=${req.params.sheetId}`;
  const pos = (maxPos[0].m ?? -1) + 1;
  const rows = await sql`INSERT INTO spreadsheet_rows (spreadsheet_id, position, data) VALUES (${req.params.sheetId}, ${pos}, ${req.body.data || {}}) RETURNING *`;
  res.status(201).json(rows[0]);
});

router.patch('/:projectId/spreadsheets/:sheetId/rows/:rowId', async (req, res) => {
  const rows = await sql`UPDATE spreadsheet_rows SET data=${req.body.data || {}} WHERE id=${req.params.rowId} RETURNING *`;
  res.json(rows[0]);
});

router.delete('/:projectId/spreadsheets/:sheetId/rows/:rowId', async (req, res) => {
  await sql`DELETE FROM spreadsheet_rows WHERE id=${req.params.rowId}`;
  res.json({ ok: true });
});

export default router;
