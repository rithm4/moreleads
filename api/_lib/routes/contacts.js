import { Router } from 'express';
import sql from '../db.js';
import { auth } from '../middleware.js';

const router = Router();
router.use(auth);

router.get('/', async (req, res) => {
  const rows = await sql`
    SELECT c.*, u.name as created_by_name FROM contacts c
    LEFT JOIN users u ON u.id = c.created_by
    ORDER BY c.updated_at DESC
  `;
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const rows = await sql`SELECT * FROM contacts WHERE id=${req.params.id}`;
  if (!rows.length) return res.status(404).json({ error: 'Contactul nu există' });
  res.json(rows[0]);
});

router.post('/', async (req, res) => {
  const { name, company, email, phone, website, status, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'Numele este obligatoriu' });
  const rows = await sql`
    INSERT INTO contacts (name, company, email, phone, website, status, notes, created_by)
    VALUES (${name}, ${company||null}, ${email||null}, ${phone||null}, ${website||null}, ${status||'prospect'}, ${notes||null}, ${req.user.id})
    RETURNING *
  `;
  res.status(201).json(rows[0]);
});

router.put('/:id', async (req, res) => {
  const { name, company, email, phone, website, status, notes } = req.body;
  const rows = await sql`
    UPDATE contacts SET name=${name}, company=${company||null}, email=${email||null}, phone=${phone||null},
    website=${website||null}, status=${status||'prospect'}, notes=${notes||null}, updated_at=NOW()
    WHERE id=${req.params.id} RETURNING *
  `;
  res.json(rows[0]);
});

router.delete('/:id', async (req, res) => {
  await sql`DELETE FROM contacts WHERE id=${req.params.id}`;
  res.json({ ok: true });
});

export default router;
