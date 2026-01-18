import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { AppState, AppMode, UserSettings, UserStats, VocabularyWord } from '../types';
import { StorageService } from '../services/StorageService';
import ApiService from '../services/ApiService';
import wordsData from '../assets/words.json';

// Actions
type AppAction =
  | { type: 'SET_MODE'; payload: AppMode }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<UserSettings> }
  | { type: 'UPDATE_STATS'; payload: Partial<UserStats> }
  | { type: 'LOAD_USER_DATA'; payload: { settings: UserSettings; stats: UserStats } }
  | { type: 'SET_SYNCING'; payload: boolean };

// Extended state for sync status
interface ExtendedAppState extends AppState {
  isSyncing: boolean;
}

// Initial state
const initialState: ExtendedAppState = {
  currentMode: 'dashboard',
  settings: StorageService.getSettings(),
  stats: StorageService.getStats(),
  isSyncing: false,
};

// Reducer
function appReducer(state: ExtendedAppState, action: AppAction): ExtendedAppState {
  switch (action.type) {
    case 'SET_MODE':
      return { ...state, currentMode: action.payload };

    case 'UPDATE_SETTINGS': {
      const newSettings = { ...state.settings, ...action.payload };
      // Always save to localStorage as fallback
      StorageService.saveSettings(newSettings);
      return { ...state, settings: newSettings };
    }

    case 'UPDATE_STATS': {
      const newStats = { ...state.stats, ...action.payload };
      // Always save to localStorage as fallback
      StorageService.saveStats(newStats);
      return { ...state, stats: newStats };
    }

    case 'LOAD_USER_DATA':
      return {
        ...state,
        settings: action.payload.settings,
        stats: action.payload.stats,
      };

    case 'SET_SYNCING':
      return { ...state, isSyncing: action.payload };

    default:
      return state;
  }
}

// Context type
interface AppContextType {
  state: ExtendedAppState;
  dispatch: React.Dispatch<AppAction>;
  vocabulary: VocabularyWord[];
  setMode: (mode: AppMode) => void;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  updateStats: (stats: Partial<UserStats>) => Promise<void>;
  loadUserData: () => Promise<void>;
  isAuthenticated: boolean;
}

// Create context
const AppContext = createContext<AppContextType | null>(null);

// Provider component
interface AppProviderProps {
  children: ReactNode;
  isAuthenticated?: boolean;
}

export function AppProvider({ children, isAuthenticated = false }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load vocabulary data
  const vocabulary = wordsData as VocabularyWord[];

  // Load user data from API when authenticated
  const loadUserData = useCallback(async () => {
    if (!isAuthenticated || !ApiService.hasTokens()) {
      return;
    }

    dispatch({ type: 'SET_SYNCING', payload: true });
    try {
      const [settings, stats] = await Promise.all([
        ApiService.getSettings(),
        ApiService.getStats(),
      ]);

      dispatch({
        type: 'LOAD_USER_DATA',
        payload: { settings, stats },
      });

      // Also update localStorage as cache
      StorageService.saveSettings(settings);
      StorageService.saveStats(stats);
    } catch (error) {
      console.error('Failed to load user data from API:', error);
      // Fall back to localStorage data (already in state)
    } finally {
      dispatch({ type: 'SET_SYNCING', payload: false });
    }
  }, [isAuthenticated]);

  // Load user data when authentication changes
  useEffect(() => {
    if (isAuthenticated) {
      loadUserData();
    }
  }, [isAuthenticated, loadUserData]);

  // Helper function to set mode
  const setMode = useCallback((mode: AppMode) => {
    dispatch({ type: 'SET_MODE', payload: mode });
  }, []);

  // Update settings with API sync
  const updateSettings = useCallback(async (settings: Partial<UserSettings>) => {
    // Optimistically update local state
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });

    // Sync to API if authenticated
    if (isAuthenticated && ApiService.hasTokens()) {
      try {
        await ApiService.updateSettings(settings);
      } catch (error) {
        console.error('Failed to sync settings to API:', error);
        // Local state is already updated, so we don't need to do anything
      }
    }
  }, [isAuthenticated]);

  // Update stats with API sync
  const updateStats = useCallback(async (stats: Partial<UserStats>) => {
    // Optimistically update local state
    dispatch({ type: 'UPDATE_STATS', payload: stats });

    // Sync to API if authenticated
    if (isAuthenticated && ApiService.hasTokens()) {
      try {
        await ApiService.updateStats(stats);
      } catch (error) {
        console.error('Failed to sync stats to API:', error);
        // Local state is already updated, so we don't need to do anything
      }
    }
  }, [isAuthenticated]);

  const value: AppContextType = {
    state,
    dispatch,
    vocabulary,
    setMode,
    updateSettings,
    updateStats,
    loadUserData,
    isAuthenticated,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Custom hook to use context
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
