'use client';

import React, { useState } from 'react';
import { Layers, Eye, Info, Sparkles, AlertCircle } from 'lucide-react';

interface GradCamViewerProps {
  originalImageUrl: string;
  gradcamImageUrl?: string | null;
  processedImageUrl?: string | null;
  gradeName?: string | null;
  confidence?: number | null;
}

export const GradCamViewer: React.FC<GradCamViewerProps> = ({
  originalImageUrl,
  gradcamImageUrl,
  processedImageUrl,
  gradeName,
  confidence,
}) => {
  const [activeTab, setActiveTab] = useState<'overlay' | 'original' | 'processed'>('overlay');
  const [blendOpacity, setBlendOpacity] = useState<number>(65);

  const displayUrl =
    activeTab === 'original'
      ? originalImageUrl
      : activeTab === 'processed' && processedImageUrl
      ? processedImageUrl
      : gradcamImageUrl || originalImageUrl;

  return (
    <div className="bg-white border border-clinical-border rounded-xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-clinical-primary" />
            <h3 className="font-semibold text-base text-clinical-navy">
              Model Attention & Visual Explainability (Grad-CAM)
            </h3>
          </div>
          <p className="text-xs text-clinical-muted mt-0.5">
            Target Layer: <span className="font-mono text-slate-700">EfficientNet-B0 (features.8)</span> | Saliency mapping
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('overlay')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'overlay'
                ? 'bg-white text-clinical-primary shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Grad-CAM Overlay
          </button>
          <button
            onClick={() => setActiveTab('original')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'original'
                ? 'bg-white text-clinical-primary shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Original Fundus
          </button>
          {processedImageUrl && (
            <button
              onClick={() => setActiveTab('processed')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'processed'
                  ? 'bg-white text-clinical-primary shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              CLAHE Processed
            </button>
          )}
        </div>
      </div>

      {/* Main Visual Display */}
      <div className="relative w-full aspect-square max-w-lg mx-auto rounded-xl overflow-hidden bg-black border border-slate-200 flex items-center justify-center">
        {displayUrl ? (
          <img
            src={displayUrl}
            alt="Explainability Visualization"
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="text-center p-6 text-slate-400">
            <Info className="w-8 h-8 mx-auto mb-2 text-slate-500" />
            <p className="text-sm">Visualization not generated for this case.</p>
          </div>
        )}

        {/* Badge in image */}
        {gradeName && (
          <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-xs text-white text-xs px-2.5 py-1 rounded-md border border-white/20">
            <span>Predicted: <strong>{gradeName}</strong></span>
            {confidence && (
              <span className="ml-1.5 text-blue-300">({(confidence * 100).toFixed(1)}%)</span>
            )}
          </div>
        )}
      </div>

      {/* Heatmap Legend */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-clinical-navy">Attention Intensity:</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-500">Low</span>
            <div className="h-3 w-28 rounded bg-gradient-to-r from-blue-700 via-green-500 via-yellow-400 to-red-600 border border-slate-200" />
            <span className="text-[10px] text-red-600 font-bold">High Saliency</span>
          </div>
        </div>

        <p className="text-[11px] text-clinical-muted">
          Warmer regions (yellow/red) contributed most strongly to the neural network's grade assignment.
        </p>
      </div>

      {/* Statutory Caveat */}
      <div className="mt-3 p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg flex items-start gap-2 text-[11px] text-amber-900">
        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <span>
          <strong>Explainability Caveat:</strong> Grad-CAM highlights deep learning feature activation areas. It does <em>not</em> represent verified lesion segmentation or replace manual retinal examination.
        </span>
      </div>
    </div>
  );
};
