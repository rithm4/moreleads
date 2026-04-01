import { Router } from 'express';
import db from '../db/database.js';
import { auth } from '../middleware/auth.js';

const router = Router();

// GET spreadsheets for project
router.get('/:projectId/spreadsheets', auth, (req, res) => {
  const sheets = db.prepare('SELECT * FROM spreadsheets WHERE project_id=? ORDER BY created_at ASC')
    .all(req.params.projectId);
  res.json(sheets);
});

// POST create spreadsheet
router.post('/:projectId/spreadsheets', auth, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Numele este obligatoriu' });
  const result = db.prepare('INSERT INTO spreadsheets (project_id, name, created_by) VALUES (?,?,?)')
    .run(req.params.projectId, name, req.user.id);
  const sheet = db.prepare('SELECT * FROM spreadsheets WHERE id=?').get(result.lastInsertRowid);
  res.status(201).json(sheet);
});

// DELETE spreadsheet
router.delete('/:projectId/spreadsheets/:sheetId', auth, (req, res) => {
  db.prepare('DELETE FROM spreadsheets WHERE id=? AND project_id=?')
    .run(req.params.sheetId, req.params.projectId);
  res.json({ ok: true });
});

// GET full spreadsheet data (columns + rows)
router.get('/:projectId/spreadsheets/:sheetId', auth, (req, res) => {
  const sheet = db.prepare('SELECT * FROM spreadsheets WHERE id=? AND project_id=?')
    .get(req.params.sheetId, req.params.projectId);
  if (!sheet) return res.status(404).json({ error: 'Tabel negăsit' });
  const columns = db.prepare('SELECT * FROM spreadsheet_columns WHERE spreadsheet_id=? ORDER BY position ASC')
    .all(req.params.sheetId);
  const rows = db.prepare('SELECT * FROM spreadsheet_rows WHERE spreadsheet_id=? ORDER BY position ASC')
    .all(req.params.sheetId);
  res.json({ ...sheet, columns, rows: rows.map(r => ({ ...r, data: JSON.parse(r.data) })) });
});

// POST add column
router.post('/:projectId/spreadsheets/:sheetId/columns', auth, (req, res) => {
  const { name, col_type } = req.body;
  const maxPos = db.prepare('SELECT MAX(position) as m FROM spreadsheet_columns WHERE spreadsheet_id=?')
    .get(req.params.sheetId);
  const pos = (maxPos?.m ?? -1) + 1;
  const result = db.prepare('INSERT INTO spreadsheet_columns (spreadsheet_id, name, col_type, position) VALUES (?,?,?,?)')
    .run(req.params.sheetId, name, col_type || 'text', pos);
  const col = db.prepare('SELECT * FROM spreadsheet_columns WHERE id=?').get(result.lastInsertRowid);
  res.status(201).json(col);
});

// PATCH rename column
router.patch('/:projectId/spreadsheets/:sheetId/columns/:colId', auth, (req, res) => {
  const { name, col_type } = req.body;
  db.prepare('UPDATE spreadsheet_columns SET name=?, col_type=? WHERE id=?')
    .run(name, col_type || 'text', req.params.colId);
  const col = db.prepare('SELECT * FROM spreadsheet_columns WHERE id=?').get(req.params.colId);
  res.json(col);
});

// DELETE column
router.delete('/:projectId/spreadsheets/:sheetId/columns/:colId', auth, (req, res) => {
  db.prepare('DELETE FROM spreadsheet_columns WHERE id=?').run(req.params.colId);
  res.json({ ok: true });
});

// POST add row
router.post('/:projectId/spreadsheets/:sheetId/rows', auth, (req, res) => {
  const maxPos = db.prepare('SELECT MAX(position) as m FROM spreadsheet_rows WHERE spreadsheet_id=?')
    .get(req.params.sheetId);
  const pos = (maxPos?.m ?? -1) + 1;
  const result = db.prepare('INSERT INTO spreadsheet_rows (spreadsheet_id, position, data) VALUES (?,?,?)')
    .run(req.params.sheetId, pos, JSON.stringify(req.body.data || {}));
  const row = db.prepare('SELECT * FROM spreadsheet_rows WHERE id=?').get(result.lastInsertRowid);
  res.status(201).json({ ...row, data: JSON.parse(row.data) });
});

// PATCH update row data
router.patch('/:projectId/spreadsheets/:sheetId/rows/:rowId', auth, (req, res) => {
  db.prepare('UPDATE spreadsheet_rows SET data=? WHERE id=?')
    .run(JSON.stringify(req.body.data || {}), req.params.rowId);
  const row = db.prepare('SELECT * FROM spreadsheet_rows WHERE id=?').get(req.params.rowId);
  res.json({ ...row, data: JSON.parse(row.data) });
});

// DELETE row
router.delete('/:projectId/spreadsheets/:sheetId/rows/:rowId', auth, (req, res) => {
  db.prepare('DELETE FROM spreadsheet_rows WHERE id=?').run(req.params.rowId);
  res.json({ ok: true });
});

export default router;
