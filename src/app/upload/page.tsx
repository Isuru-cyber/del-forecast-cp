'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { useApp } from '@/context/RoleContext';
import { parseExcelWorkbook, ParseResult } from '@/lib/excel-parser';
import { Customer, CustomerType } from '@/lib/types';
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
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

  const [ouFile, setOuFile] = useState<File | null>(null);
  const [stFile, setStFile] = useState<File | null>(null);
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

  // Load existing customers on mount
  useEffect(() => {
    async function loadCustomers() {
      try {
        const res = await fetch('/api/customers');
        const data = await res.json();
        if (data.success && Array.isArray(data.customers)) {
          const map: Record<string, CustomerType> = {};
          data.customers.forEach((c: Customer) => {
            map[c.name] = c.type;
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

      // Find any missing customers across both files
      const allMissing = Array.from(
        new Set([...ouResult.missingCustomers, ...stResult.missingCustomers])
      ).filter(c => !customerMap[c]);

      if (allMissing.length > 0) {
        // Unknown customers found! Prompt user
        const initialMap: Record<string, CustomerType> = {};
        allMissing.forEach(c => {
          initialMap[c] = 'DIRECT'; // default
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

      // If no missing customers, upload immediately
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

      // Success! Redirect to dashboard
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
      type: missingClassification[name] || 'DIRECT',
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
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 md:py-16 flex flex-col justify-center space-y-8">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center space-x-2 text-slate-500 hover:text-slate-800 text-xs font-bold uppercase tracking-wider transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            Database Sync Engine &middot; {Object.keys(customerMap).length} Verified Customers
          </span>
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Upload ERP Delivery Forecast Data
          </h2>
          <p className="text-xs text-slate-500 max-w-lg mx-auto">
            Upload the latest Order Outstanding (OU) and Shipment Tracker (ST) files. Columns will be dynamically identified, validated, and saved permanently to Supabase.
          </p>
        </div>

        {/* Upload Dropzones */}
        <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 1. Order Outstanding Box */}
            <div className="flex flex-col group">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-3 flex items-center">
                <span className="w-2 h-2 rounded-full mr-2 bg-blue-700"></span>
                Order Outstanding (OU)
              </label>
              <div className="relative border-2 border-dashed rounded-2xl p-8 text-center border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 transition-all cursor-pointer">
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setOuFile(e.target.files[0]);
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="flex flex-col items-center">
                  <div className={`p-3.5 rounded-2xl mb-3 transition-colors ${
                    ouFile ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-700'
                  }`}>
                    {ouFile ? <CheckCircle2 className="w-7 h-7" /> : <Upload className="w-7 h-7" />}
                  </div>
                  <p className="text-xs font-bold text-slate-800 truncate max-w-[200px]">
                    {ouFile ? ouFile.name : 'Select or Drop OU Workbook'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">.xlsx or .xls from ERP</p>
                </div>
              </div>
            </div>

            {/* 2. Shipment Tracker Box */}
            <div className="flex flex-col group">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-3 flex items-center">
                <span className="w-2 h-2 rounded-full mr-2 bg-indigo-900"></span>
                Shipment Tracker (ST)
              </label>
              <div className="relative border-2 border-dashed rounded-2xl p-8 text-center border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 transition-all cursor-pointer">
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setStFile(e.target.files[0]);
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="flex flex-col items-center">
                  <div className={`p-3.5 rounded-2xl mb-3 transition-colors ${
                    stFile ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-700'
                  }`}>
                    {stFile ? <CheckCircle2 className="w-7 h-7" /> : <Upload className="w-7 h-7" />}
                  </div>
                  <p className="text-xs font-bold text-slate-800 truncate max-w-[200px]">
                    {stFile ? stFile.name : 'Select or Drop ST Workbook'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">.xlsx or .xls from ERP</p>
                </div>
              </div>
            </div>

          </div>

          {/* Error Message Display */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center text-red-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 mr-3 flex-shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4 border-t border-slate-100">
            <button
              onClick={handleProcessData}
              disabled={isProcessing}
              className="flex items-center space-x-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transition-all"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Forecast...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Execute & Save to Database</span>
                </>
              )}
            </button>
            <button
              onClick={handleReset}
              disabled={isProcessing}
              className="flex items-center space-x-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 px-6 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          </div>
        </section>

        {/* Missing Customers Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 md:p-8 space-y-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-amber-100 text-amber-800 rounded-2xl">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    New Customers Detected!
                  </h3>
                  <p className="text-xs text-slate-500">
                    The uploaded sheet contains {missingCustomers.length} customer(s) not in the database. Please specify their classification to save them permanently.
                  </p>
                </div>
              </div>

              {/* Customer List with Direct/Indirect Radio buttons */}
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {missingCustomers.map((cust) => {
                  const currentChoice = missingClassification[cust] || 'DIRECT';
                  return (
                    <div
                      key={cust}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <span className="text-xs font-bold text-slate-800 truncate max-w-[240px]">
                        {cust}
                      </span>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setMissingClassification(prev => ({ ...prev, [cust]: 'DIRECT' }));
                          }}
                          className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                            currentChoice === 'DIRECT'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <Globe2 className="w-3.5 h-3.5" />
                          <span>Direct (Export)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMissingClassification(prev => ({ ...prev, [cust]: 'INDIRECT' }));
                          }}
                          className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                            currentChoice === 'INDIRECT'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <Building2 className="w-3.5 h-3.5" />
                          <span>Indirect (Local)</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleModalSave}
                  className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md transition-all"
                >
                  Save & Save Forecast
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
