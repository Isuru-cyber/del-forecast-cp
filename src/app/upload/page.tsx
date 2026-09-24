'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { useApp } from '@/context/RoleContext';
import { parseExcelWorkbook } from '@/lib/excel-parser';
import { Customer, CustomerType } from '@/lib/types';
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  Play,
  RefreshCw,
  Globe2,
  Building2,
  ArrowLeft,
  Loader2,
  HelpCircle,
} from 'lucide-react';

export default function UploadPage() {
  const router = useRouter();
  const { role } = useApp();

  useEffect(() => {
    if (role === 'viewer') {
      router.push('/');
    }
  }, [role, router]);

  const [ouFile, setOuFile] = useState<File | null>(null);
  const [stFile, setStFile] = useState<File | null>(null);
  const [inputKey, setInputKey] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Database customer map for reconciliation
  const [customerMap, setCustomerMap] = useState<Record<string, CustomerType>>({});
  const [loadingCusts, setLoadingCusts] = useState(true);

  // Missing customers modal state
  const [missingCustomers, setMissingCustomers] = useState<string[]>([]);
  const [missingClassification, setMissingClassification] = useState<Record<string, CustomerType>>({});
  const [showModal, setShowModal] = useState(false);
  const [pendingUploadData, setPendingUploadData] = useState<{
    combinedRecords: any[];
    ouName: string;
    stName: string;
  } | null>(null);

  useEffect(() => {
    async function loadCustomers() {
      try {
        const res = await fetch('/api/customers');
        const data = await res.json();
        if (data.success && Array.isArray(data.customers)) {
          const map: Record<string, CustomerType> = {};
          data.customers.forEach((c: Customer) => {
            const norm = c.name.replace(/,+$/, '').replace(/\s+/g, ' ').trim();
            map[c.name] = c.type;
            map[norm] = c.type;
          });
          setCustomerMap(map);
        }
      } catch (err) {
        console.error('Error loading customers:', err);
      } finally {
        setLoadingCusts(false);
      }
    }
    loadCustomers();
  }, []);

  const handleProcessData = async () => {
    if (loadingCusts) {
      setError('Please wait until the customer master database finishes loading.');
      return;
    }

    if (!ouFile || !stFile) {
      setError('Please select both Order Outstanding (OU) and Shipment Tracker (ST) files.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const ouBuf = await ouFile.arrayBuffer();
      const stBuf = await stFile.arrayBuffer();

      const ouResult = parseExcelWorkbook(ouBuf, 'OU', ouFile.name, customerMap);
      const stResult = parseExcelWorkbook(stBuf, 'ST', stFile.name, customerMap);

      const combinedRecords = [...ouResult.records, ...stResult.records];

      const allMissing = Array.from(
        new Set([...ouResult.missingCustomers, ...stResult.missingCustomers])
      ).filter(c => {
        const norm = c.replace(/,+$/, '').replace(/\s+/g, ' ').trim();
        return !customerMap[c] && !customerMap[norm];
      });

      if (allMissing.length > 0) {
        const initialMap: Record<string, CustomerType> = {};
        allMissing.forEach(c => {
          initialMap[c] = missingClassification[c] || 'INDIRECT';
        });
        setMissingCustomers(allMissing);
        setMissingClassification(initialMap);
        setPendingUploadData({
          combinedRecords,
          ouName: ouFile.name,
          stName: stFile.name,
        });
        setShowModal(true);
        setIsProcessing(false);
        return;
      }

      await finalizeUpload(combinedRecords, [], ouFile.name, stFile.name);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error processing worksheets. Please check file structure.');
      setIsProcessing(false);
    }
  };

  const finalizeUpload = async (
    records: any[],
    newCustomersList: { name: string; type: CustomerType }[],
    ouFilename: string,
    stFilename: string
  ) => {
    try {
      setIsProcessing(true);
      const res = await fetch('/api/forecast/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          records,
          newCustomers: newCustomersList,
          ouFilename,
          stFilename,
          uploadedBy: 'Admin',
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to save forecast in database');
      }

      router.push('/');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error saving forecast to database');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleModalSave = async () => {
    if (!pendingUploadData) return;
    setShowModal(false);

    const newCustomersList = missingCustomers.map(name => ({
      name,
      type: missingClassification[name] || 'INDIRECT',
    }));

    await finalizeUpload(
      pendingUploadData.combinedRecords,
      newCustomersList,
      pendingUploadData.ouName,
      pendingUploadData.stName
    );
  };

  const handleReset = () => {
    setOuFile(null);
    setStFile(null);
    setError(null);
    setPendingUploadData(null);
    setMissingCustomers([]);
    setShowModal(false);
    setInputKey(k => k + 1);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50 dark:bg-navy-950 transition-colors">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 flex flex-col justify-center space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white text-xs font-semibold uppercase tracking-wider transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 bg-slate-100 dark:bg-navy-800 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-navy-700">
            {Object.keys(customerMap).length} Verified Accounts
          </span>
        </div>

        <div className="text-center space-y-1">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Upload ERP Delivery Forecast Data
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Columns are dynamically identified and matched against the customer master database.
          </p>
        </div>

        {/* Upload Dropzones */}
        <section className="bg-white dark:bg-navy-900 rounded-2xl shadow-sm border border-slate-200 dark:border-navy-700 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 1. Order Outstanding Box */}
            <div className="flex flex-col group">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex items-center">
                <span className="w-2 h-2 rounded-full mr-1.5 bg-blue-700"></span>
                Order Outstanding (OU)
              </label>
              <div className="relative border-2 border-dashed rounded-xl p-6 text-center border-slate-200 dark:border-navy-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50/40 dark:hover:bg-navy-800 transition-all cursor-pointer">
                <input
                  key={`ou-${inputKey}`}
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setOuFile(e.target.files[0]);
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="flex flex-col items-center">
                  <div className={`p-3 rounded-xl mb-2 transition-colors ${
                    ouFile ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-navy-800 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-700'
                  }`}>
                    {ouFile ? <CheckCircle2 className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
                  </div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                    {ouFile ? ouFile.name : 'Select or Drop OU Workbook'}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Shipment Tracker Box */}
            <div className="flex flex-col group">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex items-center">
                <span className="w-2 h-2 rounded-full mr-1.5 bg-indigo-900 dark:bg-indigo-400"></span>
                Shipment Tracker (ST)
              </label>
              <div className="relative border-2 border-dashed rounded-xl p-6 text-center border-slate-200 dark:border-navy-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50/40 dark:hover:bg-navy-800 transition-all cursor-pointer">
                <input
                  key={`st-${inputKey}`}
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setStFile(e.target.files[0]);
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="flex flex-col items-center">
                  <div className={`p-3 rounded-xl mb-2 transition-colors ${
                    stFile ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-navy-800 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-700'
                  }`}>
                    {stFile ? <CheckCircle2 className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
                  </div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                    {stFile ? stFile.name : 'Select or Drop ST Workbook'}
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Error Message Display */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl flex items-center text-red-700 dark:text-red-300 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 mr-2.5 flex-shrink-0 text-red-600 dark:text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3 border-t border-slate-100 dark:border-navy-700">
            <button
              onClick={handleProcessData}
              disabled={isProcessing || loadingCusts}
              className="flex items-center space-x-1.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow transition-all"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Forecast...</span>
                </>
              ) : loadingCusts ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading Customer Master...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Execute & Save to Database</span>
                </>
              )}
            </button>
            <button
              onClick={handleReset}
              disabled={isProcessing}
              className="flex items-center space-x-1.5 bg-white dark:bg-navy-800 hover:bg-slate-100 dark:hover:bg-navy-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-navy-700 px-5 py-2.5 rounded-xl font-semibold text-xs uppercase tracking-wider transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </section>

        {/* Missing Customers Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-navy-700 max-w-lg w-full p-6 space-y-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-xl">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    New Customers Detected!
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Please select classification for {missingCustomers.length} unrecognized account(s):
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-navy-700">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Bulk Classify:
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      const bulk: Record<string, CustomerType> = {};
                      missingCustomers.forEach((c) => (bulk[c] = 'DIRECT'));
                      setMissingClassification(bulk);
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
                  >
                    All Direct
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const bulk: Record<string, CustomerType> = {};
                      missingCustomers.forEach((c) => (bulk[c] = 'INDIRECT'));
                      setMissingClassification(bulk);
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded border border-indigo-300 dark:border-indigo-800 hover:bg-indigo-100 transition-colors"
                  >
                    All Local
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1.5 custom-scrollbar">
                {missingCustomers.map((cust) => {
                  const currentChoice = missingClassification[cust] || 'INDIRECT';
                  return (
                    <div
                      key={cust}
                      className="p-3 rounded-lg bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                        {cust}
                      </span>
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setMissingClassification(prev => ({ ...prev, [cust]: 'DIRECT' }));
                          }}
                          className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all ${
                            currentChoice === 'DIRECT'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                              : 'bg-white dark:bg-navy-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-navy-600 hover:bg-slate-100'
                          }`}
                        >
                          <Globe2 className="w-3 h-3" />
                          <span>Direct</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMissingClassification(prev => ({ ...prev, [cust]: 'INDIRECT' }));
                          }}
                          className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all ${
                            currentChoice === 'INDIRECT'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-white dark:bg-navy-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-navy-600 hover:bg-slate-100'
                          }`}
                        >
                          <Building2 className="w-3 h-3" />
                          <span>Local</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-navy-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-1.5 bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleModalSave}
                  className="px-5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow transition-all"
                >
                  Save & Commit Forecast
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
