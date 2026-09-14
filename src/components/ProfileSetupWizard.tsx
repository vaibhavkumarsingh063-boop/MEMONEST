import React, { useState } from 'react';
import {
  Brain,
  User,
  Calendar,
  Languages,
  Upload,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  Sparkles,
  Heart,
  Compass,
  MapPin,
  Bookmark,
  Camera,
  Loader2,
  Pencil,
  Image as ImageIcon,
} from 'lucide-react';
import { UserAccount } from '../types';
import { authApi } from '../utils/authApi';

interface ProfileSetupWizardProps {
  user: UserAccount;
  onProfileComplete: (updatedUser: UserAccount) => void;
  onLogout: () => void;
}

export const ProfileSetupWizard: React.FC<ProfileSetupWizardProps> = ({
  user,
  onProfileComplete,
  onLogout,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State initialized with any existing user data
  const [name, setName] = useState(user.name || '');
  const [age, setAge] = useState<number | string>(user.age || '');
  const [preferredLanguage, setPreferredLanguage] = useState(user.preferredLanguage || 'English');
  const [profilePicture, setProfilePicture] = useState(
    user.profilePicture ||
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80'
  );

  const [favoriteActivities, setFavoriteActivities] = useState(user.favoriteActivities || '');
  const [hobbies, setHobbies] = useState(user.hobbies || '');

  const [frequentlyVisitedPlaces, setFrequentlyVisitedPlaces] = useState(
    user.frequentlyVisitedPlaces || ''
  );
  const [importantInformation, setImportantInformation] = useState(
    user.importantInformation || ''
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Quick activity tags
  const activitySuggestions = [
    'Morning walks in the park',
    'Gardening & caring for plants',
    'Cooking family recipes',
    'Listening to classical music',
    'Reading books & newspapers',
    'Knitting & crafts',
  ];

  // Quick hobby suggestions
  const hobbySuggestions = [
    'Crossword puzzles',
    'Chess & board games',
    'Bird watching',
    'Watercolor painting',
    'Writing daily journals',
    'Singing old melodies',
  ];

  // Quick places suggestions
  const placeSuggestions = [
    'City Botanical Garden',
    'Central Public Library',
    'Neighborhood Grocery Market',
    'Community Center / Hall',
    'Local Place of Worship',
    'Grandkids’ School / Park',
  ];

  // Handle Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Image size should be under 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setProfilePicture(event.target.result as string);
          setErrorMessage(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setProfilePicture('');
  };

  const handleSampleAvatar = (url: string) => {
    setProfilePicture(url);
  };

  const addTag = (currentVal: string, tag: string, setter: (val: string) => void) => {
    if (!currentVal.trim()) {
      setter(tag);
    } else if (!currentVal.includes(tag)) {
      setter(`${currentVal.trim()}, ${tag}`);
    }
  };

  // Step 1 Validation
  const handleNextFromStep1 = () => {
    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    setErrorMessage(null);
    setCurrentStep(2);
  };

  // Step 2 Next
  const handleNextFromStep2 = () => {
    setErrorMessage(null);
    setCurrentStep(3);
  };

  // Step 3 Next
  const handleNextFromStep3 = () => {
    setErrorMessage(null);
    setCurrentStep(4);
  };

  // Step 4 Complete Profile
  const handleCompleteProfile = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const updated = await authApi.updateProfile({
        name: name.trim(),
        age: age ? Number(age) || age : '',
        preferredLanguage,
        profilePicture,
        favoriteActivities: favoriteActivities.trim(),
        hobbies: hobbies.trim(),
        frequentlyVisitedPlaces: frequentlyVisitedPlaces.trim(),
        importantInformation: importantInformation.trim(),
        profileCompleted: true, // Marked as completed!
      });

      setShowSuccessToast(true);

      // Brief delay to display the success message
      setTimeout(() => {
        onProfileComplete(updated);
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save profile. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100/70 py-8 px-4 sm:px-6 lg:px-8 flex flex-col justify-between">
      {/* Top micro-bar */}
      <div className="max-w-3xl mx-auto w-full flex items-center justify-between pb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center shadow-xs">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <span className="font-serif font-bold text-stone-900 text-lg tracking-tight">
              MemoryMate AI
            </span>
            <span className="block text-[11px] text-teal-800 font-medium">
              Profile Setup Wizard
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-stone-600 hidden sm:inline">
            Logged in as <strong>{user.email}</strong>
          </span>
          <button
            onClick={onLogout}
            className="text-xs text-stone-700 hover:text-red-700 font-medium px-2.5 py-1 rounded-lg border border-stone-300 hover:bg-stone-50 transition-colors cursor-pointer"
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Main Card Container */}
      <div className="max-w-3xl mx-auto w-full bg-white rounded-3xl border border-stone-200 shadow-sm p-6 sm:p-10 relative overflow-hidden">
        {/* Success Modal / Banner */}
        {showSuccessToast && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-30 flex flex-col items-center justify-center text-center p-6 animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4 ring-8 ring-emerald-50">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900 mb-2">
              Your MemoryMate profile is ready!
            </h3>
            <p className="text-stone-600 max-w-md text-sm sm:text-base mb-6">
              Thank you, {name}. Your personalized memory companion has been configured and is
              ready to support your cognitive engagement.
            </p>
            <div className="flex items-center gap-2 text-teal-800 font-medium text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Redirecting to your Home page...</span>
            </div>
          </div>
        )}

        {/* Wizard Header Titles */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold uppercase tracking-wider mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Personalization Wizard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 font-serif">
            Let's set up your MemoryMate profile
          </h1>
          <p className="mt-2 text-sm sm:text-base text-stone-600 max-w-xl mx-auto">
            Tell us a little about yourself so we can personalize your memory exercises.
          </p>
        </div>

        {/* Multi-Step Progress Indicator: 1 ─── 2 ─── 3 ─── 4 */}
        <div className="mb-8 max-w-xl mx-auto">
          <div className="flex items-center justify-between relative">
            {/* Step 1 */}
            <div className="flex flex-col items-center z-10">
              <button
                onClick={() => setCurrentStep(1)}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all cursor-pointer ${
                  currentStep === 1
                    ? 'bg-teal-700 text-white ring-4 ring-teal-100'
                    : currentStep > 1
                    ? 'bg-emerald-600 text-white'
                    : 'bg-stone-200 text-stone-600'
                }`}
              >
                {currentStep > 1 ? <Check className="w-5 h-5" /> : '1'}
              </button>
              <span
                className={`mt-2 text-xs font-medium ${
                  currentStep === 1 ? 'text-teal-800 font-semibold' : 'text-stone-500'
                }`}
              >
                Basic Info
              </span>
            </div>

            {/* Line 1-2 */}
            <div
              className={`flex-1 h-1 mx-2 transition-colors ${
                currentStep >= 2 ? 'bg-emerald-600' : 'bg-stone-200'
              }`}
            />

            {/* Step 2 */}
            <div className="flex flex-col items-center z-10">
              <button
                onClick={() => currentStep > 2 && setCurrentStep(2)}
                disabled={currentStep < 2}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  currentStep === 2
                    ? 'bg-teal-700 text-white ring-4 ring-teal-100'
                    : currentStep > 2
                    ? 'bg-emerald-600 text-white cursor-pointer'
                    : 'bg-stone-200 text-stone-500'
                }`}
              >
                {currentStep > 2 ? <Check className="w-5 h-5" /> : '2'}
              </button>
              <span
                className={`mt-2 text-xs font-medium ${
                  currentStep === 2 ? 'text-teal-800 font-semibold' : 'text-stone-500'
                }`}
              >
                Preferences
              </span>
            </div>

            {/* Line 2-3 */}
            <div
              className={`flex-1 h-1 mx-2 transition-colors ${
                currentStep >= 3 ? 'bg-emerald-600' : 'bg-stone-200'
              }`}
            />

            {/* Step 3 */}
            <div className="flex flex-col items-center z-10">
              <button
                onClick={() => currentStep > 3 && setCurrentStep(3)}
                disabled={currentStep < 3}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  currentStep === 3
                    ? 'bg-teal-700 text-white ring-4 ring-teal-100'
                    : currentStep > 3
                    ? 'bg-emerald-600 text-white cursor-pointer'
                    : 'bg-stone-200 text-stone-500'
                }`}
              >
                {currentStep > 3 ? <Check className="w-5 h-5" /> : '3'}
              </button>
              <span
                className={`mt-2 text-xs font-medium ${
                  currentStep === 3 ? 'text-teal-800 font-semibold' : 'text-stone-500'
                }`}
              >
                Important Info
              </span>
            </div>

            {/* Line 3-4 */}
            <div
              className={`flex-1 h-1 mx-2 transition-colors ${
                currentStep >= 4 ? 'bg-emerald-600' : 'bg-stone-200'
              }`}
            />

            {/* Step 4 */}
            <div className="flex flex-col items-center z-10">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  currentStep === 4
                    ? 'bg-teal-700 text-white ring-4 ring-teal-100'
                    : 'bg-stone-200 text-stone-500'
                }`}
              >
                4
              </div>
              <span
                className={`mt-2 text-xs font-medium ${
                  currentStep === 4 ? 'text-teal-800 font-semibold' : 'text-stone-500'
                }`}
              >
                Review
              </span>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {errorMessage}
          </div>
        )}

        {/* STEP 1: Basic Information */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="border-b border-stone-200 pb-4 mb-4">
              <h3 className="text-lg font-bold text-stone-900 font-serif">
                Step 1: Basic Information
              </h3>
              <p className="text-xs text-stone-500">
                Provide your basic contact identity for a warm, personalized greeting.
              </p>
            </div>

            {/* Profile Picture Upload & Preview */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
              <label className="block text-sm font-semibold text-stone-800 mb-2">
                Profile Picture <span className="text-stone-500 text-xs">(Optional)</span>
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-5">
                {/* Photo Preview */}
                <div className="relative group shrink-0">
                  {profilePicture ? (
                    <img
                      src={profilePicture}
                      alt="Profile preview"
                      className="w-24 h-24 rounded-2xl object-cover ring-2 ring-teal-600 shadow-sm"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-stone-200 text-stone-400 flex flex-col items-center justify-center border-2 border-dashed border-stone-300">
                      <ImageIcon className="w-8 h-8" />
                      <span className="text-[10px] mt-1 font-medium">No Photo</span>
                    </div>
                  )}

                  {profilePicture && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      title="Remove profile picture"
                      className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-xs cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Upload & Actions */}
                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                    <label className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-semibold rounded-xl cursor-pointer flex items-center gap-1.5 transition-colors shadow-xs">
                      <Upload className="w-4 h-4" />
                      <span>Upload Picture</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>

                    {profilePicture && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="px-3 py-2 border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs sm:text-sm rounded-xl transition-colors cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-stone-500">
                    Supports JPG, PNG, or WEBP from your phone or PC (under 5MB).
                  </p>

                  {/* Sample Quick Avatars if user does not have a photo */}
                  <div className="pt-2 flex items-center gap-2 text-xs text-stone-500">
                    <span>Or pick sample:</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleSampleAvatar(
                          'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80'
                        )
                      }
                      className="hover:underline text-teal-800 cursor-pointer"
                    >
                      Eleanor
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleSampleAvatar(
                          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80'
                        )
                      }
                      className="hover:underline text-teal-800 cursor-pointer"
                    >
                      Rahul
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleSampleAvatar(
                          'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=300&auto=format&fit=crop&q=80'
                        )
                      }
                      className="hover:underline text-teal-800 cursor-pointer"
                    >
                      Arthur
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label
                htmlFor="wizard-name"
                className="block text-sm font-semibold text-stone-800 mb-1"
              >
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  id="wizard-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Age & Language Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Age */}
              <div>
                <label
                  htmlFor="wizard-age"
                  className="block text-sm font-semibold text-stone-800 mb-1"
                >
                  Age <span className="text-stone-500 text-xs">(Optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <input
                    id="wizard-age"
                    type="number"
                    min="1"
                    max="125"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g. 68"
                    className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Preferred Language */}
              <div>
                <label
                  htmlFor="wizard-language"
                  className="block text-sm font-semibold text-stone-800 mb-1"
                >
                  Preferred Language
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Languages className="w-5 h-5" />
                  </div>
                  <select
                    id="wizard-language"
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all cursor-pointer"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi (हिंदी)</option>
                    <option value="Spanish">Spanish (Español)</option>
                    <option value="French">French (Français)</option>
                    <option value="German">German (Deutsch)</option>
                    <option value="Mandarin">Mandarin (中文)</option>
                    <option value="Italian">Italian (Italiano)</option>
                    <option value="Japanese">Japanese (日本語)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-end pt-4 border-t border-stone-200">
              <button
                type="button"
                onClick={handleNextFromStep1}
                id="wizard-step1-next-btn"
                className="px-6 py-3 bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer text-sm sm:text-base"
              >
                <span>Save and Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Preferences / About You */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="border-b border-stone-200 pb-4 mb-4">
              <h3 className="text-lg font-bold text-stone-900 font-serif">
                Step 2: About You (Preferences)
              </h3>
              <p className="text-xs text-stone-500">
                These help MemoryMate build personalized questions centered on things you love.
              </p>
            </div>

            {/* Favorite Activities */}
            <div>
              <label
                htmlFor="wizard-activities"
                className="block text-sm font-semibold text-stone-800 mb-1"
              >
                What are your favorite activities?
              </label>
              <textarea
                id="wizard-activities"
                rows={3}
                value={favoriteActivities}
                onChange={(e) => setFavoriteActivities(e.target.value)}
                placeholder="e.g. Taking morning walks in the garden, listening to classical vinyl records, baking bread"
                className="w-full p-3.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all"
              />
              {/* Quick Tags */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="text-xs text-stone-500 py-1">Quick Add:</span>
                {activitySuggestions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => addTag(favoriteActivities, item, setFavoriteActivities)}
                    className="px-2.5 py-1 text-xs bg-stone-100 hover:bg-teal-100 text-stone-700 hover:text-teal-800 rounded-lg transition-colors border border-stone-200/60 cursor-pointer"
                  >
                    + {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Hobbies */}
            <div>
              <label
                htmlFor="wizard-hobbies"
                className="block text-sm font-semibold text-stone-800 mb-1"
              >
                What are your hobbies?
              </label>
              <textarea
                id="wizard-hobbies"
                rows={3}
                value={hobbies}
                onChange={(e) => setHobbies(e.target.value)}
                placeholder="e.g. Crossword puzzles, chess, stamp collecting, watercolor painting"
                className="w-full p-3.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all"
              />
              {/* Quick Tags */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="text-xs text-stone-500 py-1">Quick Add:</span>
                {hobbySuggestions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => addTag(hobbies, item, setHobbies)}
                    className="px-2.5 py-1 text-xs bg-stone-100 hover:bg-teal-100 text-stone-700 hover:text-teal-800 rounded-lg transition-colors border border-stone-200/60 cursor-pointer"
                  >
                    + {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-5 py-2.5 border border-stone-300 text-stone-700 hover:bg-stone-50 rounded-xl text-sm font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleNextFromStep2}
                  className="px-4 py-2.5 text-stone-500 hover:text-stone-800 text-sm font-medium cursor-pointer"
                >
                  Skip optional questions
                </button>
                <button
                  type="button"
                  onClick={handleNextFromStep2}
                  id="wizard-step2-next-btn"
                  className="px-6 py-3 bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer text-sm sm:text-base"
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Important Information */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="border-b border-stone-200 pb-4 mb-4">
              <h3 className="text-lg font-bold text-stone-900 font-serif">
                Step 3: Important Information
              </h3>
              <p className="text-xs text-stone-500">
                Key places and facts you'd like your AI companion to help you remember.
              </p>
            </div>

            {/* Frequently Visited Places */}
            <div>
              <label
                htmlFor="wizard-places"
                className="block text-sm font-semibold text-stone-800 mb-1"
              >
                What places do you frequently visit?
              </label>
              <textarea
                id="wizard-places"
                rows={3}
                value={frequentlyVisitedPlaces}
                onChange={(e) => setFrequentlyVisitedPlaces(e.target.value)}
                placeholder="e.g. City botanical gardens, community library, the corner coffee bakery, St. Peter's"
                className="w-full p-3.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all"
              />
              {/* Quick Tags */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="text-xs text-stone-500 py-1">Quick Add:</span>
                {placeSuggestions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() =>
                      addTag(frequentlyVisitedPlaces, item, setFrequentlyVisitedPlaces)
                    }
                    className="px-2.5 py-1 text-xs bg-stone-100 hover:bg-teal-100 text-stone-700 hover:text-teal-800 rounded-lg transition-colors border border-stone-200/60 cursor-pointer"
                  >
                    + {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Important Things to Remember */}
            <div>
              <label
                htmlFor="wizard-important"
                className="block text-sm font-semibold text-stone-800 mb-1"
              >
                What are some important things you would like MemoryMate to remember?
              </label>
              <textarea
                id="wizard-important"
                rows={4}
                value={importantInformation}
                onChange={(e) => setImportantInformation(e.target.value)}
                placeholder="e.g. My daughter visits on Sundays; I enjoy peppermint tea at 8:00 AM; My wedding anniversary is on June 14th; Dr. Miller is my cardiologist."
                className="w-full p-3.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all"
              />
              <p className="text-xs text-stone-500 mt-1">
                We never ask for unnecessary sensitive info such as credit cards or bank details.
              </p>
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-5 py-2.5 border border-stone-300 text-stone-700 hover:bg-stone-50 rounded-xl text-sm font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleNextFromStep3}
                  className="px-4 py-2.5 text-stone-500 hover:text-stone-800 text-sm font-medium cursor-pointer"
                >
                  Skip optional question
                </button>
                <button
                  type="button"
                  onClick={handleNextFromStep3}
                  id="wizard-step3-next-btn"
                  className="px-6 py-3 bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer text-sm sm:text-base"
                >
                  <span>Review Profile</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Review Page */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="border-b border-stone-200 pb-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-stone-900 font-serif">
                    Step 4: Review Your Profile
                  </h3>
                  <p className="text-xs text-stone-500">
                    Verify all your details before completing setup.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-teal-800 hover:text-teal-950 px-3 py-1.5 rounded-lg border border-teal-200 bg-teal-50 cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
              </div>
            </div>

            {/* Profile Header Summary */}
            <div className="p-5 bg-stone-50 border border-stone-200 rounded-2xl flex flex-col sm:flex-row items-center gap-5">
              <img
                src={
                  profilePicture ||
                  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80'
                }
                alt={name}
                className="w-20 h-20 rounded-2xl object-cover ring-2 ring-teal-600 shadow-sm"
              />
              <div className="text-center sm:text-left">
                <h4 className="text-xl font-bold text-stone-900 font-serif">{name || 'Rahul'}</h4>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1.5 text-xs text-stone-600">
                  <span className="px-2.5 py-1 rounded-md bg-white border border-stone-200">
                    Age: <strong>{age || 'Not specified'}</strong>
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-white border border-stone-200">
                    Language: <strong>{preferredLanguage}</strong>
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-teal-100 text-teal-900 font-medium">
                    Account: {user.email}
                  </span>
                </div>
              </div>
            </div>

            {/* Detailed Cards */}
            <div className="space-y-3.5">
              {/* Favorite Activities */}
              <div className="p-4 rounded-xl border border-stone-200 bg-white">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-teal-600" />
                    Favorite Activity
                  </span>
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="text-xs text-stone-500 hover:text-teal-800 cursor-pointer"
                  >
                    Change
                  </button>
                </div>
                <p className="text-sm text-stone-800 font-medium">
                  {favoriteActivities || <em className="text-stone-400">None specified yet</em>}
                </p>
              </div>

              {/* Hobbies */}
              <div className="p-4 rounded-xl border border-stone-200 bg-white">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                    Hobby
                  </span>
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="text-xs text-stone-500 hover:text-teal-800 cursor-pointer"
                  >
                    Change
                  </button>
                </div>
                <p className="text-sm text-stone-800 font-medium">
                  {hobbies || <em className="text-stone-400">None specified yet</em>}
                </p>
              </div>

              {/* Frequently Visited Places */}
              <div className="p-4 rounded-xl border border-stone-200 bg-white">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-teal-600" />
                    Frequently Visited Place
                  </span>
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="text-xs text-stone-500 hover:text-teal-800 cursor-pointer"
                  >
                    Change
                  </button>
                </div>
                <p className="text-sm text-stone-800 font-medium">
                  {frequentlyVisitedPlaces || (
                    <em className="text-stone-400">None specified yet</em>
                  )}
                </p>
              </div>

              {/* Important Information */}
              <div className="p-4 rounded-xl border border-stone-200 bg-white">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                    <Bookmark className="w-3.5 h-3.5 text-teal-600" />
                    Important Things to Remember
                  </span>
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="text-xs text-stone-500 hover:text-teal-800 cursor-pointer"
                  >
                    Change
                  </button>
                </div>
                <p className="text-sm text-stone-800 font-medium whitespace-pre-line">
                  {importantInformation || (
                    <em className="text-stone-400">None specified yet</em>
                  )}
                </p>
              </div>
            </div>

            {/* Completion Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="w-full sm:w-auto px-5 py-2.5 border border-stone-300 text-stone-700 hover:bg-stone-50 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="w-full sm:w-auto px-5 py-3 border border-stone-300 text-stone-800 hover:bg-stone-100 font-semibold rounded-xl text-sm cursor-pointer"
                >
                  Edit Profile
                </button>

                <button
                  type="button"
                  onClick={handleCompleteProfile}
                  id="wizard-complete-profile-btn"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 py-3 bg-teal-700 hover:bg-teal-800 active:bg-teal-900 disabled:bg-teal-400 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-base hover:shadow-lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Complete Profile</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer reassurance */}
      <div className="text-center py-6 text-xs text-stone-500">
        <p>MemoryMate AI • Your data is encrypted and securely stored for recall training</p>
      </div>
    </div>
  );
};
