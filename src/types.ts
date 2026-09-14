export type QuestionType =
  | 'multiple_choice'
  | 'true_false'
  | 'short_answer'
  | 'sequence'
  | 'recall';

export type MemoryCategory =
  | 'Daily Routine'
  | 'Family & Friends'
  | 'Audio Memories'
  | 'Personal Preferences'
  | 'Chronology'
  | 'Reinforcement Recall';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  age?: number | string;
  preferredLanguage?: string;
  profilePicture?: string;
  favoriteActivities?: string;
  hobbies?: string;
  frequentlyVisitedPlaces?: string;
  importantInformation?: string;
  profileCompleted: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface AuthState {
  user: UserAccount | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  preferredLanguage: string;
  avatar: string;
  role: 'senior_user' | 'authorized_family';
  importantNotes: string;
  consentGiven: boolean;
  emergencyContact?: string;
  createdAt: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  birthday: string;
  importantDates: string;
  importantEvents: string;
  personalPreferences: string;
  sharedMemories: string;
  avatar: string;
  phone?: string;
  permissions: {
    canEditProfile: boolean;
    canAddQuizPrompts: boolean;
    canViewReports: boolean;
  };
}

export interface RoutineQuestion {
  id: string;
  key: string;
  question: string;
  answer: string;
  category: 'morning' | 'daytime' | 'favorite' | 'places' | 'habits';
  lastUpdated: string;
  addedBy: string;
  isCustom?: boolean;
}

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  category: MemoryCategory;
  question: string;
  options?: string[];
  correctAnswer: string;
  sequenceItems?: string[];
  explanation: string;
  memoryFactSource: string;
  imageUrl?: string;
  audioPromptUrl?: string;
  familyMemberId?: string;
  familyMemberName?: string;
  spokenHint?: string;
}

export interface UserQuizAnswer {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  accuracyScore: number;
  feedback?: string;
}

export interface QuizSession {
  id: string;
  date: string;
  completed: boolean;
  score: number; // 0-100
  totalQuestions: number;
  correctCount: number;
  answers: UserQuizAnswer[];
  timeTakenSeconds: number;
}

export interface AudioStory {
  id: string;
  title: string;
  date: string;
  timestamp: string;
  audioBlobUrl?: string;
  durationSeconds: number;
  transcript: string;
  aiAnalysis?: {
    summary: string;
    entities: {
      people: string[];
      places: string[];
      activities: string[];
      objects: string[];
      sentiment: string;
    };
    extractedFacts: string[];
    suggestedRecallQuestions: {
      question: string;
      expectedAnswer: string;
      type: QuestionType;
      options?: string[];
    }[];
  };
}

export interface ForgottenTopicItem {
  id: string;
  topic: string;
  category: MemoryCategory;
  correctAnswer: string;
  missCount: number;
  lastMissedDate: string;
  status: 'needs_reinforcement' | 'improving' | 'mastered';
}

export interface MemoryDashboardStats {
  overallScore: number; // e.g. 86
  recallAccuracy: number; // e.g. 89%
  dailyScore: number; // e.g. 92%
  weeklyProgress: { day: string; date: string; score: number; completed: boolean }[];
  frequentlyForgotten: ForgottenTopicItem[];
  categoryBreakdown: {
    category: MemoryCategory;
    accuracy: number;
    totalAttempts: number;
    color: string;
  }[];
}

export type CustomQuizDifficulty = 'easy' | 'medium' | 'hard';
export type CustomQuizQuestionType =
  | 'multiple_choice'
  | 'true_false'
  | 'short_answer'
  | 'recall'
  | 'sequence';

export interface QuizImage {
  id: string;
  userId: string;
  quizId?: string;
  questionId?: string;
  storagePath: string;
  imageUrl: string;
  originalFileName: string;
  description: string;
  uploadedAt: string;
  fileSize?: number;
  mimeType?: string;
}

export interface CustomQuizQuestion {
  id: string;
  quizId: string;
  question: string;
  questionType: CustomQuizQuestionType;
  options?: string[];
  correctAnswer: string;
  sequenceItems?: string[];
  explanation?: string;
  hint?: string;
  imageId?: string;
  imageUrl?: string;
  order: number;
  createdAt: string;
}

export interface CustomQuiz {
  id: string;
  userId: string;
  title: string;
  description: string;
  difficulty: CustomQuizDifficulty;
  questionCount: number;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'published' | 'archived';
  improveFutureExercises: boolean;
  questions: CustomQuizQuestion[];
  images: QuizImage[];
  bestScore?: number;
  lastAttemptedAt?: string;
  attemptsCount?: number;
}

export interface CustomQuizAttemptAnswer {
  questionId: string;
  question: string;
  questionType: CustomQuizQuestionType;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  feedback?: string;
  imageUrl?: string;
}

export interface CustomQuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  correctAnswers: number;
  incorrectAnswers: number;
  recallAccuracy: number;
  timeTaken: number;
  answers: CustomQuizAttemptAnswer[];
  date: string;
  completedAt: string;
}
