import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-900">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0" />
          <span>
            <strong className="font-semibold">STATUTORY CLINICAL DISCLAIMER:</strong> RetinaGuard AI is an automated decision-support screening tool for resource-limited settings (SIH 2026 #26038). It does <strong>not</strong> provide a definitive diagnosis or replace clinical examination by a licensed ophthalmologist.
          </span>
        </div>
        <div className="hidden md:flex items-center gap-1.5 text-amber-800 flex-shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
          <span>Decision Support Only</span>
        </div>
      </div>
    </div>
  );
};
