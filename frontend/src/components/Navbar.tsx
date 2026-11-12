'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Eye, Activity, History, Sliders, LogIn, LogOut, ShieldAlert, User, Stethoscope } from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout, isHealthcareProfessional, loginAsDemoUser } = useAuth();

  const navLinks = [
    { href: '/screen', label: 'Screening', icon: Eye },
    { href: '/dashboard', label: 'Professional Dashboard', icon: Activity, reqPro: true },
    { href: '/history', label: 'Case History', icon: History },
    { href: '/dashboard#simulation', label: 'Operational Sim', icon: Sliders },
    { href: '/settings', label: 'Model Info & Safety', icon: ShieldAlert },
  ];

  return (
    <header className="bg-white border-b border-clinical-border sticky top-0 z-50 clinical-shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-lg bg-clinical-deepBlue flex items-center justify-center text-white font-bold shadow-sm group-hover:bg-clinical-primary transition-colors">
            <Eye className="w-5 h-5 text-clinical-tealLight" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg text-clinical-navy tracking-tight">RetinaGuard</span>
              <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-1.5 py-0.5 rounded">AI</span>
            </div>
            <p className="text-[10px] text-clinical-muted leading-tight">SIH 2026 | Rural Tele-Ophthalmology</p>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            if (link.reqPro && !isHealthcareProfessional) return null;
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-clinical-primary font-semibold'
                    : 'text-clinical-slate hover:bg-slate-50 hover:text-clinical-navy'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-clinical-primary' : 'text-slate-400'}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* User Status / Mode Switcher */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-clinical-navy">{user.full_name}</p>
                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                  isHealthcareProfessional ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                }`}>
                  {isHealthcareProfessional ? 'Clinician Mode' : 'Public Mode'}
                </span>
              </div>
              <button
                onClick={logout}
                className="p-2 text-slate-500 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => loginAsDemoUser('healthcare_professional')}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                title="Switch to Healthcare Professional Mode"
              >
                <Stethoscope className="w-3.5 h-3.5" />
                Demo Clinician
              </button>
              <Link
                href="/auth/login"
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md bg-clinical-deepBlue text-white hover:bg-clinical-primary transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
