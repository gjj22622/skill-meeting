import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import defaultSkillsData from '@/data/default-skills.json';

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'skill-meeting.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    initSchema(_db);
  }
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'user' CHECK(role IN ('user','admin')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS meetings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      topic TEXT NOT NULL,
      source_data TEXT DEFAULT '',
      skill_ids TEXT DEFAULT '[]',
      rounds INTEGER DEFAULT 3,
      goal_type TEXT DEFAULT 'consensus' CHECK(goal_type IN ('consensus','explore','brainstorm')),
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft','in_progress','completed')),
      messages TEXT DEFAULT '[]',
      report TEXT,
      token_usage INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS default_skills (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      avatar TEXT DEFAULT '',
      expertise TEXT DEFAULT '[]',
      personality TEXT DEFAULT '',
      prompt TEXT DEFAULT '',
      signature TEXT DEFAULT '{}',
      is_visible INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS custom_skills (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      avatar TEXT DEFAULT '',
      expertise TEXT DEFAULT '[]',
      personality TEXT DEFAULT '',
      prompt TEXT DEFAULT '',
      signature TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id TEXT REFERENCES users(id),
      action TEXT NOT NULL,
      resource_type TEXT,
      resource_id TEXT,
      details TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_meetings_user ON meetings(user_id);
    CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
    CREATE INDEX IF NOT EXISTS idx_meetings_deleted ON meetings(deleted_at);
    CREATE INDEX IF NOT EXISTS idx_custom_skills_user ON custom_skills(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);

    CREATE TABLE IF NOT EXISTS api_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider TEXT NOT NULL,
      model TEXT NOT NULL,
      key_index INTEGER NOT NULL DEFAULT 0,
      input_tokens INTEGER NOT NULL DEFAULT 0,
      output_tokens INTEGER NOT NULL DEFAULT 0,
      meeting_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_api_usage_created ON api_usage(created_at);
    CREATE INDEX IF NOT EXISTS idx_api_usage_key ON api_usage(provider, key_index);
  `);

  // Add columns for token tracking and duration (safe to run multiple times)
  const meetingColumns = db.prepare("PRAGMA table_info(meetings)").all() as Array<{ name: string }>;
  const colNames = meetingColumns.map((c) => c.name);
  if (!colNames.includes('token_input')) {
    db.exec('ALTER TABLE meetings ADD COLUMN token_input INTEGER DEFAULT 0');
  }
  if (!colNames.includes('token_output')) {
    db.exec('ALTER TABLE meetings ADD COLUMN token_output INTEGER DEFAULT 0');
  }
  if (!colNames.includes('duration_ms')) {
    db.exec('ALTER TABLE meetings ADD COLUMN duration_ms INTEGER DEFAULT 0');
  }

  // Add is_active column to custom_skills (safe migration)
  const customSkillCols = db.prepare("PRAGMA table_info(custom_skills)").all() as Array<{ name: string }>;
  const customColNames = customSkillCols.map((c) => c.name);
  if (!customColNames.includes('is_active')) {
    db.exec('ALTER TABLE custom_skills ADD COLUMN is_active INTEGER DEFAULT 1');
  }

  // Seed default skills from JSON if empty
  const count = db.prepare('SELECT COUNT(*) as c FROM default_skills').get() as { c: number };
  if (count.c === 0) {
    const insert = db.prepare(`
      INSERT INTO default_skills (id, name, avatar, expertise, personality, prompt, signature, is_visible, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);
    const tx = db.transaction(() => {
      (defaultSkillsData as Array<{
        id: string; name: string; avatar: string;
        expertise: string[]; personality: string; prompt: string;
        signature: { style: string };
      }>).forEach((s, i) => {
        insert.run(s.id, s.name, s.avatar, JSON.stringify(s.expertise), s.personality, s.prompt, JSON.stringify(s.signature), i);
      });
    });
    tx();
  }
}

// ── API 用量記錄 ──

export function recordApiUsage(
  provider: string,
  model: string,
  keyIndex: number,
  inputTokens: number,
  outputTokens: number,
  meetingId?: string,
) {
  const db = getDb();
  db.prepare(
    `INSERT INTO api_usage (provider, model, key_index, input_tokens, output_tokens, meeting_id)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(provider, model, keyIndex, inputTokens, outputTokens, meetingId || null);
}

export interface DailyKeyUsage {
  key_index: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_requests: number;
}

export function getDailyApiUsage(): DailyKeyUsage[] {
  const db = getDb();
  const rows = db.prepare(
    `SELECT
       key_index,
       SUM(input_tokens) as total_input_tokens,
       SUM(output_tokens) as total_output_tokens,
       COUNT(*) as total_requests
     FROM api_usage
     WHERE provider = 'gemini'
       AND date(created_at) = date('now')
     GROUP BY key_index
     ORDER BY key_index`
  ).all() as DailyKeyUsage[];
  return rows;
}

// Helper: create admin user if none exists
export function ensureAdminUser(db: Database.Database, email: string, passwordHash: string) {
  const existing = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
  if (!existing) {
    const { v4 } = require('uuid');
    db.prepare('INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)').run(
      v4(), email, passwordHash, 'Admin', 'admin'
    );
  }
}
