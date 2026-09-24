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

// Format Excel dates reliably to YYYY-MM-DD without timezone shifts
export function formatExcelDate(val: any): string {
  if (val === null || val === undefined || val === '') return '';

  // 1. Excel serial number (days since Dec 30, 1899)
  if (typeof val === 'number') {
    if (val <= 0 || isNaN(val)) return '';
    const utcDays = val - 25569;
    const utcMillis = Math.round(utcDays * 86400 * 1000);
    const dateObj = new Date(utcMillis);
    if (isNaN(dateObj.getTime())) return '';
    const y = dateObj.getUTCFullYear();
    const m = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // 2. Date object instance
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '';
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const str = String(val).trim();
  if (!str) return '';

  // 3. String already in YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = str.match(/^(\d{4})[\/\.-](\d{1,2})[\/\.-](\d{1,2})/);
  if (ymdMatch) {
    const y = ymdMatch[1];
    const m = ymdMatch[2].padStart(2, '0');
    const d = ymdMatch[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // 4. String in DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})/);
  if (dmyMatch) {
    let p1 = Number(dmyMatch[1]);
    let p2 = Number(dmyMatch[2]);
    const year = dmyMatch[3];
    // If first number > 12, it is definitely Day/Month/Year
    // If second number > 12, it is Month/Day/Year
    let day = p1;
    let month = p2;
    if (p1 <= 12 && p2 > 12) {
      day = p2;
      month = p1;
    }
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  // Fallback to JS Date parsing
  try {
    const d = new Date(str);
    if (isNaN(d.getTime())) return str;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return str;
  }
}

// Clean and parse numbers with commas, currency symbols, and extra spaces
export function parseExcelNumber(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') {
    return isNaN(val) ? 0 : val;
  }
  const cleaned = String(val).replace(/,/g, '').replace(/[\$\s]/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
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
  // Read with cellDates: false to avoid timezone off-by-one shifts on serial dates
  const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array', cellDates: false });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  if (jsonData.length < 2) {
    throw new Error(`Workbook ${fileName} contains no data rows.`);
  }

  // Detect header row dynamically (check row 0 through 4)
  let headerRowIdx = 0;
  let custIdx = -1;
  let dateIdx = -1;
  let qtyIdx = -1;
  let valIdx = -1;

  const ouQtyAliases = ['order out qty', 'out qty', 'order out quantity', 'outstanding qty', 'qty'];
  const ouValAliases = ['order out value', 'out value', 'order out val', 'order value', 'value'];
  const stQtyAliases = ['ship qty', 'shipped qty', 'shipping qty', 'quantity', 'qty'];
  const stValAliases = ['ship value(usd)', 'ship value', 'ship val', 'value'];

  const qtyAliases = fileType === 'OU' ? ouQtyAliases : stQtyAliases;
  const valAliases = fileType === 'OU' ? ouValAliases : stValAliases;

  for (let r = 0; r < Math.min(jsonData.length, 5); r++) {
    const candidateHeaders = (jsonData[r] || []).map(h => String(h || '').trim());
    const cIdx = findColumnIndex(candidateHeaders, ['cust name', 'customer name', 'custname', 'customer']);
    const dIdx = findColumnIndex(candidateHeaders, ['delivery date', 'del date', 'deliverydate']);
    const qIdx = findColumnIndex(candidateHeaders, qtyAliases);
    const vIdx = findColumnIndex(candidateHeaders, valAliases);

    if (cIdx !== -1 && dIdx !== -1) {
      headerRowIdx = r;
      custIdx = cIdx;
      dateIdx = dIdx;
      qtyIdx = qIdx;
      valIdx = vIdx;
      break;
    }
  }

  if (custIdx === -1) throw new Error(`Could not find Customer column in ${fileName}. Checked aliases.`);
  if (dateIdx === -1) throw new Error(`Could not find Delivery Date column in ${fileName}. Checked aliases.`);
  if (qtyIdx === -1) throw new Error(`Could not find Quantity column in ${fileName}. Checked aliases.`);
  if (valIdx === -1) throw new Error(`Could not find Value column in ${fileName}. Checked aliases.`);

  const records: ParsedRow[] = [];
  const uniqueCustomers = new Set<string>();
  const missingCustomers = new Set<string>();

  for (let i = headerRowIdx + 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row || row.length === 0) continue;

    const rawCustomer = String(row[custIdx] || '').trim();
    if (!rawCustomer) continue;

    const customer = normalizeCustomerName(rawCustomer);
    const date = formatExcelDate(row[dateIdx]);
    const qty = parseExcelNumber(row[qtyIdx]);
    const value = parseExcelNumber(row[valIdx]);

    if (customer && date) {
      uniqueCustomers.add(customer);
      records.push({
        customer,
        date,
        qty,
        value,
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
