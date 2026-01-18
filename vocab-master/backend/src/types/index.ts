import { Request } from 'express';

// Database row types
export interface UserRow {
  id: number;
  username: string;
  password_hash: string;
  display_name: string | null;
  role: 'student' | 'parent' | 'admin';
  parent_id: number | null;
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

export interface QuizResultRow {
  id: number;
  user_id: number;
  quiz_type: 'quiz' | 'challenge';
  total_questions: number;
  correct_answers: number;
  score: number;
  time_per_question: number | null;
  total_time_spent: number;
  points_earned: number;
  completed_at: string;
}

export interface QuizAnswerRow {
  id: number;
  quiz_result_id: number;
  question_index: number;
  word: string;
  prompt_type: string;
  question_format: string;
  correct_answer: string;
  selected_answer: string | null;
  is_correct: number;
  time_spent: number;
}

export interface StudySessionRow {
  id: number;
  user_id: number;
  words_reviewed: number;
  start_time: string;
  end_time: string;
  created_at: string;
}

export interface AdminSettingsRow {
  id: number;
  password_hash: string;
  created_at: string;
}

// API response types
export interface User {
  id: number;
  username: string;
  displayName: string | null;
  role: 'student' | 'parent' | 'admin';
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
  role: 'student' | 'parent' | 'admin';
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
