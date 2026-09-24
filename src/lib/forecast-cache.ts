import { ReportData } from './types';

let cachedReport: ReportData | null = null;
let cachedBatchId: string | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 30 * 1000; // 30 seconds

export function getCachedReport(batchId: string): ReportData | null {
  if (cachedReport && cachedBatchId === batchId && (Date.now() - lastCacheTime < CACHE_TTL_MS)) {
    return cachedReport;
  }
  return null;
}

export function setCachedReport(batchId: string, report: ReportData) {
  cachedBatchId = batchId;
  cachedReport = report;
  lastCacheTime = Date.now();
}

export function invalidateForecastCache() {
  cachedReport = null;
  cachedBatchId = null;
  lastCacheTime = 0;
}
