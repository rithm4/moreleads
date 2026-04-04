import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initSchema } from './db.js';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import tasksRoutes from './routes/tasks.js';
import notesRoutes from './routes/notes.js';
import projectsRoutes from './routes/projects.js';
import contactsRoutes from './routes/contacts.js';
import dealsRoutes from './routes/deals.js';
import dashboardRoutes from './routes/dashboard.js';
import chatRoutes from './routes/chat.js';
import webhooksRoutes from './routes/webhooks.js';

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
app.use('/api/contacts', contactsRoutes);
app.use('/api/deals', dealsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/webhooks', webhooksRoutes);

app.get('/api', (req, res) => res.json({ status: 'Moreleads Hub API ok' }));

export default app;
