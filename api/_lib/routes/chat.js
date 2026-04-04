import { Router } from 'express';
import sql from '../db.js';
import { auth } from '../middleware.js';

const router = Router();
router.use(auth);

// GET all channels
router.get('/channels', async (req, res) => {
  const rows = await sql`SELECT * FROM chat_channels ORDER BY name ASC`;
  res.json(rows);
});

// POST create channel
router.post('/channels', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Numele este obligatoriu' });
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const existing = await sql`SELECT id FROM chat_channels WHERE name=${slug}`;
  if (existing.length) return res.status(409).json({ error: 'Canal existent' });
  const rows = await sql`INSERT INTO chat_channels (name, created_by) VALUES (${slug}, ${req.user.id}) RETURNING *`;
  res.status(201).json(rows[0]);
});

// DELETE channel (only creator or admin)
router.delete('/channels/:id', async (req, res) => {
  const ch = await sql`SELECT * FROM chat_channels WHERE id=${req.params.id}`;
  if (!ch.length) return res.status(404).json({ error: 'Canal negăsit' });
  if (ch[0].created_by !== req.user.id && req.user.role !== 'admin')
    return res.status(403).json({ error: 'Acces interzis' });
  await sql`DELETE FROM chat_channels WHERE id=${req.params.id}`;
  res.json({ ok: true });
});

// GET messages for channel (last 100)
router.get('/channels/:id/messages', async (req, res) => {
  const since = req.query.since; // ISO timestamp for polling
  let rows;
  if (since) {
    rows = await sql`
      SELECT m.*, u.name as user_name FROM chat_messages m
      JOIN users u ON u.id = m.user_id
      WHERE m.channel_id=${req.params.id} AND m.created_at > ${since}
      ORDER BY m.created_at ASC
    `;
  } else {
    rows = await sql`
      SELECT m.*, u.name as user_name FROM chat_messages m
      JOIN users u ON u.id = m.user_id
      WHERE m.channel_id=${req.params.id}
      ORDER BY m.created_at DESC LIMIT 100
    `;
    rows = rows.reverse();
  }
  res.json(rows);
});

// POST send message
router.post('/channels/:id/messages', async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'Mesajul nu poate fi gol' });
  const rows = await sql`
    INSERT INTO chat_messages (channel_id, user_id, text) VALUES (${req.params.id}, ${req.user.id}, ${text.trim()})
    RETURNING *
  `;
  const msg = await sql`
    SELECT m.*, u.name as user_name FROM chat_messages m
    JOIN users u ON u.id = m.user_id WHERE m.id=${rows[0].id}
  `;
  res.status(201).json(msg[0]);
});

export default router;
