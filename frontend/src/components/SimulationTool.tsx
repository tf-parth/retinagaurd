'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { SimulationParams, SimulationResult } from '@/lib/types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { Sliders, Cpu, Wifi, Users, AlertTriangle, CheckCircle, RefreshCw, BarChart2 } from 'lucide-react';

export const SimulationTool: React.FC = () => {
  const [params, setParams] = useState<SimulationParams>({
    daily_patients_per_phc: 35,
    num_phc_centers: 10,
    network_bandwidth_kbps: 512,
    avg_image_size_kb: 2200,
    ai_inference_time_sec: 1.2,
    num_ophthalmologists: 2,
    specialist_review_time_min: 4.5,
    work_hours_per_day: 7.0,
    dr_prevalence_pct: 22.0,
  });

  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const runSim = async () => {
    setLoading(true);
    try {
      const data = await api.runSimulation(params);
      setResult(data);
    } catch (err) {
      console.error('Simulation run failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSim();
  }, [params]);

  const handleSliderChange = (field: keyof SimulationParams, val: number) => {
    setParams((prev) => ({ ...prev, [field]: val }));
  };

  return (
    <div className="bg-white border border-clinical-border rounded-xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-clinical-primary" />
            <h3 className="font-bold text-lg text-clinical-navy">
              Rural Tele-Ophthalmology Workflow & Backlog Simulation
            </h3>
          </div>
          <p className="text-xs text-clinical-muted mt-0.5">
            SIH 2026 Problem 26038 | MATLAB/Simulink Discrete-Event Screening Queue Model
          </p>
        </div>
        <button
          onClick={runSim}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Recalculate
        </button>
      </div>

      {/* Grid: Parameter Sliders vs Real-time Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sliders Column (4 cols) */}
        <div className="lg:col-span-4 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-clinical-slate flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5" />
            Operational Parameters
          </h4>

          {/* Number of PHCs */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-slate-700">Rural PHCs / Centers:</span>
              <span className="font-bold text-clinical-primary">{params.num_phc_centers} centers</span>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              step="1"
              value={params.num_phc_centers}
              onChange={(e) => handleSliderChange('num_phc_centers', parseInt(e.target.value))}
              className="w-full accent-clinical-primary"
            />
          </div>

          {/* Patients per PHC */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-slate-700">Screening Influx / PHC:</span>
              <span className="font-bold text-clinical-primary">{params.daily_patients_per_phc} patients/day</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={params.daily_patients_per_phc}
              onChange={(e) => handleSliderChange('daily_patients_per_phc', parseInt(e.target.value))}
              className="w-full accent-clinical-primary"
            />
          </div>

          {/* Network Bandwidth */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-slate-700">Uplink Bandwidth:</span>
              <span className="font-bold text-clinical-primary">{params.network_bandwidth_kbps} kbps</span>
            </div>
            <input
              type="range"
              min="128"
              max="4096"
              step="128"
              value={params.network_bandwidth_kbps}
              onChange={(e) => handleSliderChange('network_bandwidth_kbps', parseInt(e.target.value))}
              className="w-full accent-clinical-primary"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
              <span>2G (128k)</span>
              <span>3G Rural (512k)</span>
              <span>4G (2M+)</span>
            </div>
          </div>

          {/* Number of Reviewing Specialists */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-slate-700">Tele-Ophthalmologists:</span>
              <span className="font-bold text-clinical-primary">{params.num_ophthalmologists} specialists</span>
            </div>
            <input
              type="range"
              min="1"
              max="8"
              step="1"
              value={params.num_ophthalmologists}
              onChange={(e) => handleSliderChange('num_ophthalmologists', parseInt(e.target.value))}
              className="w-full accent-clinical-primary"
            />
          </div>

          {/* Review Duration */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-slate-700">Specialist Review Time:</span>
              <span className="font-bold text-clinical-primary">{params.specialist_review_time_min} min/case</span>
            </div>
            <input
              type="range"
              min="2.0"
              max="15.0"
              step="0.5"
              value={params.specialist_review_time_min}
              onChange={(e) => handleSliderChange('specialist_review_time_min', parseFloat(e.target.value))}
              className="w-full accent-clinical-primary"
            />
          </div>
        </div>

        {/* Results & Chart Column (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {result && (
            <>
              {/* KPI summary tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg">
                  <p className="text-[11px] text-blue-700 font-medium">Daily Influx</p>
                  <p className="text-xl font-bold text-blue-900 mt-0.5">{result.total_screenings_day}</p>
                  <p className="text-[10px] text-blue-600">({result.total_referable_cases} referable)</p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <p className="text-[11px] text-slate-600 font-medium">Upload Delay</p>
                  <p className="text-xl font-bold text-slate-900 mt-0.5">{result.avg_network_upload_sec}s</p>
                  <p className="text-[10px] text-slate-500">per 2.2MB image</p>
                </div>

                <div className={`p-3 border rounded-lg ${
                  result.daily_backlog_cases > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'
                }`}>
                  <p className={`text-[11px] font-medium ${
                    result.daily_backlog_cases > 0 ? 'text-red-700' : 'text-emerald-700'
                  }`}>
                    Daily Backlog
                  </p>
                  <p className={`text-xl font-bold mt-0.5 ${
                    result.daily_backlog_cases > 0 ? 'text-red-900' : 'text-emerald-900'
                  }`}>
                    {result.daily_backlog_cases} cases
                  </p>
                  <p className={`text-[10px] ${
                    result.daily_backlog_cases > 0 ? 'text-red-600' : 'text-emerald-600'
                  }`}>
                    {result.daily_backlog_cases > 0 ? 'Unreviewed at 17:00' : 'Zero queue cleared'}
                  </p>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-[11px] text-amber-700 font-medium">Readiness Score</p>
                  <p className="text-xl font-bold text-amber-900 mt-0.5">{result.telemedicine_readiness_score}/100</p>
                  <p className="text-[10px] text-amber-600">Turnaround: {result.turnaround_time_p95_hours}h</p>
                </div>
              </div>

              {/* Identified Bottleneck Alert */}
              <div className={`p-3.5 rounded-lg border flex items-start gap-2.5 ${
                result.daily_backlog_cases > 0 || result.avg_network_upload_sec > 15
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-900'
              }`}>
                {result.daily_backlog_cases > 0 || result.avg_network_upload_sec > 15 ? (
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <h5 className="font-semibold text-xs uppercase tracking-wide">
                    Operational Diagnostic: {result.bottleneck_identified}
                  </h5>
                  <ul className="text-xs mt-1 space-y-0.5 list-disc list-inside">
                    {result.recommendations.map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Hourly Workload vs Backlog Queue Chart */}
              <div>
                <h4 className="text-xs font-semibold text-clinical-navy mb-2 flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-clinical-primary" />
                  Hourly Shift Dynamics: Patient Influx vs Specialist Review vs Pending Queue
                </h4>
                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={result.hourly_projection} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="hour" tickFormatter={(h) => `Hr ${h}`} tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="incoming_images" name="Screenings Influx" fill="#93C5FD" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="doctor_reviewed" name="Doctor Reviewed" fill="#10B981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="backlog_queue" name="Waiting Queue" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
