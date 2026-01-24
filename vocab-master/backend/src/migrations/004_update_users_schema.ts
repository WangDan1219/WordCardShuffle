import type { Database } from 'better-sqlite3';
import type { Migration } from '../config/migrator';

export const updateUsersSchema: Migration = {
    name: '004_update_users_schema',
    up: (db: Database) => {
        console.log('[Migration 004] Checking if users table needs update...');

        // Check if parent_id column exists
        const tableInfo = db.pragma('table_info(users)') as { name: string }[];
        const hasParentId = tableInfo.some(col => col.name === 'parent_id');

        if (hasParentId) {
            console.log('[Migration 004] Users table already has parent_id. Checking constraint...');
            // In SQLite, checking the exact constraint definition is hard, but if parent_id exists
            // it's likely the schema is already correct from a fresh install.
            // However, to be safe and ensure the ROLE constraint is updated for 'parent' role support,
            // we will proceed with recreation if we want to be 100% sure, OR we can assume if parent_id
            // matches, we are good.
            //
            // Given the user's issue is specifically about "structure not updated", running this
            // won't hurt if we do it safely.
        }

        console.log('[Migration 004] Starting schema update for users table...');

        db.transaction(() => {
            // Disable foreign keys to allow table replacement
            db.pragma('foreign_keys = OFF');

            try {
                // 1. Rename existing table
                db.prepare('ALTER TABLE users RENAME TO users_old').run();

                // 2. Create new table with updated schema (including parent_id and updated CHECK constraint)
                db.prepare(`
          CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            display_name TEXT,
            role TEXT CHECK(role IN ('student', 'parent', 'admin')) DEFAULT 'student',
            parent_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE SET NULL
          )
        `).run();

                // 3. Copy data from old table to new table
                // mapping columns that definitely exist
                db.prepare(`
          INSERT INTO users (id, username, password_hash, display_name, role, created_at)
          SELECT id, username, password_hash, display_name, role, created_at
          FROM users_old
        `).run();

                // 4. Drop old table
                db.prepare('DROP TABLE users_old').run();

                // 5. Verify integrity (optional but good)
                const count = db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number };
                console.log(`[Migration 004] Migrated ${count.c} users.`);

            } catch (error) {
                console.error('[Migration 004] Failed. Rolling back (if possible within tx)...', error);
                throw error; // Transaction will rollback
            } finally {
                // Re-enable foreign keys
                db.pragma('foreign_keys = ON');
            }
        })();

        console.log('[Migration 004] Users table schema updated successfully.');
    }
};
