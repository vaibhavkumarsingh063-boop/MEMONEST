import React, { useState, useRef } from 'react';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Heart,
  Sparkles,
  Gift,
  Camera,
  Upload,
  Image as ImageIcon,
  Play,
  Volume2,
  CheckCircle2,
  ListOrdered,
  Type,
  FileQuestion,
  HelpCircle,
  X,
  Eye,
} from 'lucide-react';
import { FamilyMember, QuizQuestion, QuestionType, UserProfile } from '../types';
import { speakText, stopSpeech } from '../utils/soundAndSpeech';

interface FamilyViewProps {
  family: FamilyMember[];
  user: UserProfile;
  onAddFamilyMember: (member: FamilyMember) => void;
  onUpdateFamilyMember: (member: FamilyMember) => void;
  onDeleteFamilyMember: (id: string) => void;
  onAddCustomQuizQuestion: (question: QuizQuestion) => void;
  onPlayCustomQuiz?: (question: QuizQuestion) => void;
}

const AVATAR_PRESETS = [
  { label: 'Son / Architect', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80' },
  { label: 'Granddaughter / Student', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' },
  { label: 'Sister / Senior', url: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=400&q=80' },
  { label: 'Daughter', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80' },
  { label: 'Grandson / Young Man', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80' },
  { label: 'Brother / Senior', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80' },
  { label: 'Spouse / Mature Gentleman', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80' },
  { label: 'Close Friend / Caregiver', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80' },
];

const MEMORY_PHOTO_PRESETS = [
  { label: 'Backyard Birdhouse (2019)', url: 'https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?auto=format&fit=crop&w=800&q=80' },
  { label: 'Cape Cod Beach Trip', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80' },
  { label: 'Lemon Shortbread Baking', url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80' },
  { label: 'Oak Garden Hydrangeas', url: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80' },
  { label: 'Sunday Family Dinner', url: 'https://images.unsplash.com/photo-1547928576-a4a33237cbc3?auto=format&fit=crop&w=800&q=80' },
];

export const FamilyView: React.FC<FamilyViewProps> = ({
  family,
  user,
  onAddFamilyMember,
  onUpdateFamilyMember,
  onDeleteFamilyMember,
  onAddCustomQuizQuestion,
  onPlayCustomQuiz,
}) => {
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);

  // Quick photo upload ref for family card
  const cardPhotoInputRef = useRef<HTMLInputElement>(null);
  const [targetMemberForCardPhoto, setTargetMemberForCardPhoto] = useState<FamilyMember | null>(null);

  // Form states for adding/editing family member
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('Daughter');
  const [birthday, setBirthday] = useState('');
  const [importantDates, setImportantDates] = useState('');
  const [importantEvents, setImportantEvents] = useState('');
  const [personalPreferences, setPersonalPreferences] = useState('');
  const [sharedMemories, setSharedMemories] = useState('');
  const [avatar, setAvatar] = useState(AVATAR_PRESETS[0].url);
  const [canEditProfile, setCanEditProfile] = useState(false);
  const [canAddQuizPrompts, setCanAddQuizPrompts] = useState(true);
  const [canViewReports, setCanViewReports] = useState(true);

  // Custom Quiz Creator Studio States
  const [isQuizStudioOpen, setIsQuizStudioOpen] = useState(false);
  const [quizTargetMemberId, setQuizTargetMemberId] = useState<string>('');
  const [quizQuestionTitle, setQuizQuestionTitle] = useState('');
  const [quizQuestionType, setQuizQuestionType] = useState<QuestionType>('multiple_choice');
  const [quizQuestionImage, setQuizQuestionImage] = useState<string>('');
  const [quizCorrectAnswer, setQuizCorrectAnswer] = useState('');
  const [quizOptionA, setQuizOptionA] = useState('');
  const [quizOptionB, setQuizOptionB] = useState('');
  const [quizOptionC, setQuizOptionC] = useState('');
  const [quizOptionD, setQuizOptionD] = useState('');
  const [quizSequenceSteps, setQuizSequenceSteps] = useState<string>('Step 1\nStep 2\nStep 3');
  const [quizTrueFalseAnswer, setQuizTrueFalseAnswer] = useState<'True' | 'False'>('True');
  const [quizSpokenHint, setQuizSpokenHint] = useState('');
  const [quizExplanation, setQuizExplanation] = useState('');
  const [createdCustomQuestions, setCreatedCustomQuestions] = useState<QuizQuestion[]>([]);
  const [isPlayingSpokenHint, setIsPlayingSpokenHint] = useState(false);
  const [feedbackSuccessNotice, setFeedbackSuccessNotice] = useState<string | null>(null);

  // File input refs
  const memberFileInputRef = useRef<HTMLInputElement>(null);
  const quizPhotoFileInputRef = useRef<HTMLInputElement>(null);

  // Open modal to add new member
  const openAddModal = () => {
    setName('');
    setRelationship('Daughter');
    setBirthday('');
    setImportantDates('');
    setImportantEvents('');
    setPersonalPreferences('');
    setSharedMemories('');
    setAvatar(AVATAR_PRESETS[3].url);
    setCanEditProfile(false);
    setCanAddQuizPrompts(true);
    setCanViewReports(true);
    setEditingMember(null);
    setIsAddModalOpen(true);
  };

  // Open modal to edit existing member
  const openEditModal = (member: FamilyMember) => {
    setEditingMember(member);
    setName(member.name);
    setRelationship(member.relationship);
    setBirthday(member.birthday);
    setImportantDates(member.importantDates);
    setImportantEvents(member.importantEvents);
    setPersonalPreferences(member.personalPreferences);
    setSharedMemories(member.sharedMemories);
    setAvatar(member.avatar);
    setCanEditProfile(member.permissions?.canEditProfile ?? false);
    setCanAddQuizPrompts(member.permissions?.canAddQuizPrompts ?? true);
    setCanViewReports(member.permissions?.canViewReports ?? true);
    setIsAddModalOpen(true);
  };

  // File reader for uploading picture from device (phone or PC)
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    onSuccess: (dataUrl: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Please select an image smaller than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onSuccess(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Save new or edited family member
  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const memberData: FamilyMember = {
      id: editingMember ? editingMember.id : 'fam_' + Date.now(),
      name: name.trim(),
      relationship,
      birthday,
      importantDates,
      importantEvents,
      personalPreferences,
      sharedMemories,
      avatar: avatar.trim() || AVATAR_PRESETS[0].url,
      permissions: {
        canEditProfile,
        canAddQuizPrompts,
        canViewReports,
      },
    };

    if (editingMember) {
      onUpdateFamilyMember(memberData);
    } else {
      onAddFamilyMember(memberData);
    }

    setIsAddModalOpen(false);
    setEditingMember(null);
  };

  // Quick photo update from card
  const handleQuickPhotoChange = (member: FamilyMember) => {
    setTargetMemberForCardPhoto(member);
    cardPhotoInputRef.current?.click();
  };

  const handleCardPhotoUploaded = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!targetMemberForCardPhoto) return;
    handleFileUpload(e, (dataUrl) => {
      const updatedMember = { ...targetMemberForCardPhoto, avatar: dataUrl };
      onUpdateFamilyMember(updatedMember);
      setTargetMemberForCardPhoto(null);
    });
  };

  // Open Quiz Creator Studio for a specific family member
  const openQuizStudioForMember = (member?: FamilyMember) => {
    const selectedMember = member || family[0];
    setQuizTargetMemberId(selectedMember ? selectedMember.id : '');
    setQuizQuestionTitle(`Who is in this photo with ${user.name}?`);
    setQuizQuestionType('multiple_choice');
    setQuizQuestionImage(selectedMember ? selectedMember.avatar : MEMORY_PHOTO_PRESETS[0].url);
    setQuizCorrectAnswer(selectedMember ? selectedMember.name : '');
    setQuizOptionA(selectedMember ? selectedMember.name : 'Rahul Vance');
    setQuizOptionB('Sister Clara');
    setQuizOptionC('Cousin David');
    setQuizOptionD('Dr. Evans');
    setQuizSequenceSteps('1. Put on walking shoes\n2. Walk to the rose garden\n3. Rest on the green park bench');
    setQuizTrueFalseAnswer('True');
    setQuizSpokenHint(`Listen closely: This is your ${selectedMember ? selectedMember.relationship : 'family member'} who loves spending time with you.`);
    setQuizExplanation(`Cherished memory with ${selectedMember ? selectedMember.name : 'family'}.`);
    setIsQuizStudioOpen(true);
  };

  // Speak hint aloud for testing audio
  const handleTestSpokenHint = () => {
    if (isPlayingSpokenHint) {
      stopSpeech();
      setIsPlayingSpokenHint(false);
    } else if (quizSpokenHint.trim()) {
      setIsPlayingSpokenHint(true);
      speakText(quizSpokenHint.trim(), () => setIsPlayingSpokenHint(false));
    }
  };

  // Save the custom quiz question created by family
  const handleSaveCustomQuiz = (playImmediately: boolean = false) => {
    if (!quizQuestionTitle.trim()) {
      alert('Please enter a question title');
      return;
    }

    const selectedMember = family.find((f) => f.id === quizTargetMemberId) || family[0];
    let finalOptions: string[] = [];
    let finalAnswer = quizCorrectAnswer.trim();

    if (quizQuestionType === 'multiple_choice' || quizQuestionType === 'recall') {
      finalOptions = [quizOptionA.trim(), quizOptionB.trim(), quizOptionC.trim(), quizOptionD.trim()].filter(Boolean);
      if (finalOptions.length < 2) {
        alert('Please provide at least 2 options for multiple choice');
        return;
      }
      if (!finalAnswer) {
        finalAnswer = finalOptions[0];
      }
    } else if (quizQuestionType === 'true_false') {
      finalOptions = ['True', 'False'];
      finalAnswer = quizTrueFalseAnswer;
    } else if (quizQuestionType === 'sequence') {
      const items = quizSequenceSteps
        .split('\n')
        .map((s) => s.replace(/^\d+[\.\)]\s*/, '').trim())
        .filter(Boolean);
      if (items.length < 2) {
        alert('Please enter at least 2 sequence steps on separate lines');
        return;
      }
      finalAnswer = items.join(' -> ');
    } else if (quizQuestionType === 'short_answer') {
      if (!finalAnswer) {
        alert('Please specify the expected answer keyword for written recall');
        return;
      }
      finalOptions = [finalAnswer, 'Family memory', 'Not sure'];
    }

    const newQuestion: QuizQuestion = {
      id: 'q_custom_' + Date.now(),
      type: quizQuestionType,
      category: 'Family & Friends',
      question: quizQuestionTitle.trim(),
      options: finalOptions.length > 0 ? finalOptions : undefined,
      sequenceItems:
        quizQuestionType === 'sequence'
          ? quizSequenceSteps
              .split('\n')
              .map((s) => s.replace(/^\d+[\.\)]\s*/, '').trim())
              .filter(Boolean)
          : undefined,
      correctAnswer: finalAnswer,
      explanation:
        quizExplanation.trim() ||
        `Contributed with love by your ${selectedMember ? selectedMember.relationship : 'family member'}, ${
          selectedMember ? selectedMember.name : ''
        }.`,
      memoryFactSource: `Family Quiz: ${selectedMember ? selectedMember.name : 'Personal Circle'}`,
      imageUrl: quizQuestionImage.trim() || undefined,
      familyMemberId: selectedMember?.id,
      familyMemberName: selectedMember?.name,
      spokenHint: quizSpokenHint.trim() || undefined,
    };

    onAddCustomQuizQuestion(newQuestion);
    setCreatedCustomQuestions((prev) => [newQuestion, ...prev]);

    setFeedbackSuccessNotice(`Successfully added custom quiz question for ${selectedMember?.name || 'family'}!`);
    setTimeout(() => setFeedbackSuccessNotice(null), 4000);

    if (playImmediately && onPlayCustomQuiz) {
      setIsQuizStudioOpen(false);
      onPlayCustomQuiz(newQuestion);
    } else {
      setIsQuizStudioOpen(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Hidden card photo upload input */}
      <input
        ref={cardPhotoInputRef}
        type="file"
        accept="image/*"
        onChange={handleCardPhotoUploaded}
        className="hidden"
      />

      {/* Success Notification Banner */}
      {feedbackSuccessNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold text-sm">{feedbackSuccessNotice}</span>
          </div>
          <button
            onClick={() => setFeedbackSuccessNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 text-sm font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-semibold mb-2">
              <Users className="w-3.5 h-3.5 text-teal-600" />
              Trusted Family Circle & Photo Memory Vault
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 font-serif">
              Family Members & Custom Photo Quizzes
            </h1>
            <p className="text-sm sm:text-base text-stone-600 mt-1 max-w-2xl leading-relaxed">
              Add distinct photos for every family member and create custom recall quizzes with real photographs, written stories, and voice clues. Patients can answer by tapping or simply speaking aloud!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => openQuizStudioForMember()}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
              title="Create a custom quiz with photo for any family member"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>Create Custom Photo Quiz</span>
            </button>

            <button
              onClick={openAddModal}
              className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Family Member</span>
            </button>
          </div>
        </div>
      </div>

      {/* Family Members Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {family.map((member) => (
          <div
            key={member.id}
            className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs flex flex-col justify-between hover:border-teal-300 transition-all group"
          >
            <div>
              {/* Member Card Header & Photo */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3.5">
                  {/* Photo with Quick Change Hover Overlay */}
                  <div className="relative group/avatar shrink-0">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-16 h-16 rounded-2xl object-cover ring-2 ring-teal-100 shadow-xs group-hover/avatar:opacity-90 transition-opacity"
                    />
                    <button
                      type="button"
                      onClick={() => handleQuickPhotoChange(member)}
                      className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover/avatar:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-semibold transition-opacity cursor-pointer"
                      title="Upload or change photo for this member"
                    >
                      <Camera className="w-4 h-4 mb-0.5" />
                      <span>Change</span>
                    </button>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg text-stone-900 leading-snug">
                      {member.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="inline-block text-xs font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md">
                        {member.relationship}
                      </span>
                      {member.phone && (
                        <span className="text-xs text-stone-400 font-mono">
                          {member.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Edit & Delete Controls */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(member)}
                    className="p-2 rounded-lg text-stone-400 hover:text-teal-700 hover:bg-stone-100 transition-colors cursor-pointer"
                    title="Edit member details & picture"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteFamilyMember(member.id)}
                    className="p-2 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-stone-100 transition-colors cursor-pointer"
                    title="Remove from circle"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Details List */}
              <div className="space-y-3 text-xs sm:text-sm text-stone-700 pt-2 border-t border-stone-100">
                {member.birthday && (
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-stone-900">Birthday: </span>
                      <span>{member.birthday}</span>
                    </div>
                  </div>
                )}

                {member.importantDates && (
                  <div className="flex items-start gap-2">
                    <Gift className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-stone-900">Important Dates: </span>
                      <span>{member.importantDates}</span>
                    </div>
                  </div>
                )}

                {member.sharedMemories && (
                  <div className="flex items-start gap-2">
                    <Heart className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-stone-900">Shared Memories: </span>
                      <span className="italic text-stone-600">"{member.sharedMemories}"</span>
                    </div>
                  </div>
                )}

                {member.personalPreferences && (
                  <div className="bg-stone-50 p-3 rounded-xl border border-stone-100 text-xs">
                    <span className="font-semibold text-stone-800 block mb-0.5">Preferences & Notes:</span>
                    <span className="text-stone-600">{member.personalPreferences}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Custom Quiz Action Button */}
            <div className="mt-5 pt-4 border-t border-stone-100 space-y-2">
              <button
                onClick={() => openQuizStudioForMember(member)}
                className="w-full py-2.5 px-3 rounded-xl bg-teal-50 hover:bg-teal-100/90 text-teal-900 font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 border border-teal-200 cursor-pointer shadow-2xs"
              >
                <Camera className="w-4 h-4 text-teal-700" />
                <span>Create Photo & Memory Quiz for {member.name}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Showcase of Created Custom Quizzes if any exist */}
      {createdCustomQuestions.length > 0 && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              <h2 className="text-xl font-bold text-stone-900 font-serif">
                Custom Family Memory Quizzes ({createdCustomQuestions.length})
              </h2>
            </div>
            <span className="text-xs text-stone-500">
              Active in {user.name}'s daily recall pool
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {createdCustomQuestions.map((q) => (
              <div
                key={q.id}
                className="p-4 rounded-2xl border border-stone-200 bg-stone-50 flex gap-4 items-start"
              >
                {q.imageUrl ? (
                  <img
                    src={q.imageUrl}
                    alt={q.question}
                    className="w-20 h-20 rounded-xl object-cover shrink-0 ring-1 ring-stone-200"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                    <FileQuestion className="w-8 h-8" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded">
                      {q.type.replace('_', ' ')}
                    </span>
                    {q.familyMemberName && (
                      <span className="text-xs font-semibold text-stone-600 truncate">
                        {q.familyMemberName}
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-stone-900 line-clamp-2">
                    {q.question}
                  </h4>
                  <p className="text-xs text-stone-600 mt-1">
                    Answer: <strong className="text-teal-900">{q.correctAnswer}</strong>
                  </p>
                  {onPlayCustomQuiz && (
                    <button
                      onClick={() => onPlayCustomQuiz(q)}
                      className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold cursor-pointer"
                    >
                      <Play className="w-3 h-3" />
                      <span>Play this Quiz Now</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Family Member Modal (Includes Photo Upload & Presets) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4 my-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-xl font-bold text-stone-900 font-serif">
                  {editingMember ? 'Edit Family Member' : 'Add New Family Member'}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Set their personal picture, details, and memory notes.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="space-y-4 text-xs sm:text-sm">
              {/* Picture Upload & Preset Selector Section */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                <label className="block font-bold text-stone-900">
                  Member Picture / Photo *
                </label>

                <div className="flex items-center gap-4">
                  <img
                    src={avatar}
                    alt="Preview"
                    className="w-20 h-20 rounded-2xl object-cover ring-2 ring-teal-500 shadow-sm shrink-0"
                  />
                  <div className="space-y-2 flex-1">
                    <input
                      ref={memberFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, setAvatar)}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => memberFileInputRef.current?.click()}
                      className="w-full py-2 px-3 rounded-xl bg-white border border-stone-300 hover:bg-stone-100 text-stone-800 font-semibold flex items-center justify-center gap-2 cursor-pointer text-xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-teal-700" />
                      <span>Upload Photo from Phone / PC</span>
                    </button>
                    <p className="text-[11px] text-stone-500">
                      Upload any portrait or family snapshot (PNG, JPG).
                    </p>
                  </div>
                </div>

                {/* Quick Presets Carousel */}
                <div>
                  <span className="text-[11px] font-semibold text-stone-600 block mb-1.5">
                    Or choose from standard photo presets:
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {AVATAR_PRESETS.slice(0, 4).map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAvatar(preset.url)}
                        className={`p-1 rounded-xl border transition-all text-center cursor-pointer ${
                          avatar === preset.url
                            ? 'border-teal-600 ring-2 ring-teal-400 bg-white'
                            : 'border-stone-200 hover:border-stone-300 bg-white'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.label}
                          className="w-full h-12 object-cover rounded-lg"
                        />
                        <span className="text-[10px] text-stone-600 block mt-1 truncate">
                          {preset.label.split('/')[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block font-semibold text-stone-800 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Vance"
                  className="w-full p-3 rounded-xl border border-stone-300 text-stone-900 bg-white focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                />
              </div>

              {/* Relationship & Birthday */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Relationship *</label>
                  <select
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    className="w-full p-3 rounded-xl border border-stone-300 text-stone-900 bg-white focus:border-teal-600"
                  >
                    <option value="Son">Son</option>
                    <option value="Daughter">Daughter</option>
                    <option value="Granddaughter">Granddaughter</option>
                    <option value="Grandson">Grandson</option>
                    <option value="Sister">Sister</option>
                    <option value="Brother">Brother</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Close Friend">Close Friend</option>
                    <option value="Caregiver">Caregiver</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Birthday</label>
                  <input
                    type="text"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    placeholder="e.g. April 14, 1982"
                    className="w-full p-3 rounded-xl border border-stone-300 text-stone-900 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-800 mb-1">
                  Important Dates & Events
                </label>
                <input
                  type="text"
                  value={importantDates}
                  onChange={(e) => setImportantDates(e.target.value)}
                  placeholder="e.g. Sunday dinner at 5:00 PM; Anniversary in July"
                  className="w-full p-3 rounded-xl border border-stone-300 text-stone-900 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-800 mb-1">Shared Memories</label>
                <textarea
                  rows={2}
                  value={sharedMemories}
                  onChange={(e) => setSharedMemories(e.target.value)}
                  placeholder="e.g. Built the wooden backyard birdhouse together in 2019..."
                  className="w-full p-3 rounded-xl border border-stone-300 text-stone-900 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-800 mb-1">
                  Personal Preferences & Favorites
                </label>
                <input
                  type="text"
                  value={personalPreferences}
                  onChange={(e) => setPersonalPreferences(e.target.value)}
                  placeholder="e.g. Loves cardamom tea, jazz music, and gardening"
                  className="w-full p-3 rounded-xl border border-stone-300 text-stone-900 bg-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold cursor-pointer"
                >
                  {editingMember ? 'Save Changes' : 'Add to Circle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Quiz Creator Studio Modal */}
      {isQuizStudioOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start pb-3 border-b border-stone-100">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider mb-1">
                  <Camera className="w-3.5 h-3.5" />
                  Custom Quiz Creator Studio
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-stone-900 font-serif">
                  Create Personalized Photo & Story Quiz
                </h3>
                <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                  Build custom questions for {user.name} with real family photos, written memories, and voice hints.
                </p>
              </div>
              <button
                onClick={() => setIsQuizStudioOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              {/* Target Family Member Selector */}
              <div>
                <label className="block font-bold text-stone-900 mb-1">
                  Who is this memory about? *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {family.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        setQuizTargetMemberId(f.id);
                        if (!quizQuestionImage || quizQuestionImage === AVATAR_PRESETS[0].url) {
                          setQuizQuestionImage(f.avatar);
                        }
                      }}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-left cursor-pointer transition-all ${
                        quizTargetMemberId === f.id
                          ? 'border-teal-600 bg-teal-50/80 ring-2 ring-teal-400 text-teal-950 font-bold'
                          : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                      }`}
                    >
                      <img
                        src={f.avatar}
                        alt={f.name}
                        className="w-8 h-8 rounded-lg object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="truncate text-xs">{f.name}</div>
                        <div className="text-[10px] text-stone-500 truncate">{f.relationship}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Attach Photo / Picture for the Question */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-amber-950 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-amber-700" />
                    <span>Attach Photo / Image for this Question</span>
                  </label>
                  {quizQuestionImage && (
                    <button
                      type="button"
                      onClick={() => setQuizQuestionImage('')}
                      className="text-[11px] text-rose-600 hover:underline font-semibold"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  {quizQuestionImage ? (
                    <div className="relative shrink-0">
                      <img
                        src={quizQuestionImage}
                        alt="Quiz Clue"
                        className="w-32 h-24 sm:w-40 sm:h-28 rounded-2xl object-cover ring-2 ring-amber-400 shadow-sm"
                      />
                      <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded">
                        Preview
                      </span>
                    </div>
                  ) : (
                    <div className="w-32 h-24 sm:w-40 sm:h-28 rounded-2xl border-2 border-dashed border-amber-300 bg-white flex flex-col items-center justify-center text-amber-800 text-xs shrink-0">
                      <ImageIcon className="w-6 h-6 mb-1 text-amber-600" />
                      <span>No Photo</span>
                    </div>
                  )}

                  <div className="space-y-2 flex-1 w-full">
                    <input
                      ref={quizPhotoFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, setQuizQuestionImage)}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => quizPhotoFileInputRef.current?.click()}
                      className="w-full py-2.5 px-3 rounded-xl bg-white border border-amber-300 hover:bg-amber-100/50 text-amber-950 font-bold flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                    >
                      <Upload className="w-4 h-4 text-amber-700" />
                      <span>Upload Memory Photo from Phone / PC</span>
                    </button>

                    <div>
                      <span className="text-[11px] text-stone-600 block mb-1">
                        Or select a sample family event photo:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {MEMORY_PHOTO_PRESETS.map((m, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setQuizQuestionImage(m.url)}
                            className="text-[11px] px-2 py-1 rounded-lg bg-white border border-stone-200 hover:border-amber-400 hover:text-amber-900 transition-colors"
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Question Text */}
              <div>
                <label className="block font-bold text-stone-900 mb-1">
                  Question Text (Shown to {user.name}) *
                </label>
                <input
                  type="text"
                  required
                  value={quizQuestionTitle}
                  onChange={(e) => setQuizQuestionTitle(e.target.value)}
                  placeholder="e.g. Who is this in the photo standing by the wooden birdhouse?"
                  className="w-full p-3 rounded-xl border border-stone-300 text-stone-900 bg-white font-medium focus:border-teal-600 focus:ring-1 focus:ring-teal-600 text-sm"
                />
              </div>

              {/* Question Format Selector */}
              <div>
                <label className="block font-bold text-stone-900 mb-1.5">
                  Question Format
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { type: 'multiple_choice', label: 'Multiple Choice', icon: FileQuestion },
                    { type: 'short_answer', label: 'Written Recall', icon: Type },
                    { type: 'true_false', label: 'True / False', icon: CheckCircle2 },
                    { type: 'sequence', label: 'Event Sequence', icon: ListOrdered },
                  ].map((fmt) => {
                    const Icon = fmt.icon;
                    return (
                      <button
                        key={fmt.type}
                        type="button"
                        onClick={() => setQuizQuestionType(fmt.type as QuestionType)}
                        className={`p-2.5 rounded-xl border text-center flex flex-col items-center gap-1 cursor-pointer transition-all ${
                          quizQuestionType === fmt.type
                            ? 'border-teal-600 bg-teal-50/90 ring-2 ring-teal-400 text-teal-950 font-bold'
                            : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                        }`}
                      >
                        <Icon className="w-4 h-4 text-teal-700" />
                        <span className="text-xs">{fmt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Answer Inputs based on question type */}
              {/* MULTIPLE CHOICE */}
              {quizQuestionType === 'multiple_choice' && (
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-stone-900">
                      Options & Correct Answer
                    </label>
                    <span className="text-[11px] text-teal-700 font-semibold">
                      Click the radio dot to mark the correct choice
                    </span>
                  </div>

                  <div className="space-y-2">
                    {[
                      { val: quizOptionA, setVal: setQuizOptionA, label: 'Option A' },
                      { val: quizOptionB, setVal: setQuizOptionB, label: 'Option B' },
                      { val: quizOptionC, setVal: setQuizOptionC, label: 'Option C' },
                      { val: quizOptionD, setVal: setQuizOptionD, label: 'Option D' },
                    ].map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="correctOptionRadio"
                          checked={quizCorrectAnswer === opt.val && opt.val.trim().length > 0}
                          onChange={() => setQuizCorrectAnswer(opt.val)}
                          className="w-4 h-4 text-teal-600 focus:ring-teal-500 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={opt.val}
                          onChange={(e) => {
                            opt.setVal(e.target.value);
                            if (quizCorrectAnswer === opt.val) {
                              setQuizCorrectAnswer(e.target.value);
                            }
                          }}
                          placeholder={opt.label}
                          className="flex-1 p-2.5 rounded-xl border border-stone-300 bg-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SHORT ANSWER / WRITTEN RECALL */}
              {quizQuestionType === 'short_answer' && (
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                  <label className="font-bold text-stone-900 block">
                    Expected Recall Answer *
                  </label>
                  <p className="text-[11px] text-stone-500">
                    The patient can either speak this answer aloud into their microphone or type it.
                  </p>
                  <input
                    type="text"
                    required
                    value={quizCorrectAnswer}
                    onChange={(e) => setQuizCorrectAnswer(e.target.value)}
                    placeholder="e.g. Cape Cod or Lemon Cookies"
                    className="w-full p-3 rounded-xl border border-stone-300 bg-white"
                  />
                </div>
              )}

              {/* TRUE / FALSE */}
              {quizQuestionType === 'true_false' && (
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                  <label className="font-bold text-stone-900 block">
                    Correct Answer
                  </label>
                  <div className="flex gap-3">
                    {['True', 'False'].map((tf) => (
                      <button
                        key={tf}
                        type="button"
                        onClick={() => setQuizTrueFalseAnswer(tf as 'True' | 'False')}
                        className={`flex-1 py-2.5 rounded-xl border font-bold cursor-pointer transition-all ${
                          quizTrueFalseAnswer === tf
                            ? 'bg-teal-700 text-white border-teal-700 ring-2 ring-teal-400'
                            : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* SEQUENCE */}
              {quizQuestionType === 'sequence' && (
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                  <label className="font-bold text-stone-900 block">
                    Timeline Sequence (Enter steps in correct chronological order, one per line)
                  </label>
                  <textarea
                    rows={3}
                    value={quizSequenceSteps}
                    onChange={(e) => setQuizSequenceSteps(e.target.value)}
                    className="w-full p-3 rounded-xl border border-stone-300 bg-white font-mono text-xs"
                    placeholder="Step 1&#10;Step 2&#10;Step 3"
                  />
                </div>
              )}

              {/* Spoken Audio Voice Clue (Optional) */}
              <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-teal-950 flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-teal-700" />
                    <span>Spoken Voice Clue / Loving Audio Note (Optional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleTestSpokenHint}
                    className="text-xs font-semibold text-teal-800 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>{isPlayingSpokenHint ? 'Stop Audio' : 'Test Speech'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={quizSpokenHint}
                  onChange={(e) => setQuizSpokenHint(e.target.value)}
                  placeholder="e.g. Remember our summer trip where we baked lemon cookies together?"
                  className="w-full p-2.5 rounded-xl border border-teal-300 bg-white text-stone-900"
                />
                <p className="text-[11px] text-teal-800">
                  {user.name} can tap the "Read Aloud" button during the quiz to hear this spoken hint.
                </p>
              </div>

              {/* Memory Context / Explanation */}
              <div>
                <label className="block font-semibold text-stone-800 mb-1">
                  Memory Note / Feedback Explanation
                </label>
                <input
                  type="text"
                  value={quizExplanation}
                  onChange={(e) => setQuizExplanation(e.target.value)}
                  placeholder="e.g. Maya took this photo during our Sunday terrace breakfast in 2021."
                  className="w-full p-3 rounded-xl border border-stone-300 bg-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsQuizStudioOpen(false)}
                  className="py-3 px-4 rounded-xl border border-stone-300 font-semibold hover:bg-stone-100 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveCustomQuiz(false)}
                  className="flex-1 py-3 px-4 rounded-xl border border-teal-700 text-teal-800 hover:bg-teal-50 font-bold cursor-pointer transition-colors"
                >
                  Save to Daily Quiz Pool
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveCustomQuiz(true)}
                  className="flex-1 py-3 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-colors"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Play This Quiz with {user.name} Now</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
