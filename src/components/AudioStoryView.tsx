import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Play,
  Pause,
  Save,
  Trash2,
  Sparkles,
  Volume2,
  Calendar,
  Clock,
  CheckCircle2,
  Brain,
  FileText,
  AlertCircle,
  HelpCircle,
  Loader2,
} from 'lucide-react';
import { AudioStory, QuizQuestion } from '../types';
import { apiAnalyzeStory } from '../utils/storage';
import { speakText } from '../utils/soundAndSpeech';

interface AudioStoryViewProps {
  stories: AudioStory[];
  onSaveStory: (story: AudioStory, newQuestions?: QuizQuestion[]) => void;
  onDeleteStory: (storyId: string) => void;
}

export const AudioStoryView: React.FC<AudioStoryViewProps> = ({
  stories,
  onSaveStory,
  onDeleteStory,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [isPlayingRecorded, setIsPlayingRecorded] = useState(false);
  const [storyTitle, setStoryTitle] = useState('');
  const [storyTranscript, setStoryTranscript] = useState('');
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [analyzedResult, setAnalyzedResult] = useState<any | null>(null);
  const [selectedStoryForDetail, setSelectedStoryForDetail] = useState<AudioStory | null>(null);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Sample prompt ideas for the senior user to spark stories
  const storyPrompts = [
    '“Today I went to the market with my brother and bought some books...”',
    '“This afternoon, I sat in the sunroom and drank chamomile tea while listening to birds...”',
    '“We baked lemon cookies with Maya using fresh lemons from her terrace...”',
    '“I walked down Oak Street to the public library and saw the blooming flowers...”',
  ];

  // Recording Timer
  useEffect(() => {
    if (isRecording) {
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isRecording]);

  // Start Recording
  const startRecording = async () => {
    try {
      setMicPermissionDenied(false);
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioBlobUrl(url);

        // If no transcript entered yet, populate with a conversational sample template
        if (!storyTranscript.trim()) {
          setStoryTranscript(
            'Today I went to the local market with my brother Rahul. The weather was bright and sunny. We bought some fresh apples, a loaf of warm sourdough bread, and two mystery novels from the bookstall.'
          );
        }
        if (!storyTitle.trim()) {
          setStoryTitle("Market Trip with Rahul");
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      setAudioBlobUrl(null);
    } catch (err: any) {
      console.warn('Microphone access denied or unavailable:', err);
      setMicPermissionDenied(true);
      // Still allow recording simulation for testing
      setIsRecording(true);
      setRecordingSeconds(0);
    }
  };

  // Stop Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    } else {
      // simulated fallback
      if (!storyTranscript.trim()) {
        setStoryTranscript(
          'Today I went to the local market with my brother Rahul. We bought some fresh apples, warm sourdough bread, and two mystery novels from the bookstall.'
        );
      }
      if (!storyTitle.trim()) {
        setStoryTitle('Afternoon Walk & Market Visit');
      }
    }
    setIsRecording(false);
  };

  // Playback recorded audio
  const togglePlayback = () => {
    if (!audioBlobUrl) return;
    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new Audio(audioBlobUrl);
      audioPlayerRef.current.onended = () => setIsPlayingRecorded(false);
    }

    if (isPlayingRecorded) {
      audioPlayerRef.current.pause();
      setIsPlayingRecorded(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlayingRecorded(true);
    }
  };

  // Analyze with AI and Extract Memory Recall Questions
  const handleAnalyzeStory = async () => {
    if (!storyTranscript.trim()) return;
    setIsAnalyzingAI(true);
    try {
      const title = storyTitle.trim() || "Today's Story";
      const date = new Date().toISOString().split('T')[0];
      const analysis = await apiAnalyzeStory({
        storyText: storyTranscript,
        title,
        date,
      });
      setAnalyzedResult(analysis);
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  // Save story to persistent records
  const handleSave = () => {
    if (!storyTranscript.trim()) return;

    const title = storyTitle.trim() || 'Daily Spoken Memory';
    const date = new Date().toISOString().split('T')[0];
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Format new quiz questions if extracted
    const newQuizQuestions: QuizQuestion[] = [];
    if (analyzedResult?.suggestedRecallQuestions) {
      analyzedResult.suggestedRecallQuestions.forEach((q: any, i: number) => {
        newQuizQuestions.push({
          id: `q_audio_${Date.now()}_${i}`,
          type: q.type || 'multiple_choice',
          category: 'Audio Memories',
          question: q.question,
          options: q.options || [q.expectedAnswer, 'Other activity', 'Nobody', 'Different day'],
          correctAnswer: q.expectedAnswer,
          explanation: `Extracted from your recorded story "${title}". Remembering your own stories strengthens episodic memory.`,
          memoryFactSource: `Audio Story: ${title}`,
        });
      });
    }

    const newStory: AudioStory = {
      id: 'story_' + Date.now(),
      title,
      date,
      timestamp: `${date} at ${timestamp}`,
      durationSeconds: recordingSeconds || 45,
      transcript: storyTranscript,
      audioBlobUrl: audioBlobUrl || undefined,
      aiAnalysis: analyzedResult || undefined,
    };

    onSaveStory(newStory, newQuizQuestions);

    // Reset recording form
    setStoryTitle('');
    setStoryTranscript('');
    setAudioBlobUrl(null);
    setAnalyzedResult(null);
    setRecordingSeconds(0);
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-900 text-xs font-semibold mb-2">
              <Mic className="w-3.5 h-3.5 text-amber-700" />
              Episodic Memory Audio Journal
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 font-serif">
              Record Today's Story & Memories
            </h1>
            <p className="text-sm sm:text-base text-stone-600 mt-1 max-w-2xl">
              Speaking about your day exercises verbal memory. Our AI analyzes your voice stories to extract people, places, and facts for future personalized recall quizzes.
            </p>
          </div>
        </div>
      </div>

      {/* Main Recording Station */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs">
        <h2 className="text-lg sm:text-xl font-bold text-stone-900 font-serif mb-4 flex items-center gap-2">
          <Mic className="w-5 h-5 text-teal-700" />
          <span>Active Recording Booth</span>
        </h2>

        {micPermissionDenied && (
          <div className="mb-4 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              Microphone permission was not granted or not detected. You can still test the complete AI analysis and recall question generation below!
            </span>
          </div>
        )}

        {/* Big Tactile Record Button & Visualizer */}
        <div className="p-6 sm:p-8 bg-stone-50 rounded-2xl border border-stone-200/80 flex flex-col items-center justify-center text-center">
          {/* Animated Waveform Bars when Recording */}
          {isRecording ? (
            <div className="flex items-center gap-1.5 h-12 mb-4">
              {[40, 70, 95, 55, 80, 100, 65, 85, 45, 90, 60, 75].map((h, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-rose-500 rounded-full animate-pulse-bar"
                  style={{
                    height: `${h}%`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-stone-400 mb-4 flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4" />
              <span>Tap the red button below and speak clearly about your day</span>
            </div>
          )}

          {/* Time Counter */}
          <div className="text-3xl sm:text-4xl font-extrabold text-stone-900 font-mono tracking-tight mb-4">
            {formatTime(recordingSeconds)}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            {!isRecording ? (
              <button
                type="button"
                onClick={startRecording}
                className="px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-base shadow-md hover:shadow-lg transition-all flex items-center gap-2.5 cursor-pointer transform active:scale-95"
              >
                <div className="w-3.5 h-3.5 rounded-full bg-white animate-ping" />
                <span>Start Recording</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="px-6 py-3.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-base shadow-md transition-all flex items-center gap-2.5 cursor-pointer"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>Stop Recording</span>
              </button>
            )}

            {audioBlobUrl && !isRecording && (
              <button
                type="button"
                onClick={togglePlayback}
                className="px-5 py-3.5 rounded-2xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-800 font-semibold text-sm flex items-center gap-2 transition-colors cursor-pointer"
              >
                {isPlayingRecorded ? (
                  <>
                    <Pause className="w-4 h-4 text-teal-700" />
                    <span>Pause Audio</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 text-teal-700 fill-teal-700" />
                    <span>Listen Back</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Story Title & Spoken Transcript */}
        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-stone-800 mb-1">
              Story Title / Topic:
            </label>
            <input
              type="text"
              value={storyTitle}
              onChange={(e) => setStoryTitle(e.target.value)}
              placeholder="e.g. Afternoon Walk & Market Trip with Rahul"
              className="w-full p-3.5 rounded-xl border border-stone-300 focus:border-teal-600 text-sm sm:text-base bg-white"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs sm:text-sm font-semibold text-stone-800">
                Spoken Memory Transcript / Notes:
              </label>
              <span className="text-xs text-stone-400">
                What did you do? Who were you with? What did you see?
              </span>
            </div>
            <textarea
              rows={3}
              value={storyTranscript}
              onChange={(e) => setStoryTranscript(e.target.value)}
              placeholder="Speak or type your memories here. For example: 'Today I went to the market with my brother and bought some fresh apples and books...'"
              className="w-full p-3.5 rounded-xl border border-stone-300 focus:border-teal-600 text-sm sm:text-base bg-white leading-relaxed"
            />
          </div>

          {/* Sample Prompts Pills */}
          <div>
            <span className="text-xs text-stone-500 font-medium block mb-1.5">
              Click a sample story to test AI extraction:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {storyPrompts.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setStoryTranscript(prompt.replace(/[“”]/g, ''));
                    setStoryTitle(
                      i === 0
                        ? 'Market Trip with Brother'
                        : i === 1
                        ? 'Afternoon Tea in Sunroom'
                        : i === 2
                        ? 'Baking with Maya'
                        : 'Garden Walk to Library'
                    );
                  }}
                  className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-teal-50 hover:text-teal-900 border border-stone-200 text-stone-700 text-xs transition-colors cursor-pointer text-left"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Action Row: AI Analysis & Save */}
          <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-stone-200">
            <button
              type="button"
              onClick={handleAnalyzeStory}
              disabled={!storyTranscript.trim() || isAnalyzingAI}
              className="px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 disabled:opacity-40 text-white font-semibold text-sm flex items-center gap-2 transition-colors cursor-pointer"
            >
              {isAnalyzingAI ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing Memory Story...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-teal-300" />
                  <span>Analyze Story with AI</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={!storyTranscript.trim()}
              className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-stone-900 font-bold text-sm flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4 text-stone-900" />
              <span>Save & Add to Memory Pool</span>
            </button>
          </div>
        </div>

        {/* AI Extracted Facts & Generated Questions Display */}
        {analyzedResult && (
          <div className="mt-6 p-5 sm:p-6 bg-gradient-to-br from-teal-50/70 to-emerald-50/50 rounded-2xl border border-teal-200 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-teal-700" />
                <h3 className="font-bold text-stone-900 text-sm sm:text-base">
                  AI Extracted Memory Entities & Recall Questions
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-md">
                Analyzed by MEMONEST AI
              </span>
            </div>

            {/* Extracted Entities Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-stone-200">
                <span className="text-stone-500 font-semibold block mb-1">People Mentioned:</span>
                <span className="font-bold text-stone-800">
                  {analyzedResult.entities?.people?.join(', ') || 'Self / Loved ones'}
                </span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-stone-200">
                <span className="text-stone-500 font-semibold block mb-1">Places & Sights:</span>
                <span className="font-bold text-stone-800">
                  {analyzedResult.entities?.places?.join(', ') || 'Neighborhood'}
                </span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-stone-200">
                <span className="text-stone-500 font-semibold block mb-1">Activities & Details:</span>
                <span className="font-bold text-stone-800">
                  {analyzedResult.entities?.activities?.join(', ') || 'Daily events'}
                </span>
              </div>
            </div>

            {/* Generated Recall Questions Preview */}
            {analyzedResult.suggestedRecallQuestions && (
              <div>
                <span className="text-xs font-bold text-stone-700 uppercase tracking-wider block mb-2">
                  Sample Recall Questions Added to Your Quiz Bank:
                </span>
                <div className="space-y-2">
                  {analyzedResult.suggestedRecallQuestions.map((q: any, i: number) => (
                    <div
                      key={i}
                      className="p-3 bg-white rounded-xl border border-stone-200 text-xs flex items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold text-stone-900 block">
                          {q.question}
                        </span>
                        <span className="text-teal-800 mt-0.5 block">
                          Expected Answer: "{q.expectedAnswer}"
                        </span>
                      </div>
                      <span className="text-[10px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                        {q.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Audio History Archive */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-stone-900 font-serif">
              Date-wise Audio Memory History
            </h2>
            <p className="text-xs sm:text-sm text-stone-500">
              Listen back to previous days' recordings and review the facts extracted.
            </p>
          </div>
          <span className="text-xs font-semibold text-stone-500">
            {stories.length} stories recorded
          </span>
        </div>

        <div className="space-y-4">
          {stories.map((story) => (
            <div
              key={story.id}
              className="p-4 sm:p-5 rounded-2xl bg-stone-50 border border-stone-200 hover:border-teal-300 transition-colors space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-stone-900 text-base">
                    {story.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-stone-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {story.date}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {story.durationSeconds} seconds
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => speakText(story.transcript)}
                    className="p-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    title="Read story aloud"
                  >
                    <Volume2 className="w-4 h-4 text-teal-700" />
                    <span>Play Audio</span>
                  </button>

                  <button
                    onClick={() => onDeleteStory(story.id)}
                    className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete recording"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Transcript */}
              <p className="text-xs sm:text-sm text-stone-700 leading-relaxed italic bg-white p-3 rounded-xl border border-stone-100">
                "{story.transcript}"
              </p>

              {/* Extracted Facts Tag */}
              {story.aiAnalysis?.extractedFacts && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {story.aiAnalysis.extractedFacts.map((fact, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-teal-50 text-teal-800 text-[11px] font-medium border border-teal-100"
                    >
                      <CheckCircle2 className="w-3 h-3 text-teal-600" />
                      {fact}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
