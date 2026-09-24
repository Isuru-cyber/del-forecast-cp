export type CustomerType = 'DIRECT' | 'INDIRECT';

export type CustomerFilter = 'ALL' | 'DIRECT' | 'INDIRECT';

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
