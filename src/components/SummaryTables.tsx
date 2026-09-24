'use client';

import React from 'react';
import { ReportData, CustomerFilter } from '@/lib/types';
import { Users, Calendar } from 'lucide-react';

interface SummaryTablesProps {
  report: ReportData;
  filter: CustomerFilter;
}

export function SummaryTables({ report, filter }: SummaryTablesProps) {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const { customerSummaries, dates, data } = report;

  // Filtered customers
  const filteredCustomers = customerSummaries.filter(c => {
    return filter === 'ALL' || c.type === filter;
  });

  const totalCustQty = filteredCustomers.reduce((acc, c) => acc + c.qty, 0);
  const totalCustValue = filteredCustomers.reduce((acc, c) => acc + c.value, 0);

  // Recalculated date summaries based on filtered customers
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* 1. Customer Volume Summary Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-blue-800 to-indigo-900 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-blue-200" />
            <h3 className="text-xs font-bold uppercase tracking-widest">
              Customer Volume Summary ({filter})
            </h3>
          </div>
          <span className="text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded-full">
            {filteredCustomers.length} Customers
          </span>
        </div>

        <div className="overflow-x-auto flex-1 max-h-[500px] custom-scrollbar">
          <table className="w-full">
            <thead className="sticky top-0 bg-blue-50/95 backdrop-blur z-10 border-b border-blue-100">
              <tr>
                <th className="px-5 py-3 text-left text-[10px] font-bold text-blue-900 uppercase">Customer</th>
                <th className="px-3 py-3 text-center text-[10px] font-bold text-blue-900 uppercase w-20">Type</th>
                <th className="px-5 py-3 text-right text-[10px] font-bold text-blue-900 uppercase">Total Qty (KG)</th>
                <th className="px-5 py-3 text-right text-[10px] font-bold text-blue-900 uppercase">Total Value (USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map((s, idx) => (
                <tr key={s.label} className="hover:bg-blue-50/40 transition-colors">
                  <td className="px-5 py-3 text-xs font-bold text-slate-800 truncate max-w-[220px]" title={s.label}>
                    {s.label}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                        s.type === 'DIRECT'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}
                    >
                      {s.type === 'DIRECT' ? 'Direct' : 'Local'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-right font-mono text-slate-600 font-semibold">
                    {formatNumber(s.qty)}
                  </td>
                  <td className="px-5 py-3 text-xs text-right font-mono text-blue-700 font-bold">
                    ${formatNumber(s.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="bg-blue-100/90 border-t-2 border-blue-200 px-5 py-3.5 flex items-center justify-between font-mono text-xs">
          <span className="font-extrabold text-blue-950 uppercase font-sans">Total</span>
          <div className="flex items-center space-x-6 text-right">
            <span className="font-bold text-blue-950">{formatNumber(totalCustQty)} KG</span>
            <span className="font-extrabold text-blue-950">${formatNumber(totalCustValue)}</span>
          </div>
        </div>
      </div>

      {/* 2. Date Wise Load Summary Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-blue-900 to-slate-900 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-blue-200" />
            <h3 className="text-xs font-bold uppercase tracking-widest">
              Date Wise Load Summary
            </h3>
          </div>
          <span className="text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded-full">
            {activeDateSummaries.length} Dates
          </span>
        </div>

        <div className="overflow-x-auto flex-1 max-h-[500px] custom-scrollbar">
          <table className="w-full">
            <thead className="sticky top-0 bg-blue-50/95 backdrop-blur z-10 border-b border-blue-100">
              <tr>
                <th className="px-6 py-3 text-left text-[10px] font-bold text-blue-900 uppercase">Delivery Date</th>
                <th className="px-6 py-3 text-right text-[10px] font-bold text-blue-900 uppercase">Total Qty (KG)</th>
                <th className="px-6 py-3 text-right text-[10px] font-bold text-blue-900 uppercase">Total Value (USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeDateSummaries.map((s) => (
                <tr key={s.label} className="hover:bg-blue-50/40 transition-colors">
                  <td className="px-6 py-3 text-xs font-bold text-slate-800 font-mono">
                    {s.label}
                  </td>
                  <td className="px-6 py-3 text-xs text-right font-mono text-slate-600 font-semibold">
                    {formatNumber(s.qty)}
                  </td>
                  <td className="px-6 py-3 text-xs text-right font-mono text-blue-700 font-bold">
                    ${formatNumber(s.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="bg-blue-100/90 border-t-2 border-blue-200 px-6 py-3.5 flex items-center justify-between font-mono text-xs">
          <span className="font-extrabold text-blue-950 uppercase font-sans">Total</span>
          <div className="flex items-center space-x-6 text-right">
            <span className="font-bold text-blue-950">{formatNumber(totalDateQty)} KG</span>
            <span className="font-extrabold text-blue-950">${formatNumber(totalDateValue)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
