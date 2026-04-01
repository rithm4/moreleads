import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extname, join } from 'path';
import { unlink } from 'fs/promises';
import db from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { UPLOADS_DIR } from '../db/paths.js';

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => {
    cb(null, uuidv4() + extname(file.originalname));
  },
});

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

const router = Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const files = db.prepare(`
    SELECT f.*, u.name as uploader_name
    FROM files f
    LEFT JOIN users u ON f.uploaded_by = u.id
    ORDER BY f.created_at DESC
  `).all();
  res.json(files);
});

router.post('/upload', upload.array('files', 20), (req, res) => {
  if (!req.files?.length) return res.status(400).json({ error: 'Niciun fișier primit' });

  const insert = db.prepare(
    'INSERT INTO files (original_name, stored_name, mime_type, size_bytes, uploaded_by) VALUES (?, ?, ?, ?, ?)'
  );

  const saved = req.files.map(f => {
    const result = insert.run(f.originalname, f.filename, f.mimetype, f.size, req.user.id);
    return db.prepare(`
      SELECT f.*, u.name as uploader_name FROM files f
      LEFT JOIN users u ON f.uploaded_by = u.id WHERE f.id = ?
    `).get(result.lastInsertRowid);
  });

  res.json(saved);
});

router.get('/:id/download', (req, res) => {
  const file = db.prepare('SELECT * FROM files WHERE id = ?').get(req.params.id);
  if (!file) return res.status(404).json({ error: 'Fișier negăsit' });

  const filePath = join(UPLOADS_DIR, file.stored_name);
  res.download(filePath, file.original_name);
});

router.delete('/:id', async (req, res) => {
  const file = db.prepare('SELECT * FROM files WHERE id = ?').get(req.params.id);
  if (!file) return res.status(404).json({ error: 'Fișier negăsit' });
  if (file.uploaded_by !== req.user.id && req.user.role !== 'admin')
    return res.status(403).json({ error: 'Acces interzis' });

  try {
    await unlink(join(UPLOADS_DIR, file.stored_name));
  } catch { /* file may already be missing from disk */ }

  db.prepare('DELETE FROM files WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
