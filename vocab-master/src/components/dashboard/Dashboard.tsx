import { motion } from 'framer-motion';
import { BookOpen, Brain, Trophy, Volume2, VolumeX } from 'lucide-react';
import { ModeCard } from './ModeCard';
import { UserMenu } from '../common/UserMenu';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAudio } from '../../hooks/useAudio';
import { StorageService } from '../../services/StorageService';

export function Dashboard() {
  const { setMode, vocabulary, state } = useApp();
  const { state: authState } = useAuth();
  const { soundEnabled, toggleSound, playClick } = useAudio();

  const hasTodayChallenge = StorageService.hasTodayChallenge();

  const handleModeSelect = (mode: 'study' | 'quiz' | 'challenge') => {
    playClick();
    setMode(mode);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-sm"
      >
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                11+ Vocabulary Master
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {vocabulary.length} words to master
              </p>
            </div>

            {/* Sound toggle */}
            <button
              onClick={toggleSound}
              className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label={soundEnabled ? 'Mute sounds' : 'Unmute sounds'}
            >
              {soundEnabled ? (
                <Volume2 className="w-5 h-5 text-gray-700" />
              ) : (
                <VolumeX className="w-5 h-5 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* User Menu - Fixed at top right for Dashboard */}
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
          {authState.user?.role === 'parent' && (
            <button
              onClick={() => setMode('parent')}
              className="px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              Parent Dashboard
            </button>
          )}
          {authState.user?.role === 'admin' && (
            <button
              onClick={() => setMode('admin')}
              className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              Admin Panel
            </button>
          )}
          <UserMenu />
        </div>
      </motion.header>

      {/* Main content */}
      <main className="max-w-lg mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          {/* Study Mode */}
          <ModeCard
            title="Study Mode"
            description="Flip through flashcards to memorize vocabulary"
            icon={BookOpen}
            color="study"
            onClick={() => handleModeSelect('study')}
          />

          {/* Quiz Mode */}
          <ModeCard
            title="Quiz Mode"
            description="Test yourself with customizable quizzes"
            icon={Brain}
            color="quiz"
            onClick={() => handleModeSelect('quiz')}
          />

          {/* Daily Challenge */}
          <ModeCard
            title="Daily Challenge"
            description="20 questions, timed, mixed formats"
            icon={Trophy}
            color="challenge"
            onClick={() => handleModeSelect('challenge')}
            badge={hasTodayChallenge ? 'Completed' : 'New'}
          />
        </motion.div>

        {/* Stats summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 p-4 bg-white rounded-2xl shadow-card"
        >
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Your Progress
          </h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {state.stats.totalWordsStudied}
              </p>
              <p className="text-xs text-gray-500">Words Studied</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {state.stats.quizzesTaken}
              </p>
              <p className="text-xs text-gray-500">Quizzes Taken</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {state.stats.bestChallengeScore}
              </p>
              <p className="text-xs text-gray-500">Best Score</p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
