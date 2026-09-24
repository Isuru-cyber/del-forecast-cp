'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Customer, CustomerType } from '@/lib/types';
import {
  Users,
  Search,
  Plus,
  Globe2,
  Building2,
  Loader2,
  ArrowLeft,
  X,
  Layers,
  ArrowUpDown,
} from 'lucide-react';

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'DIRECT' | 'INDIRECT'>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Add customer modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<CustomerType>('DIRECT');
  const [addError, setAddError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      if (data.success && Array.isArray(data.customers)) {
        setCustomers(data.customers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleToggleType = async (cust: Customer) => {
    const nextType: CustomerType = cust.type === 'DIRECT' ? 'INDIRECT' : 'DIRECT';
    setUpdatingId(cust.id);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cust.name, type: nextType }),
      });
      const data = await res.json();
      if (data.success) {
        setCustomers(prev =>
          prev.map(c => (c.name === cust.name ? { ...c, type: nextType } : c))
        );
      }
    } catch (err) {
      console.error('Error toggling type:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setAddError('Customer name cannot be empty');
      return;
    }

    setIsAdding(true);
    setAddError(null);

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), type: newType }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to add customer');
      }

      setNewName('');
      setShowAddModal(false);
      fetchCustomers();
    } catch (err: any) {
      setAddError(err.message || 'Error adding customer');
    } finally {
      setIsAdding(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchesType = typeFilter === 'ALL' || c.type === typeFilter;
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [customers, typeFilter, search]);

  const directCount = customers.filter(c => c.type === 'DIRECT').length;
  const indirectCount = customers.filter(c => c.type === 'INDIRECT').length;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50 dark:bg-navy-950 transition-colors">
      <Navbar />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* Header toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <button
              onClick={() => router.push('/')}
              className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white text-xs font-semibold uppercase tracking-wider mb-1 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-700 dark:text-blue-400" />
              <span>Customer Master Directory</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage Direct (Export) and Indirect (Local) customer categories
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-xl font-semibold text-xs uppercase tracking-wider shadow transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Account</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div
            onClick={() => setTypeFilter('ALL')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              typeFilter === 'ALL'
                ? 'bg-blue-900 dark:bg-navy-700 text-white border-blue-900 dark:border-navy-600 shadow'
                : 'bg-white dark:bg-navy-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-navy-700 hover:border-blue-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">All Accounts</span>
              <Layers className="w-3.5 h-3.5 opacity-80" />
            </div>
            <p className="text-xl font-bold mt-1">{customers.length}</p>
          </div>

          <div
            onClick={() => setTypeFilter('DIRECT')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              typeFilter === 'DIRECT'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                : 'bg-white dark:bg-navy-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-navy-700 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Direct (Export)</span>
              <Globe2 className="w-3.5 h-3.5 opacity-80" />
            </div>
            <p className="text-xl font-bold mt-1">{directCount}</p>
          </div>

          <div
            onClick={() => setTypeFilter('INDIRECT')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              typeFilter === 'INDIRECT'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                : 'bg-white dark:bg-navy-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-navy-700 hover:border-indigo-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Indirect (Local)</span>
              <Building2 className="w-3.5 h-3.5 opacity-80" />
            </div>
            <p className="text-xl font-bold mt-1">{indirectCount}</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white dark:bg-navy-800 p-3 rounded-xl border border-slate-200 dark:border-navy-700 shadow-sm flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-800 dark:text-slate-100"
            />
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="text-blue-700 dark:text-blue-400 font-bold">{filteredCustomers.length}</span> accounts
          </span>
        </div>

        {/* Customers Table */}
        <div className="bg-white dark:bg-navy-800 rounded-xl shadow-sm border border-slate-200 dark:border-navy-700 overflow-hidden">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-2">
              <Loader2 className="w-6 h-6 text-blue-700 dark:text-blue-400 animate-spin" />
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Loading Customer Master...</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[580px] custom-scrollbar">
              <table className="w-full">
                <thead className="sticky top-0 bg-slate-50 dark:bg-navy-900 z-10 border-b border-slate-200 dark:border-navy-700">
                  <tr>
                    <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase">Customer Name</th>
                    <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase w-44">Category</th>
                    <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase w-40">Toggle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-navy-700">
                  {filteredCustomers.map((cust) => (
                    <tr key={cust.id || cust.name} className="hover:bg-blue-50/40 dark:hover:bg-blue-950/30 transition-colors">
                      <td className="px-5 py-2.5 font-semibold text-slate-800 dark:text-slate-200 text-xs">
                        {cust.name}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span
                          className={`inline-flex items-center space-x-1 text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                            cust.type === 'DIRECT'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                          }`}
                        >
                          {cust.type === 'DIRECT' ? (
                            <>
                              <Globe2 className="w-3 h-3 mr-1" />
                              <span>Direct</span>
                            </>
                          ) : (
                            <>
                              <Building2 className="w-3 h-3 mr-1" />
                              <span>Local</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <button
                          onClick={() => handleToggleType(cust)}
                          disabled={updatingId === cust.id}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md border border-slate-200 dark:border-navy-600 hover:border-blue-400 bg-slate-50 dark:bg-navy-900 text-slate-700 dark:text-slate-300 text-[10px] font-semibold transition-all disabled:opacity-50"
                        >
                          {updatingId === cust.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                          )}
                          <span>Switch to {cust.type === 'DIRECT' ? 'Local' : 'Direct'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Customer Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-navy-700 max-w-sm w-full p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-navy-700">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                  <span>Add Customer Account</span>
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddCustomer} className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Customer Name (ERP Match)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MAS ACTIVE (PVT) LTD"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-600 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Classification
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewType('DIRECT')}
                      className={`flex items-center justify-center space-x-1 p-2 rounded-lg border font-bold text-xs transition-all ${
                        newType === 'DIRECT'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-navy-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-navy-700'
                      }`}
                    >
                      <Globe2 className="w-3.5 h-3.5" />
                      <span>Direct</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewType('INDIRECT')}
                      className={`flex items-center justify-center space-x-1 p-2 rounded-lg border font-bold text-xs transition-all ${
                        newType === 'INDIRECT'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-navy-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-navy-700'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Local</span>
                    </button>
                  </div>
                </div>

                {addError && (
                  <p className="text-xs text-red-600 bg-red-50 dark:bg-red-950/60 p-2 rounded-lg border border-red-200 dark:border-red-900">
                    {addError}
                  </p>
                )}

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAdding}
                    className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow transition-all disabled:opacity-50"
                  >
                    {isAdding ? 'Saving...' : 'Add Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
