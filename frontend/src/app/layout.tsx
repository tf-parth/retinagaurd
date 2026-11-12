import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { Navbar } from '@/components/Navbar';
import { DisclaimerBanner } from '@/components/DisclaimerBanner';

export const metadata: Metadata = {
  title: 'RetinaGuard AI — Explainable Diabetic Retinopathy Screening',
  description:
    'Rural Tele-Ophthalmology Decision-Support Platform with EfficientNet-B0, Grad-CAM Explainability, and Queue Simulation | SIH 2026 Problem Statement 26038.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
        <AuthProvider>
          <DisclaimerBanner />
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
          <footer className="bg-white border-t border-clinical-border py-6 mt-12 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4 space-y-2">
              <p className="font-semibold text-slate-700">
                RetinaGuard AI • Smart India Hackathon (SIH) 2026 • Problem Statement 26038
              </p>
              <p className="max-w-2xl mx-auto text-[11px] text-slate-400">
                Developed for automated diabetic retinopathy decision support in rural and underserved Indian healthcare facilities.
                Not intended for definitive diagnostic confirmation without an ophthalmologist.
              </p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
