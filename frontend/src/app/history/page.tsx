'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ScreeningCase } from '@/lib/types';
import {
  History,
  Search,
  Filter,
  Download,
  Eye,
  FileText,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function CaseHistoryPage() {
  const [screenings, setScreenings] = useState<ScreeningCase[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>('');
  const [referableFilter, setReferableFilter] = useState<boolean | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const res = await api.listScreenings(page, 15, search || undefined, referableFilter);
      setScreenings(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load history', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [page, referableFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCases();
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-clinical-border pb-4">
        <h1 className="text-2xl font-bold text-clinical-navy flex items-center gap-2">
          <History className="w-6 h-6 text-clinical-primary" />
          Screening Case History & Reports
        </h1>
        <p className="text-xs text-clinical-muted mt-1">
          Searchable audit archive of processed retinal evaluations, Grad-CAM attention visualizations, and downloadable clinical PDF reports.
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white border border-clinical-border rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full sm:w-auto relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Patient Ref, Case ID, or filename..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs">
            <button
              onClick={() => setReferableFilter(undefined)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                referableFilter === undefined
                  ? 'bg-white text-clinical-navy font-bold shadow-xs'
                  : 'text-slate-600'
              }`}
            >
              All Cases
            </button>
            <button
              onClick={() => setReferableFilter(true)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                referableFilter === true
                  ? 'bg-white text-red-600 font-bold shadow-xs'
                  : 'text-slate-600'
              }`}
            >
              Referable Only
            </button>
            <button
              onClick={() => setReferableFilter(false)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                referableFilter === false
                  ? 'bg-white text-emerald-600 font-bold shadow-xs'
                  : 'text-slate-600'
              }`}
            >
              Routine Follow-up
            </button>
          </div>

          <button
            onClick={fetchCases}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Case Table */}
      <div className="bg-white border border-clinical-border rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Case ID</th>
                <th className="py-3 px-4">Patient Ref</th>
                <th className="py-3 px-4">Date / Time (UTC)</th>
                <th className="py-3 px-4">Eye</th>
                <th className="py-3 px-4">Quality</th>
                <th className="py-3 px-4">Severity Grade</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">Referable</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {screenings.length > 0 ? (
                screenings.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">
                      {c.id.substring(0, 8)}...
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {c.patient_ref || 'De-identified'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {new Date(c.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">
                      {c.eye_laterality || 'OD'}
                    </td>
                    <td className="py-3 px-4">
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
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {c.grade_name || (c.status === 'QUALITY_REJECTED' ? 'Ungradeable' : 'Pending')}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {c.confidence ? `${(c.confidence * 100).toFixed(1)}%` : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.referable_dr
                          ? 'bg-red-100 text-red-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {c.referable_dr ? 'Referral' : 'Clear'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
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
                        <Download className="w-3.5 h-3.5" /> PDF
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    {loading ? 'Loading cases...' : 'No screening records matching criteria.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span>Total cases: <strong>{total}</strong></span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1 rounded border border-slate-200 hover:bg-white disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>Page {page} of {Math.max(1, Math.ceil(total / 15))}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= Math.ceil(total / 15)}
              className="p-1 rounded border border-slate-200 hover:bg-white disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
