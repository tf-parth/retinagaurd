'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { LogIn, Eye, Stethoscope, Lock, AlertCircle, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, loginAsDemoUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async (role: 'public' | 'healthcare_professional') => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await loginAsDemoUser(role);
      router.push(role === 'healthcare_professional' ? '/dashboard' : '/screen');
    } catch (err: any) {
      setErrorMsg(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-10 space-y-6">
      <div className="text-center space-y-1">
        <div className="w-12 h-12 bg-clinical-deepBlue text-white rounded-xl flex items-center justify-center mx-auto shadow-sm">
          <Eye className="w-6 h-6 text-clinical-tealLight" />
        </div>
        <h1 className="text-2xl font-bold text-clinical-navy pt-2">Sign in to RetinaGuard AI</h1>
        <p className="text-xs text-clinical-muted">
          Access clinical screening records, Grad-CAM visualizations, and tele-ophthalmology triage tools.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Demo Quick Logins */}
      <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2.5">
        <p className="text-xs font-bold text-blue-900 uppercase tracking-wider">
          Instant Evaluation Access (SIH 2026 Evaluators):
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleDemo('healthcare_professional')}
            disabled={loading}
            className="p-2.5 bg-white border border-blue-200 rounded-lg text-xs text-left hover:border-blue-400 hover:shadow-2xs transition-all"
          >
            <div className="flex items-center gap-1.5 font-bold text-blue-900">
              <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
              Clinician Demo
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">District Tele-Ophthalmologist</p>
          </button>

          <button
            type="button"
            onClick={() => handleDemo('public')}
            disabled={loading}
            className="p-2.5 bg-white border border-blue-200 rounded-lg text-xs text-left hover:border-blue-400 hover:shadow-2xs transition-all"
          >
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Eye className="w-3.5 h-3.5 text-blue-600" />
              Public Demo
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">PHC Screening Worker</p>
          </button>
        </div>
      </div>

      {/* Manual Login Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-clinical-border rounded-xl p-6 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="doctor@health.gov.in"
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 text-xs font-bold rounded-lg bg-clinical-deepBlue hover:bg-clinical-primary text-white transition-colors shadow-xs flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </>
          )}
        </button>

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          Don't have an account?{' '}
          <Link href="/auth/register" className="text-clinical-primary font-semibold hover:underline">
            Register new user
          </Link>
        </div>
      </form>
    </div>
  );
}
