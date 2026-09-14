import React from 'react';
import {
  Sparkles,
  Play,
  CheckCircle2,
  TrendingUp,
  Mic,
  Users,
  Calendar,
  Clock,
  ArrowRight,
  Brain,
  ShieldCheck,
  AlertCircle,
  Volume2,
  Heart,
  BookOpen,
} from 'lucide-react';
import {
  UserProfile,
  QuizSession,
  AudioStory,
  FamilyMember,
  ForgottenTopicItem,
} from '../types';

interface HomeViewProps {
  user: UserProfile;
  sessions: QuizSession[];
  audioStories: AudioStory[];
  family: FamilyMember[];
  forgottenTopics: ForgottenTopicItem[];
  onStartQuiz: () => void;
  onNavigate: (tab: string) => void;
  todayQuizCompleted: boolean;
  todayScore: number;
}

export const HomeView: React.FC<HomeViewProps> = ({
  user,
  sessions,
  audioStories,
  family,
  forgottenTopics,
  onStartQuiz,
  onNavigate,
  todayQuizCompleted,
  todayScore,
}) => {
  const latestStory = audioStories[0];

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
      {/* Welcome Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-800 via-teal-700 to-emerald-900 text-white p-6 sm:p-8 md:p-10 shadow-md">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-teal-100 text-xs sm:text-sm font-medium mb-3">
            <Sparkles className="w-4 h-4 text-teal-300" />
            <span>Personalized Daily Cognitive Engagement</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white font-serif">
            Welcome back, {user.name}
          </h1>
          <p className="mt-2 text-stone-200 text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl font-normal">
            Your personalized AI memory exercises are ready. Practice recalling your family moments, daily routine, and recent audio stories.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3 sm:gap-4">
            <button
              onClick={onStartQuiz}
              className="inline-flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-900 font-bold text-base sm:text-lg shadow-md hover:shadow-lg transition-all transform active:scale-95 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-stone-900" />
              {todayQuizCompleted ? "Review Today's Quiz" : "Start Today's Quiz"}
            </button>

            <button
              onClick={() => onNavigate('story')}
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-semibold text-sm sm:text-base backdrop-blur-sm transition-all cursor-pointer border border-white/20"
            >
              <Mic className="w-4 h-4 text-teal-200" />
              Record Today's Story
            </button>
          </div>
        </div>

        {/* Decorative background brain waves */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 opacity-15 pointer-events-none hidden md:block">
          <Brain className="w-96 h-96 text-white" />
        </div>
      </section>

      {/* Grid of Core Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Today's Quiz Status */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between hover:border-teal-300 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  todayQuizCompleted
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {todayQuizCompleted ? 'Completed Today' : 'Questions Ready'}
              </span>
            </div>

            <h3 className="text-lg font-bold text-stone-900">Today's Quiz</h3>
            <p className="text-sm text-stone-600 mt-1 leading-normal">
              5 personalized questions drawn from your routines, loved ones, and audio recordings.
            </p>

            <div className="mt-4 p-3 bg-stone-50 rounded-xl border border-stone-100 space-y-1.5 text-xs text-stone-700">
              <div className="flex justify-between">
                <span>Questions in session:</span>
                <span className="font-semibold text-stone-900">5 items</span>
              </div>
              <div className="flex justify-between">
                <span>Questions remaining:</span>
                <span className="font-semibold text-stone-900">
                  {todayQuizCompleted ? '0 (Completed)' : '5 remaining'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Today's Score:</span>
                <span className="font-semibold text-teal-800">
                  {todayQuizCompleted ? `${todayScore}%` : 'Pending quiz'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-stone-100">
            <button
              onClick={onStartQuiz}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm transition-colors cursor-pointer"
            >
              <span>{todayQuizCompleted ? 'Review Answers' : 'Start 5-Min Quiz'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Card 2: Memory Dashboard Overview */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between hover:border-teal-300 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-800">
                Weekly: +4% Trend
              </span>
            </div>

            <h3 className="text-lg font-bold text-stone-900">Memory Dashboard</h3>
            <p className="text-sm text-stone-600 mt-1">
              Tracking your recall consistency, memory categories, and progress over time.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="p-3 bg-stone-50 rounded-xl text-center border border-stone-100">
                <span className="text-xs text-stone-500 block">Overall Score</span>
                <span className="text-xl font-bold text-teal-800 mt-0.5 block">86%</span>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl text-center border border-stone-100">
                <span className="text-xs text-stone-500 block">Recall Accuracy</span>
                <span className="text-xl font-bold text-emerald-700 mt-0.5 block">89%</span>
              </div>
            </div>

            {forgottenTopics.length > 0 && (
              <div className="mt-3 flex items-center gap-2 text-xs text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200/60">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>
                  <strong>1 Topic in Gentle Reinforcement:</strong> Medication schedule.
                </span>
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-stone-100">
            <button
              onClick={() => onNavigate('dashboard')}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-800 font-semibold text-sm transition-colors cursor-pointer"
            >
              <span>View Full Analytics</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Card 3: Daily Audio Story / Memories */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between hover:border-teal-300 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <Mic className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-100 text-stone-700">
                {audioStories.length} Recorded
              </span>
            </div>

            <h3 className="text-lg font-bold text-stone-900">Audio Memories</h3>
            <p className="text-sm text-stone-600 mt-1">
              Record spoken memories of your day. The AI extracts details to create personalized recall prompts.
            </p>

            {latestStory && (
              <div className="mt-4 p-3 bg-teal-50/50 rounded-xl border border-teal-100 text-xs">
                <div className="flex items-center justify-between font-semibold text-teal-900 mb-1">
                  <span>Latest: {latestStory.title}</span>
                  <span className="text-[11px] text-stone-500">{latestStory.date}</span>
                </div>
                <p className="text-stone-600 line-clamp-2 italic">
                  "{latestStory.transcript}"
                </p>
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-stone-100">
            <button
              onClick={() => onNavigate('story')}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm transition-colors cursor-pointer"
            >
              <Mic className="w-4 h-4 text-amber-300" />
              <span>Record Today's Story</span>
            </button>
          </div>
        </div>
      </div>

      {/* Two-Column Section: Family Circle & AI Adaptive Learning Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Family Circle Mini-Widget */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-700" />
              <h3 className="text-base sm:text-lg font-bold text-stone-900">Family Circle</h3>
            </div>
            <button
              onClick={() => onNavigate('family')}
              className="text-xs font-semibold text-teal-700 hover:text-teal-900 hover:underline"
            >
              View All
            </button>
          </div>
          <p className="text-xs text-stone-500 mb-4">
            Family members can contribute personal memories and custom quiz questions.
          </p>

          <div className="space-y-3">
            {family.slice(0, 3).map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 border border-stone-100"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-9 h-9 rounded-full object-cover ring-1 ring-stone-200"
                  />
                  <div>
                    <span className="block font-semibold text-xs sm:text-sm text-stone-900">
                      {member.name}
                    </span>
                    <span className="block text-xs text-stone-500">
                      {member.relationship}
                    </span>
                  </div>
                </div>
                <div className="text-right text-[11px] text-teal-800 font-medium bg-teal-50 px-2 py-0.5 rounded-md">
                  {member.relationship === 'Son'
                    ? 'Sunday Dinner'
                    : member.relationship === 'Granddaughter'
                    ? 'Baking partner'
                    : 'Weekly call'}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => onNavigate('family')}
            className="mt-4 w-full py-2 px-3 rounded-lg border border-dashed border-stone-300 text-stone-600 hover:border-teal-600 hover:text-teal-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            <span>+ Add or Edit Family Member</span>
          </button>
        </div>

        {/* AI Adaptive Engine Explainer & Spaced Repetition Showcase */}
        <div className="lg:col-span-2 bg-gradient-to-br from-stone-50 to-teal-50/40 rounded-2xl border border-teal-200/70 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center gap-2 text-teal-900 font-bold text-base sm:text-lg mb-2">
            <Brain className="w-5 h-5 text-teal-700" />
            <h3>How MEMONEST's Adaptive AI Works</h3>
          </div>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            MEMONEST doesn't ask generic trivia. Every day, our cognitive engine evaluates what you remember easily and gently re-tests what you might forget.
          </p>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-white rounded-xl border border-stone-200/80 shadow-2xs">
              <span className="font-bold text-teal-800 block mb-1">
                1. Information Collection
              </span>
              <p className="text-stone-600">
                Gathers details from your daily routine, family circle, and spoken audio stories.
              </p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-stone-200/80 shadow-2xs">
              <span className="font-bold text-teal-800 block mb-1">
                2. Adaptive Generation
              </span>
              <p className="text-stone-600">
                If an item is repeatedly forgotten, it asks again in different formats (True/False, Choice, Recall).
              </p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-stone-200/80 shadow-2xs">
              <span className="font-bold text-teal-800 block mb-1">
                3. Gentle Reinforcement
              </span>
              <p className="text-stone-600">
                Well-remembered facts drop in frequency so the daily quiz remains fresh and encouraging.
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between p-3 bg-white/80 rounded-xl border border-teal-200/60 text-xs">
            <div className="flex items-center gap-2 text-stone-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                <strong>Adaptive Spaced Repetition:</strong> Active for Eleanor Vance
              </span>
            </div>
            <button
              onClick={() => onNavigate('dashboard')}
              className="text-teal-800 font-semibold hover:underline"
            >
              View Learning Curve
            </button>
          </div>
        </div>
      </div>

      {/* Non-clinical medical disclaimer banner */}
      <div className="p-4 bg-stone-100 rounded-2xl border border-stone-200/80 text-xs text-stone-600 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-stone-900">
            Wellness & Cognitive Memory Notice
          </p>
          <p className="mt-0.5 leading-relaxed text-stone-600">
            MEMONEST AI is an interactive cognitive engagement and memory retention training system designed to exercise recall and maintain connection with loved ones. It does not provide medical diagnosis, clinical treatment, or medical advice.
          </p>
        </div>
      </div>
    </div>
  );
};
