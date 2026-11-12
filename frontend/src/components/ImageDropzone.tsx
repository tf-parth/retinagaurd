'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, CheckCircle, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';

interface ImageDropzoneProps {
  onImageSelected: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
  disabled?: boolean;
}

export const ImageDropzone: React.FC<ImageDropzoneProps> = ({
  onImageSelected,
  selectedFile,
  onClear,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setErrorMsg(null);
    const validTypes = ['image/jpeg', 'image/png', 'image/tiff'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|tif|tiff)$/i)) {
      setErrorMsg('Invalid file format. Please upload a standard retinal photograph (JPEG, PNG, or TIFF).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('Image size exceeds 15MB limit. Please upload a compressed or standard fundus photo.');
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    onImageSelected(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const generateSyntheticFundusSample = (severity: 'normal' | 'referable') => {
    // Generate a valid high-resolution 512x512 canvas representation of a retinal fundus for testing
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dark background
    ctx.fillStyle = '#050302';
    ctx.fillRect(0, 0, 512, 512);

    // Retinal globe circle
    const gradient = ctx.createRadialGradient(256, 256, 40, 256, 256, 240);
    gradient.addColorStop(0, '#D95B26');
    gradient.addColorStop(0.7, '#A83812');
    gradient.addColorStop(1, '#5C1805');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(256, 256, 230, 0, Math.PI * 2);
    ctx.fill();

    // Optic disc (yellowish bright circle on nasal side ~ x:160, y:256)
    ctx.fillStyle = '#FED7AA';
    ctx.beginPath();
    ctx.arc(170, 256, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFF7ED';
    ctx.beginPath();
    ctx.arc(170, 256, 16, 0, Math.PI * 2);
    ctx.fill();

    // Macula / Fovea (darker avascular zone temporal to disc ~ x:330, y:256)
    ctx.fillStyle = '#7C2D12';
    ctx.beginPath();
    ctx.arc(330, 256, 24, 0, Math.PI * 2);
    ctx.fill();

    // Retinal vessels branching from disc
    ctx.strokeStyle = '#450A0A';
    ctx.lineWidth = 4;
    ctx.beginPath();
    // Superior arcade
    ctx.moveTo(170, 240);
    ctx.bezierCurveTo(190, 180, 260, 140, 360, 150);
    // Inferior arcade
    ctx.moveTo(170, 272);
    ctx.bezierCurveTo(190, 330, 260, 370, 360, 360);
    // Nasal branches
    ctx.moveTo(150, 256);
    ctx.lineTo(80, 220);
    ctx.moveTo(150, 260);
    ctx.lineTo(80, 290);
    ctx.stroke();

    // If referable sample, add lesions: exudates (bright yellow) and hemorrhages (deep red dots)
    if (severity === 'referable') {
      // Exudates
      ctx.fillStyle = '#FEF08A';
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.arc(280 + (i % 3) * 20, 210 + Math.floor(i / 3) * 25, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      // Hemorrhages
      ctx.fillStyle = '#991B1B';
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.arc(240 + (i % 2) * 40, 300 + Math.floor(i / 2) * 20, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    canvas.toBlob((blob) => {
      if (blob) {
        const sampleFile = new File(
          [blob],
          severity === 'referable' ? 'fundus_referable_dr_sample.png' : 'fundus_healthy_sample.png',
          { type: 'image/png' }
        );
        handleFile(sampleFile);
      }
    }, 'image/png');
  };

  const handleClear = () => {
    setPreviewUrl(null);
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClear();
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.tif,.tiff"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
        disabled={disabled}
      />

      {errorMsg && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-sm text-red-800">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {!selectedFile ? (
        <div>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-clinical-primary bg-blue-50/60 scale-[1.01]'
                : 'border-slate-300 hover:border-clinical-primary bg-slate-50/50 hover:bg-slate-50'
            }`}
          >
            <div className="mx-auto w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-clinical-primary mb-4 shadow-sm">
              <UploadCloud className="w-7 h-7" />
            </div>
            <h3 className="font-semibold text-base text-clinical-navy mb-1">
              Select or Drag & Drop Retinal Fundus Image
            </h3>
            <p className="text-xs text-clinical-muted mb-4 max-w-md mx-auto">
              Supports optical fundus photographs in JPEG, PNG, or TIFF formats (up to 15MB). Non-retinal or corrupted files will be rejected by the quality gateway.
            </p>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md bg-white border border-slate-300 text-clinical-navy shadow-sm hover:bg-slate-50"
            >
              Browse Local Files
            </button>
          </div>

          {/* Quick-test Demonstration Samples */}
          <div className="mt-4 p-3 bg-blue-50/60 border border-blue-100 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-blue-900">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span><strong>Instant Screening Test:</strong> No camera fundus file on hand?</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => generateSyntheticFundusSample('normal')}
                className="px-2.5 py-1 text-xs font-medium bg-white text-slate-700 border border-slate-200 rounded hover:bg-slate-50 transition-colors shadow-2xs"
              >
                Load Healthy Sample
              </button>
              <button
                type="button"
                onClick={() => generateSyntheticFundusSample('referable')}
                className="px-2.5 py-1 text-xs font-medium bg-white text-blue-700 border border-blue-200 rounded hover:bg-blue-50 transition-colors shadow-2xs"
              >
                Load DR Lesion Sample
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-clinical-border rounded-xl p-4 bg-white shadow-xs">
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-semibold text-clinical-navy truncate max-w-xs sm:max-w-md">
                {selectedFile.name}
              </span>
              <span className="text-xs text-clinical-muted">
                ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
              </span>
            </div>
            {!disabled && (
              <button
                onClick={handleClear}
                className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Change Image
              </button>
            )}
          </div>

          {previewUrl && (
            <div className="relative w-full max-w-md mx-auto aspect-square rounded-lg overflow-hidden border border-slate-200 bg-black flex items-center justify-center">
              <img
                src={previewUrl}
                alt="Retinal Preview"
                className="object-contain w-full h-full"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
