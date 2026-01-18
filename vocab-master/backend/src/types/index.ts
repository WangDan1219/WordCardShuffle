import { Request } from 'express';

// Database row types
export interface UserRow {
  id: number;
  username: string;
  password_hash: string;
  display_name: string | null;
  created_at: string;
}

export interface UserSettingsRow {
  user_id: number;
  sound_enabled: number; // SQLite stores booleans as integers
  auto_advance: number;
}

export interface UserStatsRow {
  user_id: number;
  total_words_studied: number;
  quizzes_taken: number;
  challenges_completed: number;
  best_challenge_score: number;
  last_study_date: string | null;
}

export interface DailyChallengeRow {
  id: number;
  user_id: number;
  challenge_date: string;
  score: number;
  created_at: string;
}

export interface RefreshTokenRow {
  id: number;
  user_id: number;
  token: string;
  expires_at: string;
  created_at: string;
}

// API response types
export interface User {
  id: number;
  username: string;
  displayName: string | null;
  createdAt: string;
}

export interface UserSettings {
  soundEnabled: boolean;
  autoAdvance: boolean;
}

export interface UserStats {
  totalWordsStudied: number;
  quizzesTaken: number;
  challengesCompleted: number;
  bestChallengeScore: number;
  lastStudyDate: string | null;
}

export interface DailyChallenge {
  id: number;
  userId: number;
  challengeDate: string;
  score: number;
  createdAt: string;
}

// Auth types
export interface JWTPayload {
  userId: number;
  username: string;
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// API Request/Response types
export interface RegisterRequest {
  username: string;
  password: string;
  displayName?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  tokens: TokenPair;
}

export interface UpdateSettingsRequest {
  soundEnabled?: boolean;
  autoAdvance?: boolean;
}

export interface UpdateStatsRequest {
  totalWordsStudied?: number;
  quizzesTaken?: number;
  challengesCompleted?: number;
  bestChallengeScore?: number;
  lastStudyDate?: string | null;
}

export interface CompleteChallengeRequest {
  score: number;
}

// Error response
export interface ErrorResponse {
  error: string;
  message: string;
}
