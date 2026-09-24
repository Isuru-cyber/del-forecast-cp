'use client';

import React, { useState, useMemo } from 'react';
import { ReportData, CustomerFilter, DateSummary, TrendBuckets } from '@/lib/types';
import {
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  Layers,
  ArrowLeft,
  Maximize2,
  TrendingUp,
  Search,
} from 'lucide-react';
import { FullscreenModal } from './FullscreenModal';

interface TrendAnalysisProps {
  report: ReportData;
  filter: CustomerFilter;
}

export function TrendAnalysis({ report, filter }: TrendAnalysisProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [drillSearch, setDrillSearch] = useState('');

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
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  // Build trend buckets
  const buckets: TrendBuckets = useMemo(() => {
    const currentMonthKey = getTodayMonthKey();
    const { dates, data, customerSummaries } = report;

    const filteredCustNames = customerSummaries
      .filter(c => filter === 'ALL' || c.type === filter)
      .map(c => c.label);

    const pastMonthMap: Record<string, { qty: number; value: number }> = {};
    const futureMonthMap: Record<string, { qty: number; value: number }> = {};
    const currentDailyMap: Record<string, { qty: number; value: number }> = {};
    const summary = {
      past: { qty: 0, value: 0 },
      current: { qty: 0, value: 0 },
      future: { qty: 0, value: 0 },
    };

    dates.forEach(dateStr => {
      let q = 0;
      let v = 0;
      filteredCustNames.forEach(cust => {
        const entry = data[cust]?.[dateStr];
        if (entry) {
          q += entry.qty;
          v += entry.value;
        }
      });

      const monthKey = dateStr.slice(0, 7);
      if (monthKey === currentMonthKey) {
        if (!currentDailyMap[dateStr]) currentDailyMap[dateStr] = { qty: 0, value: 0 };
        currentDailyMap[dateStr].qty += q;
        currentDailyMap[dateStr].value += v;
        summary.current.qty += q;
        summary.current.value += v;
      } else if (monthKey < currentMonthKey) {
        if (!pastMonthMap[monthKey]) pastMonthMap[monthKey] = { qty: 0, value: 0 };
        pastMonthMap[monthKey].qty += q;
        pastMonthMap[monthKey].value += v;
        summary.past.qty += q;
        summary.past.value += v;
      } else {
        if (!futureMonthMap[monthKey]) futureMonthMap[monthKey] = { qty: 0, value: 0 };
        futureMonthMap[monthKey].qty += q;
        futureMonthMap[monthKey].value += v;
        summary.future.qty += q;
        summary.future.value += v;
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
  }, [report, filter]);

  // Drilldown data for selected date
  const drilldownData = useMemo(() => {
    if (!selectedDate) return null;
    const { data, customerSummaries, customerTypes } = report;

    const list: { customer: string; type: string; qty: number; value: number }[] = [];
    customerSummaries.forEach(c => {
      if (filter !== 'ALL' && c.type !== filter) return;
      const entry = data[c.label]?.[selectedDate];
      if (entry && (entry.qty > 0 || entry.value > 0)) {
        list.push({
          customer: c.label,
          type: customerTypes[c.label] || c.type,
          qty: entry.qty,
          value: entry.value,
        });
      }
    });

    list.sort((a, b) => b.value - a.value);

    const totalQty = list.reduce((a, b) => a + b.qty, 0);
    const totalVal = list.reduce((a, b) => a + b.value, 0);

    return { date: selectedDate, list, totalQty, totalVal };
  }, [selectedDate, report, filter]);

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
      sub: 'Current Month Load',
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
      title: 'Overdue + Current + Future',
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
            💡 Click on any bar to drill down into delivery details
          </span>
        </div>

        <div className="flex items-end justify-between gap-1" style={{ minHeight: '190px' }}>
          {data.map((d) => {
            const h = Math.max((d[metric] / max) * 140, 4);
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
                <span
                  className={`text-[8px] font-bold mb-1 truncate w-full text-center ${
                    hasData ? 'text-slate-700 dark:text-slate-200' : 'text-slate-300 dark:text-slate-600'
                  }`}
                >
                  {hasData ? formatNumber(d[metric]) : ''}
                </span>
                <div
                  className={`w-full max-w-[20px] mx-auto rounded-t-sm transition-all duration-300 ${
                    isDaySelected
                      ? 'ring-2 ring-amber-400 ring-offset-1 bg-amber-500'
                      : hasData
                      ? colorClass
                      : 'bg-slate-200 dark:bg-navy-700'
                  }`}
                  style={{ height: `${h}px` }}
                  title={`${d.label}: ${formatNumber(d[metric])} (Click to drill down)`}
                ></div>
                <span
                  className={`text-[8px] font-semibold mt-1.5 text-center leading-tight truncate w-full ${
                    isDaySelected
                      ? 'text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {dayLabel(d.label)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDrilldownView = () => {
    if (!drilldownData) return null;

    const filteredList = drilldownData.list.filter(item =>
      item.customer.toLowerCase().includes(drillSearch.toLowerCase())
    );

    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        {/* Drilldown Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-blue-50/70 dark:bg-navy-800 p-4 rounded-xl border border-blue-200/80 dark:border-navy-700">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSelectedDate(null)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-white dark:bg-navy-700 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold border border-blue-200 dark:border-navy-600 hover:bg-blue-100 transition-all shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Full Month</span>
            </button>
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Delivery Breakdown: {formatFullDate(drilldownData.date)}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Showing all shipments scheduled for this date ({filter} Customers)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 self-end sm:self-auto">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Day Total</span>
              <span className="text-xs font-mono font-bold text-blue-700 dark:text-blue-400">
                ${formatNumber(drilldownData.totalVal)} &middot; {formatNumber(drilldownData.totalQty)} KG
              </span>
            </div>
          </div>
        </div>

        {/* Drilldown Search and Table */}
        <div className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 overflow-hidden shadow-sm">
          <div className="p-3 border-b border-slate-100 dark:border-navy-700 flex items-center justify-between">
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search customers on this date..."
                value={drillSearch}
                onChange={(e) => setDrillSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              {filteredList.length} Customer Accounts
            </span>
          </div>

          <div className="overflow-x-auto max-h-[420px] custom-scrollbar">
            <table className="w-full">
              <thead className="sticky top-0 bg-slate-50 dark:bg-navy-900 border-b border-slate-200 dark:border-navy-700 z-10">
                <tr>
                  <th className="px-5 py-2.5 text-left text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase">Customer Name</th>
                  <th className="px-3 py-2.5 text-center text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase w-28">Category</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase">Day Qty (KG)</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase">Day Value (USD)</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase w-24">Day Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-700">
                {filteredList.map((item) => {
                  const share = drilldownData.totalVal > 0 ? ((item.value / drilldownData.totalVal) * 100).toFixed(1) : '0';
                  return (
                    <tr key={item.customer} className="hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-colors">
                      <td className="px-5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {item.customer}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                            item.type === 'DIRECT'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                          }`}
                        >
                          {item.type === 'DIRECT' ? 'Direct' : 'Local'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-right font-mono text-slate-600 dark:text-slate-300 font-semibold">
                        {formatNumber(item.qty)}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-right font-mono text-blue-700 dark:text-blue-400 font-bold">
                        ${formatNumber(item.value)}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-navy-900 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                          {share}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-100/90 dark:bg-navy-900 border-t-2 border-slate-200 dark:border-navy-700 font-mono text-xs">
                <tr>
                  <td colSpan={2} className="px-5 py-3 font-bold text-slate-900 dark:text-white uppercase font-sans">
                    Date Total ({formatFullDate(drilldownData.date)})
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">
                    {formatNumber(drilldownData.totalQty)} KG
                  </td>
                  <td className="px-4 py-3 text-right font-extrabold text-blue-900 dark:text-blue-300">
                    ${formatNumber(drilldownData.totalVal)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-600 dark:text-slate-400">
                    100%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => (
    <div className="space-y-4">
      {/* 4 Horizon KPI Cards */}
      <div className="bg-white dark:bg-navy-800 rounded-xl shadow-sm border border-slate-200 dark:border-navy-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-blue-800 dark:bg-blue-500 rounded-full"></div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">
              Overdue / Current / Future Load Summary ({filter} Customers)
            </h3>
          </div>
          <button
            onClick={() => setIsFullscreen(true)}
            className="flex items-center space-x-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-navy-700 dark:hover:bg-navy-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-all"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Full Screen</span>
          </button>
        </div>

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
      </div>

      {/* Main View: Either Drilldown or Full Month Daily Charts */}
      {selectedDate ? (
        renderDrilldownView()
      ) : (
        <div className="bg-white dark:bg-navy-800 rounded-xl shadow-sm border border-slate-200 dark:border-navy-700 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-blue-700 dark:bg-blue-400 rounded-full"></div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                Current Month Daily Velocity ({buckets.currentMonthLabel})
              </h3>
            </div>
            <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-900">
              Interactive Drill-Down Active
            </span>
          </div>

          <div className="space-y-4">
            {renderDailyChart(
              buckets.currentDaily,
              'qty',
              'Daily Delivery Volume (KG)',
              'bg-gradient-to-t from-blue-600 to-blue-400'
            )}
            {renderDailyChart(
              buckets.currentDaily,
              'value',
              'Daily Delivery Value (USD)',
              'bg-gradient-to-t from-blue-900 to-indigo-600'
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {renderContent()}

      <FullscreenModal
        isOpen={isFullscreen}
        onClose={() => setIsFullscreen(false)}
        title={`Trend Analysis & Daily Load (${filter} Customers)`}
      >
        {renderContent()}
      </FullscreenModal>
    </>
  );
}
