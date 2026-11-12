'use client';

import React from 'react';
import Link from 'next/link';
import {
  Eye,
  Activity,
  Layers,
  ShieldCheck,
  ArrowRight,
  FileText,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Stethoscope,
  Building2,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function LandingPage() {
  const { loginAsDemoUser } = useAuth();

  return (
    <div className="space-y-16 py-4">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-blue-900 via-slate-900 to-clinical-navy text-white p-8 sm:p-14 shadow-lg">
        <div className="max-w-3xl space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            Smart India Hackathon 2026 • Problem Statement 26038
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Explainable AI for Diabetic Retinopathy Screening in Rural India
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
            RetinaGuard AI assists Primary Health Centres (PHCs) and rural health workers with instant optical quality verification, EfficientNet-B0 severity grading, Grad-CAM visual attention mapping, and tele-ophthalmology triage support.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/screen"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-md hover:shadow-blue-500/20 scale-100 hover:scale-[1.02]"
            >
              <Eye className="w-4 h-4" />
              Start Screening Now
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>

            <button
              onClick={() => loginAsDemoUser('healthcare_professional')}
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-semibold text-sm transition-colors"
            >
              <Stethoscope className="w-4 h-4 text-emerald-400" />
              Clinician Dashboard
            </button>
          </div>
        </div>

        {/* Background decorative subtle circles */}
        <div className="absolute -right-20 -bottom-20 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
      </section>

      {/* Prominent Medical Safety Disclaimer Box */}
      <section className="bg-amber-50/80 border-l-4 border-amber-500 p-5 rounded-r-xl shadow-xs">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-amber-900 uppercase tracking-wide">
              Statutory Clinical Decision-Support Notice
            </h2>
            <p className="text-xs text-amber-800 leading-relaxed">
              RetinaGuard AI is an automated screening assistant designed to triage patients who require urgent specialist evaluation. <strong>It does not definitively diagnose, treat, or rule out diabetic retinopathy or other blinding eye diseases.</strong> Negative screening results do not eliminate the need for routine annual dilated eye exams by an ophthalmologist.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works: The 8-Stage Pipeline */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl font-bold text-clinical-navy">The End-to-End Clinical AI Pipeline</h2>
          <p className="text-sm text-clinical-muted">
            Engineered specifically for low-resource Indian Primary Health Centres (PHCs) with rigorous quality gating.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-5 bg-white rounded-xl border border-clinical-border shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
              01
            </div>
            <h3 className="font-semibold text-sm text-clinical-navy">Optical Quality Check</h3>
            <p className="text-xs text-clinical-muted">
              Evaluates focus (Laplacian variance), illumination, and retinal FOV coverage. Rejects ungradeable captures before running inference.
            </p>
          </div>

          <div className="p-5 bg-white rounded-xl border border-clinical-border shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
              02
            </div>
            <h3 className="font-semibold text-sm text-clinical-navy">Retinal Preprocessing</h3>
            <p className="text-xs text-clinical-muted">
              Applies Ben Graham circular crop, CLAHE contrast enhancement, and standardized normalization for the neural network.
            </p>
          </div>

          <div className="p-5 bg-white rounded-xl border border-clinical-border shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm">
              03
            </div>
            <h3 className="font-semibold text-sm text-clinical-navy">5-Class DR Grading</h3>
            <p className="text-xs text-clinical-muted">
              EfficientNet-B0 classifies severity (No DR, Mild, Moderate, Severe, Proliferative) and flags referable cases (Grade ≥ 2).
            </p>
          </div>

          <div className="p-5 bg-white rounded-xl border border-clinical-border shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm">
              04
            </div>
            <h3 className="font-semibold text-sm text-clinical-navy">Explainable AI & Report</h3>
            <p className="text-xs text-clinical-muted">
              Generates Grad-CAM visual attention overlays and provides downloadable clinical PDF reports with structured audit logs.
            </p>
          </div>
        </div>
      </section>

      {/* Two Operating Modes Overview */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
            <Eye className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-clinical-navy">Public & Patient Mode</h3>
          <p className="text-xs text-clinical-muted leading-relaxed">
            Designed for patient understanding and community health volunteers (ASHAs). Provides simple plain-language summaries, optical quality guidance, clear next-step recommendations, and encouragement for routine specialist follow-up.
          </p>
          <ul className="text-xs text-slate-700 space-y-2">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Easy-to-understand severity status
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Clear recapture tips if photo is blurry or dark
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Downloadable summary for personal health records
            </li>
          </ul>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Stethoscope className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-clinical-navy">Healthcare Professional Mode</h3>
          <p className="text-xs text-clinical-muted leading-relaxed">
            Tailored for medical officers at PHCs and district tele-ophthalmologists. Displays multi-class calibrated probability distributions, Grad-CAM layer attention, vascular metrics, triage queues, and comprehensive clinical PDF exports.
          </p>
          <ul className="text-xs text-slate-700 space-y-2">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              5-class probability vector & referable risk scoring
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Grad-CAM receptive field feature maps
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Simulink operational screening queue simulation
            </li>
          </ul>
        </div>
      </section>

      {/* Security & Data Privacy Callout */}
      <section className="bg-slate-900 text-white rounded-2xl p-8 shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold">
              <Lock className="w-4 h-4" />
              Healthcare Privacy & Cybersecurity
            </div>
            <h3 className="text-xl font-bold">Safe File Handling & Pseudonymous Records</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              RetinaGuard AI enforces MIME and magic-byte signature validation, prevents directory traversal, renames files with randomized UUIDs, and stores images in isolated object storage directories. No plaintext passwords or unencrypted credentials are ever committed.
            </p>
          </div>
          <div className="text-left md:text-right">
            <Link
              href="/screen"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors"
            >
              Screening Workspace
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
