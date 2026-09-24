'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/context/RoleContext';
import { ReportData } from '@/lib/types';
import { Navbar } from '@/components/Navbar';
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

type AnalysisTab = 'pivot' | 'analysis' | 'trend' | 'customerTA' | 'tables';

function AnalysisContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as AnalysisTab) || 'pivot';
  const { role, customerFilter } = useApp();

  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AnalysisTab>(initialTab);

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
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50 dark:bg-navy-950 transition-colors">
      <Navbar
        lastUpdated={report?.batchInfo?.uploaded_at}
        uploadedBy={report?.batchInfo?.uploaded_by}
      />

      <main className="flex-1 max-w-[1850px] w-full mx-auto px-3 sm:px-6 pt-3 pb-1 space-y-2.5">

        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Loading Detailed Analytics...
            </p>
          </div>
        ) : error ? (
          <div className="p-6 max-w-lg mx-auto bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400 mx-auto" />
            <h3 className="text-sm font-bold text-red-900 dark:text-red-200">Database Connection Error</h3>
            <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
            <button
              onClick={fetchForecast}
              className="px-5 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-semibold transition-all"
            >
              Retry Connection
            </button>
          </div>
        ) : !report ? (
          <div className="py-20 max-w-lg mx-auto text-center space-y-5 bg-white dark:bg-navy-900 p-8 rounded-2xl border border-slate-200 dark:border-navy-700 shadow-sm">
            <div className="w-14 h-14 bg-blue-50 dark:bg-navy-800 text-blue-700 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Upload className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">No Forecast Uploaded Yet</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                No active delivery forecast found. Please load Order Outstanding (OU) and Shipment Tracker (ST) files.
              </p>
            </div>
            {role === 'admin' ? (
              <Link
                href="/upload"
                className="inline-flex items-center space-x-2 px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold uppercase tracking-wider shadow transition-all"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Forecast Files</span>
              </Link>
            ) : (
              <p className="text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800 inline-block">
                Please ask an Admin to upload the forecast data.
              </p>
            )}
          </div>
        ) : (
          <>
            {/* Primary Analysis Tab Switcher & Export Controls */}
            <div className="bg-white dark:bg-navy-900 rounded-xl p-2 border border-slate-200 dark:border-navy-700 shadow-sm flex flex-col md:flex-row items-center justify-between gap-2.5">
              <div className="flex bg-slate-100 dark:bg-navy-800 p-0.5 rounded-xl border border-slate-200 dark:border-navy-700 overflow-x-auto max-w-full no-scrollbar w-full md:w-auto">
                <button
                  onClick={() => setActiveTab('pivot')}
                  className={`flex items-center px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${
                    activeTab === 'pivot'
                      ? 'bg-blue-700 text-white shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Table className="w-3.5 h-3.5 mr-1.5" />
                  Pivot Matrix
                </button>
                <button
                  onClick={() => setActiveTab('analysis')}
                  className={`flex items-center px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${
                    activeTab === 'analysis'
                      ? 'bg-blue-700 text-white shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                  Summary Analysis
                </button>
                <button
                  onClick={() => setActiveTab('trend')}
                  className={`flex items-center px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${
                    activeTab === 'trend'
                      ? 'bg-blue-700 text-white shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
                  Trend Analysis
                </button>
                <button
                  onClick={() => setActiveTab('customerTA')}
                  className={`flex items-center px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${
                    activeTab === 'customerTA'
                      ? 'bg-blue-700 text-white shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <UserSearch className="w-3.5 h-3.5 mr-1.5" />
                  Customer wise TA
                </button>
                <button
                  onClick={() => setActiveTab('tables')}
                  className={`flex items-center px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${
                    activeTab === 'tables'
                      ? 'bg-blue-700 text-white shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <ListOrdered className="w-3.5 h-3.5 mr-1.5" />
                  Summary Tables
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
                <button
                  onClick={fetchForecast}
                  title="Reload forecast"
                  className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-navy-800 dark:hover:bg-navy-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-navy-700 rounded-lg transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => exportForecastToExcel(report, customerFilter)}
                  className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-950 dark:bg-navy-700 dark:hover:bg-navy-600 text-white px-4 py-1.5 rounded-lg font-semibold text-xs transition-all shadow-sm"
                >
                  <FileDown className="w-3.5 h-3.5 text-blue-300" />
                  <span>Download XL</span>
                </button>

                {role === 'admin' && (
                  <Link
                    href="/upload"
                    className="flex items-center space-x-1.5 bg-blue-700 hover:bg-blue-800 text-white px-4 py-1.5 rounded-lg font-semibold text-xs shadow-sm transition-all"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload New</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Render Selected Analytics Tab */}
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

      <footer className="w-full mt-auto py-1"></footer>
    </div>
  );
}

export default function AnalysisPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-navy-950 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      }
    >
      <AnalysisContent />
    </Suspense>
  );
}
