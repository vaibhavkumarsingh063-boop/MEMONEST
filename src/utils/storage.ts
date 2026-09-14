import {
  UserProfile,
  FamilyMember,
  RoutineQuestion,
  AudioStory,
  QuizQuestion,
  ForgottenTopicItem,
  QuizSession,
} from '../types';
import {
  INITIAL_USER,
  INITIAL_FAMILY,
  INITIAL_ROUTINE,
  INITIAL_AUDIO_STORIES,
  INITIAL_FORGOTTEN_TOPICS,
  INITIAL_TODAYS_QUIZ,
  INITIAL_WEEKLY_PROGRESS,
} from '../data/initialData';

const STORAGE_KEYS = {
  USER: 'mindrecall_user_v1',
  FAMILY: 'mindrecall_family_v1',
  ROUTINE: 'mindrecall_routine_v1',
  STORIES: 'mindrecall_stories_v1',
  FORGOTTEN: 'mindrecall_forgotten_v1',
  SESSIONS: 'mindrecall_sessions_v1',
  CURRENT_QUIZ: 'mindrecall_current_quiz_v1',
  WEEKLY: 'mindrecall_weekly_v1',
  TEXT_SIZE: 'mindrecall_text_size_v1',
};

// Safe storage retrieval
export function loadUser(): UserProfile {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USER);
    if (data) return JSON.parse(data);
  } catch {}
  return INITIAL_USER;
}

export function saveUser(user: UserProfile) {
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

export function loadFamily(): FamilyMember[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.FAMILY);
    if (data) return JSON.parse(data);
  } catch {}
  return INITIAL_FAMILY;
}

export function saveFamily(family: FamilyMember[]) {
  localStorage.setItem(STORAGE_KEYS.FAMILY, JSON.stringify(family));
}

export function loadRoutine(): RoutineQuestion[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ROUTINE);
    if (data) return JSON.parse(data);
  } catch {}
  return INITIAL_ROUTINE;
}

export function saveRoutine(routine: RoutineQuestion[]) {
  localStorage.setItem(STORAGE_KEYS.ROUTINE, JSON.stringify(routine));
}

export function loadStories(): AudioStory[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.STORIES);
    if (data) return JSON.parse(data);
  } catch {}
  return INITIAL_AUDIO_STORIES;
}

export function saveStories(stories: AudioStory[]) {
  localStorage.setItem(STORAGE_KEYS.STORIES, JSON.stringify(stories));
}

export function loadForgottenTopics(): ForgottenTopicItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.FORGOTTEN);
    if (data) return JSON.parse(data);
  } catch {}
  return INITIAL_FORGOTTEN_TOPICS;
}

export function saveForgottenTopics(items: ForgottenTopicItem[]) {
  localStorage.setItem(STORAGE_KEYS.FORGOTTEN, JSON.stringify(items));
}

export function loadCurrentQuiz(): QuizQuestion[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_QUIZ);
    if (data) return JSON.parse(data);
  } catch {}
  return INITIAL_TODAYS_QUIZ;
}

export function saveCurrentQuiz(quiz: QuizQuestion[]) {
  localStorage.setItem(STORAGE_KEYS.CURRENT_QUIZ, JSON.stringify(quiz));
}

export function loadSessions(): QuizSession[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    if (data) return JSON.parse(data);
  } catch {}
  return [
    {
      id: 'sess_prev_01',
      date: '2026-09-13',
      completed: true,
      score: 92,
      totalQuestions: 5,
      correctCount: 4,
      timeTakenSeconds: 95,
      answers: [],
    },
    {
      id: 'sess_prev_02',
      date: '2026-09-12',
      completed: true,
      score: 88,
      totalQuestions: 5,
      correctCount: 4,
      timeTakenSeconds: 110,
      answers: [],
    },
  ];
}

export function saveSessions(sessions: QuizSession[]) {
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
}

export function loadWeeklyProgress() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.WEEKLY);
    if (data) return JSON.parse(data);
  } catch {}
  return INITIAL_WEEKLY_PROGRESS;
}

export function saveWeeklyProgress(weekly: any) {
  localStorage.setItem(STORAGE_KEYS.WEEKLY, JSON.stringify(weekly));
}

export function resetAllData() {
  localStorage.removeItem(STORAGE_KEYS.USER);
  localStorage.removeItem(STORAGE_KEYS.FAMILY);
  localStorage.removeItem(STORAGE_KEYS.ROUTINE);
  localStorage.removeItem(STORAGE_KEYS.STORIES);
  localStorage.removeItem(STORAGE_KEYS.FORGOTTEN);
  localStorage.removeItem(STORAGE_KEYS.SESSIONS);
  localStorage.removeItem(STORAGE_KEYS.CURRENT_QUIZ);
  localStorage.removeItem(STORAGE_KEYS.WEEKLY);
  localStorage.removeItem(STORAGE_KEYS.TEXT_SIZE);
}

export function saveTextSizePreference(size: string) {
  localStorage.setItem(STORAGE_KEYS.TEXT_SIZE, size);
}

export function loadTextSizePreference(): 'normal' | 'large' | 'xlarge' {
  try {
    const size = localStorage.getItem(STORAGE_KEYS.TEXT_SIZE);
    if (size === 'large' || size === 'xlarge') return size;
  } catch {}
  return 'normal';
}

// Convenient aggregate loaders and aliases
export const saveUserProfile = saveUser;
export const saveQuizQuestions = saveCurrentQuiz;
export const saveQuizSessions = saveSessions;
export const saveAudioStories = saveStories;
export const resetToDefaults = resetAllData;

export function getInitialState() {
  return {
    user: loadUser(),
    family: loadFamily(),
    routine: loadRoutine(),
    audioStories: loadStories(),
    forgottenTopics: loadForgottenTopics(),
    quizQuestions: loadCurrentQuiz(),
    sessions: loadSessions(),
    weeklyProgress: loadWeeklyProgress(),
    textSize: loadTextSizePreference(),
  };
}

// API interaction with server
export async function apiGenerateQuiz(params: {
  profile: UserProfile;
  routine: RoutineQuestion[];
  family: FamilyMember[];
  audioStories: AudioStory[];
  forgottenTopics: ForgottenTopicItem[];
}): Promise<{ questions: QuizQuestion[]; source: string }> {
  try {
    const res = await fetch('/api/ai/generate-quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        return { questions: data.questions, source: data.source || 'ai' };
      }
    }
  } catch (err) {
    console.warn('API quiz generation error, falling back to local heuristic:', err);
  }

  // Local fallback questions
  return {
    questions: INITIAL_TODAYS_QUIZ,
    source: 'local-heuristic',
  };
}

export async function apiAnalyzeStory(params: {
  storyText: string;
  title: string;
  date: string;
}): Promise<any> {
  try {
    const res = await fetch('/api/ai/analyze-story', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (res.ok) {
      const data = await res.json();
      return data.analysis;
    }
  } catch (err) {
    console.warn('API story analysis fallback:', err);
  }

  return {
    summary: params.storyText.slice(0, 100) + '...',
    entities: {
      people: ['Family'],
      places: ['Home', 'Garden'],
      activities: ['Daily reflection'],
      objects: ['Memory items'],
      sentiment: 'Warm',
    },
    extractedFacts: ['Recorded personal memory reflection'],
    suggestedRecallQuestions: [
      {
        question: `What was the central theme of your story "${params.title}"?`,
        expectedAnswer: 'Personal daily memories',
        type: 'multiple_choice',
        options: ['Personal daily memories', 'Work conference', 'Car repairs', 'International airport'],
      },
    ],
  };
}

export async function apiEvaluateAnswer(params: {
  question: string;
  expectedAnswer: string;
  userAnswer: string;
  questionType: string;
}): Promise<{ isCorrect: boolean; accuracyPercent: number; feedback: string }> {
  try {
    const res = await fetch('/api/ai/evaluate-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (res.ok) {
      const data = await res.json();
      return data.result;
    }
  } catch (e) {
    console.warn('Evaluation API failed, checking locally:', e);
  }

  const u = (params.userAnswer || '').trim().toLowerCase();
  const e = (params.expectedAnswer || '').trim().toLowerCase();
  const isCorrect = u === e || u.includes(e) || e.includes(u);
  return {
    isCorrect,
    accuracyPercent: isCorrect ? 100 : 0,
    feedback: isCorrect
      ? 'Correct! Wonderful recall.'
      : `Good effort! The recorded detail was "${params.expectedAnswer}".`,
  };
}
