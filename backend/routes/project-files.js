import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extname, join } from 'path';
import { unlink } from 'fs/promises';
import db from '../db/database.js';
import { auth } from '../middleware/auth.js';
import { UPLOADS_DIR } from '../db/paths.js';

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => cb(null, uuidv4() + extname(file.originalname)),
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

const router = Router();

// GET files for a project
router.get('/:projectId/files', auth, (req, res) => {
  const files = db.prepare(`
    SELECT pf.*, u.name as uploader_name
    FROM project_files pf
    JOIN users u ON u.id = pf.uploaded_by
    WHERE pf.project_id = ?
    ORDER BY pf.created_at DESC
  `).all(req.params.projectId);
  res.json(files);
});

// POST upload file to project
router.post('/:projectId/files', auth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Niciun fișier primit' });
  const display_name = req.body.display_name || req.file.originalname;
  const result = db.prepare(`
    INSERT INTO project_files (project_id, display_name, stored_name, mime_type, size_bytes, uploaded_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.params.projectId, display_name, req.file.filename, req.file.mimetype, req.file.size, req.user.id);
  const file = db.prepare(`
    SELECT pf.*, u.name as uploader_name FROM project_files pf
    JOIN users u ON u.id = pf.uploaded_by WHERE pf.id = ?
  `).get(result.lastInsertRowid);
  res.status(201).json(file);
});

// PATCH rename file
router.patch('/:projectId/files/:fileId', auth, (req, res) => {
  const { display_name } = req.body;
  db.prepare('UPDATE project_files SET display_name=? WHERE id=? AND project_id=?')
    .run(display_name, req.params.fileId, req.params.projectId);
  const file = db.prepare('SELECT * FROM project_files WHERE id=?').get(req.params.fileId);
  res.json(file);
});

// GET download
router.get('/:projectId/files/:fileId/download', auth, (req, res) => {
  const file = db.prepare('SELECT * FROM project_files WHERE id=? AND project_id=?')
    .get(req.params.fileId, req.params.projectId);
  if (!file) return res.status(404).json({ error: 'Fișier negăsit' });
  res.download(join(UPLOADS_DIR, file.stored_name), file.display_name);
});

// DELETE file
router.delete('/:projectId/files/:fileId', auth, async (req, res) => {
  const file = db.prepare('SELECT * FROM project_files WHERE id=? AND project_id=?')
    .get(req.params.fileId, req.params.projectId);
  if (!file) return res.status(404).json({ error: 'Fișier negăsit' });
  try { await unlink(join(UPLOADS_DIR, file.stored_name)); } catch { /* ignore */ }
  db.prepare('DELETE FROM project_files WHERE id=?').run(req.params.fileId);
  res.json({ ok: true });
});

export default router;
