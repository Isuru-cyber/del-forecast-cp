'use client';

import React, { useState } from 'react';
import { ReportData, CustomerFilter } from '@/lib/types';
import { Target, Calendar, TrendingUp, Maximize2, Minimize2 } from 'lucide-react';
import { FullscreenModal } from './FullscreenModal';

interface SummaryAnalysisProps {
  report: ReportData;
  filter: CustomerFilter;
}

export function SummaryAnalysis({ report, filter }: SummaryAnalysisProps) {
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
      <div className="bg-white dark:bg-navy-800 rounded-xl shadow-sm border border-slate-200 dark:border-navy-700 p-4 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center">
            {icon}
            <span className="ml-1.5">{title} ({metric.toUpperCase()})</span>
          </h3>
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase bg-slate-100 dark:bg-navy-700 px-2 py-0.5 rounded-full border border-slate-200 dark:border-navy-600">
            Total: {metric === 'value' ? `$${formatNumber(total)}` : `${formatNumber(total)} KG`}
          </span>
        </div>

        <div className="flex-1 flex flex-col space-y-2.5 overflow-y-auto max-h-[380px] pr-1.5 custom-scrollbar">
          {items.map((item) => {
            const width = (item[metric] / max) * 100;
            const share = total > 0 ? ((item[metric] / total) * 100).toFixed(1) : '0.0';
            return (
              <div key={item.label} className="group">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate max-w-[200px]" title={item.label}>
                    {item.label}
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[9px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-1.5 py-0.2 rounded border border-blue-100 dark:border-blue-900">
                      {share}%
                    </span>
                    <span className="text-[11px] font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {metric === 'value' ? `$${formatNumber(item[metric])}` : formatNumber(item[metric])}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-navy-900 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${colorClass} transition-all duration-300`}
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

  const renderContent = (isFs: boolean = false) => (
    <div className="space-y-6">
      {/* Customer Distribution Share */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <div className="w-1 h-4 bg-blue-700 dark:bg-blue-500 rounded-full"></div>
            <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">
              Customer Demand Share ({filter} Customers)
            </h2>
          </div>
          {isFs ? (
            <button
              onClick={() => setIsFullscreen(false)}
              className="flex items-center space-x-1.5 px-3 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Exit Full Screen</span>
            </button>
          ) : (
            <button
              onClick={() => setIsFullscreen(true)}
              className="flex items-center space-x-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-navy-700 dark:hover:bg-navy-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-all"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Full Screen</span>
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {renderShareChart(
            filteredCustomers,
            'qty',
            'Customer Volume Share',
            'bg-gradient-to-r from-blue-500 to-indigo-600',
            <Target className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          )}
          {renderShareChart(
            filteredCustomers,
            'value',
            'Customer Value Share',
            'bg-gradient-to-r from-blue-700 to-blue-950 dark:from-blue-600 dark:to-indigo-500',
            <TrendingUp className="w-3.5 h-3.5 text-blue-800 dark:text-blue-400" />
          )}
        </div>
      </div>

      {/* Date Wise Velocity Share */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2 px-1">
          <div className="w-1 h-4 bg-blue-900 dark:bg-indigo-500 rounded-full"></div>
          <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">
            Date Wise Velocity % Share
          </h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {renderShareChart(
            activeDateSummaries,
            'qty',
            'Daily Delivery Volume',
            'bg-gradient-to-r from-sky-400 to-sky-600',
            <Calendar className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          )}
          {renderShareChart(
            activeDateSummaries,
            'value',
            'Daily Delivery Value',
            'bg-gradient-to-r from-indigo-500 to-indigo-800',
            <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {renderContent(false)}

      <FullscreenModal
        isOpen={isFullscreen}
        onClose={() => setIsFullscreen(false)}
        title={`Summary Analysis Share Visualizer (${filter} Customers)`}
        noPadding={false}
      >
        <div className="p-4">
          {renderContent(true)}
        </div>
      </FullscreenModal>
    </>
  );
}
