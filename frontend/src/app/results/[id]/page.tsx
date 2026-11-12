'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ScreeningCase } from '@/lib/types';
import { GradCamViewer } from '@/components/GradCamViewer';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Eye,
  Activity,
  Layers,
  ArrowLeft,
  FileText,
  Clock,
  Sparkles,
  Info,
  Calendar,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export default function ScreeningResultsPage() {
  const params = useParams();
  const router = useRouter();
  const screeningId = params.id as string;

  const [screening, setScreening] = useState<ScreeningCase | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCase() {
      try {
        const data = await api.getScreening(screeningId);
        setScreening(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load screening case.');
      } finally {
        setLoading(false);
      }
    }
    if (screeningId) {
      loadCase();
    }
  }, [screeningId]);

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-10 h-10 border-3 border-clinical-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold text-clinical-navy">Retrieving screening case details...</p>
      </div>
    );
  }

  if (error || !screening) {
    return (
      <div className="max-w-xl mx-auto py-12 p-6 bg-red-50 border border-red-200 rounded-xl text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-red-600 mx-auto" />
        <h2 className="text-base font-bold text-red-900">Case Lookup Error</h2>
        <p className="text-xs text-red-700">{error || 'Screening record does not exist or has been deleted.'}</p>
        <button
          onClick={() => router.push('/screen')}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Screening
        </button>
      </div>
    );
  }

  const isRejected = screening.status === 'QUALITY_REJECTED';
  const grade = screening.predicted_grade ?? -1;
  const referable = screening.referable_dr ?? false;
  const isProfessional = screening.screening_mode === 'professional';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-clinical-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/history')}
              className="p-1 rounded hover:bg-slate-100 text-slate-500"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-clinical-navy">
              Diabetic Retinopathy Screening Result
            </h1>
          </div>
          <p className="text-xs text-clinical-muted mt-1 ml-6">
            Case ID: <span className="font-mono text-slate-700">{screening.id}</span> • Mode: <span className="capitalize font-semibold text-clinical-navy">{screening.screening_mode}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 ml-6 sm:ml-0">
          <a
            href={api.getReportDownloadUrl(screening.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-clinical-deepBlue text-white hover:bg-clinical-primary transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Download PDF Report
          </a>
        </div>
      </div>

      {/* Quality Gate Rejection Banner (If Ungradeable) */}
      {isRejected && (
        <div className="p-5 rounded-xl bg-red-50 border border-red-200 text-red-900 space-y-3 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h2 className="text-sm font-bold uppercase tracking-wide text-red-800">
                Image Quality Gateway: Recapture Required (Ungradeable Photograph)
              </h2>
              <p className="text-xs text-red-700 leading-relaxed">
                The optical quality evaluation identified excessive blur, severe lighting imbalance, or insufficient retinal field-of-view. <strong>Automated neural network classification has been halted</strong> to prevent misleading predictions.
              </p>
              {screening.quality_feedback && screening.quality_feedback.length > 0 && (
                <div className="mt-2 pt-2 border-t border-red-200 text-xs">
                  <span className="font-semibold">Detected Quality Issues:</span>
                  <ul className="list-disc list-inside mt-1 space-y-0.5">
                    {screening.quality_feedback.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => router.push('/screen')}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white"
            >
              Recapture Fundus Photo
            </button>
          </div>
        </div>
      )}

      {/* Main Results Grid */}
      {!isRejected && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Grade, Recommendation, Probability Vector (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Primary Severity Card */}
            <div className={`p-5 rounded-xl border ${
              referable
                ? 'bg-red-50/70 border-red-200'
                : 'bg-emerald-50/70 border-emerald-200'
            } shadow-xs space-y-3`}>
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                  referable ? 'bg-red-200 text-red-900' : 'bg-emerald-200 text-emerald-900'
                }`}>
                  {referable ? 'Referable Retinopathy' : 'Non-Referable Retinopathy'}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  Level {screening.predicted_grade} of 4
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-extrabold text-clinical-navy">
                  {screening.grade_name || 'Grading Pending'}
                </h2>
                <div className="flex items-center gap-2 mt-1 text-xs">
                  <span className="font-semibold text-slate-700">Model Confidence:</span>
                  <span className="font-bold text-clinical-primary">
                    {((screening.confidence || 0) * 100).toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-slate-400">(Calibrated softmax score)</span>
                </div>
              </div>

              <div className="p-3 bg-white/80 rounded-lg border border-slate-200 text-xs space-y-1">
                <p className="font-semibold text-clinical-navy">
                  {isProfessional ? 'Clinical Recommendation:' : 'What This Means For You:'}
                </p>
                <p className="text-slate-600 leading-relaxed">
                  {isProfessional ? screening.clinical_recommendation : screening.plain_language_summary}
                </p>
              </div>
            </div>

            {/* Quality Summary Tile */}
            <div className="p-4 bg-white border border-clinical-border rounded-xl shadow-xs space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-clinical-navy flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Image Optical Adequacy Status
              </h3>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Quality Assessment:</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {screening.quality_status || 'GOOD'} (Score: {((screening.quality_score || 0.85) * 100).toFixed(0)}/100)
                </span>
              </div>
              {screening.quality_metrics && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  <div>Focus Var: <strong className="text-slate-800">{screening.quality_metrics.focus_laplacian_var}</strong></div>
                  <div>Illumination: <strong className="text-slate-800">{screening.quality_metrics.illumination_mean}/255</strong></div>
                  <div>Resolution: <strong className="text-slate-800">{screening.quality_metrics.resolution_width}x{screening.quality_metrics.resolution_height}</strong></div>
                  <div>Coverage: <strong className="text-slate-800">{((screening.quality_metrics.coverage_ratio || 0.7) * 100).toFixed(0)}%</strong></div>
                </div>
              )}
            </div>

            {/* 5-Class Probability Distribution (Detailed for Professional Mode) */}
            {screening.class_scores && (
              <div className="p-4 bg-white border border-clinical-border rounded-xl shadow-xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-clinical-navy flex items-center justify-between">
                  <span>Class Probability Vector</span>
                  <span className="text-[10px] text-slate-400 font-normal">ICDR Scale</span>
                </h3>

                <div className="space-y-2 text-xs">
                  {[
                    { level: '0', label: 'Level 0: No DR' },
                    { level: '1', label: 'Level 1: Mild NPDR' },
                    { level: '2', label: 'Level 2: Moderate NPDR' },
                    { level: '3', label: 'Level 3: Severe NPDR' },
                    { level: '4', label: 'Level 4: Proliferative DR' },
                  ].map((cls) => {
                    const prob = screening.class_scores?.[cls.level] || 0;
                    const isPred = screening.predicted_grade?.toString() === cls.level;
                    return (
                      <div key={cls.level} className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className={`${isPred ? 'font-bold text-clinical-primary' : 'text-slate-600'}`}>
                            {cls.label} {isPred && '★'}
                          </span>
                          <span className="font-mono text-slate-700">{(prob * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isPred ? 'bg-clinical-primary' : 'bg-slate-300'
                            }`}
                            style={{ width: `${Math.max(prob * 100, 2)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Retinal Structures & Lesion Modules Status */}
            {screening.lesion_findings && screening.lesion_findings.length > 0 && (
              <div className="p-4 bg-white border border-clinical-border rounded-xl shadow-xs space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-clinical-navy">
                  Retinal Structures & Dedicated Lesion Modules
                </h3>
                <div className="space-y-1.5 text-xs">
                  {screening.lesion_findings.map((lf) => (
                    <div key={lf.id} className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100">
                      <span className="capitalize font-medium text-slate-700">
                        {lf.lesion_type.replace('_', ' ')}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        lf.status === 'AVAILABLE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : lf.status === 'EXPERIMENTAL'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {lf.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Grad-CAM Explainability Viewer (7 cols) */}
          <div className="lg:col-span-7">
            <GradCamViewer
              originalImageUrl={screening.original_image_url}
              gradcamImageUrl={screening.gradcam_image_url}
              processedImageUrl={screening.processed_image_url}
              gradeName={screening.grade_name}
              confidence={screening.confidence}
            />
          </div>
        </div>
      )}
    </div>
  );
}
