import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

type AuthMode = 'login' | 'register';

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const { state, login, register, clearError } = useAuth();

  const handleLogin = async (username: string, password: string) => {
    await login(username, password);
  };

  const handleRegister = async (username: string, password: string, displayName?: string) => {
    await register(username, password, displayName);
  };

  const switchMode = (newMode: AuthMode) => {
    clearError();
    setMode(newMode);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4">
            <BookOpen size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            11+ Vocabulary Master
          </h1>
          <p className="text-gray-400">
            {mode === 'login'
              ? 'Welcome back! Sign in to continue learning.'
              : 'Create an account to track your progress.'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 shadow-xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: mode === 'login' ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === 'login' ? 20 : -20 }}
              transition={{ duration: 0.2 }}
            >
              {mode === 'login' ? (
                <LoginForm
                  onSubmit={handleLogin}
                  onSwitchToRegister={() => switchMode('register')}
                  isLoading={state.isLoading}
                  error={state.error}
                />
              ) : (
                <RegisterForm
                  onSubmit={handleRegister}
                  onSwitchToLogin={() => switchMode('login')}
                  isLoading={state.isLoading}
                  error={state.error}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Your progress is saved automatically and synced across devices.
        </p>
      </motion.div>
    </div>
  );
}

export default AuthPage;
