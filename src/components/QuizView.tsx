import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Volume2,
  VolumeX,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Award,
  TrendingUp,
  Brain,
  ShieldCheck,
  MoveUp,
  MoveDown,
  Clock,
  Loader2,
  HelpCircle,
  Mic,
  MicOff,
  Camera,
  MessageSquare,
  Radio,
  Check,
  Plus,
} from 'lucide-react';
import {
  QuizQuestion,
  UserQuizAnswer,
  QuizSession,
  UserProfile,
  RoutineQuestion,
  FamilyMember,
  AudioStory,
  ForgottenTopicItem,
} from '../types';
import { sounds, speakText, stopSpeech } from '../utils/soundAndSpeech';
import { apiEvaluateAnswer, apiGenerateQuiz } from '../utils/storage';
import { isSpeechRecognitionSupported, matchSpokenTextToOption } from '../utils/speechRecognition';

interface QuizViewProps {
  questions: QuizQuestion[];
  user: UserProfile;
  routine: RoutineQuestion[];
  family: FamilyMember[];
  audioStories: AudioStory[];
  forgottenTopics: ForgottenTopicItem[];
  onQuizComplete: (session: QuizSession, updatedForgotten: ForgottenTopicItem[]) => void;
  onRefreshQuiz: (newQuestions: QuizQuestion[]) => void;
  onNavigateToDashboard: () => void;
  onCreateCustomQuiz?: () => void;
  onOpenCustomQuizzes?: () => void;
}

export const QuizView: React.FC<QuizViewProps> = ({
  questions,
  user,
  routine,
  family,
  audioStories,
  forgottenTopics,
  onQuizComplete,
  onRefreshQuiz,
  onNavigateToDashboard,
  onCreateCustomQuiz,
  onOpenCustomQuizzes,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [shortAnswerText, setShortAnswerText] = useState<string>('');
  const [sequenceOrder, setSequenceOrder] = useState<string[]>([]);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<{
    isCorrect: boolean;
    accuracyScore: number;
    explanation: string;
  } | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserQuizAnswer[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isQuizFinished, setIsQuizFinished] = useState(false);
  const [isGeneratingNewQuiz, setIsGeneratingNewQuiz] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());

  // Voice Answering States
  const [isListening, setIsListening] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [speechFeedback, setSpeechFeedback] = useState<string | null>(null);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const [isVoiceSupported, setIsVoiceSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  const currentQ = questions[currentIndex] || questions[0];

  useEffect(() => {
    setIsVoiceSupported(isSpeechRecognitionSupported());
  }, []);

  // Initialize question state when index changes
  useEffect(() => {
    if (currentQ && currentQ.type === 'sequence' && currentQ.sequenceItems) {
      const items = [...currentQ.sequenceItems];
      if (items.length > 2) {
        const temp = items[0];
        items[0] = items[1];
        items[1] = temp;
      }
      setSequenceOrder(items);
    } else {
      setSequenceOrder([]);
    }
    setSelectedOption('');
    setShortAnswerText('');
    setIsAnswerSubmitted(false);
    setCurrentFeedback(null);
    setSpeechTranscript('');
    setSpeechFeedback(null);
    setRecognitionError(null);
    if (isListening) {
      stopListening();
    }
  }, [currentIndex, currentQ]);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  // Voice Recognition Handler
  const startListening = () => {
    if (isAnswerSubmitted) return;
    setSpeechFeedback(null);
    setRecognitionError(null);
    setSpeechTranscript('');

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsVoiceSupported(false);
      setRecognitionError(
        'Speech recognition is not natively supported in this browser. You can tap the answers directly or use Chrome/Edge/Safari.'
      );
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;

      // Check if user prefers Hindi or English
      const lang = user.preferredLanguage?.toLowerCase().includes('hi')
        ? 'hi-IN'
        : 'en-US';
      recognition.lang = lang;

      recognition.onstart = () => {
        setIsListening(true);
        sounds.playTap();
      };

      recognition.onresult = (event: any) => {
        let currentText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        setSpeechTranscript(currentText);

        const last = event.results[event.results.length - 1];
        if (last && last.isFinal) {
          handleVoiceInputReceived(currentText);
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setRecognitionError(
            'Microphone access was denied. Please allow microphone permission in your browser.'
          );
        } else if (event.error === 'no-speech') {
          setRecognitionError(
            'No speech detected. Please tap the button again and speak clearly into your device.'
          );
        } else {
          setRecognitionError(`Speech notice: ${event.error}. You can also tap the answer choices.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      setIsListening(false);
      setRecognitionError('Could not start microphone. Please tap your answer directly.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  };

  // Process voice input when received
  const handleVoiceInputReceived = (spokenText: string) => {
    const text = spokenText.trim();
    if (!text || !currentQ) return;

    if (currentQ.type === 'short_answer') {
      // Auto-fill the short answer input box!
      setShortAnswerText(text);
      setSpeechFeedback(`Voice transcribed: "${text}"`);
      sounds.playSuccess();
    } else if (currentQ.options && currentQ.options.length > 0) {
      // Match against multiple choice / true-false options
      const match = matchSpokenTextToOption(text, currentQ.options);
      if (match) {
        setSelectedOption(match.matchedOption);
        setSpeechFeedback(`Recognized: "${text}" → Selected: ${match.matchedOption}`);
        sounds.playSuccess();
      } else {
        setSpeechFeedback(`Heard: "${text}". Tap an option below or speak again.`);
      }
    } else if (currentQ.type === 'sequence') {
      setSpeechFeedback(`Heard: "${text}". Use the up/down arrows to arrange the order.`);
    }
  };

  // Simulation voice trigger for demo / sandbox environments
  const handleSimulatedVoiceAnswer = (sampleText: string) => {
    setSpeechTranscript(sampleText);
    handleVoiceInputReceived(sampleText);
  };

  // Audio Speech synthesis (Read question aloud)
  const handleReadAloud = () => {
    if (isSpeaking) {
      stopSpeech();
      setIsSpeaking(false);
    } else if (currentQ) {
      setIsSpeaking(true);
      let textToRead = `${currentQ.question}. `;

      if (currentQ.spokenHint) {
        textToRead += `Family hint: ${currentQ.spokenHint}. `;
      }

      if (currentQ.options && currentQ.options.length > 0) {
        textToRead += `Options are: ${currentQ.options.join(', ')}.`;
      }
      speakText(textToRead, () => setIsSpeaking(false));
    }
  };

  // Reordering handler for sequence question
  const moveSequenceItem = (index: number, direction: 'up' | 'down') => {
    if (isAnswerSubmitted) return;
    const newItems = [...sequenceOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;
    setSequenceOrder(newItems);
  };

  // Submit Answer
  const handleSubmitAnswer = async () => {
    if (isAnswerSubmitted || !currentQ) return;

    let answerString = '';
    if (currentQ.type === 'sequence') {
      answerString = sequenceOrder.join(' -> ');
    } else if (currentQ.type === 'short_answer') {
      answerString = shortAnswerText.trim() || selectedOption;
    } else {
      answerString = selectedOption;
    }

    if (!answerString) return;

    setIsEvaluating(true);

    let isCorrect = false;
    let accuracyScore = 0;

    if (currentQ.type === 'sequence') {
      const correctStr = (currentQ.correctAnswer || '').toLowerCase().replace(/\s+/g, '');
      const userStr = answerString.toLowerCase().replace(/\s+/g, '');
      isCorrect = correctStr === userStr;
      accuracyScore = isCorrect ? 100 : 40;
    } else if (currentQ.type === 'short_answer') {
      const evalRes = await apiEvaluateAnswer({
        question: currentQ.question,
        expectedAnswer: currentQ.correctAnswer,
        userAnswer: answerString,
        questionType: currentQ.type,
      });
      isCorrect = evalRes.isCorrect;
      accuracyScore = evalRes.accuracyPercent;
    } else {
      isCorrect =
        answerString.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase();
      accuracyScore = isCorrect ? 100 : 0;
    }

    if (isCorrect) {
      sounds.playSuccess();
    } else {
      sounds.playEncouraging();
    }

    const answerRecord: UserQuizAnswer = {
      questionId: currentQ.id,
      userAnswer: answerString,
      isCorrect,
      accuracyScore,
      feedback: currentQ.explanation,
    };

    setUserAnswers((prev) => [...prev, answerRecord]);
    setCurrentFeedback({
      isCorrect,
      accuracyScore,
      explanation: currentQ.explanation,
    });
    setIsAnswerSubmitted(true);
    setIsEvaluating(false);
  };

  // Next Question
  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      finishQuiz();
    }
  };

  // Finish quiz and update adaptive metrics
  const finishQuiz = () => {
    sounds.playFanfare();
    setIsQuizFinished(true);

    const totalQuestions = questions.length;
    const correctCount = userAnswers.filter((a) => a.isCorrect).length;
    const calculatedScore = Math.round((correctCount / totalQuestions) * 100);
    const duration = Math.round((Date.now() - startTime) / 1000);

    const session: QuizSession = {
      id: 'sess_' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      completed: true,
      score: calculatedScore,
      totalQuestions,
      correctCount,
      answers: userAnswers,
      timeTakenSeconds: duration,
    };

    const updatedForgotten: ForgottenTopicItem[] = [...forgottenTopics];
    userAnswers.forEach((ans) => {
      const q = questions.find((item) => item.id === ans.questionId);
      if (!q) return;

      if (!ans.isCorrect) {
        const existingIndex = updatedForgotten.findIndex(
          (f) =>
            f.topic.toLowerCase().includes(q.category.toLowerCase()) ||
            f.correctAnswer.toLowerCase() === q.correctAnswer.toLowerCase()
        );
        if (existingIndex >= 0) {
          updatedForgotten[existingIndex].missCount += 1;
          updatedForgotten[existingIndex].status = 'needs_reinforcement';
          updatedForgotten[existingIndex].lastMissedDate = new Date().toISOString().split('T')[0];
        } else {
          updatedForgotten.push({
            id: 'fg_' + Date.now() + Math.random(),
            topic: q.question,
            category: q.category,
            correctAnswer: q.correctAnswer,
            missCount: 1,
            lastMissedDate: new Date().toISOString().split('T')[0],
            status: 'needs_reinforcement',
          });
        }
      } else {
        const existingIndex = updatedForgotten.findIndex(
          (f) => f.correctAnswer.toLowerCase() === q.correctAnswer.toLowerCase()
        );
        if (existingIndex >= 0) {
          updatedForgotten[existingIndex].status = 'improving';
        }
      }
    });

    onQuizComplete(session, updatedForgotten);
  };

  // Generate next adaptive quiz
  const handleGenerateNextAdaptiveQuiz = async () => {
    setIsGeneratingNewQuiz(true);
    try {
      const result = await apiGenerateQuiz({
        profile: user,
        routine,
        family,
        audioStories,
        forgottenTopics,
      });
      onRefreshQuiz(result.questions);
      setCurrentIndex(0);
      setUserAnswers([]);
      setIsQuizFinished(false);
      setStartTime(Date.now());
    } finally {
      setIsGeneratingNewQuiz(false);
    }
  };

  // Summary View
  if (isQuizFinished) {
    const total = questions.length;
    const correct = userAnswers.filter((a) => a.isCorrect).length;
    const finalScore = Math.round((correct / total) * 100);

    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 md:p-10 shadow-sm text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-teal-50 text-teal-700 flex items-center justify-center mb-4">
            <Award className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>

          <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-100/70 px-3 py-1 rounded-full">
            Quiz Complete
          </span>

          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 mt-3 font-serif">
            Memory Recall Results for {user.name}
          </h2>

          <p className="text-stone-600 text-sm sm:text-base mt-2 max-w-xl mx-auto">
            Wonderful session! Daily engagement stimulates neuroplasticity and strengthens long-term memory retrieval pathways.
          </p>

          <div className="my-6 p-6 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl border border-teal-200 max-w-md mx-auto">
            <span className="text-xs text-stone-500 font-semibold uppercase tracking-wider block">
              Today's Memory Performance Score
            </span>
            <div className="text-5xl sm:text-6xl font-extrabold text-teal-900 mt-2 font-serif">
              {finalScore}%
            </div>
            <p className="text-sm font-medium text-teal-800 mt-2">
              {correct} of {total} Questions Recalled Correctly
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left my-6 text-sm">
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/80">
              <span className="text-xs text-stone-500 block">Recall Accuracy</span>
              <span className="text-lg font-bold text-stone-900 block mt-0.5">
                {finalScore >= 80 ? 'High Recall' : 'Steady Progress'}
              </span>
              <p className="text-xs text-stone-500 mt-1">Consistency maintained</p>
            </div>

            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/80">
              <span className="text-xs text-stone-500 block">Adaptive Engine</span>
              <span className="text-lg font-bold text-teal-800 block mt-0.5">
                Spaced Active
              </span>
              <p className="text-xs text-stone-500 mt-1">Adjusts future questions</p>
            </div>

            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/80">
              <span className="text-xs text-stone-500 block">Next Practice</span>
              <span className="text-lg font-bold text-stone-900 block mt-0.5">Tomorrow</span>
              <p className="text-xs text-stone-500 mt-1">Fresh daily memory prompts</p>
            </div>
          </div>

          <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200/70 text-left text-xs text-stone-600 mb-6 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
            <p>
              <strong>Notice:</strong> This is an AI-based memory engagement and cognitive performance tracking system for wellness and recall practice. It is not a medical diagnosis or clinical assessment.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onNavigateToDashboard}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm sm:text-base shadow-sm transition-colors cursor-pointer"
            >
              View Full Memory Dashboard
            </button>

            <button
              onClick={handleGenerateNextAdaptiveQuiz}
              disabled={isGeneratingNewQuiz}
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-800 font-semibold text-sm sm:text-base transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {isGeneratingNewQuiz ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-teal-700" />
                  Generating New Quiz...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-teal-700" />
                  Generate Next Adaptive Quiz
                </>
              )}
            </button>
          </div>

          {(onCreateCustomQuiz || onOpenCustomQuizzes) && (
            <div className="mt-4 pt-4 border-t border-stone-100 flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs text-stone-500">Want to test personal memories with photos?</span>
              {onCreateCustomQuiz && (
                <button
                  type="button"
                  onClick={onCreateCustomQuiz}
                  className="text-xs font-bold text-teal-800 hover:text-teal-900 underline cursor-pointer"
                >
                  + Create Custom Quiz
                </button>
              )}
              {onOpenCustomQuizzes && (
                <button
                  type="button"
                  onClick={onOpenCustomQuizzes}
                  className="text-xs font-semibold text-stone-600 hover:text-stone-900 underline cursor-pointer"
                >
                  Browse Custom Quizzes
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Banner with prominent + Create Custom Quiz button */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs shrink-0">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
              Daily Memory Quiz
            </span>
            <p className="text-xs text-stone-500">
              Personalized cognitive engagement & spaced repetition
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {onOpenCustomQuizzes && (
            <button
              type="button"
              onClick={onOpenCustomQuizzes}
              className="px-3.5 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              My Custom Quizzes
            </button>
          )}

          {onCreateCustomQuiz && (
            <button
              type="button"
              onClick={onCreateCustomQuiz}
              className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create Custom Quiz</span>
            </button>
          )}
        </div>
      </div>

      {/* Quiz Progress Header */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-md">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span className="text-xs text-stone-500 font-medium hidden sm:inline">
              Category: {currentQ?.category}
            </span>
            {currentQ?.familyMemberName && (
              <span className="text-xs font-semibold text-amber-900 bg-amber-100/70 px-2 py-0.5 rounded-md">
                Family: {currentQ.familyMemberName}
              </span>
            )}
          </div>

          {/* Read Aloud Button */}
          <button
            onClick={handleReadAloud}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              isSpeaking
                ? 'bg-amber-100 text-amber-900 ring-1 ring-amber-300'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
            title="Listen to this question spoken aloud"
          >
            {isSpeaking ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-amber-700" />
                <span>Stop Audio</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-teal-700" />
                <span>Read Aloud</span>
              </>
            )}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-teal-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Question Card */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 md:p-10 shadow-sm">
        {/* Source fact tag */}
        <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-3">
          <Brain className="w-3.5 h-3.5 text-teal-600" />
          <span>{currentQ.memoryFactSource}</span>
        </div>

        {/* Photo Memory Attachment (if question has picture) */}
        {currentQ.imageUrl && (
          <div className="mb-6 rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 shadow-xs">
            <div className="relative">
              <img
                src={currentQ.imageUrl}
                alt={currentQ.question}
                className="w-full max-h-80 object-cover"
              />
              <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-xs text-white text-xs px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-md">
                <Camera className="w-4 h-4 text-amber-300" />
                <span className="font-semibold">
                  {currentQ.familyMemberName
                    ? `Family Memory • ${currentQ.familyMemberName}`
                    : 'Personal Family Photograph'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Question Heading */}
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-stone-900 leading-snug font-serif">
          {currentQ.question}
        </h2>

        {/* Spoken family audio hint if present */}
        {currentQ.spokenHint && (
          <div className="mt-3 p-3 rounded-xl bg-teal-50/80 border border-teal-200 text-xs sm:text-sm text-teal-900 flex items-start gap-2">
            <Volume2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Family Voice Clue: </span>
              <span className="italic">"{currentQ.spokenHint}"</span>
            </div>
          </div>
        )}

        {/* Question Type Instruction */}
        <p className="text-xs sm:text-sm text-stone-500 mt-2">
          {currentQ.type === 'sequence' && 'Tap the up and down arrows to arrange these steps in order.'}
          {currentQ.type === 'multiple_choice' && 'Select the choice or tap the microphone to speak your answer.'}
          {currentQ.type === 'true_false' && 'Decide True or False, or speak "True" or "False" out loud.'}
          {currentQ.type === 'short_answer' && 'Speak your memory aloud using the microphone or type it.'}
          {currentQ.type === 'recall' && 'Select your answer or speak it aloud.'}
        </p>

        {/* ACCESSIBLE VOICE ANSWER ASSISTANT (BOL KAR ANSWER KAREIN) */}
        {!isAnswerSubmitted && (
          <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-50/80 via-teal-50/50 to-stone-50 border-2 border-amber-300/80 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-amber-950 font-bold text-sm sm:text-base">
                  <Mic className="w-4 h-4 text-amber-700" />
                  <span>Speak to Answer (बोलकर उत्तर दें)</span>
                </div>
                <p className="text-xs text-stone-600">
                  Can't type on keyboard or phone? Just speak your answer out loud!
                </p>
              </div>

              {/* Big Tap-to-Speak Button */}
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`px-5 py-3 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all shadow-sm cursor-pointer shrink-0 ${
                  isListening
                    ? 'bg-rose-600 hover:bg-rose-700 text-white ring-4 ring-rose-200 animate-pulse'
                    : 'bg-amber-600 hover:bg-amber-700 text-white ring-2 ring-amber-400'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-5 h-5 animate-bounce" />
                    <span>Listening... (Tap to Stop)</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5" />
                    <span>Tap to Speak Answer</span>
                  </>
                )}
              </button>
            </div>

            {/* Active Speech Indicator & Live Transcript */}
            {isListening && (
              <div className="mt-3 p-3 rounded-xl bg-white border border-rose-200 flex items-center gap-3 animate-in fade-in duration-200">
                <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-rose-800 block">
                    Listening to your voice... Speak clearly:
                  </span>
                  <p className="text-sm font-semibold text-stone-900 italic truncate">
                    {speechTranscript || 'Speak now (say your answer, option letter, or words)...'}
                  </p>
                </div>
              </div>
            )}

            {/* Voice Feedback / Recognition Result */}
            {speechFeedback && !isListening && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex items-center gap-2.5 text-xs sm:text-sm animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="font-semibold">{speechFeedback}</span>
              </div>
            )}

            {/* Recognition error notice */}
            {recognitionError && (
              <div className="mt-3 p-2.5 rounded-xl bg-stone-100 border border-stone-300 text-stone-700 text-xs flex items-center justify-between">
                <span>{recognitionError}</span>
                <button
                  onClick={() => setRecognitionError(null)}
                  className="text-stone-500 hover:text-stone-800 font-bold ml-2"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Quick Speech Simulation Shortcuts (Helpful for demo or when mic permission is blocked) */}
            {currentQ.options && currentQ.options.length > 0 && !isListening && (
              <div className="mt-3 pt-2.5 border-t border-amber-200/60 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-[11px] text-stone-500 font-medium">
                  Voice demo test:
                </span>
                {currentQ.options.slice(0, 3).map((opt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSimulatedVoiceAnswer(opt)}
                    className="px-2.5 py-1 rounded-lg bg-white border border-stone-200 hover:border-amber-400 text-stone-700 hover:text-amber-950 text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    Say "{opt.slice(0, 18)}"
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Input Interface based on type */}
        <div className="mt-6 space-y-3">
          {/* SEQUENCE TYPE */}
          {currentQ.type === 'sequence' && (
            <div className="space-y-2">
              {sequenceOrder.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-stone-50 border border-stone-200 hover:border-teal-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-stone-800 text-sm sm:text-base font-medium">{item}</span>
                  </div>

                  {!isAnswerSubmitted && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveSequenceItem(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg text-stone-600 hover:bg-stone-200 disabled:opacity-30 cursor-pointer"
                        title="Move step earlier"
                      >
                        <MoveUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSequenceItem(idx, 'down')}
                        disabled={idx === sequenceOrder.length - 1}
                        className="p-1.5 rounded-lg text-stone-600 hover:bg-stone-200 disabled:opacity-30 cursor-pointer"
                        title="Move step later"
                      >
                        <MoveDown className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* MULTIPLE CHOICE / TRUE FALSE / RECALL WITH OPTIONS */}
          {(currentQ.type === 'multiple_choice' ||
            currentQ.type === 'true_false' ||
            currentQ.type === 'recall') &&
            currentQ.options && (
              <div className="space-y-3">
                {currentQ.options.map((option, idx) => {
                  const isSelected = selectedOption === option;
                  let optionStyles = 'bg-stone-50 border-stone-200 hover:bg-stone-100/80';

                  if (isAnswerSubmitted) {
                    if (option.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase()) {
                      optionStyles =
                        'bg-emerald-50 border-emerald-300 text-emerald-900 ring-2 ring-emerald-400';
                    } else if (isSelected) {
                      optionStyles = 'bg-rose-50 border-rose-300 text-rose-900';
                    } else {
                      optionStyles = 'opacity-50 bg-stone-50 border-stone-200';
                    }
                  } else if (isSelected) {
                    optionStyles =
                      'bg-teal-50 border-teal-500 ring-2 ring-teal-400 text-teal-950 font-semibold';
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isAnswerSubmitted}
                      onClick={() => {
                        setSelectedOption(option);
                        sounds.playTap();
                      }}
                      className={`w-full text-left p-4 sm:p-5 rounded-2xl border transition-all text-sm sm:text-base flex items-center justify-between cursor-pointer ${optionStyles}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-white border border-stone-300 text-stone-700 font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="text-base font-medium text-stone-900">{option}</span>
                      </div>

                      {isAnswerSubmitted &&
                        option.trim().toLowerCase() ===
                          currentQ.correctAnswer.trim().toLowerCase() && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        )}
                    </button>
                  );
                })}
              </div>
            )}

          {/* SHORT ANSWER TYPE */}
          {currentQ.type === 'short_answer' && (
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  disabled={isAnswerSubmitted}
                  value={shortAnswerText}
                  onChange={(e) => setShortAnswerText(e.target.value)}
                  placeholder="Speak answer using microphone above, or type here..."
                  className="w-full p-4 rounded-2xl border border-stone-300 focus:border-teal-600 text-base sm:text-lg bg-stone-50/50 pr-12"
                />
                {!isAnswerSubmitted && (
                  <button
                    type="button"
                    onClick={isListening ? stopListening : startListening}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl text-stone-500 hover:text-amber-700 hover:bg-stone-100"
                    title="Speak into microphone"
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Helpful options pill hints */}
              {currentQ.options && (
                <div>
                  <span className="text-xs text-stone-500 font-medium block mb-2">
                    Or select a suggested recall keyword:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {currentQ.options.map((opt, i) => (
                      <button
                        key={i}
                        type="button"
                        disabled={isAnswerSubmitted}
                        onClick={() => {
                          setShortAnswerText(opt);
                          setSelectedOption(opt);
                          sounds.playTap();
                        }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                          shortAnswerText === opt
                            ? 'bg-teal-700 text-white border-teal-700'
                            : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Feedback Section (after submission) */}
        {isAnswerSubmitted && currentFeedback && (
          <div
            className={`mt-6 p-4 sm:p-5 rounded-2xl border transition-all ${
              currentFeedback.isCorrect
                ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                : 'bg-amber-50/90 border-amber-200 text-amber-950'
            }`}
          >
            <div className="flex items-start gap-3">
              {currentFeedback.isCorrect ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <HelpCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-bold text-base">
                  {currentFeedback.isCorrect ? 'Spot on! Correct Recall' : 'Good Try! Here is the detail'}
                </p>
                <p className="mt-1 text-sm sm:text-base leading-relaxed text-stone-700">
                  {currentFeedback.explanation}
                </p>
                {!currentFeedback.isCorrect && (
                  <p className="mt-2 text-xs font-semibold text-teal-800 bg-white/70 p-2 rounded-lg border border-stone-200">
                    💡 Fact recorded in your circle: "{currentQ.correctAnswer}"
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Buttons Footer */}
        <div className="mt-8 pt-6 border-t border-stone-200 flex items-center justify-between gap-4">
          <span className="text-xs text-stone-500 font-medium">
            Take your time — there is no time limit.
          </span>

          {!isAnswerSubmitted ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={
                isEvaluating ||
                (currentQ.type === 'sequence'
                  ? sequenceOrder.length === 0
                  : currentQ.type === 'short_answer'
                  ? !shortAnswerText.trim() && !selectedOption
                  : !selectedOption)
              }
              className="px-6 py-3.5 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:opacity-40 text-white font-bold text-sm sm:text-base transition-all shadow-xs cursor-pointer"
            >
              {isEvaluating ? 'Evaluating recall...' : 'Confirm Answer'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm sm:text-base transition-all shadow-xs cursor-pointer"
            >
              <span>
                {currentIndex + 1 < questions.length ? 'Next Question' : 'View Results'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
