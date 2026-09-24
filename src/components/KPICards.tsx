'use client';

import React from 'react';
import { ReportData, CustomerFilter, getActiveForecastMonthKey } from '@/lib/types';
import { useApp } from '@/context/RoleContext';
import {
  Globe2,
  Building2,
  CalendarDays,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

interface KPICardsProps {
  report: ReportData;
  filter: CustomerFilter;
}

export function KPICards({ report, filter }: KPICardsProps) {
  const { theme } = useApp();
  const { grandTotal, directTotal, indirectTotal } = report;

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

  // Key Accounts Concentration (Top 5 Accounts Share)
  const sortedAccounts = [...report.customerSummaries]
    .filter(c => filter === 'ALL' || c.type === filter)
    .sort((a, b) => b.value - a.value);

  const top5Value = sortedAccounts.slice(0, 5).reduce((acc, c) => acc + c.value, 0);
  const top5Qty = sortedAccounts.slice(0, 5).reduce((acc, c) => acc + c.qty, 0);
  const top5ValShare = activeValue > 0 ? ((top5Value / activeValue) * 100).toFixed(1) : '0';
  const top1Cust = sortedAccounts[0]?.label || 'None';

  // Dynamic theme styling for Total Portfolio card
  const getThemeStyles = () => {
    switch (theme) {
      case 'emerald':
        return {
          gradient: 'bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-950 text-white',
          glow1: 'bg-emerald-400/25',
          glow2: 'bg-teal-500/20',
          ring: 'ring-2 ring-emerald-400 border border-emerald-400/50',
          borderInactive: 'border border-emerald-500/30',
          accentText: 'text-emerald-100',
          sparkle: 'text-emerald-300',
          subLabel: 'text-emerald-200/90',
          footerBorder: 'border-white/20',
          volumeLabel: 'text-emerald-200',
          volumeValue: 'text-emerald-100',
        };
      case 'dark': // Slate
        return {
          gradient: 'bg-gradient-to-br from-slate-700 via-slate-800 to-zinc-950 text-white',
          glow1: 'bg-sky-400/20',
          glow2: 'bg-slate-500/20',
          ring: 'ring-2 ring-sky-400 border border-sky-400/50',
          borderInactive: 'border border-slate-600/30',
          accentText: 'text-slate-100',
          sparkle: 'text-sky-300',
          subLabel: 'text-slate-300/90',
          footerBorder: 'border-white/20',
          volumeLabel: 'text-slate-300',
          volumeValue: 'text-sky-200',
        };
      case 'navy':
        return {
          gradient: 'bg-gradient-to-br from-blue-700 via-blue-900 to-slate-950 text-white',
          glow1: 'bg-sky-400/25',
          glow2: 'bg-blue-600/20',
          ring: 'ring-2 ring-sky-400 border border-sky-400/50',
          borderInactive: 'border border-blue-500/30',
          accentText: 'text-sky-100',
          sparkle: 'text-sky-300',
          subLabel: 'text-blue-200/90',
          footerBorder: 'border-white/20',
          volumeLabel: 'text-blue-200',
          volumeValue: 'text-sky-200',
        };
      case 'light':
      default:
        return {
          gradient: 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 text-white shadow-md',
          glow1: 'bg-sky-300/35',
          glow2: 'bg-indigo-300/25',
          ring: 'ring-2 ring-blue-300 border border-blue-300/50',
          borderInactive: 'border border-blue-400/30',
          accentText: 'text-blue-50',
          sparkle: 'text-sky-200',
          subLabel: 'text-blue-100',
          footerBorder: 'border-white/20',
          volumeLabel: 'text-blue-100',
          volumeValue: 'text-white',
        };
    }
  };

  const themeStyles = getThemeStyles();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* 1. Grand Total Card - Dynamically reacts to selected Theme */}
      <div className={`relative overflow-hidden ${themeStyles.gradient} rounded-xl p-3.5 sm:p-4 shadow-md transition-all duration-300 min-h-[115px] flex flex-col justify-between ${
        filter === 'ALL'
          ? themeStyles.ring
          : themeStyles.borderInactive
      }`}>
        {/* Soft Ambient Radial Shine Glow */}
        <div className={`absolute -top-10 -right-10 w-28 h-28 ${themeStyles.glow1} rounded-full blur-xl pointer-events-none transition-colors duration-300`} />
        <div className={`absolute -bottom-8 -left-8 w-24 h-24 ${themeStyles.glow2} rounded-full blur-lg pointer-events-none transition-colors duration-300`} />

        <div className="relative z-10 flex items-center justify-between mb-1.5">
          <span className={`text-[11px] font-bold uppercase tracking-wider ${themeStyles.accentText} flex items-center gap-1.5`}>
            <Sparkles className={`w-3.5 h-3.5 ${themeStyles.sparkle} animate-pulse`} />
            {filter === 'ALL' ? 'Total Portfolio' : `${filter} Portfolio`}
          </span>
          <span className="text-[10px] font-mono bg-white/20 text-white px-2 py-0.5 rounded-full border border-white/25 font-semibold shadow-xs">
            {sortedAccounts.length} Accounts
          </span>
        </div>
        <div className="relative z-10 space-y-0.5">
          <p className={`text-[9px] uppercase font-semibold ${themeStyles.subLabel}`}>Total Value (USD)</p>
          <p className="text-xl font-black text-white tracking-tight drop-shadow-xs">
            ${formatNum(activeValue)}
          </p>
          <div className={`flex items-center justify-between pt-1.5 border-t ${themeStyles.footerBorder}`}>
            <span className={`text-[10px] ${themeStyles.volumeLabel} font-medium`}>Total Volume</span>
            <span className={`text-xs font-mono font-bold ${themeStyles.volumeValue}`}>{formatNum(activeQty)} KG</span>
          </div>
        </div>
      </div>

      {/* 2. Direct (Export) Card */}
      <div className={`bg-white dark:bg-navy-800 rounded-xl p-3.5 sm:p-4 shadow-sm border transition-all min-h-[115px] flex flex-col justify-between ${
        filter === 'DIRECT'
          ? 'ring-2 ring-emerald-500 border-emerald-400 dark:border-emerald-500'
          : 'border-slate-200 dark:border-navy-700'
      }`}>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
            <Globe2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Direct (Export)
          </span>
          <span className="text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50">
            {directValShare}% Share
          </span>
        </div>
        <div className="space-y-0.5">
          <p className="text-[9px] uppercase font-semibold text-slate-400 dark:text-slate-400">Forecast Value</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            ${formatNum(directTotal.value)}
          </p>
          <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-navy-700">
            <span className="text-[10px] text-slate-400 font-medium">Volume ({directQtyShare}%)</span>
            <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">{formatNum(directTotal.qty)} KG</span>
          </div>
        </div>
      </div>

      {/* 3. Indirect (Local) Card */}
      <div className={`bg-white dark:bg-navy-800 rounded-xl p-3.5 sm:p-4 shadow-sm border transition-all min-h-[115px] flex flex-col justify-between ${
        filter === 'INDIRECT'
          ? 'ring-2 ring-indigo-500 border-indigo-400 dark:border-indigo-500'
          : 'border-slate-200 dark:border-navy-700'
      }`}>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            Indirect (Local)
          </span>
          <span className="text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800/50">
            {indirectValShare}% Share
          </span>
        </div>
        <div className="space-y-0.5">
          <p className="text-[9px] uppercase font-semibold text-slate-400 dark:text-slate-400">Forecast Value</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            ${formatNum(indirectTotal.value)}
          </p>
          <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-navy-700">
            <span className="text-[10px] text-slate-400 font-medium">Volume ({indirectQtyShare}%)</span>
            <span className="text-xs font-mono font-bold text-indigo-700 dark:text-indigo-400">{formatNum(indirectTotal.qty)} KG</span>
          </div>
        </div>
      </div>

      {/* 4. Key Account Concentration Risk Card */}
      <div className="bg-white dark:bg-navy-800 rounded-xl p-3.5 sm:p-4 shadow-sm border border-slate-200 dark:border-navy-700 min-h-[115px] flex flex-col justify-between">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            Top 5 Concentration
          </span>
          <span className="text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800/50">
            {top5ValShare}% of {filter === 'ALL' ? 'Total' : filter === 'DIRECT' ? 'Direct' : 'Local'}
          </span>
        </div>
        <div className="space-y-0.5">
          <p className="text-[9px] uppercase font-semibold text-slate-400 dark:text-slate-400">Top 5 Accounts Value</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            ${formatNum(top5Value)}
          </p>
          <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-navy-700">
            <span className="text-[10px] text-slate-400 font-medium truncate max-w-[150px]" title={`#1 Account: ${top1Cust}`}>
              #1 {top1Cust}
            </span>
            <span className="text-xs font-mono font-bold text-purple-700 dark:text-purple-400">
              {formatNum(top5Qty)} KG
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
