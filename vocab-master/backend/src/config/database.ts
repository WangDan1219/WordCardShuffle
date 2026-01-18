import Database from 'better-sqlite3';
import path from 'path';

const DATABASE_PATH = process.env.DATABASE_PATH || path.join(__dirname, '../../data/vocab-master.db');

// Ensure data directory exists
import fs from 'fs';
const dataDir = path.dirname(DATABASE_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

import type { Database as DatabaseType } from 'better-sqlite3';

export const db: DatabaseType = new Database(DATABASE_PATH);

// Enable foreign keys
db.pragma('foreign_keys = ON');

export function initializeDatabase(): void {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      role TEXT CHECK(role IN ('student', 'parent', 'admin')) DEFAULT 'student',
      parent_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // Migration: Add role and parent_id if they don't exist
  try {
    const tableInfo = db.pragma('table_info(users)') as { name: string }[];
    const hasRole = tableInfo.some(col => col.name === 'role');
    const hasParentId = tableInfo.some(col => col.name === 'parent_id');

    if (!hasRole) {
      console.log('Migrating: Adding role column to users');
      db.exec(`ALTER TABLE users ADD COLUMN role TEXT CHECK(role IN ('student', 'parent', 'admin')) DEFAULT 'student'`);
    }
    if (!hasParentId) {
      console.log('Migrating: Adding parent_id column to users');
      db.exec(`ALTER TABLE users ADD COLUMN parent_id INTEGER REFERENCES users(id) ON DELETE SET NULL`);
    }
  } catch (err) {
    console.error('Migration error:', err);
  }

  // Drop deprecated admin_settings if exists
  db.exec(`DROP TABLE IF EXISTS admin_settings`);

  // ... (rest of tables)

  // User settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id INTEGER PRIMARY KEY,
      sound_enabled INTEGER DEFAULT 1,
      auto_advance INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // User stats table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_stats (
      user_id INTEGER PRIMARY KEY,
      total_words_studied INTEGER DEFAULT 0,
      quizzes_taken INTEGER DEFAULT 0,
      challenges_completed INTEGER DEFAULT 0,
      best_challenge_score INTEGER DEFAULT 0,
      last_study_date TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Daily challenges table
  db.exec(`
    CREATE TABLE IF NOT EXISTS daily_challenges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      challenge_date TEXT NOT NULL,
      score INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, challenge_date)
    )
  `);

  // Refresh tokens table for JWT
  db.exec(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Quiz Results table (individual quiz/challenge attempts)
  db.exec(`
    CREATE TABLE IF NOT EXISTS quiz_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      quiz_type TEXT NOT NULL CHECK(quiz_type IN ('quiz', 'challenge')),
      total_questions INTEGER NOT NULL,
      correct_answers INTEGER NOT NULL,
      score INTEGER NOT NULL,
      time_per_question INTEGER,
      total_time_spent INTEGER NOT NULL,
      points_earned INTEGER DEFAULT 0,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Quiz Answers table (question-level tracking)
  db.exec(`
    CREATE TABLE IF NOT EXISTS quiz_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quiz_result_id INTEGER NOT NULL,
      question_index INTEGER NOT NULL,
      word TEXT NOT NULL,
      prompt_type TEXT NOT NULL,
      question_format TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      selected_answer TEXT,
      is_correct INTEGER NOT NULL,
      time_spent INTEGER NOT NULL,
      FOREIGN KEY (quiz_result_id) REFERENCES quiz_results(id) ON DELETE CASCADE
    )
  `);

  // Study Sessions (track daily effort)
  db.exec(`
    CREATE TABLE IF NOT EXISTS study_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      words_reviewed INTEGER NOT NULL,
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // User Vocabulary (track unique words)
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_vocabulary (
      user_id INTEGER NOT NULL,
      word TEXT NOT NULL,
      first_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, word),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id ON quiz_results(user_id);
    CREATE INDEX IF NOT EXISTS idx_quiz_results_completed_at ON quiz_results(completed_at);
    CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_study_sessions_created_at ON study_sessions(created_at);
  `);

  seedAdminUser();

  console.log('Database initialized successfully');
}

import bcrypt from 'bcryptjs';

function seedAdminUser() {
  const adminUser = process.env.INITIAL_ADMIN_USERNAME;
  const adminPass = process.env.INITIAL_ADMIN_PASSWORD;

  if (adminUser && adminPass) {
    try {
      const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(adminUser);
      if (!existing) {
        console.log(`Seeding admin user: ${adminUser}`);
        const hash = bcrypt.hashSync(adminPass, 12);
        db.prepare(`
          INSERT INTO users (username, password_hash, display_name, role)
          VALUES (?, ?, 'System Admin', 'admin')
        `).run(adminUser, hash);
      } else {
        console.log(`Admin user ${adminUser} already exists. Skipping seed.`);
      }
    } catch (err) {
      console.error('Failed to seed admin user:', err);
    }
  }
}

export function closeDatabase(): void {
  db.close();
}

export default db;
