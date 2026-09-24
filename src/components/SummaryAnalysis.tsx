'use client';

import React from 'react';
import { ReportData, CustomerFilter } from '@/lib/types';
import { Target, Calendar, TrendingUp } from 'lucide-react';

interface SummaryAnalysisProps {
  report: ReportData;
  filter: CustomerFilter;
}

export function SummaryAnalysis({ report, filter }: SummaryAnalysisProps) {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const { customerSummaries, dateSummaries, dates, data } = report;

  // Filtered customer summaries
  const filteredCustomers = customerSummaries.filter(c => {
    return filter === 'ALL' || c.type === filter;
  });

  // Filtered date summaries (recalculated from visible customers)
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

  const renderShareChart = (
    items: { label: string; qty: number; value: number }[],
    metric: 'qty' | 'value',
    title: string,
    colorClass: string,
    icon: React.ReactNode
  ) => {
    const total = items.reduce((acc, curr) => acc + curr[metric], 0);
    const max = Math.max(...items.map(d => d[metric]), 1);

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center">
            {icon}
            <span className="ml-2">{title} ({metric.toUpperCase()})</span>
          </h3>
          <span className="text-[11px] font-bold text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
            Total: {metric === 'value' ? `$${formatNumber(total)}` : `${formatNumber(total)} KG`}
          </span>
        </div>

        <div className="flex-1 flex flex-col space-y-3.5 overflow-y-auto max-h-[380px] pr-2 custom-scrollbar">
          {items.map((item) => {
            const width = (item[metric] / max) * 100;
            const share = total > 0 ? ((item[metric] / total) * 100).toFixed(1) : '0.0';
            return (
              <div key={item.label} className="group">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] font-semibold text-slate-700 truncate max-w-[200px]" title={item.label}>
                    {item.label}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">
                      {share}%
                    </span>
                    <span className="text-[11px] font-mono font-bold text-slate-800">
                      {metric === 'value' ? `$${formatNumber(item[metric])}` : formatNumber(item[metric])}
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${colorClass} transition-all duration-500`}
                    style={{ width: `${Math.max(width, 1)}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 gap-8">
      {/* Customer Distribution Share */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 px-1">
          <div className="w-1.5 h-5 bg-blue-700 rounded-full"></div>
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-widest">
            Customer Distribution % Share ({filter} Customers)
          </h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderShareChart(
            filteredCustomers,
            'qty',
            'Customer Demand Share',
            'bg-gradient-to-r from-blue-500 to-indigo-600',
            <Target className="w-4 h-4 text-blue-600" />
          )}
          {renderShareChart(
            filteredCustomers,
            'value',
            'Customer Value Contribution',
            'bg-gradient-to-r from-blue-700 to-blue-950',
            <TrendingUp className="w-4 h-4 text-blue-900" />
          )}
        </div>
      </div>

      {/* Date Wise Velocity Share */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 px-1">
          <div className="w-1.5 h-5 bg-blue-900 rounded-full"></div>
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-widest">
            Date Wise Velocity % Share
          </h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderShareChart(
            activeDateSummaries,
            'qty',
            'Daily Forecasted Volume',
            'bg-gradient-to-r from-sky-400 to-sky-600',
            <Calendar className="w-4 h-4 text-sky-600" />
          )}
          {renderShareChart(
            activeDateSummaries,
            'value',
            'Daily Forecasted Value',
            'bg-gradient-to-r from-indigo-500 to-indigo-800',
            <Calendar className="w-4 h-4 text-indigo-700" />
          )}
        </div>
      </div>
    </div>
  );
}
