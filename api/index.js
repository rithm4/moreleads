import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initSchema } from './_lib/db.js';
import authRoutes from './_lib/routes/auth.js';
import usersRoutes from './_lib/routes/users.js';
import tasksRoutes from './_lib/routes/tasks.js';
import notesRoutes from './_lib/routes/notes.js';
import projectsRoutes from './_lib/routes/projects.js';
import contactsRoutes from './_lib/routes/contacts.js';
import dealsRoutes from './_lib/routes/deals.js';
import dashboardRoutes from './_lib/routes/dashboard.js';
import commentsRoutes from './_lib/routes/comments.js';
import activityRoutes from './_lib/routes/activity.js';

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
app.use(express.urlencoded({ extended: true }));

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
app.use('/api/contacts', contactsRoutes);
app.use('/api/deals', dealsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/activity', activityRoutes);

app.get('/api', (req, res) => res.json({ status: 'Moreleads Hub API ok' }));

export default app;
