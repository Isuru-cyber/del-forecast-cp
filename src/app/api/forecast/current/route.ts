import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { CustomerType, PivotCell, ReportData } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Get latest active batch
    const batchRes = await query(
      `SELECT id, uploaded_at, uploaded_by, ou_filename, st_filename, total_qty, total_value 
       FROM forecast_batches 
       WHERE is_active = TRUE 
       ORDER BY uploaded_at DESC 
       LIMIT 1;`
    );

    if (batchRes.rows.length === 0) {
      return NextResponse.json({ success: true, report: null });
    }

    const batch = batchRes.rows[0];

    // 2. Fetch all records for this active batch
    const recordsRes = await query(
      `SELECT customer_name, customer_type, delivery_date::text as delivery_date, source_type, qty, value 
       FROM forecast_records 
       WHERE batch_id = $1 
       ORDER BY customer_name ASC, delivery_date ASC;`,
      [batch.id]
    );

    const records = recordsRes.rows;

    const consolidated: Record<string, Record<string, PivotCell>> = {};
    const uniqueDates = new Set<string>();
    const uniqueCustomers = new Set<string>();
    const customerTypes: Record<string, CustomerType> = {};
    const custTotals: Record<string, PivotCell> = {};
    const dateTotals: Record<string, PivotCell> = {};
    const grandTotal: PivotCell = { qty: 0, value: 0 };
    const directTotal: PivotCell = { qty: 0, value: 0 };
    const indirectTotal: PivotCell = { qty: 0, value: 0 };

    records.forEach(r => {
      const cust = r.customer_name;
      const date = r.delivery_date;
      const type = (r.customer_type as CustomerType) || 'DIRECT';
      const qty = Number(r.qty || 0);
      const val = Number(r.value || 0);

      uniqueDates.add(date);
      uniqueCustomers.add(cust);
      customerTypes[cust] = type;

      if (!consolidated[cust]) consolidated[cust] = {};
      if (!consolidated[cust][date]) consolidated[cust][date] = { qty: 0, value: 0 };
      consolidated[cust][date].qty += qty;
      consolidated[cust][date].value += val;

      if (!custTotals[cust]) custTotals[cust] = { qty: 0, value: 0 };
      custTotals[cust].qty += qty;
      custTotals[cust].value += val;

      if (!dateTotals[date]) dateTotals[date] = { qty: 0, value: 0 };
      dateTotals[date].qty += qty;
      dateTotals[date].value += val;

      grandTotal.qty += qty;
      grandTotal.value += val;

      if (type === 'DIRECT') {
        directTotal.qty += qty;
        directTotal.value += val;
      } else {
        indirectTotal.qty += qty;
        indirectTotal.value += val;
      }
    });

    const sortedDates = Array.from(uniqueDates).sort();
    const sortedCustomers = Array.from(uniqueCustomers).sort();

    const report: ReportData = {
      dates: sortedDates,
      customers: sortedCustomers,
      customerTypes,
      data: consolidated,
      customerSummaries: sortedCustomers.map(c => ({
        label: c,
        type: customerTypes[c] || 'DIRECT',
        qty: custTotals[c]?.qty || 0,
        value: custTotals[c]?.value || 0,
      })),
      dateSummaries: sortedDates.map(d => ({
        label: d,
        qty: dateTotals[d]?.qty || 0,
        value: dateTotals[d]?.value || 0,
      })),
      grandTotal,
      directTotal,
      indirectTotal,
      batchInfo: {
        id: batch.id,
        uploaded_at: batch.uploaded_at,
        uploaded_by: batch.uploaded_by,
        ou_filename: batch.ou_filename,
        st_filename: batch.st_filename,
        total_qty: Number(batch.total_qty || grandTotal.qty),
        total_value: Number(batch.total_value || grandTotal.value),
      },
    };

    return NextResponse.json({ success: true, report });
  } catch (err: any) {
    console.error('Error fetching current forecast:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch current forecast' },
      { status: 500 }
    );
  }
}
