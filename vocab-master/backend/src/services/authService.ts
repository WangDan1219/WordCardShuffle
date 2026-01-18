import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { userRepository } from '../repositories/userRepository.js';
import { tokenRepository } from '../repositories/tokenRepository.js';
import type { User, JWTPayload, TokenPair, UserRow } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

function userRowToUser(row: UserRow): User {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    role: row.role,
    createdAt: row.created_at
  };
}

export const authService = {
  async register(username: string, password: string, displayName?: string): Promise<{ user: User; tokens: TokenPair }> {
    // Check if username already exists
    const existing = userRepository.findByUsername(username);
    if (existing) {
      throw new Error('Username already taken');
    }

    // Validate password
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const userRow = userRepository.create(username, passwordHash, displayName);
    const user = userRowToUser(userRow);

    // Generate tokens
    const tokens = this.generateTokens(user.id, user.username, user.role);

    return { user, tokens };
  },

  async login(username: string, password: string): Promise<{ user: User; tokens: TokenPair }> {
    // Find user
    const userRow = userRepository.findByUsername(username);
    if (!userRow) {
      throw new Error('Invalid username or password');
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, userRow.password_hash);
    if (!validPassword) {
      throw new Error('Invalid username or password');
    }

    const user = userRowToUser(userRow);

    // Generate tokens
    const tokens = this.generateTokens(user.id, user.username, user.role);

    return { user, tokens };
  },

  logout(refreshToken: string): void {
    tokenRepository.deleteByToken(refreshToken);
  },

  logoutAll(userId: number): void {
    tokenRepository.deleteAllForUser(userId);
  },

  async refresh(refreshToken: string): Promise<TokenPair> {
    // Validate refresh token
    const tokenRecord = tokenRepository.findByToken(refreshToken);
    if (!tokenRecord) {
      throw new Error('Invalid refresh token');
    }

    // Check if expired
    const expiresAt = new Date(tokenRecord.expires_at);
    if (expiresAt <= new Date()) {
      tokenRepository.deleteByToken(refreshToken);
      throw new Error('Refresh token expired');
    }

    // Find user
    const userRow = userRepository.findById(tokenRecord.user_id);
    if (!userRow) {
      tokenRepository.deleteByToken(refreshToken);
      throw new Error('User not found');
    }

    // Delete old refresh token
    tokenRepository.deleteByToken(refreshToken);

    // Generate new tokens
    return this.generateTokens(userRow.id, userRow.username, userRow.role);
  },

  generateTokens(userId: number, username: string, role: 'student' | 'parent' | 'admin'): TokenPair {
    const payload: JWTPayload = { userId, username, role };

    // Generate access token
    const accessToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRY
    });

    // Generate refresh token
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    // Store refresh token
    tokenRepository.create(userId, refreshToken, refreshExpiresAt);

    return { accessToken, refreshToken };
  },

  verifyAccessToken(token: string): JWTPayload {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
      return payload;
    } catch {
      throw new Error('Invalid or expired access token');
    }
  },

  getUser(userId: number): User | null {
    const userRow = userRepository.findById(userId);
    if (!userRow) {
      return null;
    }
    return userRowToUser(userRow);
  },

  cleanupExpiredTokens(): void {
    tokenRepository.deleteExpired();
  }
};
