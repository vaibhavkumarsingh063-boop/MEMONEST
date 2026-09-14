import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Upload,
  Image as ImageIcon,
  Trash2,
  Plus,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  AlertCircle,
  Loader2,
  HelpCircle,
  Brain,
  RotateCcw,
  MoveUp,
  MoveDown,
  Wand2,
  X,
  Play,
  Save,
  ShieldCheck,
  Sliders,
  Layers,
  ChevronRight,
} from 'lucide-react';
import {
  CustomQuiz,
  CustomQuizQuestion,
  QuizImage,
  CustomQuizDifficulty,
  CustomQuizQuestionType,
  UserProfile,
} from '../../types';
import { customQuizApi, GenerateAiQuestionsPayload } from '../../utils/customQuizApi';

interface CustomQuizBuilderProps {
  initialQuiz?: CustomQuiz | null;
  user: UserProfile;
  onSaveSuccess: (quiz: CustomQuiz, startImmediately?: boolean) => void;
  onCancel: () => void;
}

export const CustomQuizBuilder: React.FC<CustomQuizBuilderProps> = ({
  initialQuiz,
  user,
  onSaveSuccess,
  onCancel,
}) => {
  // Step state: 1: Details, 2: Photos, 3: Questions Review/Editor
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1: Details
  const [title, setTitle] = useState(initialQuiz?.title || '');
  const [description, setDescription] = useState(initialQuiz?.description || '');
  const [difficulty, setDifficulty] = useState<CustomQuizDifficulty>(
    initialQuiz?.difficulty || 'medium'
  );
  const [questionCount, setQuestionCount] = useState<number>(
    initialQuiz?.questionCount || 5
  );
  const [preferredTypes, setPreferredTypes] = useState<CustomQuizQuestionType[]>([
    'multiple_choice',
    'true_false',
    'short_answer',
    'recall',
    'sequence',
  ]);

  // Step 2: Uploaded Photos
  const [uploadedImages, setUploadedImages] = useState<QuizImage[]>(
    initialQuiz?.images || []
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Step 3: AI Generation & Questions
  const [questions, setQuestions] = useState<CustomQuizQuestion[]>(
    initialQuiz?.questions || []
  );
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [improveFutureExercises, setImproveFutureExercises] = useState<boolean>(
    initialQuiz?.improveFutureExercises ?? false
  );

  // AI Generation Sources
  const [sources, setSources] = useState({
    uploadedPhotos: true,
    personalMemories: true,
    familyInformation: true,
    audioMemories: true,
  });

  // Saving state
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Editing single question inline modal/form
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);

  // Toggle preferred question type
  const toggleQuestionType = (type: CustomQuizQuestionType) => {
    if (preferredTypes.includes(type)) {
      if (preferredTypes.length === 1) return; // Keep at least one
      setPreferredTypes(preferredTypes.filter((t) => t !== type));
    } else {
      setPreferredTypes([...preferredTypes, type]);
    }
  };

  // Handle Photo File Upload
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setUploadError(null);

    const validFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    try {
      const newUploads: QuizImage[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (!validFormats.includes(file.type.toLowerCase())) {
          throw new Error(
            `"${file.name}" is not supported. Please upload JPG, PNG, or WEBP images.`
          );
        }

        if (file.size > 10 * 1024 * 1024) {
          throw new Error(
            `"${file.name}" exceeds the 10MB limit. Please choose a smaller photo.`
          );
        }

        // Upload to server
        const uploadedImg = await customQuizApi.uploadImage(
          file,
          `Photo: ${file.name.replace(/\.[^/.]+$/, '')}`
        );
        newUploads.push(uploadedImg);
      }

      setUploadedImages((prev) => [...prev, ...newUploads]);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload photo.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Update description/context for an uploaded photo
  const handleUpdateImageDescription = (id: string, newDesc: string) => {
    setUploadedImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, description: newDesc } : img))
    );
  };

  // Delete an uploaded photo
  const handleDeleteImage = async (id: string) => {
    try {
      await customQuizApi.deleteImage(id);
    } catch {
      // Continue client-side removal regardless
    }
    setUploadedImages((prev) => prev.filter((img) => img.id !== id));
    // Also remove from any questions referencing this image
    setQuestions((prev) =>
      prev.map((q) =>
        q.imageId === id ? { ...q, imageId: undefined, imageUrl: undefined } : q
      )
    );
  };

  // Generate Questions with AI (Gemini Multimodal)
  const handleGenerateAiQuestions = async () => {
    setIsGeneratingAI(true);
    setAiError(null);

    try {
      const payload: GenerateAiQuestionsPayload = {
        title: title.trim() || 'Personal Memory Quiz',
        description: description.trim(),
        difficulty,
        questionCount,
        preferredTypes,
        images: uploadedImages.map((img) => ({
          id: img.id,
          originalFileName: img.originalFileName,
          description: img.description,
          imageUrl: img.imageUrl,
          storagePath: img.storagePath,
        })),
        sources,
      };

      const generated = await customQuizApi.generateAiQuestions(payload);
      if (!generated || generated.length === 0) {
        throw new Error('No questions could be generated. Please try again.');
      }

      setQuestions(generated);
      setCurrentStep(3); // Advance to Questions Review step
    } catch (err: any) {
      setAiError(err.message || 'AI question generation encountered an issue.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Add a new blank question manually
  const handleAddManualQuestion = () => {
    const newQ: CustomQuizQuestion = {
      id: `q_manual_${Date.now()}`,
      quizId: initialQuiz?.id || '',
      question: '',
      questionType: 'multiple_choice',
      options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
      correctAnswer: 'Option 1',
      explanation: 'Great recall!',
      hint: '',
      order: questions.length + 1,
      createdAt: new Date().toISOString(),
      imageId: uploadedImages[0]?.id || undefined,
      imageUrl: uploadedImages[0]?.imageUrl || undefined,
    };
    setQuestions([...questions, newQ]);
    setEditingQuestionIndex(questions.length);
  };

  // Update a question in the list
  const handleUpdateQuestion = (index: number, updated: Partial<CustomQuizQuestion>) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updated };
      return next;
    });
  };

  // Delete a question
  const handleDeleteQuestion = (index: number) => {
    setQuestions((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.map((q, i) => ({ ...q, order: i + 1 }));
    });
    if (editingQuestionIndex === index) {
      setEditingQuestionIndex(null);
    }
  };

  // Reorder question up or down
  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= questions.length) return;
    const next = [...questions];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    // update order
    setQuestions(next.map((q, i) => ({ ...q, order: i + 1 })));
  };

  // Save Quiz (either Create or Update)
  const handleSaveQuiz = async (startImmediately = false) => {
    if (!title.trim()) {
      setSaveError('Please provide a title for your custom quiz.');
      setCurrentStep(1);
      return;
    }

    if (questions.length === 0) {
      setSaveError('Please generate or create at least one question before saving.');
      return;
    }

    // Validate that questions have required fields
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        setSaveError(`Question #${i + 1} is missing the question prompt.`);
        return;
      }
      if (!q.correctAnswer.trim()) {
        setSaveError(`Question #${i + 1} is missing the correct answer.`);
        return;
      }
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const payload: Partial<CustomQuiz> = {
        title: title.trim(),
        description: description.trim(),
        difficulty,
        questionCount: questions.length,
        status: 'published',
        improveFutureExercises,
        questions,
        images: uploadedImages,
      };

      let saved: CustomQuiz;
      if (initialQuiz?.id) {
        saved = await customQuizApi.updateQuiz(initialQuiz.id, payload);
      } else {
        saved = await customQuizApi.createQuiz(payload);
      }

      onSaveSuccess(saved, startImmediately);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save custom quiz.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-md">
                Custom Quiz Builder
              </span>
              <span className="text-xs text-stone-500">Step {currentStep} of 3</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900">
              {initialQuiz ? 'Edit Custom Memory Quiz' : 'Create Personalized Memory Quiz'}
            </h1>
            <p className="text-stone-600 text-sm mt-1">
              Build a custom cognitive recall exercise using your photos, family moments, and routines.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-sm font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSaveQuiz(false)}
              disabled={isSaving || questions.length === 0}
              className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Quiz</span>
            </button>
          </div>
        </div>

        {/* Step Indicator Tabs */}
        <div className="grid grid-cols-3 gap-2 mt-6 pt-5 border-t border-stone-200">
          <button
            onClick={() => setCurrentStep(1)}
            className={`flex items-center gap-2 p-3 rounded-xl text-left transition-all cursor-pointer ${
              currentStep === 1
                ? 'bg-teal-50 text-teal-900 font-bold border border-teal-200'
                : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                currentStep === 1 ? 'bg-teal-700 text-white' : 'bg-stone-200 text-stone-700'
              }`}
            >
              1
            </span>
            <div className="hidden sm:block">
              <span className="text-xs block">Step 1</span>
              <span className="text-sm font-semibold">Quiz Details</span>
            </div>
          </button>

          <button
            onClick={() => setCurrentStep(2)}
            className={`flex items-center gap-2 p-3 rounded-xl text-left transition-all cursor-pointer ${
              currentStep === 2
                ? 'bg-teal-50 text-teal-900 font-bold border border-teal-200'
                : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                currentStep === 2 ? 'bg-teal-700 text-white' : 'bg-stone-200 text-stone-700'
              }`}
            >
              2
            </span>
            <div className="hidden sm:block">
              <span className="text-xs block">Step 2</span>
              <span className="text-sm font-semibold">
                Photo Upload ({uploadedImages.length})
              </span>
            </div>
          </button>

          <button
            onClick={() => setCurrentStep(3)}
            className={`flex items-center gap-2 p-3 rounded-xl text-left transition-all cursor-pointer ${
              currentStep === 3
                ? 'bg-teal-50 text-teal-900 font-bold border border-teal-200'
                : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                currentStep === 3 ? 'bg-teal-700 text-white' : 'bg-stone-200 text-stone-700'
              }`}
            >
              3
            </span>
            <div className="hidden sm:block">
              <span className="text-xs block">Step 3</span>
              <span className="text-sm font-semibold">
                Questions & AI ({questions.length})
              </span>
            </div>
          </button>
        </div>
      </div>

      {saveError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-800 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
          <span>{saveError}</span>
        </div>
      )}

      {/* ================= STEP 1: QUIZ DETAILS ================= */}
      {currentStep === 1 && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-lg font-bold font-serif text-stone-900">
              Step 1 — Quiz Information & Preferences
            </h2>
            <p className="text-xs sm:text-sm text-stone-500">
              Provide a name and choose the cognitive difficulty and question styles you prefer.
            </p>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-stone-800 mb-1.5">
              Quiz Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Summer Family Picnic 2025, Morning Routine Memory"
              className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-600/30 text-stone-900 text-base"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-stone-800 mb-1.5">
              Quiz Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief note on what memories or occasions this quiz focuses on..."
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-600/30 text-stone-900 text-sm"
            />
          </div>

          {/* Difficulty & Count Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-stone-100">
            {/* Difficulty */}
            <div>
              <label className="block text-sm font-semibold text-stone-800 mb-2">
                Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['easy', 'medium', 'hard'] as CustomQuizDifficulty[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setDifficulty(level)}
                    className={`py-3 px-3 rounded-xl text-center text-xs sm:text-sm font-bold capitalize transition-all cursor-pointer ${
                      difficulty === level
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <p className="text-xs text-stone-500 mt-2">
                {difficulty === 'easy' && 'Gentle cues with obvious visual clues and affirmations.'}
                {difficulty === 'medium' && 'Balanced recall engaging short-term and episodic memory.'}
                {difficulty === 'hard' && 'Detailed chronological and specific recall challenges.'}
              </p>
            </div>

            {/* Number of Questions */}
            <div>
              <label className="block text-sm font-semibold text-stone-800 mb-2">
                Target Number of Questions: <span className="font-bold text-teal-800">{questionCount}</span>
              </label>
              <div className="flex items-center gap-2">
                {[3, 5, 8, 10].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setQuestionCount(count)}
                    className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      questionCount === count
                        ? 'bg-teal-700 text-white'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
              <p className="text-xs text-stone-500 mt-2">
                Recommended: 5 questions for optimal 5-minute daily engagement.
              </p>
            </div>
          </div>

          {/* Preferred Question Types */}
          <div className="pt-2 border-t border-stone-100">
            <label className="block text-sm font-semibold text-stone-800 mb-2">
              Preferred Question Types (Select all that apply)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {[
                { type: 'multiple_choice' as const, label: 'Multiple Choice' },
                { type: 'true_false' as const, label: 'True / False' },
                { type: 'short_answer' as const, label: 'Short Answer' },
                { type: 'recall' as const, label: 'Recall' },
                { type: 'sequence' as const, label: 'Sequence / Order' },
              ].map(({ type, label }) => {
                const selected = preferredTypes.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleQuestionType(type)}
                    className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                      selected
                        ? 'border-teal-600 bg-teal-50 text-teal-900'
                        : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold">{label}</span>
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                          selected ? 'bg-teal-700 text-white' : 'border border-stone-300'
                        }`}
                      >
                        {selected && '✓'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Next Button */}
          <div className="pt-4 flex justify-end">
            <button
              onClick={() => {
                if (!title.trim()) {
                  setSaveError('Please enter a quiz title to proceed.');
                  return;
                }
                setSaveError(null);
                setCurrentStep(2);
              }}
              className="px-6 py-3 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span>Next: Add Photos</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 2: PHOTO UPLOAD ================= */}
      {currentStep === 2 && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-lg font-bold font-serif text-stone-900">
              Step 2 — Add Photos to Your Quiz
            </h2>
            <p className="text-xs sm:text-sm text-stone-500">
              Upload photos from your family albums, gatherings, or favorite places. MemoryMate AI uses these to build rich visual questions.
            </p>
          </div>

          {/* Drag and Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              handleFileUpload(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-teal-600 bg-teal-50/70 scale-[1.01]'
                : 'border-stone-300 hover:border-teal-500 bg-stone-50/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
            />

            <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center mb-3">
              {isUploading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Upload className="w-6 h-6" />
              )}
            </div>

            <h3 className="text-base font-bold text-stone-900 font-serif">
              {isUploading ? 'Uploading and processing photos...' : 'Drag & drop photos here, or click to browse'}
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Supports JPG, JPEG, PNG, WEBP (Max 10MB per photo). Upload multiple photos at once.
            </p>

            <button
              type="button"
              className="mt-4 px-4 py-2 rounded-xl bg-white border border-stone-300 text-stone-800 font-semibold text-xs hover:bg-stone-100 shadow-xs inline-flex items-center gap-1.5"
            >
              <ImageIcon className="w-3.5 h-3.5 text-teal-700" />
              <span>Browse Files</span>
            </button>
          </div>

          {uploadError && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Privacy & Context Tip Banner */}
          <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-start gap-2.5 text-xs text-stone-700">
            <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
            <div>
              <strong className="text-stone-900">Add Context for Best AI Recall Prompts:</strong>
              <p className="mt-0.5 leading-relaxed">
                Add a short note for each photo below (e.g., “Family dinner – December 2025. Rahul is standing on the left. Mom is sitting at the head of the table.”). For privacy, the AI does not guess unknown people and relies solely on your clues.
              </p>
            </div>
          </div>

          {/* Uploaded Photos Grid */}
          {uploadedImages.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-stone-900">
                  Uploaded Photos ({uploadedImages.length})
                </h3>
                <span className="text-xs text-stone-500">
                  Click on context notes to describe who or what is shown
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {uploadedImages.map((img) => (
                  <div
                    key={img.id}
                    className="p-3 rounded-2xl border border-stone-200 bg-white shadow-xs flex flex-col gap-3 group"
                  >
                    <div className="relative rounded-xl overflow-hidden bg-stone-100 aspect-video flex items-center justify-center">
                      <img
                        src={img.imageUrl}
                        alt={img.originalFileName}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(img.id)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-600/90 text-white hover:bg-red-700 shadow-sm transition-colors cursor-pointer"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-stone-800 truncate max-w-[200px]">
                          {img.originalFileName}
                        </span>
                        <span className="text-stone-400 text-[11px]">
                          {img.fileSize ? `${Math.round(img.fileSize / 1024)} KB` : ''}
                        </span>
                      </div>

                      <label className="block text-[11px] font-semibold text-teal-800 uppercase tracking-wider">
                        Memory Context / Clues for AI:
                      </label>
                      <textarea
                        rows={2}
                        value={img.description}
                        onChange={(e) => handleUpdateImageDescription(img.id, e.target.value)}
                        placeholder="e.g., Mom's 75th Birthday party in Mumbai, Rahul sitting on left, laughing at old albums..."
                        className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-teal-600 text-xs text-stone-900"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="pt-4 flex items-center justify-between border-t border-stone-100">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-5 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 font-semibold text-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Details</span>
            </button>

            <button
              onClick={() => setCurrentStep(3)}
              className="px-6 py-3 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span>Next: Generate & Review Questions</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 3: QUESTIONS & AI ================= */}
      {currentStep === 3 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* AI Generator Control Box */}
          <div className="bg-gradient-to-br from-teal-900 via-teal-950 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-md">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-800/80 border border-teal-500/40 text-teal-200 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Gemini Multimodal AI Memory Engine</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold font-serif">
                  Generate Questions with AI
                </h2>
                <p className="text-xs sm:text-sm text-teal-100 max-w-xl leading-relaxed">
                  MemoryMate AI will analyze your {uploadedImages.length} uploaded photo
                  {uploadedImages.length === 1 ? '' : 's'} and context to create {questionCount} customized recall questions.
                </p>

                {/* Sources Checkboxes */}
                <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
                  <span className="font-semibold text-teal-300">Sources:</span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sources.uploadedPhotos}
                      onChange={(e) =>
                        setSources({ ...sources, uploadedPhotos: e.target.checked })
                      }
                      className="rounded text-teal-600 focus:ring-0"
                    />
                    <span>Uploaded Photos</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sources.personalMemories}
                      onChange={(e) =>
                        setSources({ ...sources, personalMemories: e.target.checked })
                      }
                      className="rounded text-teal-600 focus:ring-0"
                    />
                    <span>Personal Memories</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sources.familyInformation}
                      onChange={(e) =>
                        setSources({ ...sources, familyInformation: e.target.checked })
                      }
                      className="rounded text-teal-600 focus:ring-0"
                    />
                    <span>Family Details</span>
                  </label>
                </div>
              </div>

              {/* Generate AI Button */}
              <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleGenerateAiQuestions}
                  disabled={isGeneratingAI}
                  className="px-6 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm sm:text-base"
                >
                  {isGeneratingAI ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-stone-900" />
                      <span>Analyzing & Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 fill-current text-stone-900" />
                      <span>Generate Questions with AI</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleAddManualQuestion}
                  className="px-4 py-2.5 rounded-xl bg-teal-800/80 hover:bg-teal-800 text-teal-100 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer border border-teal-700/50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Question Manually</span>
                </button>
              </div>
            </div>

            {aiError && (
              <div className="mt-4 p-3 bg-red-900/60 border border-red-500/50 rounded-xl text-xs text-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{aiError}</span>
              </div>
            )}
          </div>

          {/* Adaptive Memory Integration Option */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-xs flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-900">
                  Improve Future Memory Exercises
                </h4>
                <p className="text-xs text-stone-600 mt-0.5">
                  When enabled, any questions you miss during this custom quiz will be incorporated into your daily adaptive spaced-repetition exercises.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={improveFutureExercises}
                onChange={(e) => setImproveFutureExercises(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-700"></div>
            </label>
          </div>

          {/* Questions Review & Editor List */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-serif text-stone-900">
                  Quiz Questions ({questions.length})
                </h3>
                <p className="text-xs text-stone-500">
                  Review, edit, reorder, or attach specific photos to each question.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddManualQuestion}
                className="px-3.5 py-1.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-teal-700" />
                <span>Add Question</span>
              </button>
            </div>

            {questions.length === 0 ? (
              <div className="text-center py-12 px-4 border-2 border-dashed border-stone-200 rounded-2xl">
                <Brain className="w-10 h-10 mx-auto text-stone-300 mb-2" />
                <h4 className="text-base font-bold text-stone-700 font-serif">
                  No Questions Added Yet
                </h4>
                <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 mb-4">
                  Click "Generate Questions with AI" above to automatically create questions from your photos, or add questions manually.
                </p>
                <button
                  onClick={handleGenerateAiQuestions}
                  disabled={isGeneratingAI}
                  className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs inline-flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Questions with AI</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((q, idx) => {
                  const isEditing = editingQuestionIndex === idx;
                  const attachedImg = uploadedImages.find((img) => img.id === q.imageId);

                  return (
                    <div
                      key={q.id || idx}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                        isEditing
                          ? 'border-teal-500 bg-teal-50/20 ring-1 ring-teal-200'
                          : 'border-stone-200 bg-white hover:border-stone-300 shadow-xs'
                      }`}
                    >
                      {/* Question Header */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-stone-100 text-stone-700 font-bold text-xs flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-md">
                            {q.questionType.replace('_', ' ')}
                          </span>
                          {attachedImg && (
                            <span className="text-[11px] text-stone-500 flex items-center gap-1">
                              <ImageIcon className="w-3 h-3 text-teal-600" />
                              <span className="truncate max-w-[120px]">
                                {attachedImg.originalFileName}
                              </span>
                            </span>
                          )}
                        </div>

                        {/* Actions (Move, Edit, Delete) */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveQuestion(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-30 cursor-pointer"
                            title="Move up"
                          >
                            <MoveUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveQuestion(idx, 'down')}
                            disabled={idx === questions.length - 1}
                            className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-30 cursor-pointer"
                            title="Move down"
                          >
                            <MoveDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setEditingQuestionIndex(isEditing ? null : idx)
                            }
                            className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs transition-colors cursor-pointer"
                          >
                            {isEditing ? 'Done' : 'Edit'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteQuestion(idx)}
                            className="p-1 text-red-400 hover:text-red-600 cursor-pointer"
                            title="Delete question"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Display View */}
                      {!isEditing ? (
                        <div className="space-y-2 text-sm text-stone-800">
                          <div className="flex items-start gap-3">
                            {attachedImg && (
                              <img
                                src={attachedImg.imageUrl}
                                alt="Question photo"
                                className="w-16 h-16 rounded-xl object-cover shrink-0 border border-stone-200"
                              />
                            )}
                            <div>
                              <p className="font-semibold text-stone-900 text-base font-serif">
                                {q.question || 'Empty question prompt'}
                              </p>
                              <div className="mt-1 text-xs text-stone-600">
                                <span className="font-bold text-teal-800">Answer: </span>
                                <span>{q.correctAnswer}</span>
                              </div>
                            </div>
                          </div>

                          {q.options && q.options.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {q.options.map((opt, optIdx) => (
                                <span
                                  key={optIdx}
                                  className={`text-xs px-2.5 py-1 rounded-lg border ${
                                    opt === q.correctAnswer
                                      ? 'bg-teal-50 border-teal-300 text-teal-900 font-bold'
                                      : 'bg-stone-50 border-stone-200 text-stone-600'
                                  }`}
                                >
                                  {opt}
                                </span>
                              ))}
                            </div>
                          )}

                          {q.sequenceItems && q.sequenceItems.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap text-xs text-stone-600 pt-1">
                              <span className="font-bold text-teal-800">Sequence:</span>
                              {q.sequenceItems.map((step, sIdx) => (
                                <span key={sIdx} className="flex items-center gap-1">
                                  <span className="px-2 py-0.5 bg-stone-100 rounded">
                                    {sIdx + 1}. {step}
                                  </span>
                                  {sIdx < (q.sequenceItems?.length || 0) - 1 && (
                                    <ChevronRight className="w-3 h-3 text-stone-400" />
                                  )}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Inline Edit Form */
                        <div className="space-y-4 pt-2 border-t border-stone-200 text-xs">
                          <div>
                            <label className="block font-semibold text-stone-800 mb-1">
                              Question Text
                            </label>
                            <input
                              type="text"
                              value={q.question}
                              onChange={(e) =>
                                handleUpdateQuestion(idx, { question: e.target.value })
                              }
                              className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-1 focus:ring-teal-600 text-sm text-stone-900"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Question Type */}
                            <div>
                              <label className="block font-semibold text-stone-800 mb-1">
                                Question Type
                              </label>
                              <select
                                value={q.questionType}
                                onChange={(e) => {
                                  const newType = e.target.value as CustomQuizQuestionType;
                                  let newOpts = q.options;
                                  if (newType === 'true_false') newOpts = ['True', 'False'];
                                  handleUpdateQuestion(idx, {
                                    questionType: newType,
                                    options: newOpts,
                                  });
                                }}
                                className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-stone-900"
                              >
                                <option value="multiple_choice">Multiple Choice</option>
                                <option value="true_false">True / False</option>
                                <option value="short_answer">Short Answer</option>
                                <option value="recall">Recall</option>
                                <option value="sequence">Sequence / Order</option>
                              </select>
                            </div>

                            {/* Attach Photo from Uploaded */}
                            <div>
                              <label className="block font-semibold text-stone-800 mb-1">
                                Attach Photo
                              </label>
                              <select
                                value={q.imageId || ''}
                                onChange={(e) => {
                                  const selectedId = e.target.value;
                                  const img = uploadedImages.find((i) => i.id === selectedId);
                                  handleUpdateQuestion(idx, {
                                    imageId: selectedId || undefined,
                                    imageUrl: img?.imageUrl || undefined,
                                  });
                                }}
                                className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white text-stone-900"
                              >
                                <option value="">None (No photo)</option>
                                {uploadedImages.map((img) => (
                                  <option key={img.id} value={img.id}>
                                    {img.originalFileName}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Options editing for multiple choice */}
                          {q.questionType === 'multiple_choice' && (
                            <div className="space-y-2">
                              <label className="block font-semibold text-stone-800">
                                Answer Options (Click radio button to mark correct answer):
                              </label>
                              <div className="space-y-2">
                                {(q.options || ['Option 1', 'Option 2', 'Option 3', 'Option 4']).map(
                                  (opt, optIdx) => (
                                    <div key={optIdx} className="flex items-center gap-2">
                                      <input
                                        type="radio"
                                        name={`correct_${q.id}`}
                                        checked={q.correctAnswer === opt}
                                        onChange={() =>
                                          handleUpdateQuestion(idx, { correctAnswer: opt })
                                        }
                                        className="text-teal-600 focus:ring-0"
                                      />
                                      <input
                                        type="text"
                                        value={opt}
                                        onChange={(e) => {
                                          const nextOpts = [...(q.options || [])];
                                          const wasCorrect = q.correctAnswer === nextOpts[optIdx];
                                          nextOpts[optIdx] = e.target.value;
                                          handleUpdateQuestion(idx, {
                                            options: nextOpts,
                                            correctAnswer: wasCorrect
                                              ? e.target.value
                                              : q.correctAnswer,
                                          });
                                        }}
                                        className="flex-1 px-3 py-1.5 rounded-lg border border-stone-300 text-xs text-stone-900"
                                      />
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                          {/* True / False selection */}
                          {q.questionType === 'true_false' && (
                            <div>
                              <label className="block font-semibold text-stone-800 mb-1">
                                Correct Answer:
                              </label>
                              <div className="flex gap-3">
                                {['True', 'False'].map((tf) => (
                                  <label key={tf} className="flex items-center gap-1.5">
                                    <input
                                      type="radio"
                                      name={`tf_${q.id}`}
                                      checked={q.correctAnswer === tf}
                                      onChange={() =>
                                        handleUpdateQuestion(idx, { correctAnswer: tf })
                                      }
                                      className="text-teal-600"
                                    />
                                    <span className="font-semibold">{tf}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Short answer / recall input */}
                          {(q.questionType === 'short_answer' ||
                            q.questionType === 'recall') && (
                            <div>
                              <label className="block font-semibold text-stone-800 mb-1">
                                Expected Correct Answer:
                              </label>
                              <input
                                type="text"
                                value={q.correctAnswer}
                                onChange={(e) =>
                                  handleUpdateQuestion(idx, { correctAnswer: e.target.value })
                                }
                                placeholder="Exact or key phrase answer"
                                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900"
                              />
                            </div>
                          )}

                          {/* Sequence input */}
                          {q.questionType === 'sequence' && (
                            <div>
                              <label className="block font-semibold text-stone-800 mb-1">
                                Sequence items in correct order (comma or line separated):
                              </label>
                              <textarea
                                rows={3}
                                value={q.sequenceItems?.join('\n') || ''}
                                onChange={(e) => {
                                  const items = e.target.value
                                    .split('\n')
                                    .map((s) => s.trim())
                                    .filter(Boolean);
                                  handleUpdateQuestion(idx, {
                                    sequenceItems: items,
                                    correctAnswer: items.join(' -> '),
                                  });
                                }}
                                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900"
                              />
                            </div>
                          )}

                          {/* Hint & Explanation */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block font-semibold text-stone-800 mb-1">
                                Spoken Clue / Hint:
                              </label>
                              <input
                                type="text"
                                value={q.hint || ''}
                                onChange={(e) =>
                                  handleUpdateQuestion(idx, { hint: e.target.value })
                                }
                                placeholder="Gentle clue to help prompt recall"
                                className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs text-stone-900"
                              />
                            </div>
                            <div>
                              <label className="block font-semibold text-stone-800 mb-1">
                                Explanation / Affirmation:
                              </label>
                              <input
                                type="text"
                                value={q.explanation || ''}
                                onChange={(e) =>
                                  handleUpdateQuestion(idx, { explanation: e.target.value })
                                }
                                placeholder="Encouraging feedback affirming the memory"
                                className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs text-stone-900"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 font-semibold text-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Photos</span>
              </button>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => handleSaveQuiz(false)}
                  disabled={isSaving || questions.length === 0}
                  className="flex-1 sm:flex-none px-6 py-3 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-800 font-bold text-sm shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Quiz</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveQuiz(true)}
                  disabled={isSaving || questions.length === 0}
                  className="flex-1 sm:flex-none px-7 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Save & Start Quiz</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
