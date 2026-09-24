'use client';

import React, { useState, useMemo } from 'react';
import { ReportData, CustomerFilter, DateSummary, TrendBuckets } from '@/lib/types';
import { UserCheck, Globe2, Building2, AlertCircle, Clock, CheckCircle2, Layers } from 'lucide-react';

interface CustomerWiseTAProps {
  report: ReportData;
  filter: CustomerFilter;
}

export function CustomerWiseTA({ report, filter }: CustomerWiseTAProps) {
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

  const monthKeyToLabel = (key: string) => {
    const [y, m] = key.split('-').map(Number);
    const d = new Date(y, m - 1, 1);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const getTodayMonthKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
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

  // Sync selected customer if filter changes and current customer isn't in filtered list
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
      bg: 'bg-amber-50/70',
      border: 'border-amber-200',
      text: 'text-amber-900',
      dot: 'bg-amber-500',
      icon: <AlertCircle className="w-4 h-4 text-amber-600" />,
    },
    {
      title: buckets.currentMonthLabel,
      sub: 'Current Month',
      totals: buckets.summary.current,
      bg: 'bg-blue-50/70',
      border: 'border-blue-200',
      text: 'text-blue-900',
      dot: 'bg-blue-600',
      icon: <Clock className="w-4 h-4 text-blue-600" />,
    },
    {
      title: 'Next Months',
      sub: 'Future Pipeline',
      totals: buckets.summary.future,
      bg: 'bg-emerald-50/70',
      border: 'border-emerald-200',
      text: 'text-emerald-900',
      dot: 'bg-emerald-500',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
    },
    {
      title: 'Total Demand',
      sub: 'Total Horizon',
      totals: grandTotal,
      bg: 'bg-slate-100/80',
      border: 'border-slate-300',
      text: 'text-slate-900',
      dot: 'bg-slate-700',
      icon: <Layers className="w-4 h-4 text-slate-700" />,
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
      <div className="rounded-xl bg-slate-50/70 border border-slate-200/80 p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">
            {title} ({metric.toUpperCase()})
          </p>
          <span className="text-[10px] font-bold text-slate-400">
            Current Month: {metric === 'value' ? `$${formatNumber(buckets.summary.current.value)}` : `${formatNumber(buckets.summary.current.qty)} KG`}
          </span>
        </div>

        <div className="flex items-end justify-between gap-1" style={{ minHeight: '190px' }}>
          {data.map((d) => {
            const h = Math.max((d[metric] / max) * 140, 4);
            const hasData = d[metric] > 0;
            return (
              <div key={d.label} className="flex flex-col items-center flex-1 min-w-0 group">
                <span className={`text-[8px] font-bold mb-1 truncate w-full text-center ${hasData ? 'text-slate-700' : 'text-slate-300'}`}>
                  {hasData ? formatNumber(d[metric]) : ''}
                </span>
                <div
                  className={`w-full max-w-[20px] mx-auto rounded-t-sm transition-all duration-300 ${
                    hasData ? colorClass : 'bg-slate-200'
                  }`}
                  style={{ height: `${h}px` }}
                  title={`${d.label}: ${formatNumber(d[metric])}`}
                ></div>
                <span className="text-[8px] font-semibold text-slate-400 mt-2 text-center leading-tight truncate w-full">
                  {dayLabel(d.label)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Customer Selection Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              Selected Customer
            </label>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className="text-sm font-extrabold text-slate-900">{selectedCustomer}</span>
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                  currentCustType === 'DIRECT'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                }`}
              >
                {currentCustType === 'DIRECT' ? 'Direct (Export)' : 'Indirect (Local)'}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full md:w-80">
          <select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
          >
            {availableCustomers.map((c) => (
              <option key={c.label} value={c.label}>
                {c.label} ({c.type})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Customer 4 Horizon Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.sub} className={`rounded-xl ${c.bg} border ${c.border} p-5`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-[10px] font-bold ${c.text} uppercase tracking-widest flex items-center gap-1.5`}>
                <span className={`w-2 h-2 rounded-full ${c.dot}`}></span>
                {c.sub}
              </span>
              {c.icon}
            </div>
            <p className="text-xs font-bold text-slate-600 mb-3">{c.title}</p>
            <div className="flex justify-between items-end pt-2 border-t border-slate-200/60">
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Volume</p>
                <p className={`text-base font-black ${c.text}`}>{formatNumber(c.totals.qty)} KG</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Value</p>
                <p className={`text-base font-black ${c.text}`}>${formatNumber(c.totals.value)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Customer Daily Load Charts */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-5 bg-blue-700 rounded-full"></div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">
              Daily Load for {selectedCustomer} ({buckets.currentMonthLabel})
            </h3>
          </div>
          <span className="text-[10px] font-bold bg-blue-50 text-blue-800 px-2.5 py-1 rounded-lg border border-blue-100">
            Total Customer Value: ${formatNumber(grandTotal.value)}
          </span>
        </div>

        <div className="space-y-6">
          {renderDailyChart(
            buckets.currentDaily,
            'qty',
            'Customer Delivery Volume',
            'bg-gradient-to-t from-blue-600 to-blue-400'
          )}
          {renderDailyChart(
            buckets.currentDaily,
            'value',
            'Customer Delivery Value',
            'bg-gradient-to-t from-blue-900 to-indigo-600'
          )}
        </div>
      </div>
    </div>
  );
}
