import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

type AuthMode = 'login' | 'register';

interface LocationState {
  from?: {
    pathname: string;
  };
}

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const { state, login, register, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the intended destination from location state
  const locationState = location.state as LocationState | null;
  const from = locationState?.from?.pathname;

  // Redirect after successful authentication
  useEffect(() => {
    if (state.isAuthenticated && state.user) {
      // If there's a saved destination, go there
      if (from && from !== '/login') {
        navigate(from, { replace: true });
        return;
      }

      // Otherwise, redirect based on user role
      const role = state.user.role;
      switch (role) {
        case 'parent':
          navigate('/parent', { replace: true });
          break;
        case 'admin':
          navigate('/admin', { replace: true });
          break;
        default:
          navigate('/', { replace: true });
      }
    }
  }, [state.isAuthenticated, state.user, from, navigate]);

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4 background-pattern">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-3xl mb-4 shadow-xl rotate-3"
          >
            <BookOpen size={40} className="text-indigo-600 drop-shadow-sm" strokeWidth={2.5} />
          </motion.div>
          <h1 className="text-3xl font-black text-white mb-2 drop-shadow-md tracking-tight">
            Vocabulary Master
          </h1>
          <p className="text-indigo-100 font-medium text-lg">
            {mode === 'login'
              ? 'Welcome back, superstar! 🌟'
              : 'Join the fun! 🚀'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white/95 backdrop-blur-xl border-2 border-white/50 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          {/* Decorative blobs */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>

          <div className="relative z-10">
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
        </div>

        {/* Footer */}
        <p className="text-center text-indigo-100 text-sm mt-8 font-medium opacity-80">
          Your progress is saved automatically and synced across devices.
        </p>
      </motion.div>
    </div>
  );
}

export default AuthPage;
