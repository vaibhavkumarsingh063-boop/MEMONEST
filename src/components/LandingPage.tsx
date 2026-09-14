import React from 'react';
import {
  Brain,
  Sparkles,
  Heart,
  ShieldCheck,
  ArrowRight,
  LogIn,
  UserPlus,
  Users,
  Mic,
  Smile,
  CheckCircle2,
} from 'lucide-react';

interface LandingPageProps {
  onNavigateToSignup: () => void;
  onNavigateToLogin: () => void;
  onQuickDemoLogin?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigateToSignup,
  onNavigateToLogin,
  onQuickDemoLogin,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 via-teal-50/30 to-stone-100 flex flex-col text-stone-800">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-700 to-emerald-600 flex items-center justify-center text-white shadow-sm ring-2 ring-teal-600/20">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 font-serif">
                  MemoryMate AI
                </span>
                <span className="px-2 py-0.5 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-teal-800 bg-teal-100/90 rounded-full">
                  Cognitive Companion
                </span>
              </div>
              <p className="text-xs text-stone-700 hidden sm:block">
                Personalized Memory & Recall Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onNavigateToLogin}
              id="landing-login-nav-btn"
              className="px-4 py-2 text-sm font-medium text-stone-700 hover:text-teal-800 hover:bg-stone-100 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </button>
            <button
              onClick={onNavigateToSignup}
              id="landing-signup-nav-btn"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 active:bg-teal-900 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Get Started</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 flex flex-col justify-center">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs sm:text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span>Gentle, Dignified Cognitive Care for Daily Living</span>
          </div>

          {/* Logo & Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-stone-900 font-serif leading-[1.15]">
            MemoryMate AI
          </h1>

          {/* Tagline */}
          <p className="mt-4 text-xl sm:text-2xl font-medium text-teal-800 tracking-tight">
            “Your Personal AI Memory & Recall Companion”
          </p>

          {/* Brief Explanation */}
          <p className="mt-6 text-base sm:text-lg text-stone-700 leading-relaxed max-w-2xl mx-auto">
            A welcoming cognitive engagement platform designed to evaluate and gently strengthen
            memory and recall ability through personalized daily exercises, cherished family
            memories, and spoken audio reminiscence.
          </p>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4">
            <button
              onClick={onNavigateToSignup}
              id="landing-hero-get-started-btn"
              className="w-full sm:w-auto px-8 py-3.5 bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white font-semibold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-base cursor-pointer hover:shadow-lg hover:-translate-y-0.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={onNavigateToLogin}
              id="landing-hero-login-btn"
              className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-stone-100 text-stone-800 font-semibold border border-stone-300 rounded-2xl shadow-xs transition-colors flex items-center justify-center gap-2 text-base cursor-pointer"
            >
              <LogIn className="w-5 h-5 text-teal-700" />
              <span>Login to Account</span>
            </button>
          </div>

          {/* Quick Demo Helper */}
          {onQuickDemoLogin && (
            <div className="mt-6">
              <button
                onClick={onQuickDemoLogin}
                className="text-xs text-stone-700 hover:text-teal-800 underline underline-offset-4 cursor-pointer"
              >
                Quick Preview with Demo User (Rahul Sharma)
              </button>
            </div>
          )}
        </div>

        {/* Core Value Pillars Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/95 rounded-2xl p-6 border border-stone-200 shadow-xs hover:border-teal-200 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-4">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-stone-900 mb-2 font-serif">
              Tailored Memory Exercises
            </h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              Personalized cognitive quizzes created from your real-life routines, hobbies, and
              favorite places to keep your neural pathways active and refreshed.
            </p>
          </div>

          <div className="bg-white/95 rounded-2xl p-6 border border-stone-200 shadow-xs hover:border-teal-200 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-stone-900 mb-2 font-serif">
              Cherished Family Connection
            </h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              Stay deeply connected with loved ones through customized photo prompts, milestone
              reminders, and questions authored directly by family members.
            </p>
          </div>

          <div className="bg-white/95 rounded-2xl p-6 border border-stone-200 shadow-xs hover:border-teal-200 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4">
              <Mic className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-stone-900 mb-2 font-serif">
              Voice & Audio Reminiscence
            </h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              Answer questions using your voice if typing feels difficult, record spoken life stories,
              and listen to calming memory reflections.
            </p>
          </div>
        </div>

        {/* Reassurance Banner */}
        <div className="mt-12 bg-teal-900 text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-teal-800 rounded-xl shrink-0">
              <ShieldCheck className="w-6 h-6 text-teal-200" />
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-bold">Privacy-First & Dignified</h4>
              <p className="text-xs sm:text-sm text-teal-100 mt-1">
                Your personal memories, names, and routine answers belong strictly to you.
                Passwords are encrypted with industry-standard cryptographic hashing.
              </p>
            </div>
          </div>
          <button
            onClick={onNavigateToSignup}
            className="whitespace-nowrap px-6 py-2.5 bg-white text-teal-900 hover:bg-stone-100 font-semibold rounded-xl text-sm transition-colors cursor-pointer"
          >
            Create Your Profile
          </button>
        </div>
      </main>

      {/* Persistent Footer */}
      <footer className="border-t border-stone-200 bg-white/70 py-6 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 MemoryMate AI • Personalized Memory & Recall Platform</p>
          <p className="text-stone-400">Non-clinical cognitive wellness and memory engagement tool</p>
        </div>
      </footer>
    </div>
  );
};
