import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Customer } from '@/lib/types';
import { invalidateForecastCache } from '@/lib/forecast-cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await query<Customer>(
      'SELECT id, name, type, created_at, updated_at FROM customers ORDER BY name ASC'
    );
    return NextResponse.json({ success: true, customers: res.rows });
  } catch (err: any) {
    console.error('Error fetching customers:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, type } = body;

    if (!name || !type || !['DIRECT', 'INDIRECT'].includes(type.toUpperCase())) {
      return NextResponse.json(
        { success: false, error: 'Valid customer name and type (DIRECT / INDIRECT) required.' },
        { status: 400 }
      );
    }

    let trimmedName = String(name).trim().replace(/,+$/, '').replace(/\s+/g, ' ').trim();
    const upperType = type.toUpperCase();

    const res = await query<Customer>(
      `INSERT INTO customers (name, type) 
       VALUES ($1, $2) 
       ON CONFLICT (name) 
       DO UPDATE SET type = EXCLUDED.type, updated_at = NOW() 
       RETURNING id, name, type, created_at, updated_at;`,
      [trimmedName, upperType]
    );

    // Keep active forecast_records in sync as well with whitespace tolerance
    await query(
      `UPDATE forecast_records 
       SET customer_type = $2 
       WHERE REGEXP_REPLACE(UPPER(TRIM(TRAILING ',' FROM TRIM(customer_name))), '\\s+', ' ', 'g') = 
             REGEXP_REPLACE(UPPER(TRIM($1)), '\\s+', ' ', 'g');`,
      [trimmedName, upperType]
    );

    // Invalidate cached report so next fetch returns fresh customer classification
    invalidateForecastCache();

    return NextResponse.json({ success: true, customer: res.rows[0] });
  } catch (err: any) {
    console.error('Error saving customer:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to save customer' },
      { status: 500 }
    );
  }
}
