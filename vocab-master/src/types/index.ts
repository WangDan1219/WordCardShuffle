export * from './vocabulary';
export * from './quiz';
export * from './storage';

export type AppMode = 'dashboard' | 'study' | 'quiz' | 'challenge' | 'parent' | 'admin';

export interface AppState {
  currentMode: AppMode;
  settings: import('./storage').UserSettings;
  stats: import('./storage').UserStats;
}

export interface User {
  id: number;
  username: string;
  displayName: string | null;
  role: 'student' | 'parent' | 'admin';
  createdAt: string;
}
