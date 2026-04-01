import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initSchema } from './db/schema.js';

import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import tasksRoutes from './routes/tasks.js';
import notesRoutes from './routes/notes.js';
import filesRoutes from './routes/files.js';
import projectsRoutes from './routes/projects.js';
import projectFilesRoutes from './routes/project-files.js';
import spreadsheetsRoutes from './routes/spreadsheets.js';

const app = express();

app.use(cors({
  origin: ['https://moreleads.vercel.app', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.options('*', cors());
app.use(express.json());

initSchema();

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/projects', projectFilesRoutes);
app.use('/api/projects', spreadsheetsRoutes);

app.get('/', (req, res) => res.json({ status: 'API appnou ok' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server pornit pe portul ${PORT}`));
