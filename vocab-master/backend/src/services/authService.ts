import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { userRepository } from '../repositories/userRepository.js';
import { tokenRepository } from '../repositories/tokenRepository.js';
import { passwordResetRepository } from '../repositories/passwordResetRepository.js';
import { emailService } from './emailService.js';
import type { User, JWTPayload, TokenPair, UserRow } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const PASSWORD_RESET_TOKEN_EXPIRY_HOURS = 1;
const PASSWORD_HASH_ROUNDS = 12;
const TOKEN_HASH_ROUNDS = 10;

function userRowToUser(row: UserRow): User {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    role: row.role,
    email: row.email,
    emailVerified: row.email_verified === 1,
    createdAt: row.created_at
  };
}

export const authService = {
  /**
   * Legacy register method - creates a student account
   * @deprecated Use registerStudent or registerParent instead
   */
  async register(username: string, password: string, displayName?: string): Promise<{ user: User; tokens: TokenPair }> {
    return this.registerStudent(username, password, displayName);
  },

  /**
   * Register a new student account (no email required)
   */
  async registerStudent(username: string, password: string, displayName?: string): Promise<{ user: User; tokens: TokenPair }> {
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
    const passwordHash = await bcrypt.hash(password, PASSWORD_HASH_ROUNDS);

    // Create student user
    const userRow = userRepository.createStudent(username, passwordHash, displayName);
    const user = userRowToUser(userRow);

    // Generate tokens
    const tokens = this.generateTokens(user.id, user.username, user.role);

    return { user, tokens };
  },

  /**
   * Register a new parent account (email required)
   */
  async registerParent(username: string, password: string, email: string, displayName?: string): Promise<{ user: User; tokens: TokenPair }> {
    // Check if username already exists
    const existingUsername = userRepository.findByUsername(username);
    if (existingUsername) {
      throw new Error('Username already taken');
    }

    // Check if email already exists
    const existingEmail = userRepository.findByEmail(email);
    if (existingEmail) {
      throw new Error('Email already registered');
    }

    // Validate password
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, PASSWORD_HASH_ROUNDS);

    // Create parent user
    const userRow = userRepository.createParent(username, passwordHash, email, displayName);
    const user = userRowToUser(userRow);

    // Generate tokens
    const tokens = this.generateTokens(user.id, user.username, user.role);

    // Send welcome email (don't await - fire and forget)
    emailService.sendWelcomeEmail(email, displayName).catch(err => {
      console.error('[AuthService] Failed to send welcome email:', err);
    });

    return { user, tokens };
  },

  /**
   * Request a password reset email
   * Always returns void to prevent email enumeration
   */
  async requestPasswordReset(email: string): Promise<void> {
    // Find user by email
    const userRow = userRepository.findByEmail(email);

    // If user doesn't exist, add artificial delay then return (prevent timing attack)
    if (!userRow) {
      await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 100));
      return;
    }

    // Check rate limiting (max 3 tokens in last 15 minutes)
    const recentTokens = passwordResetRepository.countRecentByUserId(userRow.id, 15);
    if (recentTokens >= 3) {
      // Still return silently to prevent enumeration
      return;
    }

    // Generate token with selector (for lookup) and validator (for comparison)
    // Format: selector.validator where selector is plain and validator is hashed
    const selector = crypto.randomBytes(16).toString('hex');
    const validator = crypto.randomBytes(32).toString('hex');
    const rawToken = `${selector}.${validator}`;

    // Hash only the validator part for storage
    const validatorHash = await bcrypt.hash(validator, TOKEN_HASH_ROUNDS);
    // Store as "selector:validatorHash" for O(1) lookup by selector
    const tokenHash = `${selector}:${validatorHash}`;

    // Calculate expiry
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + PASSWORD_RESET_TOKEN_EXPIRY_HOURS);

    // Store the token
    passwordResetRepository.create(userRow.id, tokenHash, expiresAt);

    // Send the email with the raw token (selector.validator)
    await emailService.sendPasswordResetEmail(
      email,
      rawToken,
      userRow.display_name || undefined
    );
  },

  /**
   * Reset password using a valid token
   * Token format: selector.validator
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Validate password
    if (newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Parse the token
    const parts = token.split('.');
    if (parts.length !== 2) {
      throw new Error('Invalid or expired reset token');
    }
    const [selector, validator] = parts;

    // Find token by selector (O(1) lookup)
    const tokenRecord = passwordResetRepository.findBySelector(selector);
    if (!tokenRecord) {
      throw new Error('Invalid or expired reset token');
    }

    // Extract the stored validator hash from "selector:validatorHash" format
    const storedHash = tokenRecord.token_hash.split(':')[1];
    if (!storedHash) {
      throw new Error('Invalid or expired reset token');
    }

    // Compare the validator
    const isValid = await bcrypt.compare(validator, storedHash);
    if (!isValid) {
      throw new Error('Invalid or expired reset token');
    }

    // Get the user
    const userRow = userRepository.findById(tokenRecord.user_id);
    if (!userRow) {
      throw new Error('User not found');
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, PASSWORD_HASH_ROUNDS);

    // Update the password
    userRepository.updatePassword(userRow.id, passwordHash);

    // Delete all tokens for this user (single-use security)
    passwordResetRepository.deleteAllForUser(userRow.id);

    // Invalidate all existing refresh tokens (log out all sessions)
    tokenRepository.deleteAllForUser(userRow.id);

    // Send notification email
    if (userRow.email) {
      await emailService.sendPasswordChangedNotification(
        userRow.email,
        userRow.display_name || undefined
      );
    }
  },

  /**
   * Validate a reset token without using it
   * Token format: selector.validator
   */
  async validateResetToken(token: string): Promise<boolean> {
    // Parse the token
    const parts = token.split('.');
    if (parts.length !== 2) {
      return false;
    }
    const [selector, validator] = parts;

    // Find token by selector (O(1) lookup)
    const tokenRecord = passwordResetRepository.findBySelector(selector);
    if (!tokenRecord) {
      return false;
    }

    // Extract the stored validator hash from "selector:validatorHash" format
    const storedHash = tokenRecord.token_hash.split(':')[1];
    if (!storedHash) {
      return false;
    }

    // Compare the validator
    return bcrypt.compare(validator, storedHash);
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
    passwordResetRepository.deleteExpired();
  },

  /**
   * Reset a user's password directly (for admin/parent use)
   * @param requesterId - The ID of the user making the request
   * @param requesterRole - The role of the requester
   * @param targetUserId - The ID of the user whose password is being reset
   * @param newPassword - The new password
   */
  async resetUserPassword(
    requesterId: number,
    requesterRole: 'student' | 'parent' | 'admin',
    targetUserId: number,
    newPassword: string
  ): Promise<void> {
    // Validate password
    if (newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Get the target user
    const targetUser = userRepository.findById(targetUserId);
    if (!targetUser) {
      throw new Error('User not found');
    }

    // Authorization check
    if (requesterRole === 'admin') {
      // Admins can reset any password except their own (must use email reset for that)
      if (requesterId === targetUserId) {
        throw new Error('Use password reset via email to change your own password');
      }
    } else if (requesterRole === 'parent') {
      // Parents can only reset passwords for their children
      if (targetUser.parent_id !== requesterId) {
        throw new Error('You can only reset passwords for your linked students');
      }
    } else {
      throw new Error('Unauthorized to reset passwords');
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update the password
    userRepository.updatePassword(targetUserId, passwordHash);

    // Invalidate all existing refresh tokens for the target user
    tokenRepository.deleteAllForUser(targetUserId);
  }
};
