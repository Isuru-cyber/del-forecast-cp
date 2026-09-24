'use client';

import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, Check, Loader2, ArrowRight } from 'lucide-react';
import { CustomerType } from '@/lib/types';

interface UnmappedCustomerAlertProps {
  unmappedCustomers?: string[];
  onClassified?: () => void;
}

export function UnmappedCustomerAlert({
  unmappedCustomers = [],
  onClassified,
}: UnmappedCustomerAlertProps) {
  const [showModal, setShowModal] = useState(false);
  const [classifications, setClassifications] = useState<Record<string, CustomerType>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!unmappedCustomers || unmappedCustomers.length === 0) {
    return null;
  }

  const handleOpenModal = () => {
    // Initialize classifications map with default 'DIRECT'
    const init: Record<string, CustomerType> = {};
    unmappedCustomers.forEach((c) => {
      init[c] = classifications[c] || 'INDIRECT';
    });
    setClassifications(init);
    setError(null);
    setShowModal(true);
  };

  const handleSaveClassifications = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      for (const custName of unmappedCustomers) {
        const chosenType = classifications[custName] || 'INDIRECT';
        const res = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: custName, type: chosenType }),
        });
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || `Failed to classify customer ${custName}`);
        }
      }

      setShowModal(false);
      if (onClassified) {
        onClassified();
      }
    } catch (err: any) {
      console.error('Error saving customer classifications:', err);
      setError(err.message || 'Error saving classifications. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* High-Visibility Banner */}
      <div className="w-full bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-900 rounded-xl p-3 sm:p-4 shadow-sm animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 rounded-lg shrink-0 mt-0.5 sm:mt-0">
              <AlertTriangle className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-rose-600 text-white rounded tracking-wider">
                  Data Warning
                </span>
                <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200">
                  {unmappedCustomers.length} Unmapped Customer{unmappedCustomers.length > 1 ? 's' : ''} in Active Forecast
                </h4>
              </div>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">
                The following account{unmappedCustomers.length > 1 ? 's are' : ' is'} missing from the Customer Master Directory:
              </p>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {unmappedCustomers.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-white dark:bg-navy-900 text-rose-900 dark:text-rose-200 border border-rose-200 dark:border-rose-800 font-mono shadow-xs"
                  >
                    {c}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-1 italic">
                * To protect executive reporting, unclassified accounts are NOT auto-assigned to Direct. Please classify below.
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenModal}
            className="w-full sm:w-auto px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-bold shadow transition-all flex items-center justify-center space-x-1.5 shrink-0"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Classify & Fix Now</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>
      </div>

      {/* Interactive Classification Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-navy-900 rounded-2xl max-w-lg w-full p-5 border border-slate-200 dark:border-navy-700 shadow-xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-navy-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-300 rounded-xl">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Classify Unmapped Customers
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Assign Direct (Export) or Indirect (Local) to resolve portfolio metrics.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
              {unmappedCustomers.map((custName) => {
                const currentChoice = classifications[custName] || 'INDIRECT';
                return (
                  <div
                    key={custName}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 space-y-2"
                  >
                    <p className="text-xs font-bold text-slate-900 dark:text-white font-mono break-words">
                      {custName}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() =>
                          setClassifications((prev) => ({ ...prev, [custName]: 'DIRECT' }))
                        }
                        className={`p-2 rounded-lg border font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                          currentChoice === 'DIRECT'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white dark:bg-navy-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-navy-700 hover:bg-slate-100 dark:hover:bg-navy-800'
                        }`}
                      >
                        {currentChoice === 'DIRECT' && <Check className="w-3.5 h-3.5" />}
                        <span>Direct (Export)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setClassifications((prev) => ({ ...prev, [custName]: 'INDIRECT' }))
                        }
                        className={`p-2 rounded-lg border font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                          currentChoice === 'INDIRECT'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white dark:bg-navy-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-navy-700 hover:bg-slate-100 dark:hover:bg-navy-800'
                        }`}
                      >
                        {currentChoice === 'INDIRECT' && <Check className="w-3.5 h-3.5" />}
                        <span>Indirect (Local)</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-navy-800">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveClassifications}
                disabled={isSubmitting}
                className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow transition-all flex items-center space-x-1.5"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save to Master & Apply</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
