import * as XLSX from 'xlsx';
import { ReportData, CustomerFilter } from './types';

export function exportForecastToExcel(report: ReportData, filter: CustomerFilter = 'ALL', searchQuery?: string) {
  const wb = XLSX.utils.book_new();
  const { dates, data, customerSummaries, dateSummaries, grandTotal, directTotal, indirectTotal } = report;

  // Filter customers if needed
  let filteredCustSummaries = customerSummaries;
  if (filter === 'DIRECT') {
    filteredCustSummaries = customerSummaries.filter(c => c.type === 'DIRECT');
  } else if (filter === 'INDIRECT') {
    filteredCustSummaries = customerSummaries.filter(c => c.type === 'INDIRECT');
  }

  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    filteredCustSummaries = filteredCustSummaries.filter(c => c.label.toLowerCase().includes(q));
  }

  const filteredCustNames = filteredCustSummaries.map(c => c.label);
  const custTotalMap: Record<string, { qty: number; value: number }> = {};
  filteredCustSummaries.forEach(c => {
    custTotalMap[c.label] = { qty: c.qty, value: c.value };
  });

  // Calculate dynamic date totals based on filtered customers
  const dateTotals: Record<string, { qty: number; value: number }> = {};
  dates.forEach(d => {
    dateTotals[d] = { qty: 0, value: 0 };
    filteredCustNames.forEach(c => {
      const entry = data[c]?.[d];
      if (entry) {
        dateTotals[d].qty += entry.qty;
        dateTotals[d].value += entry.value;
      }
    });
  });

  const totalFilteredQty = filteredCustSummaries.reduce((acc, c) => acc + c.qty, 0);
  const totalFilteredValue = filteredCustSummaries.reduce((acc, c) => acc + c.value, 0);

  // 1. Pivot Matrix Sheet
  const pivotRows: (string | number)[][] = [
    ['Customer Name', 'Type', ...dates.flatMap(d => [d, '']), 'Total', ''],
    ['', '', ...dates.flatMap(() => ['Quantity', 'Value']), 'Quantity', 'Value'],
  ];

  filteredCustSummaries.forEach(c => {
    const row: (string | number)[] = [c.label, c.type];
    dates.forEach(date => {
      const entry = data[c.label]?.[date];
      row.push(entry ? entry.qty : 0);
      row.push(entry ? entry.value : 0);
    });
    row.push(custTotalMap[c.label]?.qty || 0);
    row.push(custTotalMap[c.label]?.value || 0);
    pivotRows.push(row);
  });

  const totalRow: (string | number)[] = ['TOTAL', filter];
  dates.forEach(date => {
    totalRow.push(dateTotals[date]?.qty || 0);
    totalRow.push(dateTotals[date]?.value || 0);
  });
  totalRow.push(totalFilteredQty);
  totalRow.push(totalFilteredValue);
  pivotRows.push(totalRow);

  const wsPivot = XLSX.utils.aoa_to_sheet(pivotRows);

  const numDateCols = dates.length * 2;
  wsPivot['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } },
    { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } },
    { s: { r: 0, c: 2 + numDateCols }, e: { r: 0, c: 3 + numDateCols } },
  ];
  dates.forEach((d, i) => {
    wsPivot['!merges']!.push({ s: { r: 0, c: 2 + i * 2 }, e: { r: 0, c: 3 + i * 2 } });
  });

  wsPivot['!cols'] = [
    { wch: 34 },
    { wch: 12 },
    ...dates.flatMap(() => [{ wch: 12 }, { wch: 12 }]),
    { wch: 14 },
    { wch: 14 },
  ];

  XLSX.utils.book_append_sheet(wb, wsPivot, `Pivot Matrix (${filter})`);

  // 2. Summary Tables Sheet
  const summaryRows: (string | number)[][] = [
    ['COVERING PLANT - DELIVERY FORECAST REPORT'],
    [`Filter: ${filter} Customers`, '', `Generated: ${new Date().toLocaleString()}`],
    [],
    ['Customer Performance Summary'],
    ['Customer Name', 'Type', 'Total Quantity', 'Total Value (USD)'],
    ...filteredCustSummaries.map(s => [s.label, s.type, s.qty, s.value]),
    ['TOTAL', filter, totalFilteredQty, totalFilteredValue],
    [],
    ['Delivery Date Load Velocity'],
    ['Delivery Date', 'Total Quantity', 'Total Value (USD)'],
    ...dates.map(d => [d, dateTotals[d]?.qty || 0, dateTotals[d]?.value || 0]),
    ['TOTAL', totalFilteredQty, totalFilteredValue],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 34 }, { wch: 14 }, { wch: 18 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary Tables');

  const filename = `Covering_Plant_Forecast_${filter}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
}
