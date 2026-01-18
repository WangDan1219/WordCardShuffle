export * from './vocabulary';
export * from './quiz';
export * from './storage';

export type AppMode = 'dashboard' | 'study' | 'quiz' | 'challenge';

export interface AppState {
  currentMode: AppMode;
  settings: import('./storage').UserSettings;
  stats: import('./storage').UserStats;
}
