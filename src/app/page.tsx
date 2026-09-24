'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/RoleContext';
import { ReportData, getActiveForecastMonthKey } from '@/lib/types';
import { Navbar } from '@/components/Navbar';
import { KPICards } from '@/components/KPICards';
import {
  Table,
  BarChart3,
  TrendingUp,
  UserSearch,
  ListOrdered,
  Upload,
  Loader2,
  AlertTriangle,
  ArrowRight,
  Globe2,
  Building2,
  Clock,
  Sparkles,
  PieChart,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export default function DashboardPage() {
  const { role, customerFilter } = useApp();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const monthKeyToLabel = (key: string) => {
    const [y, m] = key.split('-').map(Number);
    const d = new Date(y, m - 1, 1);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Active Forecast Month
  const currentMonthKey = useMemo(() => {
    return report ? getActiveForecastMonthKey(report.dates) : '';
  }, [report]);

  const currentMonthLabel = useMemo(() => {
    return currentMonthKey ? monthKeyToLabel(currentMonthKey) : 'Current Month';
  }, [currentMonthKey]);

  // Top Customer Drivers
  const topCustomers = useMemo(() => {
    if (!report) return [];
    const filtered = report.customerSummaries.filter(c => {
      return customerFilter === 'ALL' || c.type === customerFilter;
    });
    return [...filtered].sort((a, b) => b.value - a.value).slice(0, 8);
  }, [report, customerFilter]);

  // Horizon Breakdown Calculations
  const horizonData = useMemo(() => {
    if (!report) return { past: { qty: 0, value: 0 }, current: { qty: 0, value: 0 }, future: { qty: 0, value: 0 }, totalVal: 0 };
    const { customerSummaries, dates, data } = report;

    const filteredCustNames = customerSummaries
      .filter(c => customerFilter === 'ALL' || c.type === customerFilter)
      .map(c => c.label);

    const past = { qty: 0, value: 0 };
    const current = { qty: 0, value: 0 };
    const future = { qty: 0, value: 0 };

    dates.forEach(d => {
      let q = 0;
      let v = 0;
      filteredCustNames.forEach(cust => {
        const entry = data[cust]?.[d];
        if (entry) {
          q += entry.qty;
          v += entry.value;
        }
      });

      const mKey = d.slice(0, 7);
      if (mKey === currentMonthKey) {
        current.qty += q;
        current.value += v;
      } else if (mKey < currentMonthKey) {
        past.qty += q;
        past.value += v;
      } else {
        future.qty += q;
        future.value += v;
      }
    });

    const totalVal = past.value + current.value + future.value;
    return { past, current, future, totalVal };
  }, [report, customerFilter, currentMonthKey]);

  // Direct vs Indirect Percentages
  const portfolioDistribution = useMemo(() => {
    if (!report) return { directValPct: 50, indirectValPct: 50, directQtyPct: 50, indirectQtyPct: 50 };
    const totalVal = report.grandTotal.value || 1;
    const totalQty = report.grandTotal.qty || 1;
    return {
      directValPct: Math.round((report.directTotal.value / totalVal) * 100),
      indirectValPct: Math.round((report.indirectTotal.value / totalVal) * 100),
      directQtyPct: Math.round((report.directTotal.qty / totalQty) * 100),
      indirectQtyPct: Math.round((report.indirectTotal.qty / totalQty) * 100),
    };
  }, [report]);

  // Horizon Load Summary Cards
  const horizonCards = useMemo(() => {
    if (!report) return [];
    const activeDaysCount = report.dates.length || 1;
    const totalQtyAll = horizonData.past.qty + horizonData.current.qty + horizonData.future.qty;
    const dailyAvgQty = Math.round(totalQtyAll / activeDaysCount);
    const dailyAvgVal = Math.round(horizonData.totalVal / activeDaysCount);

    return [
      {
        title: 'Previous Months',
        sub: 'Overdue Backlog',
        totals: horizonData.past,
        bg: 'bg-amber-50/70 dark:bg-amber-950/40',
        border: 'border-amber-200 dark:border-amber-800/50',
        text: 'text-amber-900 dark:text-amber-300',
        dot: 'bg-amber-500',
        icon: <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
        isVelocity: false,
      },
      {
        title: currentMonthLabel,
        sub: 'Current Month Load',
        totals: horizonData.current,
        bg: 'bg-blue-50/70 dark:bg-blue-950/40',
        border: 'border-blue-200 dark:border-blue-800/50',
        text: 'text-blue-900 dark:text-blue-300',
        dot: 'bg-blue-600',
        icon: <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
        isVelocity: false,
      },
      {
        title: 'Next Months',
        sub: 'Future Pipeline',
        totals: horizonData.future,
        bg: 'bg-emerald-50/70 dark:bg-emerald-950/40',
        border: 'border-emerald-200 dark:border-emerald-800/50',
        text: 'text-emerald-900 dark:text-emerald-300',
        dot: 'bg-emerald-500',
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
        isVelocity: false,
      },
      {
        title: `${report.dates.length} Active Dispatch Days`,
        sub: 'Daily Dispatch Velocity',
        totals: {
          qty: dailyAvgQty,
          value: dailyAvgVal,
        },
        bg: 'bg-indigo-50/70 dark:bg-indigo-950/40',
        border: 'border-indigo-200 dark:border-indigo-800/50',
        text: 'text-indigo-900 dark:text-indigo-300',
        dot: 'bg-indigo-600',
        icon: <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />,
        isVelocity: true,
      },
    ];
  }, [report, horizonData, currentMonthLabel]);

  // SVG Donut Constants (Circumference for radius 42)
  const radius = 42;
  const circumference = 2 * Math.PI * radius; // ~263.89

  // Portfolio Mix Donut Calculation
  const directStroke = (portfolioDistribution.directValPct / 100) * circumference;
  const indirectStroke = circumference - directStroke;

  // Horizon Donut Calculation
  const safeTotalVal = horizonData.totalVal || 1;
  const pastStroke = (horizonData.past.value / safeTotalVal) * circumference;
  const currentStroke = (horizonData.current.value / safeTotalVal) * circumference;
  const futureStroke = (horizonData.future.value / safeTotalVal) * circumference;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50 dark:bg-navy-950 transition-colors">
      <Navbar
        lastUpdated={report?.batchInfo?.uploaded_at}
        uploadedBy={report?.batchInfo?.uploaded_by}
      />

      <main className="flex-1 max-w-[1750px] w-full mx-auto px-3 sm:px-6 py-4 space-y-4">
        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Retrieving Latest Forecast from Supabase...
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
            {/* Top Scorecard KPIs */}
            <KPICards report={report} filter={customerFilter} />

            {/* Horizon Load Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {horizonCards.map((c) => (
                <div key={c.sub} className={`rounded-xl ${c.bg} border ${c.border} p-3.5 sm:p-4 min-h-[105px] shadow-sm flex flex-col justify-between`}>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[10px] font-bold ${c.text} uppercase tracking-wider flex items-center gap-1.5`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`}></span>
                        {c.sub}
                      </span>
                      {c.icon}
                    </div>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">{c.title}</p>
                  </div>
                  <div className="flex justify-between items-end pt-2 border-t border-slate-200/50 dark:border-navy-700">
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase font-semibold">
                        {c.isVelocity ? 'Avg Daily Volume' : 'Volume'}
                      </p>
                      <p className={`text-sm font-bold ${c.text}`}>
                        {formatNumber(c.totals.qty)} {c.isVelocity ? 'KG/Day' : 'KG'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-slate-400 uppercase font-semibold">
                        {c.isVelocity ? 'Avg Daily Run Rate' : 'Value'}
                      </p>
                      <p className={`text-sm font-bold ${c.text}`}>
                        ${formatNumber(c.totals.value)}{c.isVelocity ? '/Day' : ''}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Visual Analytics 3-Column Balanced Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
              
              {/* 1. Portfolio Mix (Direct vs Indirect) with Rich SVG Donut Chart */}
              <div className="bg-white dark:bg-navy-900 rounded-xl p-4 border border-slate-200 dark:border-navy-700 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-1 h-3.5 bg-emerald-600 rounded-full"></div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Portfolio Mix (Direct vs Indirect)
                      </h3>
                    </div>
                    <PieChart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>

                  {/* Visual SVG Donut + Key Legend */}
                  <div className="flex items-center justify-around py-2">
                    {/* Donut Chart */}
                    <div className="relative w-28 h-28 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        {/* Background track */}
                        <circle
                          cx="50"
                          cy="50"
                          r={radius}
                          className="stroke-slate-100 dark:stroke-navy-800"
                          strokeWidth="12"
                          fill="transparent"
                        />
                        {/* Indirect Segment (Indigo) */}
                        <circle
                          cx="50"
                          cy="50"
                          r={radius}
                          stroke="#6366f1"
                          strokeWidth="12"
                          fill="transparent"
                          strokeDasharray={`${circumference} ${circumference}`}
                          strokeDashoffset="0"
                        />
                        {/* Direct Segment (Emerald) */}
                        <circle
                          cx="50"
                          cy="50"
                          r={radius}
                          stroke="#10b981"
                          strokeWidth="12"
                          fill="transparent"
                          strokeDasharray={`${directStroke} ${circumference}`}
                          strokeDashoffset="0"
                        />
                      </svg>
                      {/* Center Metric */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-base font-extrabold text-slate-900 dark:text-white leading-none">
                          {portfolioDistribution.directValPct}%
                        </span>
                        <span className="text-[9px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">
                          Export
                        </span>
                      </div>
                    </div>

                    {/* Donut Legend */}
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="w-3 h-3 rounded-md bg-emerald-500 shadow-sm"></span>
                        <div>
                          <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100 leading-tight">
                            Direct (Export)
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {portfolioDistribution.directValPct}% &middot; ${formatNumber(report.directTotal.value)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="w-3 h-3 rounded-md bg-indigo-500 shadow-sm"></span>
                        <div>
                          <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100 leading-tight">
                            Indirect (Local)
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {portfolioDistribution.indirectValPct}% &middot; ${formatNumber(report.indirectTotal.value)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Volume Split Progress Bar */}
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold">
                      <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                        Volume Share: Direct {portfolioDistribution.directQtyPct}%
                      </span>
                      <span className="text-indigo-700 dark:text-indigo-400 font-medium">
                        Local {portfolioDistribution.indirectQtyPct}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-navy-800 overflow-hidden flex shadow-inner">
                      <div
                        style={{ width: `${portfolioDistribution.directQtyPct}%` }}
                        className="bg-emerald-400 h-full"
                        title={`Direct Volume: ${formatNumber(report.directTotal.qty)} KG`}
                      ></div>
                      <div
                        style={{ width: `${portfolioDistribution.indirectQtyPct}%` }}
                        className="bg-indigo-400 h-full"
                        title={`Indirect Volume: ${formatNumber(report.indirectTotal.qty)} KG`}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Bottom Total Cards */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-navy-800 text-xs">
                  <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900/50">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block">Direct Total</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100 font-mono">${formatNumber(report.directTotal.value)}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-mono">{formatNumber(report.directTotal.qty)} KG</span>
                  </div>
                  <div className="bg-indigo-50/60 dark:bg-indigo-950/30 p-2.5 rounded-lg border border-indigo-100 dark:border-indigo-900/50">
                    <span className="text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-400 block">Indirect Total</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100 font-mono">${formatNumber(report.indirectTotal.value)}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-mono">{formatNumber(report.indirectTotal.qty)} KG</span>
                  </div>
                </div>
              </div>

              {/* 2. Top Customer Accounts (Key Value Drivers - Placed in Middle) */}
              <div className="bg-white dark:bg-navy-900 rounded-xl p-4 border border-slate-200 dark:border-navy-700 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-1 h-3.5 bg-indigo-600 rounded-full"></div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Top Customer Revenue Drivers
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-navy-800 px-2 py-0.5 rounded-full border border-blue-200 dark:border-navy-700">
                      Top 8 Accounts
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                    {topCustomers.map((cust, i) => (
                      <div
                        key={cust.label}
                        className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50/70 dark:bg-navy-800/60 hover:bg-blue-50/60 dark:hover:bg-navy-800 transition-colors text-xs"
                      >
                        <div className="flex items-center space-x-1.5 min-w-0">
                          <span className="text-[10px] font-mono font-bold text-slate-400 w-4">
                            #{i + 1}
                          </span>
                          <span
                            className={`text-[8px] font-bold px-1 rounded uppercase shrink-0 ${
                              cust.type === 'DIRECT'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                            }`}
                          >
                            {cust.type === 'DIRECT' ? 'Dir' : 'Loc'}
                          </span>
                          <span className="truncate max-w-[140px] font-semibold text-slate-800 dark:text-slate-200" title={cust.label}>
                            {cust.label}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-mono font-bold text-blue-700 dark:text-blue-400 block text-xs">
                            ${formatNumber(cust.value)}
                          </span>
                          <span className="font-mono text-[9px] text-slate-400">
                            {formatNumber(cust.qty)} KG
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-navy-800 text-right">
                  <Link
                    href="/analysis?tab=tables"
                    className="text-xs font-bold text-blue-700 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                  >
                    <span>View all {report.customers.length} customer accounts</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* 3. Delivery Horizon Breakdown with SVG Horizon Donut & Snug Fit */}
              <div className="bg-white dark:bg-navy-900 rounded-xl p-4 border border-slate-200 dark:border-navy-700 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-1 h-3.5 bg-blue-600 rounded-full"></div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Delivery Horizon Breakdown
                      </h3>
                    </div>
                    <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>

                  {/* Visual Horizon Donut Chart */}
                  <div className="flex items-center justify-around py-2">
                    <div className="relative w-28 h-28 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        {/* Background track */}
                        <circle
                          cx="50"
                          cy="50"
                          r={radius}
                          className="stroke-slate-100 dark:stroke-navy-800"
                          strokeWidth="12"
                          fill="transparent"
                        />
                        {/* Future Segment (Emerald) */}
                        <circle
                          cx="50"
                          cy="50"
                          r={radius}
                          stroke="#10b981"
                          strokeWidth="12"
                          fill="transparent"
                          strokeDasharray={`${circumference} ${circumference}`}
                          strokeDashoffset="0"
                        />
                        {/* Current Segment (Blue) */}
                        <circle
                          cx="50"
                          cy="50"
                          r={radius}
                          stroke="#3b82f6"
                          strokeWidth="12"
                          fill="transparent"
                          strokeDasharray={`${currentStroke + pastStroke} ${circumference}`}
                          strokeDashoffset="0"
                        />
                        {/* Overdue Segment (Amber) */}
                        <circle
                          cx="50"
                          cy="50"
                          r={radius}
                          stroke="#f59e0b"
                          strokeWidth="12"
                          fill="transparent"
                          strokeDasharray={`${pastStroke} ${circumference}`}
                          strokeDashoffset="0"
                        />
                      </svg>
                      {/* Center Metric */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-sm font-extrabold text-blue-700 dark:text-blue-400 leading-none">
                          ${formatNumber(horizonData.current.value > 0 ? horizonData.current.value : horizonData.totalVal).slice(0, 5)}k
                        </span>
                        <span className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">
                          Horizon
                        </span>
                      </div>
                    </div>

                    {/* Donut Legend */}
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                          Overdue ({horizonData.totalVal > 0 ? Math.round((horizonData.past.value / horizonData.totalVal) * 100) : 0}%)
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                        <span className="text-[11px] font-semibold text-blue-800 dark:text-blue-300">
                          Current ({horizonData.totalVal > 0 ? Math.round((horizonData.current.value / horizonData.totalVal) * 100) : 0}%)
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                          Future ({horizonData.totalVal > 0 ? Math.round((horizonData.future.value / horizonData.totalVal) * 100) : 0}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bars */}
                  <div className="space-y-2 mt-2">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="font-semibold text-amber-700 dark:text-amber-400">Overdue Backlog</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">${formatNumber(horizonData.past.value)}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-navy-800 overflow-hidden">
                        <div
                          style={{ width: `${horizonData.totalVal > 0 ? (horizonData.past.value / horizonData.totalVal) * 100 : 0}%` }}
                          className="bg-amber-500 h-full"
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="font-semibold text-blue-700 dark:text-blue-400">Current Month Load</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">${formatNumber(horizonData.current.value)}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-navy-800 overflow-hidden">
                        <div
                          style={{ width: `${horizonData.totalVal > 0 ? (horizonData.current.value / horizonData.totalVal) * 100 : 0}%` }}
                          className="bg-blue-600 h-full"
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">Future Pipeline</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">${formatNumber(horizonData.future.value)}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-navy-800 overflow-hidden">
                        <div
                          style={{ width: `${horizonData.totalVal > 0 ? (horizonData.future.value / horizonData.totalVal) * 100 : 0}%` }}
                          className="bg-emerald-500 h-full"
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Total Forecast Horizon:</span>
                  <span className="font-mono font-bold text-blue-900 dark:text-blue-300">${formatNumber(horizonData.totalVal)}</span>
                </div>
              </div>
            </div>

            {/* Deep-Dive Analytical Hub Cards */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-1 h-3.5 bg-blue-700 rounded-full"></div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Deep-Dive Analytical Modules
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {/* Module 1: Pivot Matrix */}
                <Link
                  href="/analysis?tab=pivot"
                  className="group bg-white dark:bg-navy-900 rounded-xl p-4 border border-slate-200 dark:border-navy-700 hover:border-blue-500 dark:hover:border-blue-500 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-navy-800 text-blue-700 dark:text-blue-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                      <Table className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 transition-colors">
                      Pivot Matrix
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Cross-tab grid with daily customer delivery schedule, sticky headers, and date totals.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between text-[11px] font-bold text-blue-700 dark:text-blue-400">
                    <span>Open Matrix</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>

                {/* Module 2: Summary Analysis */}
                <Link
                  href="/analysis?tab=analysis"
                  className="group bg-white dark:bg-navy-900 rounded-xl p-4 border border-slate-200 dark:border-navy-700 hover:border-blue-500 dark:hover:border-blue-500 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-navy-800 text-indigo-700 dark:text-indigo-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1 group-hover:text-indigo-600 transition-colors">
                      Summary Analysis
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Customer percentage share visualizers and date-wise delivery velocity distribution.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between text-[11px] font-bold text-indigo-700 dark:text-indigo-400">
                    <span>Open Summary</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>

                {/* Module 3: Trend Analysis */}
                <Link
                  href="/analysis?tab=trend"
                  className="group bg-white dark:bg-navy-900 rounded-xl p-4 border border-slate-200 dark:border-navy-700 hover:border-blue-500 dark:hover:border-blue-500 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-navy-800 text-sky-700 dark:text-sky-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1 group-hover:text-sky-600 transition-colors">
                      Trend Analysis
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Daily delivery velocity charts with interactive bar click drill-down to shipment details.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between text-[11px] font-bold text-sky-700 dark:text-sky-400">
                    <span>Open Trends</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>

                {/* Module 4: Customer wise TA */}
                <Link
                  href="/analysis?tab=customerTA"
                  className="group bg-white dark:bg-navy-900 rounded-xl p-4 border border-slate-200 dark:border-navy-700 hover:border-blue-500 dark:hover:border-blue-500 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-navy-800 text-teal-700 dark:text-teal-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                      <UserSearch className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1 group-hover:text-teal-600 transition-colors">
                      Customer wise TA
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Customer-specific demand timeline, delivery load cards, and daily fulfillment charts.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between text-[11px] font-bold text-teal-700 dark:text-teal-400">
                    <span>Open Customer TA</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>

                {/* Module 5: Summary Tables */}
                <Link
                  href="/analysis?tab=tables"
                  className="group bg-white dark:bg-navy-900 rounded-xl p-4 border border-slate-200 dark:border-navy-700 hover:border-blue-500 dark:hover:border-blue-500 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-navy-800 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                      <ListOrdered className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1 group-hover:text-emerald-600 transition-colors">
                      Summary Tables
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Executive volume and revenue ranking tables by customer and scheduled dispatch date.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                    <span>Open Tables</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="w-full mt-auto py-3"></footer>
    </div>
  );
}
