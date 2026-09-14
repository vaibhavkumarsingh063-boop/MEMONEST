import React from 'react';
import {
  Brain,
  Sparkles,
  Calendar,
  BarChart3,
  Mic,
  Users,
  UserCheck,
  Type,
  ShieldCheck,
  Volume2,
  LogOut,
  Settings,
  Layers,
} from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  currentTab?: string;
  activeTab?: string;
  setCurrentTab?: (tab: string) => void;
  onSelectTab?: (tab: string) => void;
  user: UserProfile;
  onToggleRole?: () => void;
  textSize: 'normal' | 'large' | 'xlarge';
  setTextSize?: (size: 'normal' | 'large' | 'xlarge') => void;
  onTextSizeChange?: (size: 'normal' | 'large' | 'xlarge') => void;
  todayQuizCompleted?: boolean;
  onOpenPrivacy?: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  onLogout?: () => void;
  onEditProfileSetup?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  activeTab,
  setCurrentTab,
  onSelectTab,
  user,
  onToggleRole,
  textSize,
  setTextSize,
  onTextSizeChange,
  todayQuizCompleted = false,
  onOpenPrivacy,
  soundEnabled,
  onToggleSound,
  onLogout,
  onEditProfileSetup,
}) => {
  const selectedTab = currentTab || activeTab || 'home';

  const handleTabClick = (tabId: string) => {
    if (setCurrentTab) setCurrentTab(tabId);
    if (onSelectTab) onSelectTab(tabId);
  };

  const handleTextSizeSelect = (size: 'normal' | 'large' | 'xlarge') => {
    if (setTextSize) setTextSize(size);
    if (onTextSizeChange) onTextSizeChange(size);
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: Brain },
    {
      id: 'quiz',
      label: 'Daily Quiz',
      icon: Sparkles,
      badge: !todayQuizCompleted ? 'Today' : undefined,
    },
    {
      id: 'custom-quizzes',
      label: 'Custom Quizzes',
      icon: Layers,
    },
    { id: 'dashboard', label: 'Memory Dashboard', icon: BarChart3 },
    { id: 'story', label: 'Record Story', icon: Mic },
    { id: 'family', label: 'Family', icon: Users },
    { id: 'profile', label: 'Profile', icon: UserCheck },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
      {/* Top micro-bar: Accessibility & Safety Banner */}
      <div className="bg-stone-100/90 px-4 py-1 text-xs text-stone-600 border-b border-stone-200/60 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 font-medium text-teal-800">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            MemoryMate AI • Cognitive Companion
          </span>
          <span className="hidden sm:inline text-stone-400">•</span>
          <span className="hidden sm:inline text-stone-500">
            Gentle memory retention & recall practice (Non-clinical)
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Text Size Accessibility Controls */}
          <div className="flex items-center gap-1 bg-white border border-stone-300 rounded-md px-1.5 py-0.5">
            <span className="text-[11px] text-stone-500 font-medium mr-1 flex items-center gap-0.5">
              <Type className="w-3 h-3 text-stone-400" /> Text:
            </span>
            <button
              onClick={() => handleTextSizeSelect('normal')}
              className={`px-1.5 py-0.5 rounded text-xs font-semibold cursor-pointer ${
                textSize === 'normal' ? 'bg-teal-700 text-white' : 'text-stone-600 hover:bg-stone-100'
              }`}
              title="Standard text size"
            >
              A
            </button>
            <button
              onClick={() => handleTextSizeSelect('large')}
              className={`px-1.5 py-0.5 rounded text-xs font-semibold cursor-pointer ${
                textSize === 'large' ? 'bg-teal-700 text-white' : 'text-stone-600 hover:bg-stone-100'
              }`}
              title="Large text size"
            >
              A+
            </button>
            <button
              onClick={() => handleTextSizeSelect('xlarge')}
              className={`px-1.5 py-0.5 rounded text-xs font-semibold cursor-pointer ${
                textSize === 'xlarge' ? 'bg-teal-700 text-white' : 'text-stone-600 hover:bg-stone-100'
              }`}
              title="Extra large text size"
            >
              A++
            </button>
          </div>

          {onToggleSound && (
            <button
              onClick={onToggleSound}
              className="text-stone-500 hover:text-stone-800 p-1 rounded hover:bg-stone-200/60 cursor-pointer"
              title={soundEnabled ? 'Mute soothing chimes' : 'Enable soothing chimes'}
            >
              <Volume2 className={`w-3.5 h-3.5 ${soundEnabled ? 'text-teal-700' : 'text-stone-400'}`} />
            </button>
          )}

          <button
            onClick={onOpenPrivacy}
            className="text-stone-500 hover:text-stone-800 hover:underline text-[11px] cursor-pointer"
          >
            Privacy Notice
          </button>
        </div>
      </div>

      {/* Main navigation row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20 gap-4">
          {/* Logo & Platform Name */}
          <div
            onClick={() => handleTabClick('home')}
            className="flex items-center gap-3 cursor-pointer select-none group shrink-0"
          >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-teal-700 to-emerald-800 flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
              <Brain className="w-6 h-6 md:w-7 md:h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl md:text-2xl font-bold tracking-tight text-stone-900 font-serif">
                  MemoryMate AI
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold tracking-wider text-teal-800 bg-teal-100/80 rounded-full uppercase">
                  Companion
                </span>
              </div>
              <p className="text-xs text-stone-500 font-medium hidden sm:block">
                “Your Personal AI Memory & Recall Companion”
              </p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = selectedTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium transition-all text-sm md:text-base cursor-pointer ${
                    isActive
                      ? 'bg-teal-50 text-teal-900 font-semibold shadow-xs ring-1 ring-teal-200'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-700' : 'text-stone-400'}`} />
                  {item.label}
                  {item.badge && (
                    <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-white text-[10px] font-bold rounded-full animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => handleTabClick('profile')}
              title="View & Edit Profile"
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-stone-300 bg-stone-50 hover:bg-stone-100 transition-colors text-xs sm:text-sm text-stone-700 cursor-pointer"
            >
              <img
                src={user.avatar}
                alt={user.name}
                className="w-7 h-7 rounded-full object-cover ring-1 ring-teal-600"
              />
              <div className="text-left hidden md:block">
                <span className="block font-semibold text-stone-900 leading-tight">
                  {user.name}
                </span>
                <span className="block text-[11px] text-teal-800 font-medium">
                  {user.role === 'senior_user' ? 'Senior Profile' : 'Caregiver'}
                </span>
              </div>
            </button>

            {onEditProfileSetup && (
              <button
                onClick={onEditProfileSetup}
                title="Edit Setup Information"
                className="p-2 rounded-full text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}

            {onLogout && (
              <button
                onClick={onLogout}
                title="Log Out"
                className="flex items-center gap-1 text-xs text-stone-600 hover:text-red-700 font-medium px-2.5 py-1.5 rounded-xl border border-stone-200 hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile navigation bar */}
      <div className="lg:hidden border-t border-stone-200 bg-white px-2 py-1.5 flex items-center justify-around overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = selectedTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`flex flex-col items-center py-1 px-2 rounded-lg text-xs font-medium shrink-0 transition-colors cursor-pointer ${
                isActive ? 'text-teal-800 font-bold bg-teal-50' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-teal-700' : 'text-stone-400'}`} />
                {item.badge && (
                  <span className="absolute -top-1 -right-1.5 w-2 h-2 bg-amber-500 rounded-full" />
                )}
              </div>
              <span className="mt-0.5 text-[11px]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
