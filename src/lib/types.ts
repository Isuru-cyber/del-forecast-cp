export type CustomerType = 'DIRECT' | 'INDIRECT' | 'UNMAPPED';

export type CustomerFilter = 'ALL' | 'DIRECT' | 'INDIRECT' | 'UNMAPPED';

export interface Customer {
  id: string;
  name: string;
  type: CustomerType;
  created_at?: string;
  updated_at?: string;
}

export interface ForecastBatch {
  id: string;
  uploaded_at: string;
  uploaded_by: string;
  ou_filename?: string;
  st_filename?: string;
  total_qty: number;
  total_value: number;
  is_active: boolean;
}

export interface ForecastRecord {
  id?: number;
  batch_id?: string;
  customer_name: string;
  customer_type: CustomerType;
  delivery_date: string; // YYYY-MM-DD
  source_type: 'OU' | 'ST';
  qty: number;
  value: number;
}

export interface PivotCell {
  qty: number;
  value: number;
}

export interface CustomerSummary {
  label: string;
  type: CustomerType;
  qty: number;
  value: number;
}

export interface DateSummary {
  label: string;
  qty: number;
  value: number;
}

export interface TrendBuckets {
  currentDaily: DateSummary[];
  pastMonths: DateSummary[];
  futureMonths: DateSummary[];
  summary: {
    past: PivotCell;
    current: PivotCell;
    future: PivotCell;
  };
  currentMonthLabel: string;
}

export interface ReportData {
  dates: string[];
  customers: string[];
  customerTypes: Record<string, CustomerType>;
  data: Record<string, Record<string, PivotCell>>;
  customerSummaries: CustomerSummary[];
  dateSummaries: DateSummary[];
  grandTotal: PivotCell;
  directTotal: PivotCell;
  indirectTotal: PivotCell;
  unmappedCustomers?: string[];
  batchInfo: {
    id?: string;
    uploaded_at: string;
    uploaded_by: string;
    ou_filename?: string;
    st_filename?: string;
    total_qty?: number;
    total_value?: number;
  } | null;
}

export function getActiveForecastMonthKey(dates: string[]): string {
  const now = new Date();
  const systemMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  if (!dates || dates.length === 0) return systemMonth;

  if (dates.some(d => d.startsWith(systemMonth))) {
    return systemMonth;
  }

  const monthCounts: Record<string, number> = {};
  dates.forEach(d => {
    const m = d.slice(0, 7);
    if (m && m.length === 7) {
      monthCounts[m] = (monthCounts[m] || 0) + 1;
    }
  });

  let bestMonth = '';
  let maxCount = -1;
  Object.entries(monthCounts).forEach(([m, count]) => {
    if (count > maxCount) {
      maxCount = count;
      bestMonth = m;
    }
  });

  return bestMonth || systemMonth;
}
