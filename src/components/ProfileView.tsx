import React, { useState } from 'react';
import {
  User,
  Clock,
  Heart,
  MapPin,
  Sparkles,
  Shield,
  Trash2,
  Edit3,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Type,
  Lock,
} from 'lucide-react';
import { RoutineQuestion, UserProfile } from '../types';

interface ProfileViewProps {
  user: UserProfile;
  routine: RoutineQuestion[];
  onUpdateUser: (updatedUser: UserProfile) => void;
  onUpdateRoutine: (updatedRoutine: RoutineQuestion[]) => void;
  onResetAllData: () => void;
  textSize: 'normal' | 'large' | 'xlarge';
  setTextSize: (size: 'normal' | 'large' | 'xlarge') => void;
  onOpenPrivacy: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  routine,
  onUpdateUser,
  onUpdateRoutine,
  onResetAllData,
  textSize,
  setTextSize,
  onOpenPrivacy,
}) => {
  const [name, setName] = useState(user.name);
  const [age, setAge] = useState(user.age);
  const [preferredLanguage, setPreferredLanguage] = useState(user.preferredLanguage);
  const [notes, setNotes] = useState(user.importantNotes);
  const [emergencyContact, setEmergencyContact] = useState(user.emergencyContact || '');
  const [isSavedAlert, setIsSavedAlert] = useState(false);

  // Custom routine question modal
  const [isCustomRoutineModalOpen, setIsCustomRoutineModalOpen] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newAnswerText, setNewAnswerText] = useState('');

  // Editing existing routine items
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [editAnswerText, setEditAnswerText] = useState('');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      ...user,
      name,
      age: Number(age),
      preferredLanguage,
      importantNotes: notes,
      emergencyContact,
    });
    setIsSavedAlert(true);
    setTimeout(() => setIsSavedAlert(false), 3000);
  };

  const handleAddCustomRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim() || !newAnswerText.trim()) return;

    const newRoutineItem: RoutineQuestion = {
      id: 'rt_custom_' + Date.now(),
      key: 'custom_' + Date.now(),
      question: newQuestionText.trim(),
      answer: newAnswerText.trim(),
      category: 'habits',
      lastUpdated: new Date().toISOString().split('T')[0],
      addedBy: user.name,
      isCustom: true,
    };

    onUpdateRoutine([...routine, newRoutineItem]);
    setNewQuestionText('');
    setNewAnswerText('');
    setIsCustomRoutineModalOpen(false);
  };

  const startEditRoutine = (item: RoutineQuestion) => {
    setEditingRoutineId(item.id);
    setEditAnswerText(item.answer);
  };

  const saveEditRoutine = (id: string) => {
    const updated = routine.map((item) =>
      item.id === id
        ? {
            ...item,
            answer: editAnswerText.trim(),
            lastUpdated: new Date().toISOString().split('T')[0],
          }
        : item
    );
    onUpdateRoutine(updated);
    setEditingRoutineId(null);
  };

  const deleteRoutine = (id: string) => {
    onUpdateRoutine(routine.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-semibold mb-2">
              <User className="w-3.5 h-3.5 text-teal-600" />
              User Profile & Cognitive Baseline
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 font-serif">
              Personal Information & Routine Settings
            </h1>
            <p className="text-sm sm:text-base text-stone-600 mt-1 max-w-2xl">
              Keep your personal background and daily routine answers updated. The AI references these facts to generate your daily memory questions.
            </p>
          </div>

          {/* Current Role Indicator */}
          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-xs self-start sm:self-center">
            <span className="text-stone-500 block">Active Mode:</span>
            <span className="font-bold text-stone-900">
              {user.role === 'senior_user' ? '👤 Senior (Eleanor Vance)' : '🛡️ Authorized Family Caregiver'}
            </span>
          </div>
        </div>
      </div>

      {isSavedAlert && (
        <div className="p-4 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-2xl flex items-center gap-2 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Profile changes saved successfully and synced with the AI memory engine!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: User Profile Form (1 col) */}
        <div className="lg:col-span-1 bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-4 pb-4 border-b border-stone-100">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-16 h-16 rounded-full object-cover ring-2 ring-teal-600"
            />
            <div>
              <h3 className="font-bold text-lg text-stone-900">{user.name}</h3>
              <span className="text-xs text-stone-500">Age {user.age} • {user.preferredLanguage}</span>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block font-semibold text-stone-800 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 rounded-xl border border-stone-300 text-stone-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-800 mb-1">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full p-3 rounded-xl border border-stone-300 text-stone-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-800 mb-1">Language</label>
                <select
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  className="w-full p-3 rounded-xl border border-stone-300 text-stone-900 bg-white"
                >
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="Hindi">Hindi</option>
                  <option value="German">German</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-stone-800 mb-1">
                Emergency Caregiver Contact
              </label>
              <input
                type="text"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="e.g. Son: Rahul Vance (555-019-2834)"
                className="w-full p-3 rounded-xl border border-stone-300 text-stone-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-800 mb-1">
                Important Personal Notes / Preferences
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 rounded-xl border border-stone-300 text-stone-900 leading-relaxed"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm transition-colors cursor-pointer shadow-xs"
            >
              Update Profile Information
            </button>
          </form>

          {/* Accessibility Text Size Card */}
          <div className="pt-4 border-t border-stone-100">
            <span className="font-semibold text-stone-800 text-xs block mb-2">
              Accessibility Display Sizing:
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTextSize('normal')}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold border ${
                  textSize === 'normal'
                    ? 'bg-teal-700 text-white border-teal-700'
                    : 'bg-stone-50 border-stone-200 text-stone-700'
                }`}
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => setTextSize('large')}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold border ${
                  textSize === 'large'
                    ? 'bg-teal-700 text-white border-teal-700'
                    : 'bg-stone-50 border-stone-200 text-stone-700'
                }`}
              >
                Large
              </button>
              <button
                type="button"
                onClick={() => setTextSize('xlarge')}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold border ${
                  textSize === 'xlarge'
                    ? 'bg-teal-700 text-white border-teal-700'
                    : 'bg-stone-50 border-stone-200 text-stone-700'
                }`}
              >
                Extra Large
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Daily Routine & Information Q&A (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-stone-900 font-serif">
                  Daily Routine & Personal Information Questionnaire
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                  Core questions asked to build Eleanor's initial memory baseline.
                </p>
              </div>

              <button
                onClick={() => setIsCustomRoutineModalOpen(true)}
                className="self-start sm:self-center px-4 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 border border-teal-200"
              >
                <Plus className="w-4 h-4 text-teal-700" />
                <span>Add Custom Question</span>
              </button>
            </div>

            <div className="space-y-4">
              {routine.map((item) => (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 rounded-2xl bg-stone-50/80 border border-stone-200 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded-md">
                        {item.category}
                      </span>
                      <h4 className="font-bold text-stone-900 text-sm sm:text-base pt-1">
                        {item.question}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEditRoutine(item)}
                        className="p-1.5 rounded-lg text-stone-500 hover:text-teal-800 hover:bg-white transition-colors"
                        title="Edit answer"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {item.isCustom && (
                        <button
                          onClick={() => deleteRoutine(item.id)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-white transition-colors"
                          title="Delete question"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {editingRoutineId === item.id ? (
                    <div className="pt-2 space-y-2">
                      <textarea
                        rows={2}
                        value={editAnswerText}
                        onChange={(e) => setEditAnswerText(e.target.value)}
                        className="w-full p-3 rounded-xl border border-teal-500 bg-white text-xs sm:text-sm"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEditRoutine(item.id)}
                          className="px-3 py-1.5 rounded-lg bg-teal-700 text-white font-semibold text-xs"
                        >
                          Save Fact
                        </button>
                        <button
                          onClick={() => setEditingRoutineId(null)}
                          className="px-3 py-1.5 rounded-lg border border-stone-300 text-stone-700 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-medium bg-white p-3 rounded-xl border border-stone-200/70">
                      "{item.answer}"
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-stone-600 pt-1">
                    <span>Added by: {item.addedBy}</span>
                    <span>Last updated: {item.lastUpdated}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy & Prototype Data Reset Section */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-4">
            <h3 className="text-lg font-bold text-stone-900 font-serif flex items-center gap-2">
              <Shield className="w-5 h-5 text-teal-700" />
              <span>Privacy, Security & Data Management</span>
            </h3>

            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              MEMONEST stores memory recordings and family information in a private, encrypted environment. Audio recordings and personal notes are never shared with external marketing or third-party ad networks.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100">
              <button
                type="button"
                onClick={onOpenPrivacy}
                className="px-4 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-semibold"
              >
                Read Full Privacy Notice & Consent
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Reset prototype data to initial Eleanor Vance defaults?')) {
                    onResetAllData();
                  }
                }}
                className="px-4 py-2 rounded-xl text-rose-700 hover:bg-rose-50 border border-rose-200 text-xs font-semibold flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Prototype Sample Data</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Routine Question Modal */}
      {isCustomRoutineModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 max-w-md w-full shadow-xl space-y-4">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-bold text-stone-900 font-serif">
                Add Custom Routine or Personal Fact
              </h3>
              <button
                onClick={() => setIsCustomRoutineModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomRoutine} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-stone-800 mb-1">
                  Question (e.g. Favorite bedtime music, pet name, etc.):
                </label>
                <input
                  type="text"
                  required
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  placeholder="e.g. What kind of tea do you drink in the evening?"
                  className="w-full p-3 rounded-xl border border-stone-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-800 mb-1">
                  Answer / Personal Detail:
                </label>
                <textarea
                  rows={2}
                  required
                  value={newAnswerText}
                  onChange={(e) => setNewAnswerText(e.target.value)}
                  placeholder="e.g. Chamomile tea with a teaspoon of clover honey at 8:30 PM."
                  className="w-full p-3 rounded-xl border border-stone-300"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCustomRoutineModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold"
                >
                  Save to Routine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
