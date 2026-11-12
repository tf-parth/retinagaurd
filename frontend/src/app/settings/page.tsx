'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  ShieldAlert,
  Cpu,
  Database,
  Lock,
  User,
  Info,
  Server,
  Layers,
  CheckCircle,
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    async function loadHealth() {
      try {
        const data = await api.getHealth();
        setHealth(data);
      } catch (err) {
        console.error('Failed to load system diagnostics', err);
      }
    }
    loadHealth();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="border-b border-clinical-border pb-4">
        <h1 className="text-2xl font-bold text-clinical-navy flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-clinical-primary" />
          System Information, Model Architecture & Clinical Safety
        </h1>
        <p className="text-xs text-clinical-muted mt-1">
          Technical specifications, methodology documentation, dataset governance, and statutory medical limitations.
        </p>
      </div>

      {/* Account Info Tile */}
      {user && (
        <div className="bg-white border border-clinical-border rounded-xl p-5 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-clinical-navy flex items-center gap-2 border-b border-slate-100 pb-2">
            <User className="w-4 h-4 text-clinical-primary" />
            Active Session Credentials
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-500">Name:</span>
              <p className="font-semibold text-slate-800">{user.full_name}</p>
            </div>
            <div>
              <span className="text-slate-500">Email:</span>
              <p className="font-semibold text-slate-800">{user.email}</p>
            </div>
            <div>
              <span className="text-slate-500">Authorized Role:</span>
              <p className="font-semibold text-slate-800 uppercase">{user.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* Live System Diagnostics */}
      <div className="bg-white border border-clinical-border rounded-xl p-5 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-clinical-navy flex items-center gap-2 border-b border-slate-100 pb-2">
          <Server className="w-4 h-4 text-clinical-primary" />
          Live Backend AI Engine & Diagnostics
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-slate-500">API Health:</span>
            <p className="font-bold text-emerald-700 capitalize mt-0.5">
              {health?.status || 'Active'}
            </p>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-slate-500">Database Engine:</span>
            <p className="font-bold text-slate-800 capitalize mt-0.5">
              {health?.database || 'Connected'}
            </p>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-slate-500">Model Checkpoint:</span>
            <p className="font-bold text-blue-700 mt-0.5">
              {health?.model_loaded ? 'Loaded (Active)' : 'Baseline Checkpoint'}
            </p>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-slate-500">Execution Hardware:</span>
            <p className="font-bold text-slate-800 uppercase mt-0.5">
              {health?.device || 'CPU'}
            </p>
          </div>
        </div>
      </div>

      {/* Model & Methodology Information */}
      <div className="bg-white border border-clinical-border rounded-xl p-5 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-clinical-navy flex items-center gap-2 border-b border-slate-100 pb-2">
          <Cpu className="w-4 h-4 text-clinical-primary" />
          Model Architecture & Training Methodology (SIH 2026 #26038)
        </h2>

        <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
          <p>
            <strong>Primary Neural Architecture:</strong> EfficientNet-B0 with custom transfer learning classification head. Input resolution: <span className="font-mono">224×224×3 RGB</span>. Transfer learning utilizes compound scaling (depth, width, and resolution scaling) optimized for high computational efficiency on rural edge devices and standard CPUs.
          </p>

          <p>
            <strong>Severity Grading Scale:</strong> The model evaluates fundus photos against the International Clinical Diabetic Retinopathy (ICDR) five-point scale:
          </p>
          <ul className="list-disc list-inside pl-2 space-y-1 text-slate-600">
            <li><strong>Level 0 (No DR):</strong> Absence of visible vascular lesions.</li>
            <li><strong>Level 1 (Mild NPDR):</strong> Presence of microaneurysms only.</li>
            <li><strong>Level 2 (Moderate NPDR):</strong> Microaneurysms plus hard exudates, cotton wool spots, or venous dilation.</li>
            <li><strong>Level 3 (Severe NPDR):</strong> 4-2-1 rule (hemorrhages in 4 quadrants, venous beading in 2, or IRMA in 1).</li>
            <li><strong>Level 4 (Proliferative DR):</strong> Pathological neovascularization (NVD/NVE), vitreous or preretinal hemorrhage.</li>
          </ul>

          <p>
            <strong>Dataset Governance:</strong> Training pipelines are designed for patient-level splits across APTOS 2019 Blindness Detection and IDRiD (Indian context retinal photos) to prevent data leakage between eyes of the same patient. Evaluation tracks Sensitivity, Specificity, and Quadratic Weighted Kappa. The SIH targets of &gt;90% sensitivity and &gt;85% specificity for referable DR represent clinical validation thresholds.
          </p>
        </div>
      </div>

      {/* Explainable AI & Grad-CAM Methodology */}
      <div className="bg-white border border-clinical-border rounded-xl p-5 shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-clinical-navy flex items-center gap-2 border-b border-slate-100 pb-2">
          <Layers className="w-4 h-4 text-clinical-primary" />
          Explainable AI (XAI) & Grad-CAM Implementation
        </h2>
        <div className="text-xs text-slate-700 leading-relaxed space-y-2">
          <p>
            RetinaGuard AI applies Gradient-weighted Class Activation Mapping (Grad-CAM) to the final convolutional stage (<span className="font-mono">features.8</span>) of EfficientNet-B0. By calculating the gradients of the target class score with respect to the feature map activations, the system computes the weighted linear combination that pinpoints the visual regions driving the network's classification.
          </p>
          <p className="bg-blue-50/70 p-3 rounded-lg border border-blue-200 text-blue-900 font-medium">
            Grad-CAM visualizes deep convolutional attention. It allows clinicians to verify whether the AI focused on true microvascular lesions (exudates, hemorrhages) or was confounded by image artifacts, lens dust, or illumination gradients.
          </p>
        </div>
      </div>

      {/* Comprehensive Medical Safety & Privacy Disclaimer */}
      <div className="bg-red-50/80 border-2 border-red-200 rounded-xl p-6 shadow-xs space-y-3 text-xs text-red-900">
        <div className="flex items-center gap-2 font-bold text-sm uppercase text-red-950">
          <ShieldAlert className="w-5 h-5 text-red-700" />
          Comprehensive Statutory Medical Disclaimer & Regulatory Limitations
        </div>
        <div className="space-y-2 text-red-900 leading-relaxed">
          <p>
            1. <strong>Not a Definitive Diagnostic Device:</strong> RetinaGuard AI is an experimental decision-support research prototype built for Smart India Hackathon (SIH) 2026 Problem Statement 26038. It has not been approved as a standalone medical diagnostic device by the Central Drugs Standard Control Organisation (CDSCO), FDA, or EMA.
          </p>
          <p>
            2. <strong>Professional Examination Prerequisite:</strong> An automated negative result (Level 0) does not eliminate the possibility of early non-proliferative retinopathy, diabetic macular edema (DME), glaucoma, age-related macular degeneration (AMD), or cataract. All diabetic patients must undergo periodic dilated fundus evaluations by an ophthalmologist.
          </p>
          <p>
            3. <strong>Data Protection:</strong> Patient names are de-identified with pseudonymized tokens. Uploaded images are secured with randomized filenames to avoid exposure of sensitive personal health information (PHI).
          </p>
        </div>
      </div>
    </div>
  );
}
