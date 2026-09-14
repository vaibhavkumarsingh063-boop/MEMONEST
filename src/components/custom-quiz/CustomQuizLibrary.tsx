import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Play,
  Pencil,
  Copy,
  Trash2,
  Image as ImageIcon,
  Clock,
  Award,
  Search,
  Filter,
  Brain,
  AlertCircle,
  Loader2,
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { CustomQuiz, CustomQuizDifficulty, UserProfile } from '../../types';
import { customQuizApi } from '../../utils/customQuizApi';

interface CustomQuizLibraryProps {
  user: UserProfile;
  onCreateNew: () => void;
  onEditQuiz: (quiz: CustomQuiz) => void;
  onStartQuiz: (quiz: CustomQuiz) => void;
}

export const CustomQuizLibrary: React.FC<CustomQuizLibraryProps> = ({
  user,
  onCreateNew,
  onEditQuiz,
  onStartQuiz,
}) => {
  const [quizzes, setQuizzes] = useState<CustomQuiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');

  // Deletion modal state
  const [deletingQuiz, setDeletingQuiz] = useState<CustomQuiz | null>(null);
  const [deleteImagesOption, setDeleteImagesOption] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Duplicate progress state
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  const fetchQuizzes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await customQuizApi.getQuizzes();
      setQuizzes(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load custom quizzes.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleDuplicate = async (quiz: CustomQuiz) => {
    setDuplicatingId(quiz.id);
    try {
      const copy = await customQuizApi.duplicateQuiz(quiz.id);
      setQuizzes((prev) => [copy, ...prev]);
    } catch (err: any) {
      alert(err.message || 'Failed to duplicate quiz.');
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingQuiz) return;
    setIsDeleting(true);
    try {
      await customQuizApi.deleteQuiz(deletingQuiz.id, deleteImagesOption);
      setQuizzes((prev) => prev.filter((q) => q.id !== deletingQuiz.id));
      setDeletingQuiz(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete quiz.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter quizzes
  const filteredQuizzes = quizzes.filter((q) => {
    const matchesSearch =
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.description && q.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDifficulty =
      difficultyFilter === 'all' || q.difficulty === difficultyFilter;
    return matchesSearch && matchesDifficulty;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-md">
              Personalized Memory Exercises
            </span>
            <span className="text-xs text-stone-500">
              {quizzes.length} {quizzes.length === 1 ? 'Quiz' : 'Quizzes'} Available
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900">
            My Custom Quizzes
          </h1>
          <p className="text-stone-600 text-sm mt-1 max-w-xl">
            Custom memory recall quizzes created from personal family photos, memorable trips, and cherished life events.
          </p>
        </div>

        <button
          onClick={onCreateNew}
          className="px-6 py-3.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>+ Create Custom Quiz</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search custom quizzes..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-600/30 text-xs text-stone-900 bg-stone-50/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs font-semibold text-stone-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Difficulty:
          </span>
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
            {['all', 'easy', 'medium', 'hard'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setDifficultyFilter(lvl)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
                  difficultyFilter === lvl
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-800 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Quizzes Grid */}
      {isLoading ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-stone-200 shadow-xs">
          <Loader2 className="w-8 h-8 animate-spin text-teal-700 mx-auto mb-3" />
          <p className="text-sm font-semibold text-stone-600">Loading custom memory quizzes...</p>
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto">
            <Brain className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-xl font-bold font-serif text-stone-900">
              No Custom Quizzes Found
            </h3>
            <p className="text-stone-500 text-xs sm:text-sm mt-1">
              {searchQuery || difficultyFilter !== 'all'
                ? 'No quizzes match your current filters. Try resetting the search query.'
                : 'You have not created any custom memory quizzes yet. Upload a few family photos and let AI build your first personalized recall exercise!'}
            </p>
          </div>
          <button
            onClick={onCreateNew}
            className="px-6 py-3 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow-xs transition-colors inline-flex items-center gap-2 cursor-pointer text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Custom Quiz</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredQuizzes.map((quiz) => {
            const hasPhotos = quiz.images && quiz.images.length > 0;
            const coverPhoto = hasPhotos ? quiz.images[0].imageUrl : null;
            const isDuplicating = duplicatingId === quiz.id;

            return (
              <div
                key={quiz.id}
                className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 shadow-xs hover:border-teal-300 hover:shadow-sm transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Badges & Cover Photo */}
                  {coverPhoto && (
                    <div className="relative rounded-2xl overflow-hidden aspect-video bg-stone-100 mb-4 border border-stone-100">
                      <img
                        src={coverPhoto}
                        alt={quiz.title}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      />
                      <div className="absolute top-2 left-2 flex items-center gap-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-white bg-black/60 backdrop-blur-xs px-2.5 py-0.5 rounded-md flex items-center gap-1">
                          <ImageIcon className="w-3 h-3 text-teal-300" />
                          <span>{quiz.images?.length} Photos</span>
                        </span>
                      </div>
                      <div className="absolute top-2 right-2">
                        <span
                          className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md shadow-xs ${
                            quiz.difficulty === 'easy'
                              ? 'bg-emerald-100/90 text-emerald-900'
                              : quiz.difficulty === 'hard'
                              ? 'bg-amber-100/90 text-amber-900'
                              : 'bg-teal-100/90 text-teal-900'
                          }`}
                        >
                          {quiz.difficulty}
                        </span>
                      </div>
                    </div>
                  )}

                  {!coverPhoto && (
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${
                            quiz.difficulty === 'easy'
                              ? 'bg-emerald-50 text-emerald-800'
                              : quiz.difficulty === 'hard'
                              ? 'bg-amber-50 text-amber-800'
                              : 'bg-teal-50 text-teal-800'
                          }`}
                        >
                          {quiz.difficulty}
                        </span>
                        <span className="text-xs text-stone-500 font-medium">
                          {quiz.questionCount || quiz.questions?.length} Questions
                        </span>
                      </div>

                      {quiz.improveFutureExercises && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Brain className="w-3 h-3 text-teal-600" /> Adaptive
                        </span>
                      )}
                    </div>
                  )}

                  <h3 className="text-xl font-bold font-serif text-stone-900 group-hover:text-teal-900 transition-colors">
                    {quiz.title}
                  </h3>

                  {quiz.description && (
                    <p className="text-stone-600 text-xs sm:text-sm mt-1.5 line-clamp-2 leading-relaxed">
                      {quiz.description}
                    </p>
                  )}

                  {/* Metadata tags */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-stone-100 text-xs text-stone-500">
                    <div className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>
                        Best Score:{' '}
                        <strong className="text-stone-800">
                          {quiz.bestScore !== undefined ? `${quiz.bestScore}%` : 'Not yet taken'}
                        </strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>
                        Attempts: <strong className="text-stone-800">{quiz.attemptsCount || 0}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEditQuiz(quiz)}
                      className="p-2 rounded-xl text-stone-600 hover:text-teal-800 hover:bg-stone-100 transition-colors cursor-pointer"
                      title="Edit Quiz"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDuplicate(quiz)}
                      disabled={isDuplicating}
                      className="p-2 rounded-xl text-stone-600 hover:text-teal-800 hover:bg-stone-100 transition-colors cursor-pointer disabled:opacity-40"
                      title="Duplicate Quiz"
                    >
                      {isDuplicating ? (
                        <Loader2 className="w-4 h-4 animate-spin text-teal-700" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDeletingQuiz(quiz);
                        setDeleteImagesOption(false);
                      }}
                      className="p-2 rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Delete Quiz"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onStartQuiz(quiz)}
                    className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Quiz</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingQuiz && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold font-serif text-stone-900">
              Delete Custom Quiz?
            </h3>

            <p className="text-stone-600 text-sm mt-2 leading-relaxed">
              Are you sure you want to delete <strong className="text-stone-900">"{deletingQuiz.title}"</strong>? This will remove all associated questions and attempts.
            </p>

            {deletingQuiz.images && deletingQuiz.images.length > 0 && (
              <div className="mt-4 p-3 bg-stone-50 rounded-xl border border-stone-200">
                <label className="flex items-start gap-2 cursor-pointer text-xs text-stone-700">
                  <input
                    type="checkbox"
                    checked={deleteImagesOption}
                    onChange={(e) => setDeleteImagesOption(e.target.checked)}
                    className="rounded text-red-600 mt-0.5"
                  />
                  <span>
                    Also permanently delete the {deletingQuiz.images.length} uploaded photo
                    {deletingQuiz.images.length === 1 ? '' : 's'} associated with this quiz.
                  </span>
                </label>
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingQuiz(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>Delete Quiz</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
