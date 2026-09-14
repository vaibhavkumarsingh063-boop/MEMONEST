import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  MoveUp,
  MoveDown,
  RotateCcw,
  Award,
  Clock,
  Brain,
  ShieldCheck,
  ZoomIn,
  X,
  Loader2,
  Image as ImageIcon,
  Check,
} from 'lucide-react';
import {
  CustomQuiz,
  CustomQuizQuestion,
  CustomQuizAttempt,
  UserProfile,
} from '../../types';
import { customQuizApi, SubmitAttemptResponse } from '../../utils/customQuizApi';

interface CustomQuizPlayerProps {
  quiz: CustomQuiz;
  user: UserProfile;
  textSize?: 'normal' | 'large' | 'xlarge';
  onBackToLibrary: () => void;
  onNavigateToDashboard?: () => void;
}

// Simple Web Audio Sound Effects
class PlayerSounds {
  private ctx: AudioContext | null = null;

  private getContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    return this.ctx;
  }

  playSuccess() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1); // E5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.2); // G5
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // Ignore
    }
  }

  playEncouraging() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now); // A4
      osc.frequency.exponentialRampToValueAtTime(392, now + 0.15); // G4
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch {
      // Ignore
    }
  }
}

const sounds = new PlayerSounds();

export const CustomQuizPlayer: React.FC<CustomQuizPlayerProps> = ({
  quiz,
  user,
  textSize = 'normal',
  onBackToLibrary,
  onNavigateToDashboard,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [sequenceOrders, setSequenceOrders] = useState<Record<string, string[]>>({});
  const [revealedHints, setRevealedHints] = useState<Record<string, boolean>>({});

  // Submitting and results
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmitAttemptResponse | null>(null);

  // Timer
  const [startTime] = useState(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Lightbox for image zooming
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Audio Speech Synthesis
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Voice recording for short answer
  const [isListening, setIsListening] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  const currentQ: CustomQuizQuestion | undefined = quiz.questions[currentIndex];
  const totalQuestions = quiz.questions.length;

  // Text size classes
  const fontSizes = {
    normal: { title: 'text-xl sm:text-2xl', body: 'text-sm sm:text-base' },
    large: { title: 'text-2xl sm:text-3xl', body: 'text-base sm:text-lg' },
    xlarge: { title: 'text-3xl sm:text-4xl', body: 'text-lg sm:text-xl' },
  }[textSize];

  // Timer interval
  useEffect(() => {
    if (submissionResult) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.round((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, submissionResult]);

  // Initialize sequence orders
  useEffect(() => {
    if (currentQ?.questionType === 'sequence' && currentQ.sequenceItems) {
      if (!sequenceOrders[currentQ.id]) {
        // Shuffle initially for interactive rearrangement
        const shuffled = [...currentQ.sequenceItems].sort(() => Math.random() - 0.5);
        setSequenceOrders((prev) => ({ ...prev, [currentQ.id]: shuffled }));
      }
    }
  }, [currentIndex, currentQ]);

  // Voice Speech Recognition Setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (currentQ) {
            setAnswers((prev) => ({ ...prev, [currentQ.id]: transcript }));
            setSpeechTranscript(transcript);
          }
          setIsListening(false);
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognitionRef.current = recognition;
      }
    }
  }, [currentQ]);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Voice speech recognition is not supported in this browser.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setSpeechTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Text-To-Speech (Read Aloud)
  const handleReadAloud = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!currentQ) return;
    setIsSpeaking(true);
    let text = `${currentQ.question}. `;

    if (currentQ.options && currentQ.options.length > 0) {
      text += `Options are: ${currentQ.options.join(', ')}.`;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  // Move sequence item
  const moveSequenceItem = (qId: string, itemIdx: number, dir: 'up' | 'down') => {
    const list = sequenceOrders[qId] || currentQ?.sequenceItems || [];
    const targetIdx = dir === 'up' ? itemIdx - 1 : itemIdx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const next = [...list];
    const temp = next[itemIdx];
    next[itemIdx] = next[targetIdx];
    next[targetIdx] = temp;
    setSequenceOrders((prev) => ({ ...prev, [qId]: next }));
    setAnswers((prev) => ({ ...prev, [qId]: next.join(' -> ') }));
  };

  // Submit Quiz Attempt
  const handleSubmitQuiz = async () => {
    setIsSubmitting(true);
    try {
      // Build answers array
      const answerPayload = quiz.questions.map((q) => {
        let userAns = answers[q.id] || '';
        if (q.questionType === 'sequence') {
          userAns = (sequenceOrders[q.id] || q.sequenceItems || []).join(' -> ');
        }
        return {
          questionId: q.id,
          userAnswer: userAns,
        };
      });

      const res = await customQuizApi.submitQuizAttempt(
        quiz.id,
        answerPayload,
        elapsedSeconds
      );

      if (res.attempt.score >= 70) {
        sounds.playSuccess();
      } else {
        sounds.playEncouraging();
      }

      setSubmissionResult(res);
    } catch (err: any) {
      alert(err.message || 'Failed to submit quiz attempt.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Find image for current question
  const currentImage = quiz.images?.find((img) => img.id === currentQ?.imageId);
  const currentImageUrl = currentQ?.imageUrl || currentImage?.imageUrl;

  // ================= RESULTS VIEW =================
  if (submissionResult) {
    const { attempt, quiz: updatedQuiz, missedQuestions, improvedMemoryIntegrated } =
      submissionResult;

    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-10 shadow-sm text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-teal-50 text-teal-700 flex items-center justify-center mb-4">
            <Award className="w-10 h-10" />
          </div>

          <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-100/70 px-3 py-1 rounded-full">
            Custom Quiz Completed
          </span>

          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 mt-3 font-serif">
            {quiz.title}
          </h2>

          <p className="text-stone-600 text-sm sm:text-base mt-1.5 max-w-md mx-auto">
            Wonderful session, {user.name}! Engaging with your personalized memories strengthens recall pathways and neuroplasticity.
          </p>

          {/* Big Score Card */}
          <div className="my-6 p-6 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl border border-teal-200 max-w-md mx-auto">
            <span className="text-xs text-stone-500 font-semibold uppercase tracking-wider block">
              Recall Performance Score
            </span>
            <div className="text-5xl sm:text-6xl font-extrabold text-teal-900 mt-2 font-serif">
              {attempt.score}%
            </div>
            <p className="text-sm font-medium text-teal-800 mt-2">
              {attempt.correctAnswers} of {quiz.questions.length} Questions Recalled Correctly
            </p>
          </div>

          {/* Stat Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left my-6 text-sm">
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
              <span className="text-xs text-stone-500 block">Time Taken</span>
              <span className="text-lg font-bold text-stone-900 block mt-0.5">
                {formatTime(attempt.timeTaken)}
              </span>
              <p className="text-xs text-stone-400 mt-1">Calm, steady pace</p>
            </div>

            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
              <span className="text-xs text-stone-500 block">Recall Accuracy</span>
              <span className="text-lg font-bold text-teal-800 block mt-0.5">
                {attempt.score >= 75 ? 'Strong Recall' : 'Steady Retention'}
              </span>
              <p className="text-xs text-stone-400 mt-1">Semantic evaluation</p>
            </div>

            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
              <span className="text-xs text-stone-500 block">Best Quiz Score</span>
              <span className="text-lg font-bold text-stone-900 block mt-0.5">
                {updatedQuiz.bestScore}%
              </span>
              <p className="text-xs text-stone-400 mt-1">Lifetime personal best</p>
            </div>
          </div>

          {/* Adaptive Integration Banner */}
          {improvedMemoryIntegrated && missedQuestions.length > 0 && (
            <div className="p-4 bg-teal-50/80 border border-teal-200 rounded-2xl text-left text-xs text-stone-700 mb-6 flex items-start gap-3">
              <Brain className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-teal-900 block">
                  Adaptive Memory Engine Updated
                </strong>
                <p className="mt-0.5 leading-relaxed">
                  We noted {missedQuestions.length} detail{missedQuestions.length === 1 ? '' : 's'} you missed. Because "Improve future memory exercises" was enabled, these topics will be gently revisited in your future daily routine recall sessions.
                </p>
              </div>
            </div>
          )}

          {/* Detailed Question Review */}
          <div className="text-left mt-8 pt-6 border-t border-stone-200">
            <h3 className="text-base font-bold font-serif text-stone-900 mb-4">
              Question-by-Question Review
            </h3>

            <div className="space-y-3">
              {attempt.answers.map((ans, idx) => (
                <div
                  key={ans.questionId || idx}
                  className={`p-4 rounded-2xl border text-xs sm:text-sm ${
                    ans.isCorrect
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-amber-50/40 border-amber-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <span className="mt-0.5">
                        {ans.isCorrect ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        )}
                      </span>
                      <div>
                        <p className="font-semibold text-stone-900">
                          {idx + 1}. {ans.question}
                        </p>
                        <div className="mt-1 space-y-0.5 text-xs">
                          <p>
                            <span className="text-stone-500 font-medium">Your answer: </span>
                            <span
                              className={`font-semibold ${
                                ans.isCorrect ? 'text-emerald-800' : 'text-amber-800'
                              }`}
                            >
                              {ans.userAnswer || '(Skipped)'}
                            </span>
                          </p>
                          {!ans.isCorrect && (
                            <p>
                              <span className="text-stone-500 font-medium">Expected: </span>
                              <span className="font-semibold text-teal-900">
                                {ans.correctAnswer}
                              </span>
                            </p>
                          )}
                          {ans.feedback && (
                            <p className="text-stone-600 mt-1 italic">
                              "{ans.feedback}"
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {ans.imageUrl && (
                      <img
                        src={ans.imageUrl}
                        alt="Question context"
                        className="w-12 h-12 rounded-lg object-cover shrink-0 border border-stone-200"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 pt-6 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onBackToLibrary}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm shadow-xs transition-colors cursor-pointer"
            >
              Back to Custom Quizzes
            </button>

            <button
              onClick={() => {
                setSubmissionResult(null);
                setCurrentIndex(0);
                setAnswers({});
                setSequenceOrders({});
                setRevealedHints({});
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-800 font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-teal-700" />
              <span>Retry Quiz</span>
            </button>

            {onNavigateToDashboard && (
              <button
                onClick={onNavigateToDashboard}
                className="w-full sm:w-auto px-5 py-3 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold text-sm transition-colors cursor-pointer"
              >
                View Dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ================= ACTIVE QUIZ PLAYER VIEW =================
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Header Card: Progress & Timer */}
      <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-xs">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-md">
              Question {currentIndex + 1} of {totalQuestions}
            </span>
            <span className="text-xs text-stone-500 font-medium hidden sm:inline truncate max-w-[200px]">
              {quiz.title}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Timer */}
            <span className="text-xs font-semibold text-stone-500 flex items-center gap-1 bg-stone-100 px-2.5 py-1 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              <span>{formatTime(elapsedSeconds)}</span>
            </span>

            {/* Read Aloud Button */}
            <button
              onClick={handleReadAloud}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                isSpeaking
                  ? 'bg-amber-100 text-amber-900 ring-1 ring-amber-300'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
              title="Listen to this question spoken aloud"
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-amber-700" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-teal-700" />
                  <span>Read Aloud</span>
                </>
              )}
            </button>

            <button
              onClick={onBackToLibrary}
              className="text-stone-400 hover:text-stone-600 text-xs font-semibold px-2 py-1 rounded-lg hover:bg-stone-100 transition-colors"
            >
              Exit
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-teal-700 h-full rounded-full transition-all duration-300"
            style={{
              width: `${Math.round(((currentIndex + 1) / totalQuestions) * 100)}%`,
            }}
          />
        </div>
      </div>

      {/* Main Question Card */}
      {currentQ && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6">
          {/* Photo Preview if attached */}
          {currentImageUrl && (
            <div className="relative rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 group max-h-72 flex items-center justify-center">
              <img
                src={currentImageUrl}
                alt="Memory reference"
                className="w-full h-full max-h-72 object-cover"
              />
              <button
                onClick={() => setLightboxImage(currentImageUrl)}
                className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white text-xs font-semibold flex items-center gap-1.5 backdrop-blur-xs transition-colors cursor-pointer shadow-md"
              >
                <ZoomIn className="w-3.5 h-3.5" />
                <span>Zoom Photo</span>
              </button>
            </div>
          )}

          {/* Question Text */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md">
                {currentQ.questionType.replace('_', ' ')}
              </span>
            </div>
            <h2 className={`font-bold font-serif text-stone-900 leading-snug ${fontSizes.title}`}>
              {currentQ.question}
            </h2>
          </div>

          {/* Answer Controls based on Type */}

          {/* 1. Multiple Choice */}
          {currentQ.questionType === 'multiple_choice' && currentQ.options && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {currentQ.options.map((opt, optIdx) => {
                const isSelected = answers[currentQ.id] === opt;
                return (
                  <button
                    key={optIdx}
                    onClick={() =>
                      setAnswers((prev) => ({ ...prev, [currentQ.id]: opt }))
                    }
                    className={`p-4 rounded-2xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50 text-teal-950 ring-2 ring-teal-600/30 font-bold'
                        : 'border-stone-200 bg-white hover:border-teal-400 hover:bg-stone-50/60 text-stone-800'
                    }`}
                  >
                    <span className={fontSizes.body}>{opt}</span>
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 ml-2 ${
                        isSelected
                          ? 'bg-teal-700 text-white'
                          : 'border border-stone-300'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* 2. True / False */}
          {currentQ.questionType === 'true_false' && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              {['True', 'False'].map((val) => {
                const isSelected = answers[currentQ.id] === val;
                return (
                  <button
                    key={val}
                    onClick={() =>
                      setAnswers((prev) => ({ ...prev, [currentQ.id]: val }))
                    }
                    className={`py-5 rounded-2xl text-center border font-bold text-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50 text-teal-950 ring-2 ring-teal-600/30'
                        : 'border-stone-200 bg-white hover:border-teal-400 hover:bg-stone-50 text-stone-800'
                    }`}
                  >
                    <span>{val}</span>
                    {isSelected && <Check className="w-4 h-4 text-teal-700" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* 3. Short Answer & Recall */}
          {(currentQ.questionType === 'short_answer' ||
            currentQ.questionType === 'recall') && (
            <div className="space-y-3 pt-2">
              <div className="relative">
                <input
                  type="text"
                  value={answers[currentQ.id] || ''}
                  onChange={(e) =>
                    setAnswers({ ...answers, [currentQ.id]: e.target.value })
                  }
                  placeholder="Type your answer or speak aloud..."
                  className={`w-full px-4 py-3.5 pr-14 rounded-2xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-600/30 text-stone-900 bg-white ${fontSizes.body}`}
                />
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-colors cursor-pointer ${
                    isListening
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                  }`}
                  title="Speak answer with microphone"
                >
                  {isListening ? (
                    <Mic className="w-4 h-4 text-white" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>
              </div>

              {isListening && (
                <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5 animate-pulse">
                  <span>Listening... Speak your answer clearly.</span>
                </p>
              )}

              <p className="text-xs text-stone-400">
                MemoryMate AI uses semantic intelligence to evaluate meaning, so conversational answers are warmly accepted.
              </p>
            </div>
          )}

          {/* 4. Sequence */}
          {currentQ.questionType === 'sequence' && (
            <div className="space-y-2 pt-2">
              <p className="text-xs text-stone-500 font-semibold mb-2">
                Use the up/down arrow buttons to arrange items into the correct order:
              </p>

              {(
                sequenceOrders[currentQ.id] ||
                currentQ.sequenceItems ||
                []
              ).map((step, sIdx, arr) => (
                <div
                  key={sIdx}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-stone-200 bg-stone-50/50 hover:bg-stone-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center">
                      {sIdx + 1}
                    </span>
                    <span className="text-sm font-semibold text-stone-900">{step}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveSequenceItem(currentQ.id, sIdx, 'up')}
                      disabled={sIdx === 0}
                      className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-200 disabled:opacity-30 cursor-pointer"
                    >
                      <MoveUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSequenceItem(currentQ.id, sIdx, 'down')}
                      disabled={sIdx === arr.length - 1}
                      className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-200 disabled:opacity-30 cursor-pointer"
                    >
                      <MoveDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Hint Section */}
          {currentQ.hint && (
            <div className="pt-2">
              {revealedHints[currentQ.id] ? (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2 animate-in fade-in">
                  <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold">Gentle Clue:</strong>
                    <span className="mt-0.5 leading-relaxed">{currentQ.hint}</span>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    setRevealedHints((prev) => ({ ...prev, [currentQ.id]: true }))
                  }
                  className="text-xs font-semibold text-teal-800 hover:text-teal-900 flex items-center gap-1.5 underline cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Need a gentle clue?</span>
                </button>
              )}
            </div>
          )}

          {/* Navigation Controls */}
          <div className="pt-6 border-t border-stone-100 flex items-center justify-between gap-3">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="px-5 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 font-semibold text-sm transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {currentIndex < totalQuestions - 1 ? (
              <button
                onClick={() => setCurrentIndex((prev) => prev + 1)}
                className="px-6 py-3 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span>Next Question</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmitQuiz}
                disabled={isSubmitting}
                className="px-7 py-3 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-stone-900" />
                    <span>Evaluating Answers...</span>
                  </>
                ) : (
                  <>
                    <Award className="w-4 h-4 text-stone-900" />
                    <span>Submit & View Results</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Photo Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-stone-900 rounded-3xl overflow-hidden p-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black text-white transition-colors cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={lightboxImage}
              alt="Memory Zoom"
              className="max-h-[85vh] w-auto mx-auto object-contain rounded-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
