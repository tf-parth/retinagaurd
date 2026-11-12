'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { DashboardMetrics, ScreeningCase } from '@/lib/types';
import { SimulationTool } from '@/components/SimulationTool';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts';
import {
  Activity,
  Users,
  AlertOctagon,
  CheckCircle,
  FileText,
  Sliders,
  ExternalLink,
  Search,
  Eye,
  RefreshCw,
  Stethoscope,
  Clock,
  ArrowRight,
} from 'lucide-react';

export default function ProfessionalDashboardPage() {
  const { user, isHealthcareProfessional, loginAsDemoUser } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const data = await api.getDashboardMetrics();
      setMetrics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const GRADE_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#7F1D1D'];

  const chartData = metrics
    ? Object.entries(metrics.grade_distribution).map(([name, count], idx) => ({
        name: name.replace('Level ', 'L'),
        count,
        color: GRADE_COLORS[idx % GRADE_COLORS.length],
      }))
    : [];

  return (
    <div className="space-y-8">
      {/* Top Banner & Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-clinical-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-6 h-6 text-clinical-primary" />
            <h1 className="text-2xl font-bold text-clinical-navy">
              Healthcare Professional Clinical Dashboard
            </h1>
          </div>
          <p className="text-xs text-clinical-muted mt-1">
            Real-time screening triage metrics, case queue, and tele-ophthalmology throughput diagnostics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isHealthcareProfessional && (
            <button
              onClick={() => loginAsDemoUser('healthcare_professional')}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs flex items-center gap-1.5"
            >
              <Stethoscope className="w-3.5 h-3.5" />
              Sign in as Clinician
            </button>
          )}
          <button
            onClick={fetchMetrics}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Statistic Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-clinical-border rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Screenings</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-clinical-navy mt-1">
            {metrics ? metrics.total_screenings : '—'}
          </p>
          <span className="text-[10px] text-slate-400">Actual database records</span>
        </div>

        <div className="p-4 bg-white border border-clinical-border rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Referable DR Flagged</span>
            <AlertOctagon className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {metrics ? metrics.referable_cases : '—'}
          </p>
          <span className="text-[10px] text-red-500">Grade ≥ 2 (Urgent Referral)</span>
        </div>

        <div className="p-4 bg-white border border-clinical-border rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Quality Rejections</span>
            <AlertOctagon className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {metrics ? metrics.quality_failures : '—'}
          </p>
          <span className="text-[10px] text-amber-600">Ungradeable / Recapture</span>
        </div>

        <div className="p-4 bg-white border border-clinical-border rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Awaiting Review</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {metrics ? metrics.awaiting_review : '—'}
          </p>
          <span className="text-[10px] text-emerald-600">Inference pipeline queue</span>
        </div>
      </div>

      {/* DR Severity Distribution Chart */}
      <div className="bg-white border border-clinical-border rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-clinical-navy">
              Diabetic Retinopathy Grade Distribution (Stored Cases)
            </h3>
            <p className="text-xs text-clinical-muted">
              Calculated exclusively from evaluated database cases
            </p>
          </div>
          <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded font-medium">
            ICDR 5-Class Scale
          </span>
        </div>

        <div className="h-64 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any) => [`${val} cases`, 'Volume']}
                  contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-xs">
              No evaluated screening records found in database yet.
            </div>
          )}
        </div>
      </div>

      {/* Recent Screening Queue Table */}
      <div className="bg-white border border-clinical-border rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-clinical-navy">Recent Screening Cases</h3>
            <p className="text-xs text-clinical-muted">Review recently processed fundus captures</p>
          </div>
          <Link
            href="/history"
            className="text-xs font-semibold text-clinical-primary hover:underline flex items-center gap-1"
          >
            View All Cases <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Case ID</th>
                <th className="py-2.5 px-3">Patient Ref</th>
                <th className="py-2.5 px-3">Eye</th>
                <th className="py-2.5 px-3">Quality</th>
                <th className="py-2.5 px-3">Severity Grade</th>
                <th className="py-2.5 px-3">Referable</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {metrics && metrics.recent_screenings.length > 0 ? (
                metrics.recent_screenings.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-800 font-medium">
                      {c.id.substring(0, 8)}...
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      {c.patient_ref || 'Anonymous'}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-700">
                      {c.eye_laterality || 'OD'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.quality_status === 'GOOD'
                          ? 'bg-emerald-100 text-emerald-800'
                          : c.quality_status === 'BORDERLINE'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {c.quality_status || 'N/A'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">
                      {c.grade_name || 'Pending'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.referable_dr
                          ? 'bg-red-100 text-red-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {c.referable_dr ? 'Referral Needed' : 'Normal / Follow-up'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right space-x-2">
                      <Link
                        href={`/results/${c.id}`}
                        className="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </Link>
                      <a
                        href={api.getReportDownloadUrl(c.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-500 hover:text-slate-800 font-semibold inline-flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" /> PDF
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    No recent screening cases found in database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Embedded Operational Simulation Tool (SIH 2026 Deliverable) */}
      <div id="simulation" className="pt-4">
        <SimulationTool />
      </div>
    </div>
  );
}
