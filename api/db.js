import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default sql;

export async function initSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id         SERIAL PRIMARY KEY,
      name       TEXT NOT NULL,
      email      TEXT NOT NULL UNIQUE,
      password   TEXT NOT NULL,
      role       TEXT NOT NULL DEFAULT 'member',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS tasks (
      id          SERIAL PRIMARY KEY,
      title       TEXT NOT NULL,
      description TEXT,
      status      TEXT NOT NULL DEFAULT 'todo',
      position    INTEGER NOT NULL DEFAULT 0,
      assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_by  INTEGER NOT NULL REFERENCES users(id),
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS notes (
      id         SERIAL PRIMARY KEY,
      title      TEXT NOT NULL,
      body       TEXT,
      visibility TEXT NOT NULL DEFAULT 'private',
      owner_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS projects (
      id          SERIAL PRIMARY KEY,
      name        TEXT NOT NULL,
      description TEXT,
      color       TEXT NOT NULL DEFAULT '#6366f1',
      parent_id   INTEGER REFERENCES projects(id) ON DELETE CASCADE,
      created_by  INTEGER NOT NULL REFERENCES users(id),
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS spreadsheets (
      id         SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      name       TEXT NOT NULL,
      created_by INTEGER NOT NULL REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS spreadsheet_columns (
      id             SERIAL PRIMARY KEY,
      spreadsheet_id INTEGER NOT NULL REFERENCES spreadsheets(id) ON DELETE CASCADE,
      name           TEXT NOT NULL,
      col_type       TEXT NOT NULL DEFAULT 'text',
      position       INTEGER NOT NULL DEFAULT 0
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS spreadsheet_rows (
      id             SERIAL PRIMARY KEY,
      spreadsheet_id INTEGER NOT NULL REFERENCES spreadsheets(id) ON DELETE CASCADE,
      position       INTEGER NOT NULL DEFAULT 0,
      data           JSONB NOT NULL DEFAULT '{}',
      created_at     TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}
