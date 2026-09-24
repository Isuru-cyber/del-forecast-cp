import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { CustomerType } from '@/lib/types';
import { invalidateForecastCache } from '@/lib/forecast-cache';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const client = await pool.connect();
  try {
    const body = await request.json();
    const { records, newCustomers, ouFilename, stFilename, uploadedBy = 'Admin' } = body;

    if (!records || !Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No forecast records provided.' },
        { status: 400 }
      );
    }

    await client.query('BEGIN');

    // 1. Insert new customers if provided
    if (newCustomers && Array.isArray(newCustomers) && newCustomers.length > 0) {
      for (const nc of newCustomers) {
        if (nc.name && nc.type) {
          let cName = nc.name.trim().replace(/,+$/, '').replace(/\s+/g, ' ').trim();
          await client.query(
            `INSERT INTO customers (name, type) 
             VALUES ($1, $2) 
             ON CONFLICT (name) 
             DO UPDATE SET type = EXCLUDED.type, updated_at = NOW();`,
            [cName, nc.type.toUpperCase()]
          );
        }
      }
    }

    // 2. Fetch customer type mapping from database (case-insensitive & whitespace/trailing comma normalized)
    const custRes = await client.query('SELECT name, type FROM customers;');
    const custTypeMap: Record<string, CustomerType> = {};
    custRes.rows.forEach(r => {
      const original = r.name.trim();
      const normalized = original.replace(/,+$/, '').replace(/\s+/g, ' ').trim().toUpperCase();
      custTypeMap[original] = r.type as CustomerType;
      custTypeMap[normalized] = r.type as CustomerType;
    });

    // 3. Compute totals
    let totalQty = 0;
    let totalVal = 0;
    records.forEach(r => {
      totalQty += Number(r.qty || 0);
      totalVal += Number(r.value || 0);
    });

    // 4. Deactivate old batches
    await client.query('UPDATE forecast_batches SET is_active = FALSE WHERE is_active = TRUE;');

    // 5. Insert new batch
    const batchRes = await client.query(
      `INSERT INTO forecast_batches (uploaded_by, ou_filename, st_filename, total_qty, total_value, is_active)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       RETURNING id, uploaded_at;`,
      [uploadedBy, ouFilename, stFilename, totalQty, totalVal]
    );

    const batchId = batchRes.rows[0].id;

    // 6. Batch insert records in chunks of 500
    const CHUNK_SIZE = 500;
    for (let i = 0; i < records.length; i += CHUNK_SIZE) {
      const chunk = records.slice(i, i + CHUNK_SIZE);
      const valPlaceholders: string[] = [];
      const params: any[] = [];

      chunk.forEach((rec, idx) => {
        const offset = idx * 7;
        valPlaceholders.push(
          `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`
        );
        
        const normCust = (rec.customer || '').trim().replace(/,+$/, '').replace(/\s+/g, ' ').toUpperCase();
        const custType = custTypeMap[normCust] || custTypeMap[rec.customer] || 'UNMAPPED';
        params.push(
          batchId,
          rec.customer,
          custType,
          rec.date,
          rec.source,
          Number(rec.qty || 0),
          Number(rec.value || 0)
        );
      });

      const insertQuery = `
        INSERT INTO forecast_records (batch_id, customer_name, customer_type, delivery_date, source_type, qty, value)
        VALUES ${valPlaceholders.join(', ')};
      `;
      await client.query(insertQuery, params);
    }

    await client.query('COMMIT');
    invalidateForecastCache();

    return NextResponse.json({
      success: true,
      batchId,
      uploadedAt: batchRes.rows[0].uploaded_at,
      recordsCount: records.length,
      totalQty,
      totalVal,
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Error during forecast upload transaction:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to save forecast data' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
