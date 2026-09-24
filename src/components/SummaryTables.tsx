'use client';

import React, { useState } from 'react';
import { ReportData, CustomerFilter } from '@/lib/types';
import { Users, Calendar, Maximize2, Minimize2 } from 'lucide-react';
import { FullscreenModal } from './FullscreenModal';

interface SummaryTablesProps {
  report: ReportData;
  filter: CustomerFilter;
}

export function SummaryTables({ report, filter }: SummaryTablesProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const { customerSummaries, dates, data } = report;

  const filteredCustomers = customerSummaries.filter(c => {
    return filter === 'ALL' || c.type === filter;
  });

  const totalCustQty = filteredCustomers.reduce((acc, c) => acc + c.qty, 0);
  const totalCustValue = filteredCustomers.reduce((acc, c) => acc + c.value, 0);

  const filteredCustNames = filteredCustomers.map(c => c.label);
  const activeDateSummaries = dates.map(d => {
    let qty = 0;
    let value = 0;
    filteredCustNames.forEach(c => {
      const entry = data[c]?.[d];
      if (entry) {
        qty += entry.qty;
        value += entry.value;
      }
    });
    return { label: d, qty, value };
  }).filter(d => d.qty > 0 || d.value > 0);

  const totalDateQty = activeDateSummaries.reduce((acc, d) => acc + d.qty, 0);
  const totalDateValue = activeDateSummaries.reduce((acc, d) => acc + d.value, 0);

  const renderContent = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Customer Volume Summary Table */}
      <div className="bg-white dark:bg-navy-800 rounded-xl shadow-sm border border-slate-200 dark:border-navy-700 overflow-hidden flex flex-col">
        <div className="bg-blue-900 dark:bg-navy-900 px-5 py-3 flex items-center justify-between text-white border-b border-blue-800 dark:border-navy-700">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-blue-200" />
            <h3 className="text-xs font-bold uppercase tracking-widest">
              Customer Volume Summary ({filter})
            </h3>
          </div>
          <span className="text-[10px] font-semibold bg-white/10 px-2 py-0.5 rounded-full">
            {filteredCustomers.length} Accounts
          </span>
        </div>

        <div className="overflow-x-auto flex-1 max-h-[500px] custom-scrollbar">
          <table className="w-full">
            <thead className="sticky top-0 bg-slate-50 dark:bg-navy-900 z-10 border-b border-slate-200 dark:border-navy-700">
              <tr>
                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase">Customer</th>
                <th className="px-2 py-2.5 text-center text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase w-20">Type</th>
                <th className="px-4 py-2.5 text-right text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase">Qty (KG)</th>
                <th className="px-4 py-2.5 text-right text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase">Value (USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-700">
              {filteredCustomers.map((s) => (
                <tr key={s.label} className="hover:bg-blue-50/40 dark:hover:bg-blue-950/30 transition-colors">
                  <td className="px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[220px]" title={s.label}>
                    {s.label}
                  </td>
                  <td className="px-2 py-2 text-center">
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider ${
                        s.type === 'DIRECT'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                      }`}
                    >
                      {s.type === 'DIRECT' ? 'Direct' : 'Local'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs text-right font-mono text-slate-600 dark:text-slate-300 font-medium">
                    {formatNumber(s.qty)}
                  </td>
                  <td className="px-4 py-2 text-xs text-right font-mono text-blue-700 dark:text-blue-400 font-bold">
                    ${formatNumber(s.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 dark:bg-navy-900 border-t-2 border-slate-200 dark:border-navy-700 px-4 py-2.5 flex items-center justify-between font-mono text-xs">
          <span className="font-bold text-slate-900 dark:text-white uppercase font-sans">Total</span>
          <div className="flex items-center space-x-6 text-right">
            <span className="font-bold text-slate-800 dark:text-slate-200">{formatNumber(totalCustQty)} KG</span>
            <span className="font-extrabold text-blue-700 dark:text-blue-400">${formatNumber(totalCustValue)}</span>
          </div>
        </div>
      </div>

      {/* 2. Date Wise Load Summary Table */}
      <div className="bg-white dark:bg-navy-800 rounded-xl shadow-sm border border-slate-200 dark:border-navy-700 overflow-hidden flex flex-col">
        <div className="bg-slate-900 dark:bg-navy-950 px-5 py-3 flex items-center justify-between text-white border-b border-slate-800 dark:border-navy-800">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-blue-300" />
            <h3 className="text-xs font-bold uppercase tracking-widest">
              Date Wise Load Summary
            </h3>
          </div>
          <span className="text-[10px] font-semibold bg-white/10 px-2 py-0.5 rounded-full">
            {activeDateSummaries.length} Dates
          </span>
        </div>

        <div className="overflow-x-auto flex-1 max-h-[500px] custom-scrollbar">
          <table className="w-full">
            <thead className="sticky top-0 bg-slate-50 dark:bg-navy-900 z-10 border-b border-slate-200 dark:border-navy-700">
              <tr>
                <th className="px-5 py-2.5 text-left text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase">Delivery Date</th>
                <th className="px-5 py-2.5 text-right text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase">Qty (KG)</th>
                <th className="px-5 py-2.5 text-right text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase">Value (USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-700">
              {activeDateSummaries.map((s) => (
                <tr key={s.label} className="hover:bg-blue-50/40 dark:hover:bg-blue-950/30 transition-colors">
                  <td className="px-5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 font-mono">
                    {s.label}
                  </td>
                  <td className="px-5 py-2 text-xs text-right font-mono text-slate-600 dark:text-slate-300 font-medium">
                    {formatNumber(s.qty)}
                  </td>
                  <td className="px-5 py-2 text-xs text-right font-mono text-blue-700 dark:text-blue-400 font-bold">
                    ${formatNumber(s.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 dark:bg-navy-900 border-t-2 border-slate-200 dark:border-navy-700 px-5 py-2.5 flex items-center justify-between font-mono text-xs">
          <span className="font-bold text-slate-900 dark:text-white uppercase font-sans">Total</span>
          <div className="flex items-center space-x-6 text-right">
            <span className="font-bold text-slate-800 dark:text-slate-200">{formatNumber(totalDateQty)} KG</span>
            <span className="font-extrabold text-blue-700 dark:text-blue-400">${formatNumber(totalDateValue)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          onClick={() => setIsFullscreen(true)}
          className="flex items-center space-x-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-navy-700 dark:hover:bg-navy-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-all"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>Full Screen</span>
        </button>
      </div>

      {renderContent()}

      <FullscreenModal
        isOpen={isFullscreen}
        onClose={() => setIsFullscreen(false)}
        title={`Summary Tables (${filter} Customers)`}
        noPadding={false}
      >
        <div className="p-4">
          {renderContent()}
        </div>
      </FullscreenModal>
    </div>
  );
}
