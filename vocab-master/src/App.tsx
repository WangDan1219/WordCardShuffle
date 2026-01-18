import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AppProvider, useApp } from './contexts/AppContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthPage } from './components/auth';
import { Dashboard } from './components/dashboard';
import { StudyMode } from './components/study';
import { QuizMode } from './components/quiz';
import { DailyChallenge } from './components/challenge';
import { ParentDashboard } from './components/parent';
import { AdminPanel } from './components/admin';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { state } = useApp();

  // Handle keyboard navigation for Study Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keys when in study mode
      if (state.currentMode !== 'study') return;

      // These keys will be handled by the StudyMode component
      // This is just to prevent default browser behavior
      if (['ArrowLeft', 'ArrowRight', ' ', 'Enter'].includes(e.key)) {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.currentMode]);

  return (
    <div className="min-h-screen">
      <AnimatePresence mode="wait">
        <motion.div
          key={state.currentMode}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {state.currentMode === 'dashboard' && <Dashboard />}
          {state.currentMode === 'study' && <StudyMode />}
          {state.currentMode === 'quiz' && <QuizMode />}
          {state.currentMode === 'challenge' && <DailyChallenge />}
          {state.currentMode === 'parent' && <ParentDashboard />}
          {state.currentMode === 'admin' && <AdminPanel />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function AuthenticatedApp() {
  const { state: authState } = useAuth();

  // Show loading state while checking authentication
  if (authState.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth page if not authenticated
  if (!authState.isAuthenticated) {
    return <AuthPage />;
  }

  // Show main app if authenticated
  return (
    <AppProvider isAuthenticated={authState.isAuthenticated}>
      <AppContent />
    </AppProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

export default App;
