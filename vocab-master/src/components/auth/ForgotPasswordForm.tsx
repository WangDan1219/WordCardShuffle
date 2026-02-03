import React, { useState } from 'react';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';

interface ForgotPasswordFormProps {
  onSubmit: (email: string) => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
  error: string | null;
}

export function ForgotPasswordForm({ onSubmit, onBack, isLoading, error }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validate = (): boolean => {
    if (!email.trim()) {
      setValidationError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setValidationError('Please enter a valid email address');
      return false;
    }
    setValidationError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await onSubmit(email.trim());
      setSubmitted(true);
    } catch {
      // Error is handled by parent
    }
  };

  const displayedError = validationError || error;

  // Success state
  if (submitted) {
    return (
      <div className="text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Check Your Email</h2>
          <p className="text-gray-600">
            If an account exists with <span className="font-medium">{email}</span>, we've sent password reset instructions.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
          <p>Don't see the email? Check your spam folder.</p>
        </div>

        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
        >
          <ArrowLeft size={18} />
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="text-center mb-4">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-xl mb-3">
          <Mail className="w-6 h-6 text-indigo-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Forgot Password?</h2>
        <p className="text-sm text-gray-500">No worries! Enter your email and we'll send you reset instructions.</p>
      </div>

      <div>
        <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 mb-2">
          Email Address
        </label>
        <input
          id="forgot-email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setValidationError(null);
          }}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          placeholder="your.email@example.com"
          disabled={isLoading}
          autoComplete="email"
          autoFocus
        />
      </div>

      {displayedError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {displayedError}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || !email.trim()}
        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Mail size={20} />
            Send Reset Link
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
          Back to sign in
        </button>
      </div>

      <div className="text-center text-xs text-gray-500 pt-2">
        <p>Only parent accounts have email-based password recovery.</p>
        <p>Students should ask their parent to reset their password.</p>
      </div>
    </form>
  );
}

export default ForgotPasswordForm;
