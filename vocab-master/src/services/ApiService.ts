// API Service for communicating with the backend

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9876/api';

// Token storage keys
const ACCESS_TOKEN_KEY = 'vocab_master_access_token';
const REFRESH_TOKEN_KEY = 'vocab_master_refresh_token';

// Types
export interface User {
  id: number;
  username: string;
  displayName: string | null;
  role: 'student' | 'parent' | 'admin';
  createdAt: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: TokenPair;
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

export interface TodayChallengeResponse {
  completed: boolean;
  challenge: DailyChallenge | null;
  streak: number;
}

export interface CompleteChallengeResponse {
  challenge: DailyChallenge;
  streak: number;
}

export interface ApiError {
  error: string;
  message: string;
}



// Quiz Result Interfaces
export interface SaveQuizResultRequest {
  quizType: 'quiz' | 'challenge';
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  timePerQuestion: number | null;
  totalTimeSpent: number;
  pointsEarned: number;
  answers: Array<{
    questionIndex: number;
    word: string;
    promptType: string;
    questionFormat: string;
    correctAnswer: string;
    selectedAnswer: string | null;
    isCorrect: boolean;
    timeSpent: number;
  }>;
}

export interface SaveStudySessionRequest {
  wordsReviewed: number;
  startTime: string;
  endTime: string;
  words?: string[];
}

// Admin Interfaces

export interface AdminUserStats {
  id: number;
  username: string;
  display_name: string | null;
  role: 'student' | 'parent' | 'admin';
  parent_id: number | null;
  created_at: string;
  quizzes_taken: number;
  total_words_studied: number;
  last_study_date: string | null;
  avg_score: number | null;
}

export interface AdminUserDetails {
  quizHistory: any[];
  studyHistory: any[];
  weakWords: any[];
}

class ApiServiceClass {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshPromise: Promise<TokenPair> | null = null;

  constructor() {
    // Load tokens from localStorage on init
    this.accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    this.refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  // Token management
  setTokens(tokens: TokenPair): void {
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  }

  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  hasTokens(): boolean {
    return this.accessToken !== null && this.refreshToken !== null;
  }

  // Core fetch wrapper with auth
  private async fetchWithAuth<T>(
    endpoint: string,
    options: RequestInit = {},
    retry = true
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle 401 - try refresh
    if (response.status === 401 && this.refreshToken && retry) {
      try {
        await this.refreshAccessToken();
        return this.fetchWithAuth<T>(endpoint, options, false);
      } catch {
        this.clearTokens();
        throw new Error('Session expired. Please login again.');
      }
    }

    if (!response.ok) {
      const errorData: ApiError = await response.json().catch(() => ({
        error: 'Unknown Error',
        message: `Request failed with status ${response.status}`
      }));
      throw new Error(errorData.message);
    }

    return response.json();
  }

  private async refreshAccessToken(): Promise<TokenPair> {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      this.setTokens(data.tokens);
      return data.tokens;
    })();

    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  // Auth endpoints
  async register(username: string, password: string, displayName?: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, displayName }),
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json().catch(() => ({
        error: 'Unknown Error',
        message: 'Registration failed'
      }));
      throw new Error(errorData.message);
    }

    const data: AuthResponse = await response.json();
    this.setTokens(data.tokens);
    return data;
  }

  async login(username: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json().catch(() => ({
        error: 'Unknown Error',
        message: 'Login failed'
      }));
      throw new Error(errorData.message);
    }

    const data: AuthResponse = await response.json();
    this.setTokens(data.tokens);
    return data;
  }

  async logout(): Promise<void> {
    if (this.refreshToken) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: this.refreshToken }),
        });
      } catch {
        // Ignore logout errors
      }
    }
    this.clearTokens();
  }

  async getCurrentUser(): Promise<User | null> {
    if (!this.hasTokens()) {
      return null;
    }

    try {
      const data = await this.fetchWithAuth<{ user: User }>('/auth/me');
      return data.user;
    } catch {
      return null;
    }
  }

  // Settings endpoints
  async getSettings(): Promise<UserSettings> {
    return this.fetchWithAuth<UserSettings>('/settings');
  }

  async updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    return this.fetchWithAuth<UserSettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Stats endpoints
  async getStats(): Promise<UserStats> {
    return this.fetchWithAuth<UserStats>('/stats');
  }

  async updateStats(stats: Partial<UserStats>): Promise<UserStats> {
    return this.fetchWithAuth<UserStats>('/stats', {
      method: 'PATCH',
      body: JSON.stringify(stats),
    });
  }

  async incrementStats(increments: {
    totalWordsStudied?: number;
    quizzesTaken?: number;
    challengesCompleted?: number;
  }): Promise<UserStats> {
    return this.fetchWithAuth<UserStats>('/stats/increment', {
      method: 'POST',
      body: JSON.stringify(increments),
    });
  }

  // Challenges endpoints
  async getTodayChallenge(): Promise<TodayChallengeResponse> {
    return this.fetchWithAuth<TodayChallengeResponse>('/challenges/today');
  }

  async completeChallenge(score: number): Promise<CompleteChallengeResponse> {
    return this.fetchWithAuth<CompleteChallengeResponse>('/challenges/complete', {
      method: 'POST',
      body: JSON.stringify({ score }),
    });
  }

  async getChallengeHistory(limit?: number): Promise<{ challenges: DailyChallenge[] }> {
    const url = limit ? `/challenges/history?limit=${limit}` : '/challenges/history';
    return this.fetchWithAuth<{ challenges: DailyChallenge[] }>(url);
  }

  async getStreak(): Promise<{ streak: number; bestScore: number }> {
    return this.fetchWithAuth<{ streak: number; bestScore: number }>('/challenges/streak');
  }

  // Migration endpoints
  async importData(data: { settings?: UserSettings; stats?: UserStats }): Promise<{
    message: string;
    settings: UserSettings | null;
    stats: UserStats | null;
  }> {
    return this.fetchWithAuth('/migrate/import', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async exportData(): Promise<{ settings: UserSettings; stats: UserStats }> {
    return this.fetchWithAuth('/migrate/export');
  }

  // Quiz & Study Result methods
  async saveQuizResult(data: SaveQuizResultRequest): Promise<{ success: boolean; resultId: number }> {
    return this.fetchWithAuth<{ success: boolean; resultId: number }>('/quiz-results', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async saveStudySession(data: SaveStudySessionRequest): Promise<{ success: boolean; sessionId: number }> {
    return this.fetchWithAuth<{ success: boolean; sessionId: number }>('/study-stats', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }



  async getAdminUsers(): Promise<AdminUserStats[]> {
    return this.fetchWithAuth<AdminUserStats[]>('/admin/users');
  }

  async getAdminUserDetails(userId: number): Promise<AdminUserDetails> {
    return this.fetchWithAuth<AdminUserDetails>(`/admin/users/${userId}/details`);
  }

  async updateUserRole(userId: number, role: 'student' | 'parent' | 'admin'): Promise<void> {
    return this.fetchWithAuth<void>(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role })
    });
  }

  async updateUserParent(userId: number, parentId: number | null): Promise<void> {
    return this.fetchWithAuth<void>(`/admin/users/${userId}/parent`, {
      method: 'PATCH',
      body: JSON.stringify({ parentId })
    });
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error('Health check failed');
    }
    return response.json();
  }
}

// Singleton instance
export const ApiService = new ApiServiceClass();
export default ApiService;
