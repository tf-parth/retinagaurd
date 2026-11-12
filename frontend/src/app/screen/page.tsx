'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { ImageDropzone } from '@/components/ImageDropzone';
import {
  Eye,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  User,
  Hash,
  Compass,
} from 'lucide-react';

export default function ScreeningPage() {
  const router = useRouter();
  const { isHealthcareProfessional } = useAuth();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [patientRef, setPatientRef] = useState<string>('');
  const [patientAge, setPatientAge] = useState<string>('');
  const [patientGender, setPatientGender] = useState<string>('Not Specified');
  const [eyeLaterality, setEyeLaterality] = useState<string>('OD');
  const [screeningMode, setScreeningMode] = useState<string>(
    isHealthcareProfessional ? 'professional' : 'public'
  );

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [pipelineStep, setPipelineStep] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('Please select or capture a retinal fundus photograph before submitting.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (patientRef) formData.append('patient_ref', patientRef);
    if (patientAge) formData.append('patient_age', patientAge);
    if (patientGender) formData.append('patient_gender', patientGender);
    formData.append('eye_laterality', eyeLaterality);
    formData.append('screening_mode', screeningMode);

    try {
      setPipelineStep('Verifying file signature and optical adequacy metrics...');
      await new Promise((r) => setTimeout(r, 400));

      setPipelineStep('Standardizing resolution & computing CLAHE enhancement...');
      const caseResult = await api.uploadScreening(formData);

      setPipelineStep('Running EfficientNet-B0 inference & Grad-CAM generation...');
      await new Promise((r) => setTimeout(r, 400));

      // Redirect directly to results
      router.push(`/results/${caseResult.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Screening pipeline encountered an error. Please try again.');
      setIsSubmitting(false);
      setPipelineStep('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="border-b border-clinical-border pb-4">
        <h1 className="text-2xl font-bold text-clinical-navy">Retinal Fundus Screening Workspace</h1>
        <p className="text-xs text-clinical-muted mt-1">
          Upload or capture a posterior-pole retinal photograph for automated quality gating, DR classification, and visual attention mapping.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Screening Submission Notice</p>
            <p className="text-xs mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient / Subject Metadata Card */}
        <div className="bg-white border border-clinical-border rounded-xl p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-clinical-navy flex items-center gap-2 border-b border-slate-100 pb-2">
            <User className="w-4 h-4 text-clinical-primary" />
            Patient / Screening Subject Information (Optional / De-identified)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Patient Token / Ref ID
              </label>
              <input
                type="text"
                value={patientRef}
                onChange={(e) => setPatientRef(e.target.value)}
                placeholder="e.g. PHC-SON-042"
                disabled={isSubmitting}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Age (Years)
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={patientAge}
                onChange={(e) => setPatientAge(e.target.value)}
                placeholder="e.g. 58"
                disabled={isSubmitting}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Gender
              </label>
              <select
                value={patientGender}
                onChange={(e) => setPatientGender(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
              >
                <option value="Not Specified">Not Specified</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Eye Evaluated
              </label>
              <select
                value={eyeLaterality}
                onChange={(e) => setEyeLaterality(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
              >
                <option value="OD">Right Eye (OD)</option>
                <option value="OS">Left Eye (OS)</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
            <span className="text-clinical-muted">Screening Evaluation Mode:</span>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  value="public"
                  checked={screeningMode === 'public'}
                  onChange={() => setScreeningMode('public')}
                  className="accent-blue-600"
                />
                <span className="font-medium text-slate-700">Public / Patient</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  value="professional"
                  checked={screeningMode === 'professional'}
                  onChange={() => setScreeningMode('professional')}
                  className="accent-blue-600"
                />
                <span className="font-medium text-slate-700">Healthcare Professional</span>
              </label>
            </div>
          </div>
        </div>

        {/* Retinal Image Dropzone */}
        <div className="bg-white border border-clinical-border rounded-xl p-5 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-clinical-navy flex items-center gap-2 border-b border-slate-100 pb-2">
            <Eye className="w-4 h-4 text-clinical-primary" />
            Upload Retinal Fundus Photograph
          </h2>
          <ImageDropzone
            onImageSelected={(file) => setSelectedFile(file)}
            selectedFile={selectedFile}
            onClear={() => setSelectedFile(null)}
            disabled={isSubmitting}
          />
        </div>

        {/* Processing State Feedback */}
        {isSubmitting && (
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
                Pipeline Running...
              </p>
              <p className="text-xs mt-0.5">{pipelineStep}</p>
            </div>
          </div>
        )}

        {/* Submit Action */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.push('/')}
            disabled={isSubmitting}
            className="px-4 py-2.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !selectedFile}
            className={`flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded-lg text-white shadow-sm transition-all ${
              isSubmitting || !selectedFile
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-clinical-deepBlue hover:bg-clinical-primary scale-100 hover:scale-[1.01]'
            }`}
          >
            <span>Run Complete Screening</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
