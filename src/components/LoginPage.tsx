import React, { useState } from 'react';
import {
  Brain,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  X,
} from 'lucide-react';
import { authApi } from '../utils/authApi';
import { UserAccount } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: UserAccount) => void;
  onNavigateToSignup: () => void;
  onNavigateToLanding: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onNavigateToSignup,
  onNavigateToLanding,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password modal state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await authApi.login({
        email: email.trim().toLowerCase(),
        password,
        rememberMe,
      });

      // Pass authenticated user object to parent handler
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoFill = (type: 'complete' | 'new') => {
    if (type === 'complete') {
      setEmail('rahul@memorymate.ai');
      setPassword('password123');
      setError(null);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;

    try {
      setForgotLoading(true);
      setForgotMessage(null);
      const res = await authApi.forgotPassword(forgotEmail.trim().toLowerCase());
      setForgotMessage(res.message);
    } catch (err: any) {
      setForgotMessage(err.message || 'No account found with this email.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100/80 flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <button
          onClick={onNavigateToLanding}
          className="inline-flex items-center gap-2.5 group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-2xl bg-teal-700 flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
            <Brain className="w-7 h-7" />
          </div>
          <span className="text-2xl font-bold font-serif tracking-tight text-stone-900">
            MemoryMate AI
          </span>
        </button>
        <h2 className="mt-4 text-2xl sm:text-3xl font-bold text-stone-900 font-serif">
          Welcome back
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          Sign in to access your personalized memory companion
        </p>
      </div>

      {/* Form Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-sm border border-stone-200 rounded-3xl">
          {error && (
            <div
              id="login-error-alert"
              className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
              <div className="leading-snug">{error}</div>
            </div>
          )}

          {/* Quick Demo Assist Banner */}
          <div className="mb-5 p-3 rounded-xl bg-teal-50/80 border border-teal-200/80 flex items-center justify-between text-xs text-teal-900">
            <span>Try sample account:</span>
            <button
              type="button"
              onClick={() => handleQuickDemoFill('complete')}
              className="font-semibold text-teal-800 hover:text-teal-950 underline cursor-pointer"
            >
              Fill Demo (Rahul)
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Address */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-sm font-semibold text-stone-800 mb-1"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="login-password"
                  className="block text-sm font-semibold text-stone-800"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setForgotMessage(null);
                    setIsForgotModalOpen(true);
                  }}
                  className="text-xs font-semibold text-teal-800 hover:text-teal-900 hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-11 pr-11 py-3 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Session Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-teal-700 rounded border-stone-300 focus:ring-teal-500"
                />
                <span className="text-sm text-stone-700">Remember session</span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                id="login-submit-btn"
                disabled={isLoading}
                className="w-full py-3.5 px-4 bg-teal-700 hover:bg-teal-800 active:bg-teal-900 disabled:bg-teal-400 text-white font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer text-base"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Login</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Switch to Signup */}
          <div className="mt-6 text-center border-t border-stone-200 pt-5">
            <p className="text-sm text-stone-600">
              Don't have an account yet?{' '}
              <button
                onClick={onNavigateToSignup}
                id="login-switch-to-signup"
                className="font-semibold text-teal-800 hover:text-teal-900 hover:underline cursor-pointer"
              >
                Sign up here
              </button>
            </p>
          </div>
        </div>

        {/* Back to landing */}
        <div className="mt-4 text-center">
          <button
            onClick={onNavigateToLanding}
            className="text-xs text-stone-500 hover:text-stone-800 cursor-pointer"
          >
            ← Back to MemoryMate AI Landing Page
          </button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-xl border border-stone-200 relative">
            <button
              onClick={() => setIsForgotModalOpen(false)}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4">
              <KeyRound className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold font-serif text-stone-900">Reset Password</h3>
            <p className="text-sm text-stone-600 mt-1">
              Enter your registered email address to receive password recovery assistance.
            </p>

            {forgotMessage ? (
              <div className="mt-4 p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-sm">
                <div className="flex items-center gap-2 font-semibold mb-1 text-teal-800">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span>Recovery Instructions</span>
                </div>
                <p>{forgotMessage}</p>
                <div className="mt-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="w-full py-2 bg-teal-700 text-white rounded-xl text-sm font-semibold hover:bg-teal-800 cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="px-4 py-2 border border-stone-300 rounded-xl text-sm text-stone-700 hover:bg-stone-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    {forgotLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Send Recovery Code'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
