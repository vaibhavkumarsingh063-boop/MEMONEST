import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  RoutineQuestion,
  FamilyMember,
  AudioStory,
  QuizQuestion,
  QuizSession,
  ForgottenTopicItem,
  UserAccount,
  CustomQuiz,
} from './types';
import {
  getInitialState,
  saveUserProfile,
  saveRoutine,
  saveFamily,
  saveAudioStories,
  saveQuizQuestions,
  saveQuizSessions,
  saveForgottenTopics,
  saveTextSizePreference,
  resetToDefaults,
} from './utils/storage';
import { authApi } from './utils/authApi';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { SignupPage } from './components/SignupPage';
import { LoginPage } from './components/LoginPage';
import { ProfileSetupWizard } from './components/ProfileSetupWizard';
import { MemoryMateHome } from './components/MemoryMateHome';
import { QuizView } from './components/QuizView';
import { DashboardView } from './components/DashboardView';
import { AudioStoryView } from './components/AudioStoryView';
import { FamilyView } from './components/FamilyView';
import { ProfileView } from './components/ProfileView';
import { PrivacyNoticeModal } from './components/PrivacyNoticeModal';
import { CustomQuizLibrary } from './components/custom-quiz/CustomQuizLibrary';
import { CustomQuizBuilder } from './components/custom-quiz/CustomQuizBuilder';
import { CustomQuizPlayer } from './components/custom-quiz/CustomQuizPlayer';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [initialData] = useState(() => getInitialState());

  // Existing cognitive wellness state
  const [user, setUser] = useState<UserProfile>(initialData.user);
  const [routine, setRoutine] = useState<RoutineQuestion[]>(initialData.routine);
  const [family, setFamily] = useState<FamilyMember[]>(initialData.family);
  const [audioStories, setAudioStories] = useState<AudioStory[]>(initialData.audioStories);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>(initialData.quizQuestions);
  const [sessions, setSessions] = useState<QuizSession[]>(initialData.sessions);
  const [forgottenTopics, setForgottenTopics] = useState<ForgottenTopicItem[]>(
    initialData.forgottenTopics
  );
  const [weeklyProgress, setWeeklyProgress] = useState(initialData.weeklyProgress);

  // Authenticated Account State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // High-level App Routing:
  // 'landing' | 'signup' | 'login' | 'profile-setup' | 'app'
  const [currentRoute, setCurrentRoute] = useState<
    'landing' | 'signup' | 'login' | 'profile-setup' | 'app'
  >('landing');

  // Internal tab when in 'app' route
  const [activeTab, setActiveTab] = useState<string>('home');

  // Custom Quiz state
  const [customQuizMode, setCustomQuizMode] = useState<'library' | 'builder' | 'player'>('library');
  const [selectedCustomQuiz, setSelectedCustomQuiz] = useState<CustomQuiz | null>(null);

  const [textSize, setTextSize] = useState<'normal' | 'large' | 'xlarge'>(
    initialData.textSize || 'normal'
  );
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [consentGiven, setConsentGiven] = useState(true);

  // Check auth session on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const authedUser = await authApi.getCurrentUser();
        if (authedUser) {
          setCurrentUser(authedUser);
          // Sync senior user profile name and avatar
          setUser((prev) => ({
            ...prev,
            name: authedUser.name || prev.name,
            avatar: authedUser.profilePicture || prev.avatar,
            age: typeof authedUser.age === 'number' ? authedUser.age : prev.age,
            primaryLanguage: authedUser.preferredLanguage || prev.primaryLanguage,
          }));

          // Strict route check: profileCompleted ? home : profile-setup
          if (authedUser.profileCompleted) {
            setCurrentRoute('app');
            setActiveTab('home');
          } else {
            setCurrentRoute('profile-setup');
          }
        } else {
          setCurrentRoute('landing');
        }
      } catch (err) {
        console.error('Auth verification error:', err);
        setCurrentRoute('landing');
      } finally {
        setIsAuthLoading(false);
      }
    }

    checkAuth();
  }, []);

  // Sync text size to local storage
  const handleSetTextSize = (size: 'normal' | 'large' | 'xlarge') => {
    setTextSize(size);
    saveTextSizePreference(size);
  };

  // Auth Handlers
  const handleSignupSuccess = (newUser: UserAccount) => {
    setCurrentUser(newUser);
    setUser((prev) => ({
      ...prev,
      name: newUser.name,
      avatar:
        newUser.profilePicture ||
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
    }));

    // Must NOT send the user directly to dashboard.
    // Redirect strictly to /profile-setup
    setCurrentRoute('profile-setup');
  };

  const handleLoginSuccess = (loggedInUser: UserAccount) => {
    setCurrentUser(loggedInUser);
    setUser((prev) => ({
      ...prev,
      name: loggedInUser.name || prev.name,
      avatar: loggedInUser.profilePicture || prev.avatar,
      age: typeof loggedInUser.age === 'number' ? loggedInUser.age : prev.age,
      primaryLanguage: loggedInUser.preferredLanguage || prev.primaryLanguage,
    }));

    // If profileCompleted === false -> /profile-setup
    // If profileCompleted === true -> /home
    if (loggedInUser.profileCompleted) {
      setCurrentRoute('app');
      setActiveTab('home');
    } else {
      setCurrentRoute('profile-setup');
    }
  };

  const handleQuickDemoLogin = async () => {
    try {
      setIsAuthLoading(true);
      const res = await authApi.login({
        email: 'rahul@memorymate.ai',
        password: 'password123',
      });
      handleLoginSuccess(res.user);
    } catch (e) {
      console.warn('Quick demo login error:', e);
      setCurrentRoute('login');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleProfileComplete = (updatedUser: UserAccount) => {
    setCurrentUser(updatedUser);
    setUser((prev) => ({
      ...prev,
      name: updatedUser.name,
      avatar: updatedUser.profilePicture || prev.avatar,
      age: typeof updatedUser.age === 'number' ? updatedUser.age : prev.age,
      primaryLanguage: updatedUser.preferredLanguage || prev.primaryLanguage,
    }));

    // Redirect to /home
    setCurrentRoute('app');
    setActiveTab('home');
  };

  const handleLogout = async () => {
    await authApi.logout();
    setCurrentUser(null);
    setCurrentRoute('landing');
  };

  // Profile update from inside the App
  const handleUpdateUser = (updated: UserProfile) => {
    setUser(updated);
    saveUserProfile(updated);
    if (currentUser) {
      authApi.updateProfile({
        name: updated.name,
        profilePicture: updated.avatar,
        age: updated.age,
        preferredLanguage: updated.preferredLanguage,
      }).catch(console.warn);
    }
  };

  // Routine update
  const handleUpdateRoutine = (updated: RoutineQuestion[]) => {
    setRoutine(updated);
    saveRoutine(updated);
  };

  // Family CRUD
  const handleAddFamilyMember = (member: FamilyMember) => {
    const updated = [member, ...family];
    setFamily(updated);
    saveFamily(updated);
  };

  const handleUpdateFamilyMember = (member: FamilyMember) => {
    const updated = family.map((f) => (f.id === member.id ? member : f));
    setFamily(updated);
    saveFamily(updated);
  };

  const handleDeleteFamilyMember = (id: string) => {
    const updated = family.filter((f) => f.id !== id);
    setFamily(updated);
    saveFamily(updated);
  };

  const handleAddCustomQuizQuestion = (question: QuizQuestion) => {
    const updated = [question, ...quizQuestions];
    setQuizQuestions(updated);
    saveQuizQuestions(updated);
  };

  const handlePlayCustomQuiz = (question: QuizQuestion) => {
    const filtered = quizQuestions.filter((q) => q.id !== question.id);
    const updated = [question, ...filtered];
    setQuizQuestions(updated);
    saveQuizQuestions(updated);
    setActiveTab('quiz');
  };

  // Audio Story saving
  const handleSaveAudioStory = (story: AudioStory, newQuestions?: QuizQuestion[]) => {
    const updatedStories = [story, ...audioStories];
    setAudioStories(updatedStories);
    saveAudioStories(updatedStories);

    if (newQuestions && newQuestions.length > 0) {
      const updatedQuestions = [...newQuestions, ...quizQuestions];
      setQuizQuestions(updatedQuestions);
      saveQuizQuestions(updatedQuestions);
    }
  };

  const handleDeleteAudioStory = (storyId: string) => {
    const updated = audioStories.filter((s) => s.id !== storyId);
    setAudioStories(updated);
    saveAudioStories(updated);
  };

  // Quiz completion
  const handleQuizComplete = (session: QuizSession, updatedForgotten: ForgottenTopicItem[]) => {
    const updatedSessions = [session, ...sessions];
    setSessions(updatedSessions);
    saveQuizSessions(updatedSessions);

    setForgottenTopics(updatedForgotten);
    saveForgottenTopics(updatedForgotten);

    const updatedWeekly = weeklyProgress.map((w, i) =>
      i === weeklyProgress.length - 1 ? { ...w, score: session.score, completed: true } : w
    );
    setWeeklyProgress(updatedWeekly);
  };

  // Reset to Defaults
  const handleResetData = () => {
    resetToDefaults();
    const fresh = getInitialState();
    setUser(fresh.user);
    setRoutine(fresh.routine);
    setFamily(fresh.family);
    setAudioStories(fresh.audioStories);
    setQuizQuestions(fresh.quizQuestions);
    setSessions(fresh.sessions);
    setForgottenTopics(fresh.forgottenTopics);
    setWeeklyProgress(fresh.weeklyProgress);
  };

  // Today's Quiz Completed State
  const todaySession = sessions[0];
  const todayQuizCompleted = Boolean(
    todaySession && todaySession.date === new Date().toISOString().split('T')[0]
  );
  const todayScore = todaySession ? todaySession.score : 92;

  // Text size container class
  const textSizeClass =
    textSize === 'xlarge'
      ? 'font-size-xlarge'
      : textSize === 'large'
      ? 'font-size-large'
      : 'font-size-normal';

  // Loading spinner on initial auth check
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-teal-700 animate-spin mb-3" />
        <p className="text-sm font-medium text-stone-600 font-serif">
          Loading MemoryMate AI...
        </p>
      </div>
    );
  }

  // 1. LANDING PAGE
  if (currentRoute === 'landing') {
    return (
      <LandingPage
        onNavigateToSignup={() => setCurrentRoute('signup')}
        onNavigateToLogin={() => setCurrentRoute('login')}
        onQuickDemoLogin={handleQuickDemoLogin}
      />
    );
  }

  // 2. SIGNUP PAGE
  if (currentRoute === 'signup') {
    return (
      <SignupPage
        onSignupSuccess={handleSignupSuccess}
        onNavigateToLogin={() => setCurrentRoute('login')}
        onNavigateToLanding={() => setCurrentRoute('landing')}
      />
    );
  }

  // 3. LOGIN PAGE
  if (currentRoute === 'login') {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onNavigateToSignup={() => setCurrentRoute('signup')}
        onNavigateToLanding={() => setCurrentRoute('landing')}
      />
    );
  }

  // 4. PROFILE SETUP WIZARD
  if (currentRoute === 'profile-setup') {
    // If somehow currentUser is missing, fallback to landing
    if (!currentUser) {
      return (
        <LandingPage
          onNavigateToSignup={() => setCurrentRoute('signup')}
          onNavigateToLogin={() => setCurrentRoute('login')}
        />
      );
    }

    return (
      <ProfileSetupWizard
        user={currentUser}
        onProfileComplete={handleProfileComplete}
        onLogout={handleLogout}
      />
    );
  }

  // 5. MAIN APPLICATION (Protected: only accessible after profile completed!)
  return (
    <div
      className={`min-h-screen bg-stone-100/70 text-stone-800 flex flex-col antialiased ${textSizeClass}`}
    >
      {/* Navigation Header */}
      <Navbar
        currentTab={activeTab}
        activeTab={activeTab}
        setCurrentTab={setActiveTab}
        onSelectTab={setActiveTab}
        user={user}
        textSize={textSize}
        setTextSize={handleSetTextSize}
        onTextSizeChange={handleSetTextSize}
        todayQuizCompleted={todayQuizCompleted}
        onOpenPrivacy={() => setIsPrivacyModalOpen(true)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        onLogout={handleLogout}
        onEditProfileSetup={() => setCurrentRoute('profile-setup')}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* MemoryMate Home View (Section 10 Requirement) */}
        {activeTab === 'home' && currentUser && (
          <MemoryMateHome
            user={currentUser}
            onStartQuiz={() => setActiveTab('quiz')}
            onNavigateTab={setActiveTab}
            onEditProfile={() => setCurrentRoute('profile-setup')}
            onLogout={handleLogout}
            onCreateCustomQuiz={() => {
              setActiveTab('custom-quizzes');
              setSelectedCustomQuiz(null);
              setCustomQuizMode('builder');
            }}
          />
        )}

        {/* Daily Quiz View */}
        {activeTab === 'quiz' && (
          <QuizView
            questions={quizQuestions}
            user={user}
            routine={routine}
            family={family}
            audioStories={audioStories}
            forgottenTopics={forgottenTopics}
            onQuizComplete={handleQuizComplete}
            onRefreshQuiz={(newQs) => {
              setQuizQuestions(newQs);
              saveQuizQuestions(newQs);
            }}
            onNavigateToDashboard={() => setActiveTab('dashboard')}
            onCreateCustomQuiz={() => {
              setActiveTab('custom-quizzes');
              setSelectedCustomQuiz(null);
              setCustomQuizMode('builder');
            }}
            onOpenCustomQuizzes={() => {
              setActiveTab('custom-quizzes');
              setCustomQuizMode('library');
            }}
          />
        )}

        {/* Custom Quiz Feature View */}
        {activeTab === 'custom-quizzes' && (
          <div>
            {customQuizMode === 'builder' && (
              <CustomQuizBuilder
                initialQuiz={selectedCustomQuiz}
                user={user}
                onSaveSuccess={(savedQuiz, startImmediately) => {
                  if (startImmediately) {
                    setSelectedCustomQuiz(savedQuiz);
                    setCustomQuizMode('player');
                  } else {
                    setSelectedCustomQuiz(null);
                    setCustomQuizMode('library');
                  }
                }}
                onCancel={() => {
                  setSelectedCustomQuiz(null);
                  setCustomQuizMode('library');
                }}
              />
            )}

            {customQuizMode === 'player' && selectedCustomQuiz && (
              <CustomQuizPlayer
                quiz={selectedCustomQuiz}
                user={user}
                textSize={textSize}
                onBackToLibrary={() => {
                  setSelectedCustomQuiz(null);
                  setCustomQuizMode('library');
                }}
                onNavigateToDashboard={() => setActiveTab('dashboard')}
              />
            )}

            {customQuizMode === 'library' && (
              <CustomQuizLibrary
                user={user}
                onCreateNew={() => {
                  setSelectedCustomQuiz(null);
                  setCustomQuizMode('builder');
                }}
                onEditQuiz={(quiz) => {
                  setSelectedCustomQuiz(quiz);
                  setCustomQuizMode('builder');
                }}
                onStartQuiz={(quiz) => {
                  setSelectedCustomQuiz(quiz);
                  setCustomQuizMode('player');
                }}
              />
            )}
          </div>
        )}

        {/* Memory Dashboard View */}
        {activeTab === 'dashboard' && (
          <DashboardView
            sessions={sessions}
            forgottenTopics={forgottenTopics}
            onStartQuiz={() => setActiveTab('quiz')}
            weeklyProgress={weeklyProgress}
          />
        )}

        {/* Record Story View */}
        {activeTab === 'story' && (
          <AudioStoryView
            stories={audioStories}
            onSaveStory={handleSaveAudioStory}
            onDeleteStory={handleDeleteAudioStory}
          />
        )}

        {/* Family View */}
        {activeTab === 'family' && (
          <FamilyView
            family={family}
            user={user}
            onAddFamilyMember={handleAddFamilyMember}
            onUpdateFamilyMember={handleUpdateFamilyMember}
            onDeleteFamilyMember={handleDeleteFamilyMember}
            onAddCustomQuizQuestion={handleAddCustomQuizQuestion}
            onPlayCustomQuiz={handlePlayCustomQuiz}
          />
        )}

        {/* Profile View */}
        {activeTab === 'profile' && (
          <ProfileView
            user={user}
            routine={routine}
            onUpdateUser={handleUpdateUser}
            onUpdateRoutine={handleUpdateRoutine}
            onResetAllData={handleResetData}
            textSize={textSize}
            setTextSize={handleSetTextSize}
            onOpenPrivacy={() => setIsPrivacyModalOpen(true)}
          />
        )}
      </main>

      {/* Persistent Calm Footer */}
      <footer className="border-t border-stone-200 bg-white/80 backdrop-blur-xs py-5 px-4 sm:px-6 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="font-medium text-stone-700">
              MemoryMate AI • Personalized Memory & Recall Platform
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={() => setCurrentRoute('profile-setup')}
              className="text-stone-600 hover:text-teal-800 underline cursor-pointer"
            >
              Profile Setup Wizard
            </button>
            <span>•</span>
            <button
              onClick={() => setIsPrivacyModalOpen(true)}
              className="text-stone-600 hover:text-teal-800 underline cursor-pointer"
            >
              Privacy Notice
            </button>
            <span>•</span>
            <button
              onClick={handleLogout}
              className="text-stone-600 hover:text-red-700 underline cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </footer>

      {/* Privacy Modal */}
      <PrivacyNoticeModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
        consentGiven={consentGiven}
        onToggleConsent={() => setConsentGiven(!consentGiven)}
      />
    </div>
  );
}
