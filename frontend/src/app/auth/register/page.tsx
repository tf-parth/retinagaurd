'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { UserPlus, Eye, AlertCircle, CheckCircle } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'public' | 'healthcare_professional'>('healthcare_professional');
  const [facilityName, setFacilityName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      await api.register({
        email,
        password,
        full_name: fullName,
        role,
        facility_name: facilityName || undefined,
      });
      // Automatically log in
      await login(email, password);
      router.push(role === 'healthcare_professional' ? '/dashboard' : '/screen');
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-10 space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-clinical-navy">Create RetinaGuard Account</h1>
        <p className="text-xs text-clinical-muted">
          Register to access patient screening records, Grad-CAM attention visualizations, and operational queue models.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-clinical-border rounded-xl p-6 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Full Name & Title
          </label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Dr. Rajesh Varma, MS"
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Official Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="rajesh.varma@mohfw.gov.in"
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Password (minimum 6 characters)
          </label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Platform Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
          >
            <option value="healthcare_professional">Healthcare Professional / Ophthalmologist</option>
            <option value="public">Public / Community Health Worker (PHC/ASHA)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Health Facility / Affiliation
          </label>
          <input
            type="text"
            value={facilityName}
            onChange={(e) => setFacilityName(e.target.value)}
            placeholder="e.g. Alwar Community Health Centre (CHC)"
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
              <UserPlus className="w-4 h-4" />
              <span>Create Account</span>
            </>
          )}
        </button>

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          Already registered?{' '}
          <Link href="/auth/login" className="text-clinical-primary font-semibold hover:underline">
            Sign in
          </Link>
        </div>
      </form>
    </div>
  );
}
