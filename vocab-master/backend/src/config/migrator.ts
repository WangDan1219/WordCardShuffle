import type { Database } from 'better-sqlite3';

export interface Migration {
    name: string;
    up: (db: Database) => void;
    down?: (db: Database) => void;
}

export class Migrator {
    private db: Database;
    private migrations: Migration[];

    constructor(db: Database, migrations: Migration[]) {
        this.db = db;
        this.migrations = migrations;
    }

    public migrate(): void {
        // 1. Create migrations table if not exists
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // 2. Get executed migrations
        const executed = new Set(
            (this.db.prepare('SELECT name FROM _migrations').all() as { name: string }[])
                .map(row => row.name)
        );

        // 3. Run pending migrations
        for (const migration of this.migrations) {
            if (!executed.has(migration.name)) {
                console.log(`Running migration: ${migration.name}`);
                try {
                    // Run in transaction
                    this.db.transaction(() => {
                        migration.up(this.db);
                        this.db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(migration.name);
                    })();
                    console.log(`Migration ${migration.name} completed.`);
                } catch (error) {
                    console.error(`Migration ${migration.name} failed:`, error);
                    throw error; // Stop migration process on error
                }
            }
        }
    }
}
