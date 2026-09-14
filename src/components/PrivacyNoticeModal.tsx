import React from 'react';
import { ShieldCheck, Lock, Users, Mic, Trash2, CheckCircle2 } from 'lucide-react';

interface PrivacyNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  consentGiven: boolean;
  onToggleConsent: () => void;
}

export const PrivacyNoticeModal: React.FC<PrivacyNoticeModalProps> = ({
  isOpen,
  onClose,
  consentGiven,
  onToggleConsent,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-5 my-8">
        <div className="flex justify-between items-start pb-2 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-stone-900 font-serif">
                Privacy, Consent & Data Governance
              </h3>
              <p className="text-xs text-stone-500">MEMONEST Cognitive Health Platform</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 font-bold text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3.5 text-xs sm:text-sm text-stone-700 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-start gap-3">
            <Lock className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-stone-900">1. Personal & Memory Data Privacy</h4>
              <p className="text-stone-600 mt-0.5 text-xs">
                All routines, birthdays, family relationships, and memories recorded are kept confidential to the user and authorized caregivers. Data is never sold or used for targeted commercial advertising.
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-start gap-3">
            <Mic className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-stone-900">2. Audio Story Recordings</h4>
              <p className="text-stone-600 mt-0.5 text-xs">
                Spoken audio stories are stored securely with your profile. The AI analyzes only the narrative memory elements (places, people, pleasant activities) to create meaningful recall questions. You can delete recordings at any time.
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-start gap-3">
            <Users className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-stone-900">3. Family & Caregiver Role-Based Access</h4>
              <p className="text-stone-600 mt-0.5 text-xs">
                Caregivers and family members access the system with defined permission scopes. Family members can submit memory prompts to help their loved one recall cherished memories.
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200/70 flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-stone-900">4. Non-Medical Clinical Disclaimer</h4>
              <p className="text-stone-700 mt-0.5 text-xs">
                MEMONEST AI is designed for active mental exercise, recall practice, and familial engagement. It does not provide clinical diagnostic conclusions, psychiatric evaluation, or medical prescriptions.
              </p>
            </div>
          </div>
        </div>

        {/* Consent toggle */}
        <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
          <label className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-stone-800 cursor-pointer">
            <input
              type="checkbox"
              checked={consentGiven}
              onChange={onToggleConsent}
              className="w-4 h-4 rounded text-teal-700 focus:ring-teal-500"
            />
            <span>I acknowledge and consent to personalized cognitive memory tracking</span>
          </label>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
};
