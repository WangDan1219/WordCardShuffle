import Database from 'better-sqlite3';
import path from 'path';
import { Migrator } from './migrator';
import { migrations } from '../migrations';

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
  try {
    const migrator = new Migrator(db, migrations);
    migrator.migrate();
    console.log('Database initialized successfully via migrations');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

export function closeDatabase(): void {
  db.close();
}

export default db;
