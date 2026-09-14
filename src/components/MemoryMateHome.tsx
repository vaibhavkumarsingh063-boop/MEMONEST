import React from 'react';
import {
  Brain,
  Sparkles,
  Play,
  Heart,
  Calendar,
  BarChart3,
  Mic,
  Users,
  UserCheck,
  MapPin,
  Bookmark,
  CheckCircle2,
  LogOut,
  Pencil,
  ArrowRight,
  ShieldCheck,
  Layers,
  Plus,
} from 'lucide-react';
import { UserAccount } from '../types';

interface MemoryMateHomeProps {
  user: UserAccount;
  onStartQuiz: () => void;
  onNavigateTab: (tab: string) => void;
  onEditProfile: () => void;
  onLogout: () => void;
  onCreateCustomQuiz?: () => void;
}

export const MemoryMateHome: React.FC<MemoryMateHomeProps> = ({
  user,
  onStartQuiz,
  onNavigateTab,
  onEditProfile,
  onLogout,
  onCreateCustomQuiz,
}) => {
  const navPlaceholders = [
    {
      id: 'home',
      label: 'Home',
      icon: Brain,
      desc: 'Personalized cognitive overview & quick actions',
      active: true,
    },
    {
      id: 'quiz',
      label: 'Daily Quiz',
      icon: Sparkles,
      desc: 'Adaptive recall exercises tailored to your profile',
      badge: 'Ready',
    },
    {
      id: 'custom-quizzes',
      label: 'Custom Quizzes',
      icon: Layers,
      desc: 'Build custom memory quizzes with personal photos & AI',
      badge: 'New',
    },
    {
      id: 'dashboard',
      label: 'Memory Dashboard',
      icon: BarChart3,
      desc: 'Cognitive retention trends & recall stability score',
    },
    {
      id: 'story',
      label: 'Record Story',
      icon: Mic,
      desc: 'Voice reminiscence & automatic memory extraction',
    },
    {
      id: 'family',
      label: 'Family',
      icon: Users,
      desc: 'Family member connections, photos & custom prompts',
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: UserCheck,
      desc: 'Personal information, daily routine & preferences',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner Card */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-900 to-emerald-900 rounded-3xl p-6 sm:p-10 text-white shadow-md relative overflow-hidden">
        {/* Soft decorative background circles */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-teal-700/20 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 -mb-16 w-48 h-48 rounded-full bg-emerald-600/20 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            {/* User Profile Picture */}
            <div className="relative">
              <img
                src={
                  user.profilePicture ||
                  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80'
                }
                alt={user.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-4 ring-teal-400/40 shadow-lg"
              />
              <span className="absolute bottom-0 right-0 transform translate-x-1 translate-y-1 w-6 h-6 bg-emerald-400 border-2 border-teal-900 rounded-full flex items-center justify-center text-teal-950 text-xs font-bold">
                ✓
              </span>
            </div>

            {/* Welcome & Info */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-700/60 border border-teal-500/40 text-teal-200 text-xs font-semibold uppercase tracking-wider mb-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-300" />
                <span>Profile Complete & Verified</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-bold font-serif tracking-tight">
                Welcome to MemoryMate, {user.name}!
              </h1>
              <p className="mt-2 text-teal-100 text-sm sm:text-base max-w-xl leading-relaxed">
                Your personalized memory exercises are ready. We have calibrated your recall companion
                around your favorite activities, cherished routines, and familiar places.
              </p>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="flex flex-col sm:flex-row md:flex-col items-center gap-3 shrink-0 w-full md:w-auto">
            <button
              onClick={onStartQuiz}
              id="start-first-memory-quiz-btn"
              className="w-full sm:w-auto px-8 py-4 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 text-base sm:text-lg cursor-pointer transform hover:-translate-y-0.5"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Start Your First Memory Quiz</span>
            </button>
            {onCreateCustomQuiz && (
              <button
                onClick={onCreateCustomQuiz}
                className="w-full sm:w-auto px-6 py-2.5 bg-teal-700/80 hover:bg-teal-700 text-white font-bold rounded-xl border border-teal-500/40 shadow-xs transition-all flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Create Custom Quiz</span>
              </button>
            )}
            <button
              onClick={onEditProfile}
              className="px-4 py-2 text-xs font-semibold text-teal-200 hover:text-white flex items-center gap-1.5 underline cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Setup Preferences</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Placeholders Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold font-serif text-stone-900">
              Platform Modules & Navigation
            </h2>
            <p className="text-xs sm:text-sm text-stone-500">
              Explore your cognitive engagement modules or jump directly into practice.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {navPlaceholders.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => onNavigateTab(item.id)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer group ${
                  item.active
                    ? 'bg-teal-50/70 border-teal-300 ring-1 ring-teal-200'
                    : 'bg-white border-stone-200 hover:border-teal-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                      item.active
                        ? 'bg-teal-700 text-white'
                        : 'bg-stone-100 text-teal-800 group-hover:bg-teal-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-stone-900 group-hover:text-teal-900 font-serif text-base">
                  {item.label}
                </h3>
                <p className="text-xs text-stone-500 mt-1 leading-snug">{item.desc}</p>
                <div className="mt-3 flex items-center text-xs font-semibold text-teal-800 group-hover:translate-x-1 transition-transform">
                  <span>Open Module</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Profile Snapshot Summary */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-stone-200 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-serif text-stone-900">
                Personalized Memory Profile
              </h3>
              <p className="text-xs text-stone-500">
                Information saved during setup used for customized quiz generation.
              </p>
            </div>
          </div>
          <button
            onClick={onEditProfile}
            className="text-xs font-semibold text-teal-800 hover:text-teal-950 px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Favorite Activities */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-800 mb-2">
              <Heart className="w-4 h-4 text-teal-600" />
              <span>Favorite Activities</span>
            </div>
            <p className="text-sm text-stone-800 font-medium">
              {user.favoriteActivities || 'Morning walks, gardening, baking'}
            </p>
          </div>

          {/* Hobbies */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-800 mb-2">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span>Hobbies & Pastimes</span>
            </div>
            <p className="text-sm text-stone-800 font-medium">
              {user.hobbies || 'Crossword puzzles, chess, listening to music'}
            </p>
          </div>

          {/* Frequently Visited Places */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-800 mb-2">
              <MapPin className="w-4 h-4 text-teal-600" />
              <span>Frequently Visited Places</span>
            </div>
            <p className="text-sm text-stone-800 font-medium">
              {user.frequentlyVisitedPlaces || 'Botanical gardens, public library, community hall'}
            </p>
          </div>

          {/* Important Information */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-800 mb-2">
              <Bookmark className="w-4 h-4 text-teal-600" />
              <span>Things to Remember</span>
            </div>
            <p className="text-sm text-stone-800 font-medium whitespace-pre-line">
              {user.importantInformation ||
                'Family visits on weekends, morning tea routine, doctor appointments'}
            </p>
          </div>
        </div>
      </div>

      {/* Safety and Reassurance Note */}
      <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between text-xs text-stone-500">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-700" />
          <span>MemoryMate AI • All personal recall data is stored securely and privately.</span>
        </div>
        <button
          onClick={onLogout}
          className="text-stone-600 hover:text-red-700 font-medium flex items-center gap-1 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
};
