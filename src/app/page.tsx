'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/RoleContext';
import { ReportData } from '@/lib/types';
import { Navbar } from '@/components/Navbar';
import { KPICards } from '@/components/KPICards';
import { PivotMatrix } from '@/components/PivotMatrix';
import { SummaryAnalysis } from '@/components/SummaryAnalysis';
import { TrendAnalysis } from '@/components/TrendAnalysis';
import { CustomerWiseTA } from '@/components/CustomerWiseTA';
import { SummaryTables } from '@/components/SummaryTables';
import { exportForecastToExcel } from '@/lib/excel-exporter';
import {
  Table,
  BarChart3,
  TrendingUp,
  UserSearch,
  ListOrdered,
  FileDown,
  Upload,
  RefreshCw,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

export default function DashboardPage() {
  const { role, customerFilter } = useApp();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pivot' | 'analysis' | 'trend' | 'customerTA' | 'tables'>('pivot');

  const fetchForecast = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/forecast/current', { cache: 'no-store' });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to load forecast data');
      }
      setReport(data.report);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error fetching current forecast');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Navbar
        lastUpdated={report?.batchInfo?.uploaded_at}
        uploadedBy={report?.batchInfo?.uploaded_by}
      />

      <main className="flex-1 max-w-[1700px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-10 h-10 text-blue-700 animate-spin" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Connecting to Supabase Database...
            </p>
          </div>
        ) : error ? (
          <div className="p-8 max-w-xl mx-auto bg-red-50 border border-red-200 rounded-2xl text-center space-y-4">
            <AlertTriangle className="w-10 h-10 text-red-600 mx-auto" />
            <h3 className="text-base font-bold text-red-900">Database Connection Error</h3>
            <p className="text-xs text-red-700">{error}</p>
            <button
              onClick={fetchForecast}
              className="px-6 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold transition-all"
            >
              Retry Connection
            </button>
          </div>
        ) : !report ? (
          <div className="py-24 max-w-xl mx-auto text-center space-y-6 bg-white p-10 rounded-3xl border border-slate-200 shadow-sm">
            <div className="w-16 h-16 bg-blue-50 text-blue-700 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Upload className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black text-slate-900">No Forecast Uploaded Yet</h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No active delivery forecast found in Supabase. Please load both Order Outstanding (OU) and Shipment Tracker (ST) files to build the database.
              </p>
            </div>
            {role === 'admin' ? (
              <Link
                href="/upload"
                className="inline-flex items-center space-x-2 px-8 py-3.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md transition-all"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Forecast Files</span>
              </Link>
            ) : (
              <p className="text-xs font-semibold text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200 inline-block">
                Please ask an Admin to upload the monthly forecast data.
              </p>
            )}
          </div>
        ) : (
          <>
            {/* Top Scorecard KPIs */}
            <KPICards report={report} filter={customerFilter} />

            {/* Navigation Tab Bar & Export Actions */}
            <div className="bg-white rounded-2xl p-2.5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto max-w-full no-scrollbar w-full md:w-auto">
                <button
                  onClick={() => setActiveTab('pivot')}
                  className={`flex items-center px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition-all whitespace-nowrap ${
                    activeTab === 'pivot'
                      ? 'bg-blue-700 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Table className="w-4 h-4 mr-2" />
                  Pivot Matrix
                </button>
                <button
                  onClick={() => setActiveTab('analysis')}
                  className={`flex items-center px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition-all whitespace-nowrap ${
                    activeTab === 'analysis'
                      ? 'bg-blue-700 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Summary Analysis
                </button>
                <button
                  onClick={() => setActiveTab('trend')}
                  className={`flex items-center px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition-all whitespace-nowrap ${
                    activeTab === 'trend'
                      ? 'bg-blue-700 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Trend Analysis
                </button>
                <button
                  onClick={() => setActiveTab('customerTA')}
                  className={`flex items-center px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition-all whitespace-nowrap ${
                    activeTab === 'customerTA'
                      ? 'bg-blue-700 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UserSearch className="w-4 h-4 mr-2" />
                  Customer wise TA
                </button>
                <button
                  onClick={() => setActiveTab('tables')}
                  className={`flex items-center px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition-all whitespace-nowrap ${
                    activeTab === 'tables'
                      ? 'bg-blue-700 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ListOrdered className="w-4 h-4 mr-2" />
                  Summary Tables
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2.5 w-full md:w-auto justify-end">
                <button
                  onClick={fetchForecast}
                  title="Reload forecast"
                  className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>

                <button
                  onClick={() => exportForecastToExcel(report, customerFilter)}
                  className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-950 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all"
                >
                  <FileDown className="w-4 h-4 text-blue-300" />
                  <span>Download XL</span>
                </button>

                {role === 'admin' && (
                  <Link
                    href="/upload"
                    className="flex items-center space-x-2 bg-blue-700 hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload New</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Tab Views */}
            <div className="transition-all duration-300">
              {activeTab === 'pivot' && (
                <PivotMatrix report={report} filter={customerFilter} />
              )}
              {activeTab === 'analysis' && (
                <SummaryAnalysis report={report} filter={customerFilter} />
              )}
              {activeTab === 'trend' && (
                <TrendAnalysis report={report} filter={customerFilter} />
              )}
              {activeTab === 'customerTA' && (
                <CustomerWiseTA report={report} filter={customerFilter} />
              )}
              {activeTab === 'tables' && (
                <SummaryTables report={report} filter={customerFilter} />
              )}
            </div>
          </>
        )}
      </main>

      <footer className="w-full mt-auto border-t border-slate-200/80 bg-white py-6 text-center">
        <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-[0.25em]">
          Covering Plant Delivery Forecast &middot; Enterprise Analytics System &middot; Powered by Supabase & Next.js
        </p>
      </footer>
    </div>
  );
}
