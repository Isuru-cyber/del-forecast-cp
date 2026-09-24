'use client';

import React from 'react';
import { ReportData, CustomerFilter } from '@/lib/types';
import {
  TrendingUp,
  Globe2,
  Building2,
  CalendarDays,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';

interface KPICardsProps {
  report: ReportData;
  filter: CustomerFilter;
}

export function KPICards({ report, filter }: KPICardsProps) {
  const { grandTotal, directTotal, indirectTotal, customerSummaries, dateSummaries } = report;

  const formatNum = (n: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(n);
  };

  // Determine active totals based on filter
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

  // Current month calculation
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Grand Total Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white rounded-2xl p-5 shadow-lg border border-slate-800">
        <div className="absolute top-0 right-0 -mt-3 -mr-3 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            {filter === 'ALL' ? 'Total Portfolio' : `${filter} Portfolio`}
          </span>
          <span className="text-[10px] font-mono bg-blue-500/20 text-blue-200 px-2 py-0.5 rounded-full border border-blue-400/20">
            {report.customers.length} Customers
          </span>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] uppercase font-bold text-slate-400">Total Forecast Value</p>
          <p className="text-2xl font-black text-white tracking-tight">
            ${formatNum(activeValue)}
          </p>
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
            <span className="text-[10px] font-semibold text-slate-400">Total Volume</span>
            <span className="text-xs font-mono font-bold text-blue-300">{formatNum(activeQty)} KG</span>
          </div>
        </div>
      </div>

      {/* 2. Direct (Export) Card */}
      <div className={`bg-white rounded-2xl p-5 shadow-sm border transition-all ${
        filter === 'DIRECT' ? 'ring-2 ring-emerald-500 border-emerald-300' : 'border-slate-200'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
            <Globe2 className="w-3.5 h-3.5 text-emerald-600" />
            Direct (Export)
          </span>
          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
            {directValShare}% Value Share
          </span>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] uppercase font-bold text-slate-400">Direct Value</p>
          <p className="text-2xl font-black text-slate-900 tracking-tight">
            ${formatNum(directTotal.value)}
          </p>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-[10px] font-semibold text-slate-400">Volume ({directQtyShare}%)</span>
            <span className="text-xs font-mono font-bold text-emerald-700">{formatNum(directTotal.qty)} KG</span>
          </div>
        </div>
      </div>

      {/* 3. Indirect (Local) Card */}
      <div className={`bg-white rounded-2xl p-5 shadow-sm border transition-all ${
        filter === 'INDIRECT' ? 'ring-2 ring-indigo-500 border-indigo-300' : 'border-slate-200'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
            Indirect (Local)
          </span>
          <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
            {indirectValShare}% Value Share
          </span>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] uppercase font-bold text-slate-400">Local Value</p>
          <p className="text-2xl font-black text-slate-900 tracking-tight">
            ${formatNum(indirectTotal.value)}
          </p>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-[10px] font-semibold text-slate-400">Volume ({indirectQtyShare}%)</span>
            <span className="text-xs font-mono font-bold text-indigo-700">{formatNum(indirectTotal.qty)} KG</span>
          </div>
        </div>
      </div>

      {/* 4. Velocity Horizon Card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-blue-700" />
            Delivery Velocity
          </span>
          <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
            {report.dates.length} Delivery Dates
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
          <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-200/60">
            <p className="text-[9px] font-bold uppercase text-amber-800">Overdue</p>
            <p className="text-xs font-black text-amber-900 mt-0.5">${formatNum(overdueVal)}</p>
          </div>
          <div className="p-2 rounded-xl bg-blue-50/70 border border-blue-200/60">
            <p className="text-[9px] font-bold uppercase text-blue-800">Current</p>
            <p className="text-xs font-black text-blue-900 mt-0.5">${formatNum(currentVal)}</p>
          </div>
          <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-200/60">
            <p className="text-[9px] font-bold uppercase text-emerald-800">Future</p>
            <p className="text-xs font-black text-emerald-900 mt-0.5">${formatNum(futureVal)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
