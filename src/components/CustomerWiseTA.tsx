'use client';

import React, { useState, useMemo } from 'react';
import { ReportData, CustomerFilter, DateSummary, TrendBuckets, getActiveForecastMonthKey } from '@/lib/types';
import { UserCheck, AlertCircle, Clock, CheckCircle2, Layers, Maximize2, Minimize2, ArrowLeft } from 'lucide-react';
import { FullscreenModal } from './FullscreenModal';

interface CustomerWiseTAProps {
  report: ReportData;
  filter: CustomerFilter;
}

export function CustomerWiseTA({ report, filter }: CustomerWiseTAProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const dayLabel = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
  };

  const formatFullDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const monthKeyToLabel = (key: string) => {
    const [y, m] = key.split('-').map(Number);
    const d = new Date(y, m - 1, 1);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const getTodayMonthKey = () => {
    return getActiveForecastMonthKey(report.dates);
  };

  // Filter customers by Direct / Indirect
  const availableCustomers = useMemo(() => {
    return report.customerSummaries.filter(c => {
      return filter === 'ALL' || c.type === filter;
    });
  }, [report.customerSummaries, filter]);

  const [selectedCustomer, setSelectedCustomer] = useState<string>(
    availableCustomers[0]?.label || report.customers[0] || ''
  );

  React.useEffect(() => {
    if (availableCustomers.length > 0 && !availableCustomers.some(c => c.label === selectedCustomer)) {
      setSelectedCustomer(availableCustomers[0].label);
    }
  }, [availableCustomers, selectedCustomer]);

  const currentCustSummary = report.customerSummaries.find(c => c.label === selectedCustomer);
  const currentCustType = currentCustSummary?.type || report.customerTypes[selectedCustomer] || 'DIRECT';

  // Build trend buckets for selected customer
  const buckets: TrendBuckets = useMemo(() => {
    const currentMonthKey = getTodayMonthKey();
    const custData = report.data[selectedCustomer] || {};

    const pastMonthMap: Record<string, { qty: number; value: number }> = {};
    const futureMonthMap: Record<string, { qty: number; value: number }> = {};
    const currentDailyMap: Record<string, { qty: number; value: number }> = {};
    const summary = {
      past: { qty: 0, value: 0 },
      current: { qty: 0, value: 0 },
      future: { qty: 0, value: 0 },
    };

    Object.keys(custData).forEach(dateStr => {
      const entry = custData[dateStr];
      if (!entry) return;
      const { qty, value } = entry;

      const monthKey = dateStr.slice(0, 7);
      if (monthKey === currentMonthKey) {
        if (!currentDailyMap[dateStr]) currentDailyMap[dateStr] = { qty: 0, value: 0 };
        currentDailyMap[dateStr].qty += qty;
        currentDailyMap[dateStr].value += value;
        summary.current.qty += qty;
        summary.current.value += value;
      } else if (monthKey < currentMonthKey) {
        if (!pastMonthMap[monthKey]) pastMonthMap[monthKey] = { qty: 0, value: 0 };
        pastMonthMap[monthKey].qty += qty;
        pastMonthMap[monthKey].value += value;
        summary.past.qty += qty;
        summary.past.value += value;
      } else {
        if (!futureMonthMap[monthKey]) futureMonthMap[monthKey] = { qty: 0, value: 0 };
        futureMonthMap[monthKey].qty += qty;
        futureMonthMap[monthKey].value += value;
        summary.future.qty += qty;
        summary.future.value += value;
      }
    });

    const [cy, cm] = currentMonthKey.split('-').map(Number);
    const daysInMonth = new Date(cy, cm, 0).getDate();
    const fullCurrentDaily: DateSummary[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentMonthKey}-${String(d).padStart(2, '0')}`;
      const entry = currentDailyMap[dateStr];
      fullCurrentDaily.push({
        label: dateStr,
        qty: entry ? entry.qty : 0,
        value: entry ? entry.value : 0,
      });
    }

    return {
      currentDaily: fullCurrentDaily,
      pastMonths: [],
      futureMonths: [],
      summary,
      currentMonthLabel: monthKeyToLabel(currentMonthKey),
    };
  }, [report.data, selectedCustomer]);

  const grandTotal = {
    qty: buckets.summary.past.qty + buckets.summary.current.qty + buckets.summary.future.qty,
    value: buckets.summary.past.value + buckets.summary.current.value + buckets.summary.future.value,
  };

  const cards = [
    {
      title: 'Previous Months',
      sub: 'Overdue Backlog',
      totals: buckets.summary.past,
      bg: 'bg-amber-50/70 dark:bg-amber-950/40',
      border: 'border-amber-200 dark:border-amber-800/50',
      text: 'text-amber-900 dark:text-amber-300',
      dot: 'bg-amber-500',
      icon: <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
    },
    {
      title: buckets.currentMonthLabel,
      sub: 'Current Month',
      totals: buckets.summary.current,
      bg: 'bg-blue-50/70 dark:bg-blue-950/40',
      border: 'border-blue-200 dark:border-blue-800/50',
      text: 'text-blue-900 dark:text-blue-300',
      dot: 'bg-blue-600',
      icon: <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
    },
    {
      title: 'Next Months',
      sub: 'Future Pipeline',
      totals: buckets.summary.future,
      bg: 'bg-emerald-50/70 dark:bg-emerald-950/40',
      border: 'border-emerald-200 dark:border-emerald-800/50',
      text: 'text-emerald-900 dark:text-emerald-300',
      dot: 'bg-emerald-500',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
    },
    {
      title: 'Total Demand',
      sub: 'Total Horizon',
      totals: grandTotal,
      bg: 'bg-slate-100/80 dark:bg-navy-800',
      border: 'border-slate-300 dark:border-navy-700',
      text: 'text-slate-900 dark:text-white',
      dot: 'bg-slate-700 dark:bg-slate-400',
      icon: <Layers className="w-4 h-4 text-slate-700 dark:text-slate-300" />,
    },
  ];

  const renderDailyChart = (
    data: DateSummary[],
    metric: 'qty' | 'value',
    title: string,
    colorClass: string
  ) => {
    const max = Math.max(...data.map(d => d[metric]), 1);

    return (
      <div className="rounded-xl bg-slate-50/70 dark:bg-navy-900/60 border border-slate-200/80 dark:border-navy-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
            {title} ({metric.toUpperCase()})
          </p>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            💡 Click on any bar to inspect date
          </span>
        </div>

        <div className="flex items-end justify-between gap-1" style={{ minHeight: '180px' }}>
          {data.map((d) => {
            const h = Math.max((d[metric] / max) * 135, 4);
            const hasData = d[metric] > 0;
            const isDaySelected = selectedDate === d.label;

            return (
              <div
                key={d.label}
                onClick={() => {
                  if (hasData) setSelectedDate(d.label);
                }}
                className={`flex flex-col items-center flex-1 min-w-0 group cursor-pointer transition-all ${
                  hasData ? 'hover:scale-105' : 'cursor-default opacity-40'
                }`}
              >
                <span className={`text-[8px] font-bold mb-1 truncate w-full text-center ${
                  hasData ? 'text-slate-700 dark:text-slate-200' : 'text-slate-300 dark:text-slate-600'
                }`}>
                  {hasData ? formatNumber(d[metric]) : ''}
                </span>
                <div
                  className={`w-full max-w-[20px] mx-auto rounded-t-sm transition-all duration-300 ${
                    isDaySelected
                      ? 'ring-2 ring-amber-400 bg-amber-500'
                      : hasData
                      ? colorClass
                      : 'bg-slate-200 dark:bg-navy-700'
                  }`}
                  style={{ height: `${h}px` }}
                  title={`${d.label}: ${formatNumber(d[metric])}`}
                ></div>
                <span className={`text-[8px] font-semibold mt-1.5 text-center leading-tight truncate w-full ${
                  isDaySelected ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-400 dark:text-slate-500'
                }`}>
                  {dayLabel(d.label)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderContent = (isFs: boolean = false) => (
    <div className="space-y-4">
      {/* Customer Selection Bar */}
      <div className="bg-white dark:bg-navy-800 rounded-xl shadow-sm border border-slate-200 dark:border-navy-700 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-blue-50 dark:bg-navy-700 text-blue-700 dark:text-blue-400 rounded-lg">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block">
              Active Account
            </label>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className="text-sm font-bold text-slate-900 dark:text-white">{selectedCustomer}</span>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider ${
                  currentCustType === 'DIRECT'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                }`}
              >
                {currentCustType === 'DIRECT' ? 'Direct (Export)' : 'Indirect (Local)'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            className="w-full md:w-80 bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            {availableCustomers.map((c) => (
              <option key={c.label} value={c.label}>
                {c.label} ({c.type})
              </option>
            ))}
          </select>
          {isFs ? (
            <button
              onClick={() => setIsFullscreen(false)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
              title="Exit Full Screen View"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Exit Full Screen</span>
            </button>
          ) : (
            <button
              onClick={() => setIsFullscreen(true)}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-navy-700 dark:hover:bg-navy-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-all"
              title="Full Screen View"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Full Screen</span>
            </button>
          )}
        </div>
      </div>

      {/* Selected Customer Horizon Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div key={c.sub} className={`rounded-xl ${c.bg} border ${c.border} p-3.5`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] font-bold ${c.text} uppercase tracking-widest flex items-center gap-1`}>
                <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`}></span>
                {c.sub}
              </span>
              {c.icon}
            </div>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">{c.title}</p>
            <div className="flex justify-between items-end pt-1.5 border-t border-slate-200/50 dark:border-navy-700">
              <div>
                <p className="text-[9px] text-slate-400 uppercase font-semibold">Volume</p>
                <p className={`text-sm font-bold ${c.text}`}>{formatNumber(c.totals.qty)} KG</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-slate-400 uppercase font-semibold">Value</p>
                <p className={`text-sm font-bold ${c.text}`}>${formatNumber(c.totals.value)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Customer Daily Load Charts / Detail */}
      <div className="bg-white dark:bg-navy-800 rounded-xl shadow-sm border border-slate-200 dark:border-navy-700 p-4 space-y-4">
        {selectedDate && (
          <div className="p-3 bg-blue-50 dark:bg-navy-900 rounded-lg border border-blue-200 dark:border-navy-700 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Detailed Delivery on {formatFullDate(selectedDate)}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                Volume: {formatNumber(report.data[selectedCustomer]?.[selectedDate]?.qty || 0)} KG &middot; Value: ${formatNumber(report.data[selectedCustomer]?.[selectedDate]?.value || 0)}
              </p>
            </div>
            <button
              onClick={() => setSelectedDate(null)}
              className="text-xs text-blue-700 dark:text-blue-400 font-bold hover:underline"
            >
              Clear Selection
            </button>
          </div>
        )}

        <div className="space-y-4">
          {renderDailyChart(
            buckets.currentDaily,
            'qty',
            `${selectedCustomer} - Volume`,
            'bg-gradient-to-t from-blue-600 to-blue-400'
          )}
          {renderDailyChart(
            buckets.currentDaily,
            'value',
            `${selectedCustomer} - Value`,
            'bg-gradient-to-t from-blue-900 to-indigo-600'
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
        title={`Customer Analysis: ${selectedCustomer}`}
        noPadding={false}
      >
        <div className="p-4">
          {renderContent(true)}
        </div>
      </FullscreenModal>
    </>
  );
}
