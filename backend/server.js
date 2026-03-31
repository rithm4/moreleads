import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initSchema } from './db/schema.js';

import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import tasksRoutes from './routes/tasks.js';
import notesRoutes from './routes/notes.js';
import filesRoutes from './routes/files.js';

const app = express();

app.use(cors());
app.use(express.json());

initSchema();

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/files', filesRoutes);

app.get('/', (req, res) => res.json({ status: 'API appnou ok' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server pornit pe portul ${PORT}`));
