import * as XLSX from 'xlsx';
import { CustomerType, ForecastRecord } from './types';

export interface ParsedRow {
  customer: string;
  date: string;
  qty: number;
  value: number;
  source: 'OU' | 'ST';
}

export interface ParseResult {
  records: ParsedRow[];
  uniqueCustomers: string[];
  missingCustomers: string[];
  filename: string;
  type: 'OU' | 'ST';
  rowCount: number;
}

// Format Excel dates reliably to YYYY-MM-DD
export function formatExcelDate(val: any): string {
  if (!val) return '';
  if (typeof val === 'number') {
    // Excel base date is Dec 30, 1899
    const d = new Date(Math.round((val - 25569) * 86400 * 1000));
    return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
  }
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? '' : val.toISOString().split('T')[0];
  }
  const str = String(val).trim();
  if (!str) return '';
  // Check if string is already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.slice(0, 10);
  }
  try {
    const d = new Date(str);
    return isNaN(d.getTime()) ? str : d.toISOString().split('T')[0];
  } catch {
    return str;
  }
}

// Clean and normalize customer names (handle trailing commas, multiple spaces)
export function normalizeCustomerName(name: string): string {
  if (!name) return '';
  let cleaned = name.trim();
  // Remove trailing comma if any
  if (cleaned.endsWith(',')) {
    cleaned = cleaned.slice(0, -1).trim();
  }
  // Replace multiple whitespace with a single space
  cleaned = cleaned.replace(/\s+/g, ' ');
  return cleaned;
}

// Dynamic header detection (ERP column order resilience)
function findColumnIndex(headers: string[], aliases: string[]): number {
  const normHeaders = headers.map(h => (h ? String(h).trim().toLowerCase() : ''));
  for (const alias of aliases) {
    const lowerAlias = alias.toLowerCase();
    // 1. Exact match
    const exactIdx = normHeaders.indexOf(lowerAlias);
    if (exactIdx !== -1) return exactIdx;
    // 2. Contains match
    const partialIdx = normHeaders.findIndex(h => h.includes(lowerAlias));
    if (partialIdx !== -1) return partialIdx;
  }
  return -1;
}

export function parseExcelWorkbook(
  arrayBuffer: ArrayBuffer,
  fileType: 'OU' | 'ST',
  fileName: string,
  existingCustomerMap: Record<string, CustomerType>
): ParseResult {
  const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  if (jsonData.length < 2) {
    throw new Error(`Workbook ${fileName} contains no data rows.`);
  }

  const rawHeaders = (jsonData[0] || []).map(h => String(h || '').trim());

  // Find column indices dynamically
  const custIdx = findColumnIndex(rawHeaders, ['cust name', 'customer name', 'custname', 'customer']);
  const dateIdx = findColumnIndex(rawHeaders, ['delivery date', 'del date', 'deliverydate']);
  
  let qtyIdx = -1;
  let valIdx = -1;

  if (fileType === 'OU') {
    qtyIdx = findColumnIndex(rawHeaders, ['order out qty', 'out qty', 'order out quantity', 'outstanding qty']);
    valIdx = findColumnIndex(rawHeaders, ['order out value', 'out value', 'order out val', 'order value']);
  } else {
    qtyIdx = findColumnIndex(rawHeaders, ['ship qty', 'shipped qty', 'shipping qty', 'quantity']);
    valIdx = findColumnIndex(rawHeaders, ['ship value(usd)', 'ship value', 'ship val', 'value']);
  }

  if (custIdx === -1) throw new Error(`Could not find Customer column in ${fileName}. Checked aliases.`);
  if (dateIdx === -1) throw new Error(`Could not find Delivery Date column in ${fileName}. Checked aliases.`);
  if (qtyIdx === -1) throw new Error(`Could not find Quantity column in ${fileName}. Checked aliases.`);
  if (valIdx === -1) throw new Error(`Could not find Value column in ${fileName}. Checked aliases.`);

  const records: ParsedRow[] = [];
  const uniqueCustomers = new Set<string>();
  const missingCustomers = new Set<string>();

  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row || row.length === 0) continue;

    const rawCustomer = String(row[custIdx] || '').trim();
    if (!rawCustomer) continue;

    const customer = normalizeCustomerName(rawCustomer);
    const date = formatExcelDate(row[dateIdx]);
    const qty = Number(row[qtyIdx] || 0);
    const value = Number(row[valIdx] || 0);

    if (customer && date) {
      uniqueCustomers.add(customer);
      records.push({
        customer,
        date,
        qty: isNaN(qty) ? 0 : qty,
        value: isNaN(value) ? 0 : value,
        source: fileType,
      });

      // Check if customer exists in database
      const mapped = existingCustomerMap[customer] || existingCustomerMap[rawCustomer];
      if (!mapped) {
        missingCustomers.add(customer);
      }
    }
  }

  return {
    records,
    uniqueCustomers: Array.from(uniqueCustomers).sort(),
    missingCustomers: Array.from(missingCustomers).sort(),
    filename: fileName,
    type: fileType,
    rowCount: records.length,
  };
}
