'use client';

import React, { useState, useMemo } from 'react';
import { ReportData, CustomerFilter } from '@/lib/types';
import { Search, Download, Maximize2 } from 'lucide-react';
import { exportForecastToExcel } from '@/lib/excel-exporter';
import { FullscreenModal } from './FullscreenModal';

interface PivotMatrixProps {
  report: ReportData;
  filter: CustomerFilter;
}

export function PivotMatrix({ report, filter }: PivotMatrixProps) {
  const [search, setSearch] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const { dates, data, customerSummaries } = report;

  // Filter customers by Direct/Indirect and search query
  const filteredCustomers = useMemo(() => {
    return customerSummaries.filter(c => {
      const matchesFilter = filter === 'ALL' || c.type === filter;
      const matchesSearch = c.label.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [customerSummaries, filter, search]);

  const custNames = useMemo(() => filteredCustomers.map(c => c.label), [filteredCustomers]);

  // Dynamic date totals based on visible filtered customers
  const dateTotals = useMemo(() => {
    const totals: Record<string, { qty: number; value: number }> = {};
    dates.forEach(d => {
      totals[d] = { qty: 0, value: 0 };
      custNames.forEach(c => {
        const entry = data[c]?.[d];
        if (entry) {
          totals[d].qty += entry.qty;
          totals[d].value += entry.value;
        }
      });
    });
    return totals;
  }, [dates, data, custNames]);

  const totalFilteredQty = useMemo(() => filteredCustomers.reduce((acc, c) => acc + c.qty, 0), [filteredCustomers]);
  const totalFilteredValue = useMemo(() => filteredCustomers.reduce((acc, c) => acc + c.value, 0), [filteredCustomers]);

  // Strict pixel dimensions for 100% gapless and line-aligned sticky cells
  const CUST_COL_WIDTH = 280; // px - wide customer column
  const TOTAL_VAL_WIDTH = 130; // px
  const TOTAL_QTY_WIDTH = 110; // px
  const TOTAL_QTY_RIGHT = TOTAL_VAL_WIDTH; // 130px offset from right
  const TOTAL_COMBINED_WIDTH = TOTAL_QTY_WIDTH + TOTAL_VAL_WIDTH; // 240px

  const renderTableContent = (isFs: boolean = false) => (
    <div
      className={`pivot-container custom-scrollbar ${
        isFs ? 'h-[calc(100vh-45px)] max-h-none' : 'max-h-[72vh]'
      }`}
    >
      <table className="w-full border-separate border-spacing-0">
        <thead className="bg-blue-900 dark:bg-[#0c1c33]">
          {/* Row 1: Header Titles (Exact 34px height) */}
          <tr style={{ height: '34px' }} className="h-[34px] bg-blue-900 dark:bg-[#0c1c33]">
            {/* Corner Cell: Customer Name (Spans 2 rows, locked at top:0, left:0) */}
            <th
              rowSpan={2}
              style={{
                top: 0,
                left: 0,
                zIndex: 50,
                width: `${CUST_COL_WIDTH}px`,
                minWidth: `${CUST_COL_WIDTH}px`,
                maxWidth: `${CUST_COL_WIDTH}px`,
              }}
              className="sticky bg-blue-900 dark:bg-[#0c1c33] border-b border-r-2 border-slate-300 dark:border-navy-600 px-3 text-left align-middle font-bold text-white text-[11px] tracking-wide uppercase shadow-[3px_0_6px_-2px_rgba(0,0,0,0.2)]"
            >
              Customer Name
            </th>

            {/* Date Headers (Top row: top: 0, solid background to eliminate white gap) */}
            {dates.map((d) => (
              <th
                key={d}
                colSpan={2}
                style={{ top: 0, zIndex: 40 }}
                className="sticky bg-blue-800 dark:bg-[#172e4f] border-b border-r border-blue-700/60 dark:border-navy-600 px-2.5 text-center align-middle font-semibold text-white text-[11px] tracking-wide uppercase whitespace-nowrap"
              >
                {d}
              </th>
            ))}

            {/* Total ({filter}) Header - Top row (Locked at top: 0, right: 0) */}
            <th
              colSpan={2}
              style={{
                top: 0,
                right: 0,
                zIndex: 45,
                width: `${TOTAL_COMBINED_WIDTH}px`,
                minWidth: `${TOTAL_COMBINED_WIDTH}px`,
                maxWidth: `${TOTAL_COMBINED_WIDTH}px`,
              }}
              className="sticky bg-blue-950 dark:bg-[#0a172a] border-b border-l-2 border-slate-300 dark:border-navy-600 px-2 text-center align-middle font-bold text-white text-[11px] tracking-wide uppercase whitespace-nowrap shadow-[-3px_0_6px_-2px_rgba(0,0,0,0.2)]"
            >
              Total ({filter})
            </th>
          </tr>

          {/* Row 2: Sub-headers Qty & Value (Exact 28px height, locked precisely at top: 34px) */}
          <tr style={{ height: '28px' }} className="h-[28px] bg-blue-800 dark:bg-[#172e4f]">
            {dates.map((d) => (
              <React.Fragment key={`${d}-sub`}>
                <th
                  style={{ top: '34px', zIndex: 40 }}
                  className="sticky bg-blue-800 dark:bg-[#172e4f] border-b border-r border-blue-700/50 dark:border-navy-600 text-center align-middle font-medium text-blue-100 dark:text-blue-200 text-[10px] uppercase w-[85px] min-w-[85px]"
                >
                  Qty
                </th>
                <th
                  style={{ top: '34px', zIndex: 40 }}
                  className="sticky bg-blue-800 dark:bg-[#172e4f] border-b border-r border-blue-700/50 dark:border-navy-600 text-center align-middle font-medium text-blue-100 dark:text-blue-200 text-[10px] uppercase w-[95px] min-w-[95px]"
                >
                  Value
                </th>
              </React.Fragment>
            ))}

            {/* Sticky Total Sub-headers with EXACT matching pixel coordinates */}
            <th
              style={{
                top: '34px',
                right: `${TOTAL_QTY_RIGHT}px`,
                width: `${TOTAL_QTY_WIDTH}px`,
                minWidth: `${TOTAL_QTY_WIDTH}px`,
                maxWidth: `${TOTAL_QTY_WIDTH}px`,
                zIndex: 45,
              }}
              className="sticky bg-blue-950 dark:bg-[#0a172a] border-b border-l-2 border-slate-300 dark:border-navy-600 text-center align-middle font-semibold text-blue-100 text-[10px] uppercase shadow-[-3px_0_6px_-2px_rgba(0,0,0,0.15)]"
            >
              Qty
            </th>
            <th
              style={{
                top: '34px',
                right: 0,
                width: `${TOTAL_VAL_WIDTH}px`,
                minWidth: `${TOTAL_VAL_WIDTH}px`,
                maxWidth: `${TOTAL_VAL_WIDTH}px`,
                zIndex: 45,
              }}
              className="sticky bg-blue-950 dark:bg-[#0a172a] border-b border-r border-slate-300 dark:border-navy-600 text-center align-middle font-semibold text-blue-100 text-[10px] uppercase"
            >
              Value
            </th>
          </tr>
        </thead>

        <tbody>
          {filteredCustomers.map((cust, idx) => {
            const solidRowBg = idx % 2 === 0
              ? 'bg-white dark:bg-[#132238]'
              : 'bg-[#f8fafc] dark:bg-[#101c2e]';

            return (
              <tr key={cust.label} className="group hover:bg-blue-50/60 dark:hover:bg-blue-950/40 transition-colors">
                {/* Customer Column: Wide width (280px) and clean smaller font size (11px) */}
                <td
                  style={{
                    left: 0,
                    width: `${CUST_COL_WIDTH}px`,
                    minWidth: `${CUST_COL_WIDTH}px`,
                    maxWidth: `${CUST_COL_WIDTH}px`,
                    zIndex: 25,
                  }}
                  className={`sticky ${solidRowBg} border-b border-r-2 border-slate-300 dark:border-navy-600 px-3 py-1.5 font-medium text-slate-800 dark:text-slate-100 text-[11px] whitespace-nowrap shadow-[3px_0_6px_-2px_rgba(0,0,0,0.12)]`}
                >
                  <div className="flex items-center space-x-1.5">
                    <span
                      className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider shrink-0 ${
                        cust.type === 'DIRECT'
                          ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                          : 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700'
                      }`}
                    >
                      {cust.type === 'DIRECT' ? 'Direct' : 'Local'}
                    </span>
                    <span className="truncate max-w-[210px] font-medium" title={cust.label}>
                      {cust.label}
                    </span>
                  </div>
                </td>

                {/* Date Qty & Value */}
                {dates.map((date) => {
                  const entry = data[cust.label]?.[date];
                  return (
                    <React.Fragment key={`${cust.label}-${date}`}>
                      <td className="border-b border-r border-slate-100 dark:border-navy-700/60 px-2 py-1.5 text-right font-mono text-[11px] text-slate-600 dark:text-slate-300">
                        {entry && entry.qty > 0 ? formatNumber(entry.qty) : '-'}
                      </td>
                      <td className="border-b border-r border-slate-100 dark:border-navy-700/60 px-2 py-1.5 text-right font-mono text-[11px] text-blue-700 dark:text-blue-400 font-semibold">
                        {entry && entry.value > 0 ? `$${formatNumber(entry.value)}` : '-'}
                      </td>
                    </React.Fragment>
                  );
                })}

                {/* Total Column Qty - Pixel-perfect matching alignment */}
                <td
                  style={{
                    right: `${TOTAL_QTY_RIGHT}px`,
                    width: `${TOTAL_QTY_WIDTH}px`,
                    minWidth: `${TOTAL_QTY_WIDTH}px`,
                    maxWidth: `${TOTAL_QTY_WIDTH}px`,
                    zIndex: 20,
                  }}
                  className="sticky bg-[#f0f5ff] dark:bg-[#152742] border-b border-l-2 border-slate-300 dark:border-navy-600 px-2 py-1.5 text-right font-mono text-[11px] text-slate-800 dark:text-slate-200 font-semibold shadow-[-3px_0_6px_-2px_rgba(0,0,0,0.12)]"
                >
                  {formatNumber(cust.qty)}
                </td>

                {/* Total Column Value - Pixel-perfect matching alignment */}
                <td
                  style={{
                    right: 0,
                    width: `${TOTAL_VAL_WIDTH}px`,
                    minWidth: `${TOTAL_VAL_WIDTH}px`,
                    maxWidth: `${TOTAL_VAL_WIDTH}px`,
                    zIndex: 20,
                  }}
                  className="sticky bg-[#f0f5ff] dark:bg-[#152742] border-b border-r border-slate-300 dark:border-navy-600 px-2 py-1.5 text-right font-mono text-[11px] text-blue-900 dark:text-blue-300 font-bold"
                >
                  ${formatNumber(cust.value)}
                </td>
              </tr>
            );
          })}
        </tbody>

        <tfoot>
          <tr className="h-9">
            <td
              style={{
                bottom: 0,
                left: 0,
                zIndex: 48,
                width: `${CUST_COL_WIDTH}px`,
                minWidth: `${CUST_COL_WIDTH}px`,
                maxWidth: `${CUST_COL_WIDTH}px`,
              }}
              className="sticky bg-blue-100 dark:bg-[#1a3356] border-t-2 border-r-2 border-slate-300 dark:border-navy-600 px-3 font-bold text-blue-950 dark:text-white text-[11px] uppercase tracking-wide shadow-[3px_0_6px_-2px_rgba(0,0,0,0.2)]"
            >
              TOTAL ({filter})
            </td>
            {dates.map((date) => {
              const t = dateTotals[date];
              return (
                <React.Fragment key={`${date}-total`}>
                  <td
                    style={{ bottom: 0, zIndex: 25 }}
                    className="sticky bg-blue-100 dark:bg-[#1a3356] border-t-2 border-r border-blue-200 dark:border-navy-600 px-2 text-right font-mono text-[11px] text-blue-900 dark:text-blue-200 font-bold"
                  >
                    {formatNumber(t?.qty || 0)}
                  </td>
                  <td
                    style={{ bottom: 0, zIndex: 25 }}
                    className="sticky bg-blue-100 dark:bg-[#1a3356] border-t-2 border-r border-blue-200 dark:border-navy-600 px-2 text-right font-mono text-[11px] text-blue-950 dark:text-white font-extrabold"
                  >
                    ${formatNumber(t?.value || 0)}
                  </td>
                </React.Fragment>
              );
            })}
            <td
              style={{
                bottom: 0,
                right: `${TOTAL_QTY_RIGHT}px`,
                width: `${TOTAL_QTY_WIDTH}px`,
                minWidth: `${TOTAL_QTY_WIDTH}px`,
                maxWidth: `${TOTAL_QTY_WIDTH}px`,
                zIndex: 47,
              }}
              className="sticky bg-blue-200 dark:bg-[#203e68] border-t-2 border-l-2 border-slate-300 dark:border-navy-600 px-2 text-right font-mono text-[11px] text-blue-950 dark:text-white font-extrabold shadow-[-3px_0_6px_-2px_rgba(0,0,0,0.2)]"
            >
              {formatNumber(totalFilteredQty)}
            </td>
            <td
              style={{
                bottom: 0,
                right: 0,
                width: `${TOTAL_VAL_WIDTH}px`,
                minWidth: `${TOTAL_VAL_WIDTH}px`,
                maxWidth: `${TOTAL_VAL_WIDTH}px`,
                zIndex: 47,
              }}
              className="sticky bg-blue-200 dark:bg-[#203e68] border-t-2 border-r border-slate-300 dark:border-navy-600 px-2 text-right font-mono text-[11px] text-blue-950 dark:text-white font-extrabold"
            >
              ${formatNumber(totalFilteredValue)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );

  return (
    <div className="space-y-2.5">
      {/* Search and Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-white dark:bg-navy-800 p-2.5 rounded-xl border border-slate-200 dark:border-navy-700 shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1 bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span className="text-blue-700 dark:text-blue-400 font-bold">{filteredCustomers.length}</span> of {customerSummaries.length} accounts
          </span>

          <button
            onClick={() => exportForecastToExcel(report, filter)}
            className="flex items-center space-x-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-navy-700 dark:hover:bg-navy-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>

          <button
            onClick={() => setIsFullscreen(true)}
            title="Full Screen Presentation View"
            className="flex items-center space-x-1 px-3 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Full Screen</span>
          </button>
        </div>
      </div>

      {/* Main Table Wrapper */}
      <div className="bg-white dark:bg-navy-800 rounded-xl shadow-sm border border-slate-200 dark:border-navy-700 overflow-hidden">
        {renderTableContent(false)}
      </div>

      {/* Fullscreen Modal View (100% Flush, Zero Outer Margins) */}
      <FullscreenModal
        isOpen={isFullscreen}
        onClose={() => setIsFullscreen(false)}
        title={`Pivot Matrix (${filter} Customers - ${filteredCustomers.length} Accounts)`}
        noPadding={true}
      >
        <div className="w-full h-full bg-white dark:bg-navy-800 overflow-hidden">
          {renderTableContent(true)}
        </div>
      </FullscreenModal>
    </div>
  );
}
