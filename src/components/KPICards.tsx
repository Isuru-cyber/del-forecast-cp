'use client';

import React from 'react';
import { ReportData, CustomerFilter, getActiveForecastMonthKey } from '@/lib/types';
import {
  Globe2,
  Building2,
  CalendarDays,
  Sparkles,
} from 'lucide-react';

interface KPICardsProps {
  report: ReportData;
  filter: CustomerFilter;
}

export function KPICards({ report, filter }: KPICardsProps) {
  const { grandTotal, directTotal, indirectTotal, dateSummaries } = report;

  const formatNum = (n: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(n);
  };

  let activeQty = grandTotal.qty;
  let activeValue = grandTotal.value;

  if (filter === 'DIRECT') {
    activeQty = directTotal.qty;
    activeValue = directTotal.value;
  } else if (filter === 'INDIRECT') {
    activeQty = indirectTotal.qty;
    activeValue = indirectTotal.value;
  }

  const directQtyShare = grandTotal.qty > 0 ? ((directTotal.qty / grandTotal.qty) * 100).toFixed(1) : '0';
  const directValShare = grandTotal.value > 0 ? ((directTotal.value / grandTotal.value) * 100).toFixed(1) : '0';

  const indirectQtyShare = grandTotal.qty > 0 ? ((indirectTotal.qty / grandTotal.qty) * 100).toFixed(1) : '0';
  const indirectValShare = grandTotal.value > 0 ? ((indirectTotal.value / grandTotal.value) * 100).toFixed(1) : '0';

  // Horizon breakdown
  const currentMonthKey = getActiveForecastMonthKey(report.dates);
  let overdueVal = 0;
  let currentVal = 0;
  let futureVal = 0;

  dateSummaries.forEach(d => {
    const monthKey = d.label.slice(0, 7);
    if (monthKey === currentMonthKey) {
      currentVal += d.value;
    } else if (monthKey < currentMonthKey) {
      overdueVal += d.value;
    } else {
      futureVal += d.value;
    }
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* 1. Grand Total Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-navy-900 to-blue-950 text-white rounded-xl p-4 shadow-sm border border-slate-800 dark:border-navy-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-blue-400" />
            {filter === 'ALL' ? 'Total Portfolio' : `${filter} Portfolio`}
          </span>
          <span className="text-[10px] font-mono bg-blue-500/20 text-blue-200 px-2 py-0.5 rounded-full border border-blue-400/20">
            {report.customers.length} Accounts
          </span>
        </div>
        <div className="space-y-0.5">
          <p className="text-[10px] uppercase font-semibold text-slate-400">Total Value (USD)</p>
          <p className="text-xl font-bold text-white tracking-tight">
            ${formatNum(activeValue)}
          </p>
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
            <span className="text-[10px] text-slate-400 font-medium">Total Volume</span>
            <span className="text-xs font-mono font-bold text-blue-300">{formatNum(activeQty)} KG</span>
          </div>
        </div>
      </div>

      {/* 2. Direct (Export) Card */}
      <div className={`bg-white dark:bg-navy-800 rounded-xl p-4 shadow-sm border transition-all ${
        filter === 'DIRECT'
          ? 'ring-2 ring-emerald-500 border-emerald-400 dark:border-emerald-500'
          : 'border-slate-200 dark:border-navy-700'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
            <Globe2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            Direct (Export)
          </span>
          <span className="text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50">
            {directValShare}% Share
          </span>
        </div>
        <div className="space-y-0.5">
          <p className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-400">Forecast Value</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            ${formatNum(directTotal.value)}
          </p>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-navy-700">
            <span className="text-[10px] text-slate-400 font-medium">Volume ({directQtyShare}%)</span>
            <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">{formatNum(directTotal.qty)} KG</span>
          </div>
        </div>
      </div>

      {/* 3. Indirect (Local) Card */}
      <div className={`bg-white dark:bg-navy-800 rounded-xl p-4 shadow-sm border transition-all ${
        filter === 'INDIRECT'
          ? 'ring-2 ring-indigo-500 border-indigo-400 dark:border-indigo-500'
          : 'border-slate-200 dark:border-navy-700'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-1">
            <Building2 className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
            Indirect (Local)
          </span>
          <span className="text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800/50">
            {indirectValShare}% Share
          </span>
        </div>
        <div className="space-y-0.5">
          <p className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-400">Forecast Value</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            ${formatNum(indirectTotal.value)}
          </p>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-navy-700">
            <span className="text-[10px] text-slate-400 font-medium">Volume ({indirectQtyShare}%)</span>
            <span className="text-xs font-mono font-bold text-indigo-700 dark:text-indigo-400">{formatNum(indirectTotal.qty)} KG</span>
          </div>
        </div>
      </div>

      {/* 4. Horizon Backlog Card */}
      <div className="bg-white dark:bg-navy-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-navy-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <CalendarDays className="w-3 h-3 text-blue-700 dark:text-blue-400" />
            Velocity Horizon
          </span>
          <span className="text-[10px] font-semibold bg-slate-100 dark:bg-navy-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full border border-slate-200 dark:border-navy-600">
            {report.dates.length} Dates
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 pt-1 text-center">
          <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/50">
            <p className="text-[9px] font-bold uppercase text-amber-800 dark:text-amber-400">Overdue</p>
            <p className="text-[11px] font-bold text-amber-900 dark:text-amber-300 mt-0.5">${formatNum(overdueVal)}</p>
          </div>
          <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/50">
            <p className="text-[9px] font-bold uppercase text-blue-800 dark:text-blue-400">Current</p>
            <p className="text-[11px] font-bold text-blue-900 dark:text-blue-300 mt-0.5">${formatNum(currentVal)}</p>
          </div>
          <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/50">
            <p className="text-[9px] font-bold uppercase text-emerald-800 dark:text-emerald-400">Future</p>
            <p className="text-[11px] font-bold text-emerald-900 dark:text-emerald-300 mt-0.5">${formatNum(futureVal)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
