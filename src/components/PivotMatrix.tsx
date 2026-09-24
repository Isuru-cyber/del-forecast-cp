'use client';

import React, { useState, useMemo } from 'react';
import { ReportData, CustomerFilter } from '@/lib/types';
import { Search, Globe2, Building2, Download } from 'lucide-react';
import { exportForecastToExcel } from '@/lib/excel-exporter';

interface PivotMatrixProps {
  report: ReportData;
  filter: CustomerFilter;
}

export function PivotMatrix({ report, filter }: PivotMatrixProps) {
  const [search, setSearch] = useState('');

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

  const TOTAL_QTY_RIGHT = 120; // px offset for sticky total qty column

  return (
    <div className="space-y-4">
      {/* Search and Export Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all text-slate-800"
          />
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          <span className="text-xs font-bold text-slate-500">
            Showing <span className="text-blue-700 font-extrabold">{filteredCustomers.length}</span> of {customerSummaries.length} customers
          </span>
          <button
            onClick={() => exportForecastToExcel(report, filter)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Matrix</span>
          </button>
        </div>
      </div>

      {/* Pivot Table Grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="pivot-container custom-scrollbar">
          <table className="w-full border-separate border-spacing-0">
            <thead className="sticky-header-row">
              <tr>
                <th
                  rowSpan={2}
                  className="sticky-corner-cell bg-blue-800 border-b border-r border-blue-900/30 px-6 py-4 text-left align-middle font-bold text-white text-xs tracking-wide uppercase min-w-[300px]"
                >
                  Customer Name
                </th>
                {dates.map((d) => (
                  <th
                    key={d}
                    colSpan={2}
                    className="bg-blue-800 border-b border-r border-blue-900/30 px-4 py-4 text-center align-middle font-bold text-white text-xs tracking-wide uppercase whitespace-nowrap"
                  >
                    {d}
                  </th>
                ))}
                <th
                  colSpan={2}
                  style={{ top: 0, right: 0, zIndex: 45 }}
                  className="sticky bg-blue-950 border-b border-r border-blue-900/30 px-4 py-4 text-center align-middle font-bold text-white text-xs tracking-wide uppercase whitespace-nowrap min-w-[240px]"
                >
                  Total ({filter})
                </th>
              </tr>
              <tr>
                {dates.map((d) => (
                  <React.Fragment key={`${d}-sub`}>
                    <th className="bg-blue-800/95 border-b border-r border-blue-900/30 py-2 text-center align-middle font-semibold text-blue-100 text-[10px] uppercase w-[95px] min-w-[95px]">
                      Qty
                    </th>
                    <th className="bg-blue-800/95 border-b border-r border-blue-900/30 py-2 text-center align-middle font-semibold text-blue-100 text-[10px] uppercase w-[105px] min-w-[105px]">
                      Value
                    </th>
                  </React.Fragment>
                ))}
                <th
                  style={{ top: '53px', right: `${TOTAL_QTY_RIGHT}px`, zIndex: 45 }}
                  className="sticky bg-blue-950 border-b border-r border-blue-900/30 py-2 text-center align-middle font-semibold text-blue-100 text-[10px] uppercase w-[120px] min-w-[120px]"
                >
                  Qty
                </th>
                <th
                  style={{ top: '53px', right: 0, zIndex: 45 }}
                  className="sticky bg-blue-950 border-b border-r border-blue-900/30 py-2 text-center align-middle font-semibold text-blue-100 text-[10px] uppercase w-[120px] min-w-[120px]"
                >
                  Value
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((cust, idx) => {
                const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50';
                return (
                  <tr key={cust.label} className={`${rowBg} hover:bg-blue-50/50 transition-colors`}>
                    <td className="sticky-col-cust bg-inherit border-b border-r border-slate-200 px-6 py-3 font-semibold text-slate-800 text-xs whitespace-nowrap shadow-sm">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                            cust.type === 'DIRECT'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}
                        >
                          {cust.type === 'DIRECT' ? 'Direct' : 'Local'}
                        </span>
                        <span className="truncate max-w-[260px]" title={cust.label}>
                          {cust.label}
                        </span>
                      </div>
                    </td>
                    {dates.map((date) => {
                      const entry = data[cust.label]?.[date];
                      return (
                        <React.Fragment key={`${cust.label}-${date}`}>
                          <td className="border-b border-r border-slate-100 px-3 py-3 text-right font-mono text-xs text-slate-600">
                            {entry && entry.qty > 0 ? formatNumber(entry.qty) : '-'}
                          </td>
                          <td className="border-b border-r border-slate-100 px-3 py-3 text-right font-mono text-xs text-blue-700 font-bold">
                            {entry && entry.value > 0 ? `$${formatNumber(entry.value)}` : '-'}
                          </td>
                        </React.Fragment>
                      );
                    })}
                    <td
                      style={{ right: `${TOTAL_QTY_RIGHT}px`, zIndex: 20 }}
                      className="sticky bg-blue-50/80 border-b border-r border-slate-200 px-3 py-3 text-right font-mono text-xs text-slate-700 font-bold"
                    >
                      {formatNumber(cust.qty)}
                    </td>
                    <td
                      style={{ right: 0, zIndex: 20 }}
                      className="sticky bg-blue-50/80 border-b border-r border-slate-200 px-3 py-3 text-right font-mono text-xs text-blue-900 font-extrabold"
                    >
                      ${formatNumber(cust.value)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td
                  style={{ bottom: 0, zIndex: 46 }}
                  className="sticky-col-cust sticky bg-blue-100 border-t-2 border-r border-blue-300 px-6 py-4 font-extrabold text-blue-950 text-xs uppercase tracking-wide"
                >
                  TOTAL ({filter})
                </td>
                {dates.map((date) => {
                  const t = dateTotals[date];
                  return (
                    <React.Fragment key={`${date}-total`}>
                      <td
                        style={{ bottom: 0, zIndex: 25 }}
                        className="sticky bg-blue-100 border-t-2 border-r border-blue-200 px-3 py-4 text-right font-mono text-xs text-blue-900 font-bold"
                      >
                        {formatNumber(t?.qty || 0)}
                      </td>
                      <td
                        style={{ bottom: 0, zIndex: 25 }}
                        className="sticky bg-blue-100 border-t-2 border-r border-blue-200 px-3 py-4 text-right font-mono text-xs text-blue-950 font-extrabold"
                      >
                        ${formatNumber(t?.value || 0)}
                      </td>
                    </React.Fragment>
                  );
                })}
                <td
                  style={{ bottom: 0, right: `${TOTAL_QTY_RIGHT}px`, zIndex: 47 }}
                  className="sticky bg-blue-200 border-t-2 border-r border-blue-300 px-3 py-4 text-right font-mono text-xs text-blue-950 font-black"
                >
                  {formatNumber(totalFilteredQty)}
                </td>
                <td
                  style={{ bottom: 0, right: 0, zIndex: 47 }}
                  className="sticky bg-blue-200 border-t-2 border-r border-blue-300 px-3 py-4 text-right font-mono text-xs text-blue-950 font-black"
                >
                  ${formatNumber(totalFilteredValue)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
