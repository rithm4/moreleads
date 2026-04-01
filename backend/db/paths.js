import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// On Render with persistent disk mounted at /data, use /data/uploads.
// Locally, use backend/uploads.
const BASE = existsSync('/data') ? '/data' : new URL('..', import.meta.url).pathname;
export const UPLOADS_DIR = join(BASE, 'uploads');

// Ensure uploads directory exists
mkdirSync(UPLOADS_DIR, { recursive: true });
