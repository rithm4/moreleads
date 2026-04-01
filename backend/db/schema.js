import db from './database.js';

export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      email      TEXT NOT NULL UNIQUE,
      password   TEXT NOT NULL,
      role       TEXT NOT NULL DEFAULT 'member',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT NOT NULL,
      description TEXT,
      status      TEXT NOT NULL DEFAULT 'todo',
      position    INTEGER NOT NULL DEFAULT 0,
      assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_by  INTEGER NOT NULL REFERENCES users(id),
      created_at  TEXT DEFAULT (datetime('now')),
      updated_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notes (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      title      TEXT NOT NULL,
      body       TEXT,
      visibility TEXT NOT NULL DEFAULT 'private',
      owner_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS files (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      original_name TEXT NOT NULL,
      stored_name   TEXT NOT NULL,
      mime_type     TEXT,
      size_bytes    INTEGER,
      uploaded_by   INTEGER NOT NULL REFERENCES users(id),
      created_at    TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS projects (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      description TEXT,
      color       TEXT NOT NULL DEFAULT '#6366f1',
      parent_id   INTEGER REFERENCES projects(id) ON DELETE CASCADE,
      created_by  INTEGER NOT NULL REFERENCES users(id),
      created_at  TEXT DEFAULT (datetime('now')),
      updated_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS project_files (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id   INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      display_name TEXT NOT NULL,
      stored_name  TEXT NOT NULL,
      mime_type    TEXT,
      size_bytes   INTEGER,
      uploaded_by  INTEGER NOT NULL REFERENCES users(id),
      created_at   TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS spreadsheets (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      name       TEXT NOT NULL,
      created_by INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS spreadsheet_columns (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      spreadsheet_id INTEGER NOT NULL REFERENCES spreadsheets(id) ON DELETE CASCADE,
      name           TEXT NOT NULL,
      col_type       TEXT NOT NULL DEFAULT 'text',
      position       INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS spreadsheet_rows (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      spreadsheet_id INTEGER NOT NULL REFERENCES spreadsheets(id) ON DELETE CASCADE,
      position       INTEGER NOT NULL DEFAULT 0,
      data           TEXT NOT NULL DEFAULT '{}',
      created_at     TEXT DEFAULT (datetime('now'))
    );
  `);
}
