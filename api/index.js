import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initSchema } from './db.js';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import tasksRoutes from './routes/tasks.js';
import notesRoutes from './routes/notes.js';
import projectsRoutes from './routes/projects.js';

const app = express();

app.use(cors({
  origin: [
    'https://moreleads.vercel.app',
    /\.vercel\.app$/,
    'http://localhost:5173'
  ],
  credentials: true
}));
app.use(express.json());

// Init DB schema on cold start
let initialized = false;
app.use(async (req, res, next) => {
  if (!initialized) {
    await initSchema();
    initialized = true;
  }
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/projects', projectsRoutes);

app.get('/api', (req, res) => res.json({ status: 'Moreleads Hub API ok' }));

export default app;
