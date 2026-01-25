import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Brain, Trophy, Volume2, VolumeX } from 'lucide-react';
import { ModeCard } from './ModeCard';
import { UserMenu } from '../common/UserMenu';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAudio } from '../../hooks/useAudio';
import { StorageService } from '../../services/StorageService';

export function Dashboard() {
  const { vocabulary, state } = useApp();
  const { state: authState } = useAuth();
  const { soundEnabled, toggleSound, playClick } = useAudio();
  const navigate = useNavigate();

  const hasTodayChallenge = StorageService.hasTodayChallenge();
  const userRole = authState.user?.role || 'student';

  const handleModeSelect = (mode: 'study' | 'quiz' | 'challenge') => {
    playClick();
    navigate(`/${mode}`);
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] background-pattern">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-md border-b border-primary-100 sticky top-0 z-10"
      >
        <div className="max-w-xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary-100 p-2 rounded-2xl">
                <BookOpen className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h1 className="text-xl font-black text-primary-900 tracking-tight">
                  Vocabulary Master
                </h1>
                <p className="text-xs text-primary-600 font-bold bg-primary-50 px-2 py-0.5 rounded-full inline-block mt-1">
                  {vocabulary.length} words
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Sound toggle */}
              <button
                onClick={toggleSound}
                className={`
                  p-3 rounded-full cursor-pointer
                  bg-white border-2 border-primary-100
                  text-primary-500 hover:text-primary-700 hover:border-primary-300
                  hover:bg-primary-50
                  transition-all duration-200
                  active:scale-95
                `}
                aria-label={soundEnabled ? 'Mute sounds' : 'Unmute sounds'}
              >
                {soundEnabled ? (
                  <Volume2 className="w-5 h-5" />
                ) : (
                  <VolumeX className="w-5 h-5" />
                )}
              </button>

              <UserMenu />
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main content */}
      <main className="max-w-xl mx-auto px-4 py-6 pb-20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="space-y-5"
        >
          {/* Greeting */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-primary-100 relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-2xl font-black text-primary-900 mb-1">
                Hi, {authState.user?.displayName || authState.user?.username}! 👋
              </h2>
              {userRole === 'student' ? (
                <p className="text-primary-600 font-medium">Ready to learn some new words?</p>
              ) : (
                <p className="text-primary-600 font-medium">Welcome to your dashboard.</p>
              )}
            </div>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary-100 rounded-full opacity-50 blur-xl"></div>
          </div>

          {/* Role-based Content */}
          {userRole === 'admin' ? (
            <ModeCard
              title="Admin Panel"
              description="Manage users and system settings"
              icon={Brain} // Using Brain mostly for placeholder, effectively replaces "AdminDashboard"
              color="quiz" // Re-using Quiz color style (Amber) for Admin
              onClick={() => navigate('/admin')}
            />
          ) : userRole === 'parent' ? (
            <ModeCard
              title="Parent Dashboard"
              description="View your children's progress"
              icon={Trophy} // Re-using Trophy
              color="challenge" // Re-using Challenge color style (Red/Rose)
              onClick={() => navigate('/parent')}
            />
          ) : (
            // Student Content
            <>
              {/* Study Mode */}
              <ModeCard
                title="Study Mode"
                description="Flip cards & learn"
                icon={BookOpen}
                color="study"
                onClick={() => handleModeSelect('study')}
              />

              {/* Quiz Mode */}
              <ModeCard
                title="Quiz Mode"
                description="Test your knowledge"
                icon={Brain}
                color="quiz"
                onClick={() => handleModeSelect('quiz')}
              />

              {/* Daily Challenge */}
              <ModeCard
                title="Daily Challenge"
                description="Beat the clock!"
                icon={Trophy}
                color="challenge"
                onClick={() => handleModeSelect('challenge')}
                badge={hasTodayChallenge ? 'Done!' : 'New!'}
              />
            </>
          )}

        </motion.div>

        {/* Stats summary - Only for Students */}
        {userRole === 'student' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 p-6 bg-white rounded-3xl border-2 border-primary-100/50 shadow-xl shadow-primary-100/50"
          >
            <h2 className="text-sm font-black text-primary-400 uppercase tracking-widest mb-4 text-center">
              Your Super Stats
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {/* Words Studied */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-study-light flex items-center justify-center mb-2 text-study-dark">
                  <BookOpen size={20} strokeWidth={3} />
                </div>
                <p className="text-2xl font-black text-gray-800">
                  {state.stats.totalWordsStudied}
                </p>
                <p className="text-xs text-gray-500 font-bold">Studied</p>
              </div>
              {/* Quizzes Taken */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-quiz-light flex items-center justify-center mb-2 text-quiz-dark">
                  <Brain size={20} strokeWidth={3} />
                </div>
                <p className="text-2xl font-black text-gray-800">
                  {state.stats.quizzesTaken}
                </p>
                <p className="text-xs text-gray-500 font-bold">Quizzes</p>
              </div>
              {/* Best Score */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-challenge-light flex items-center justify-center mb-2 text-challenge-dark">
                  <Trophy size={20} strokeWidth={3} />
                </div>
                <p className="text-2xl font-black text-gray-800">
                  {state.stats.bestChallengeScore}
                </p>
                <p className="text-xs text-gray-500 font-bold">Best Score</p>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
