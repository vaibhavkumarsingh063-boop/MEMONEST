import React, { useState } from 'react';
import {
  TrendingUp,
  Brain,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Award,
  Calendar,
  Sparkles,
  ArrowUpRight,
  BookOpen,
  Volume2,
  RefreshCw,
  Clock,
  Eye,
} from 'lucide-react';
import { ForgottenTopicItem, QuizSession } from '../types';
import { speakText } from '../utils/soundAndSpeech';

interface DashboardViewProps {
  sessions: QuizSession[];
  forgottenTopics: ForgottenTopicItem[];
  onStartQuiz: () => void;
  weeklyProgress: { day: string; date: string; score: number; completed: boolean }[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  sessions,
  forgottenTopics,
  onStartQuiz,
  weeklyProgress,
}) => {
  const [selectedForgotten, setSelectedForgotten] = useState<ForgottenTopicItem | null>(null);

  // Calculate metrics
  const latestSession = sessions[0];
  const dailyScore = latestSession ? latestSession.score : 88;
  const overallScore = 86; // weighted aggregate
  const recallAccuracy = 89;

  const categories = [
    { name: 'Daily Routine & Habits', score: 94, questions: 18, color: 'bg-teal-600' },
    { name: 'Family & Social Relations', score: 92, questions: 22, color: 'bg-emerald-600' },
    { name: 'Audio Memories & Stories', score: 85, questions: 14, color: 'bg-amber-600' },
    { name: 'Chronology & Sequences', score: 81, questions: 10, color: 'bg-indigo-600' },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-semibold mb-2">
              <Brain className="w-3.5 h-3.5 text-teal-600" />
              Cognitive Engagement Analytics
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 font-serif">
              Memory Performance & Recall Dashboard
            </h1>
            <p className="text-sm sm:text-base text-stone-600 mt-1 max-w-2xl">
              Continuous tracking of episodic, semantic, and relational recall patterns to support cognitive resilience.
            </p>
          </div>

          <button
            onClick={onStartQuiz}
            className="self-start md:self-center px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm transition-colors shadow-xs flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>Practice Today's Quiz</span>
          </button>
        </div>
      </div>

      {/* 4 Key Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Overall Score */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
            <span>Overall Memory Score</span>
            <span className="p-1 rounded-md bg-teal-50 text-teal-700">All-time</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-stone-900 font-serif">
              {overallScore}%
            </span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> Stable
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-2">
            Solid memory retrieval stability across familiar domains.
          </p>
        </div>

        {/* Recall Accuracy */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
            <span>Recall Accuracy</span>
            <span className="p-1 rounded-md bg-emerald-50 text-emerald-700">Avg</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-emerald-700 font-serif">
              {recallAccuracy}%
            </span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              +3% this week
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-2">
            Percentage of accurate answers without external hints.
          </p>
        </div>

        {/* Daily Score */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
            <span>Latest Session Score</span>
            <span className="p-1 rounded-md bg-amber-50 text-amber-700">Today</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-teal-800 font-serif">
              {dailyScore}%
            </span>
            <span className="text-xs font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md">
              5 of 5
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-2">
            Consistently completed daily check-ins for 7 consecutive days.
          </p>
        </div>

        {/* Focus Item Count */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
            <span>Adaptive Spaced Items</span>
            <span className="p-1 rounded-md bg-stone-100 text-stone-700">Active</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-amber-700 font-serif">
              {forgottenTopics.filter((f) => f.status === 'needs_reinforcement').length}
            </span>
            <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md">
              In Reinforcement
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-2">
            Prioritized by AI to ask gently in alternating question formats.
          </p>
        </div>
      </div>

      {/* Main Charts & Visual Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Progress Bar Graph (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 font-serif">
                Weekly Recall Consistency & Improvement
              </h2>
              <p className="text-xs sm:text-sm text-stone-500">
                Daily memory evaluation scores across the last 7 days.
              </p>
            </div>
            <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              Goal: &gt;75% Daily
            </span>
          </div>

          {/* Visual Custom Chart Bar Display */}
          <div className="mt-8 pt-4 pb-2">
            <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-48 sm:h-56 px-2 border-b border-stone-200">
              {weeklyProgress.map((item, idx) => {
                const heightPercent = Math.max(item.score, 15);
                const isToday = idx === weeklyProgress.length - 1;

                return (
                  <div key={idx} className="flex flex-col items-center h-full justify-end group">
                    {/* Score badge on hover/always */}
                    <span className="text-[11px] font-bold text-stone-700 mb-1.5 opacity-90 group-hover:text-teal-800">
                      {item.score}%
                    </span>

                    {/* Bar */}
                    <div className="w-full max-w-[42px] bg-stone-100 rounded-t-xl overflow-hidden flex flex-col justify-end">
                      <div
                        className={`w-full rounded-t-xl transition-all duration-500 ${
                          isToday
                            ? 'bg-gradient-to-t from-teal-700 to-emerald-500'
                            : 'bg-gradient-to-t from-stone-400 to-teal-600 opacity-80 group-hover:opacity-100'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>

                    {/* Day & Date Label */}
                    <div className="mt-2 text-center">
                      <span className="block text-xs font-bold text-stone-800">
                        {item.day}
                      </span>
                      <span className="block text-[10px] text-stone-500">{item.date}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Threshold guide line */}
            <div className="mt-3 flex items-center justify-between text-xs text-stone-400 px-2">
              <span>Baseline: 50%</span>
              <span className="text-emerald-700 font-medium">
                Target Cognitive Maintenance (80%+)
              </span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Memory Category Breakdown (1 col) */}
        <div className="lg:col-span-1 bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-stone-900 font-serif">
              Performance by Domain
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Assessment across cognitive memory types.
            </p>

            <div className="mt-6 space-y-4">
              {categories.map((cat, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-stone-800">
                    <span>{cat.name}</span>
                    <span className="text-teal-800">{cat.score}%</span>
                  </div>
                  <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`${cat.color} h-full rounded-full transition-all duration-500`}
                      style={{ width: `${cat.score}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-stone-600 block">
                    {cat.questions} questions tested • Consistent retention
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-stone-100 text-xs text-stone-600 bg-stone-50 p-3 rounded-xl">
            <span className="font-semibold text-stone-900 block mb-0.5">
              AI Insight:
            </span>
            Daily Routine and Family relations show exceptional stability (over 90%), while Chronology exercises provide healthy challenge.
          </div>
        </div>
      </div>

      {/* Frequently Forgotten Topics Section (Adaptive Spaced Repetition) */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 font-serif">
                Frequently Forgotten Topics & Adaptive Reinforcement
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              When an item is missed, the AI schedules it for gentle spaced repetition in varied question formats.
            </p>
          </div>

          <span className="text-xs text-stone-500 font-medium self-start sm:self-center">
            {forgottenTopics.length} tracked items
          </span>
        </div>

        <div className="divide-y divide-stone-100">
          {forgottenTopics.map((item) => (
            <div
              key={item.id}
              className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/60 p-2 rounded-xl transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      item.status === 'needs_reinforcement'
                        ? 'bg-amber-100 text-amber-900'
                        : item.status === 'improving'
                        ? 'bg-teal-100 text-teal-900'
                        : 'bg-emerald-100 text-emerald-900'
                    }`}
                  >
                    {item.status === 'needs_reinforcement'
                      ? 'Needs Reinforcement'
                      : item.status === 'improving'
                      ? 'Improving Recall'
                      : 'Mastered'}
                  </span>
                  <span className="text-xs text-stone-600">• {item.category}</span>
                </div>

                <p className="text-sm sm:text-base font-semibold text-stone-900">
                  {item.topic}
                </p>

                <p className="text-xs text-stone-700">
                  Recorded Fact: <strong className="text-stone-900">{item.correctAnswer}</strong> •
                  Missed {item.missCount} times
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                <button
                  onClick={() => {
                    speakText(`Memory detail to remember: ${item.topic}. The detail is ${item.correctAnswer}`);
                  }}
                  className="p-2 rounded-lg text-stone-600 hover:text-teal-800 hover:bg-stone-100 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  title="Listen to this memory fact"
                >
                  <Volume2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Listen</span>
                </button>

                <button
                  onClick={() => setSelectedForgotten(item)}
                  className="px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-100 text-stone-800 text-xs font-semibold cursor-pointer"
                >
                  View Fact Card
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fact Card Quick Modal */}
      {selectedForgotten && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 max-w-md w-full shadow-xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-md">
                Memory Fact Review
              </span>
              <button
                onClick={() => setSelectedForgotten(null)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <h3 className="text-lg font-bold text-stone-900 font-serif">
              {selectedForgotten.topic}
            </h3>

            <div className="p-4 bg-teal-50/70 rounded-2xl border border-teal-200">
              <span className="text-xs text-stone-500 font-medium block">Exact Recorded Fact:</span>
              <p className="text-base sm:text-lg font-bold text-teal-950 mt-1">
                {selectedForgotten.correctAnswer}
              </p>
            </div>

            <p className="text-xs text-stone-500 leading-relaxed">
              MEMONEST's AI will gently reinforce this memory by presenting it in different formats (such as Multiple Choice clues or True/False questions) in upcoming sessions.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  speakText(
                    `Remember this detail: ${selectedForgotten.topic}. The answer is ${selectedForgotten.correctAnswer}`
                  );
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs flex items-center justify-center gap-1.5"
              >
                <Volume2 className="w-4 h-4 text-teal-700" />
                Read Aloud
              </button>
              <button
                onClick={() => setSelectedForgotten(null)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs"
              >
                Got It!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prominent Medical Notice */}
      <div className="p-4 sm:p-5 bg-stone-100 rounded-3xl border border-stone-200 text-xs sm:text-sm text-stone-600 flex items-start gap-3">
        <ShieldCheck className="w-6 h-6 text-teal-700 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-stone-900 text-sm sm:text-base">
            Important Cognitive Engagement Disclaimer
          </h4>
          <p className="mt-1 leading-relaxed text-stone-600">
            This dashboard and all associated scores are part of an AI-based cognitive engagement and memory performance tracking system designed to encourage active recall and mental stimulation. <strong>This is not a medical diagnosis or clinical assessment</strong> and should not be used as a substitute for professional neurological, psychiatric, or geriatric healthcare evaluations.
          </p>
        </div>
      </div>
    </div>
  );
};
