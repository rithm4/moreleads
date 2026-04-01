import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// On Render: use persistent disk at /data. Locally: use project folder.
const DB_DIR = existsSync('/data') ? '/data' : join(__dirname, '..');
const db = new Database(join(DB_DIR, 'hub.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export default db;
