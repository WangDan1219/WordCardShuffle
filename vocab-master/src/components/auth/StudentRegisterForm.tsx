import React, { useState } from 'react';
import { Eye, EyeOff, UserPlus, Loader2, ArrowLeft, GraduationCap } from 'lucide-react';

interface StudentRegisterFormProps {
  onSubmit: (username: string, password: string, displayName?: string) => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
  error: string | null;
}

export function StudentRegisterForm({ onSubmit, onBack, isLoading, error }: StudentRegisterFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validate = (): boolean => {
    if (username.length < 3) {
      setValidationError('Username must be at least 3 characters');
      return false;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setValidationError('Username can only contain letters, numbers, underscores, and hyphens');
      return false;
    }
    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return false;
    }
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return false;
    }
    setValidationError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(username.trim(), password, displayName.trim() || undefined);
  };

  const displayedError = validationError || error;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Header */}
      <div className="text-center mb-4">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-xl mb-3">
          <GraduationCap className="w-6 h-6 text-indigo-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Student Account</h2>
        <p className="text-sm text-gray-500">Simple sign-up, no email needed!</p>
      </div>

      <div>
        <label htmlFor="student-username" className="block text-sm font-medium text-gray-700 mb-2">
          Username
        </label>
        <input
          id="student-username"
          type="text"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setValidationError(null);
          }}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          placeholder="Pick a cool username"
          disabled={isLoading}
          autoComplete="username"
          autoFocus
        />
        <p className="mt-1 text-xs text-gray-500">
          3-30 characters, letters, numbers, underscores, hyphens
        </p>
      </div>

      <div>
        <label htmlFor="student-display-name" className="block text-sm font-medium text-gray-700 mb-2">
          Your Name <span className="text-gray-400">(optional)</span>
        </label>
        <input
          id="student-display-name"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          placeholder="What's your name?"
          disabled={isLoading}
          autoComplete="name"
        />
      </div>

      <div>
        <label htmlFor="student-password" className="block text-sm font-medium text-gray-700 mb-2">
          Password
        </label>
        <div className="relative">
          <input
            id="student-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setValidationError(null);
            }}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all pr-12"
            placeholder="Create a secret password"
            disabled={isLoading}
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500">At least 6 characters</p>
      </div>

      <div>
        <label htmlFor="student-confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
          Confirm Password
        </label>
        <input
          id="student-confirm-password"
          type={showPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setValidationError(null);
          }}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          placeholder="Type your password again"
          disabled={isLoading}
          autoComplete="new-password"
        />
      </div>

      {displayedError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {displayedError}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || !username.trim() || !password.trim() || !confirmPassword.trim()}
        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Creating account...
          </>
        ) : (
          <>
            <UserPlus size={20} />
            Create Account
          </>
        )}
      </button>

      <div className="text-center pt-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 font-medium transition-colors"
          disabled={isLoading}
        >
          <ArrowLeft size={18} />
          Back
        </button>
      </div>
    </form>
  );
}

export default StudentRegisterForm;
