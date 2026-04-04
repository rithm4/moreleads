import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sql from '../db.js';
import { auth } from '../middleware.js';

const router = Router();

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Toate câmpurile sunt obligatorii' });
  const exists = await sql`SELECT id FROM users WHERE email = ${email}`;
  if (exists.length) return res.status(409).json({ error: 'Email deja folosit' });
  const hash = await bcrypt.hash(password, 10);
  const rows = await sql`INSERT INTO users (name, email, password) VALUES (${name}, ${email}, ${hash}) RETURNING id, name, email, role`;
  const user = rows[0];
  const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token, user });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const rows = await sql`SELECT * FROM users WHERE email = ${email}`;
  if (!rows.length) return res.status(401).json({ error: 'Email sau parolă greșite' });
  const user = rows[0];
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: 'Email sau parolă greșite' });
  const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

router.get('/me', auth, async (req, res) => {
  const rows = await sql`SELECT id, name, email, role FROM users WHERE id = ${req.user.id}`;
  if (!rows.length) return res.status(404).json({ error: 'User negăsit' });
  res.json(rows[0]);
});

export default router;
