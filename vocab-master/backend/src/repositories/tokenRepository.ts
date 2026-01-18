import db from '../config/database.js';
import type { RefreshTokenRow } from '../types/index.js';

export const tokenRepository = {
  create(userId: number, token: string, expiresAt: Date): RefreshTokenRow {
    const stmt = db.prepare(`
      INSERT INTO refresh_tokens (user_id, token, expires_at)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(userId, token, expiresAt.toISOString());
    return this.findById(result.lastInsertRowid as number)!;
  },

  findById(id: number): RefreshTokenRow | undefined {
    const stmt = db.prepare('SELECT * FROM refresh_tokens WHERE id = ?');
    return stmt.get(id) as RefreshTokenRow | undefined;
  },

  findByToken(token: string): RefreshTokenRow | undefined {
    const stmt = db.prepare('SELECT * FROM refresh_tokens WHERE token = ?');
    return stmt.get(token) as RefreshTokenRow | undefined;
  },

  deleteByToken(token: string): void {
    const stmt = db.prepare('DELETE FROM refresh_tokens WHERE token = ?');
    stmt.run(token);
  },

  deleteAllForUser(userId: number): void {
    const stmt = db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?');
    stmt.run(userId);
  },

  deleteExpired(): void {
    const stmt = db.prepare('DELETE FROM refresh_tokens WHERE expires_at < ?');
    stmt.run(new Date().toISOString());
  },

  isValid(token: string): boolean {
    const record = this.findByToken(token);
    if (!record) {
      return false;
    }

    const expiresAt = new Date(record.expires_at);
    return expiresAt > new Date();
  }
};
