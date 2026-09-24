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
  CheckCircle2,
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
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <button
              onClick={() => router.push('/')}
              className="flex items-center space-x-1.5 text-slate-500 hover:text-slate-800 text-xs font-bold uppercase tracking-wider mb-2 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-700" />
              <span>Customer Master Classification</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage Direct (Export) and Indirect (Local) customer categories saved in Supabase
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-blue-700 hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>

        {/* Filter & Metric Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            onClick={() => setTypeFilter('ALL')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              typeFilter === 'ALL'
                ? 'bg-blue-900 text-white border-blue-900 shadow-md'
                : 'bg-white text-slate-800 border-slate-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">All Customers</span>
              <Layers className="w-4 h-4 opacity-80" />
            </div>
            <p className="text-2xl font-black mt-2">{customers.length}</p>
          </div>

          <div
            onClick={() => setTypeFilter('DIRECT')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              typeFilter === 'DIRECT'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">Direct (Export)</span>
              <Globe2 className="w-4 h-4 opacity-80" />
            </div>
            <p className="text-2xl font-black mt-2">{directCount}</p>
          </div>

          <div
            onClick={() => setTypeFilter('INDIRECT')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              typeFilter === 'INDIRECT'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                : 'bg-white text-slate-800 border-slate-200 hover:border-indigo-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">Indirect (Local)</span>
              <Building2 className="w-4 h-4 opacity-80" />
            </div>
            <p className="text-2xl font-black mt-2">{indirectCount}</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all text-slate-800"
            />
          </div>
          <span className="text-xs font-bold text-slate-500">
            Showing <span className="text-blue-700 font-extrabold">{filteredCustomers.length}</span> records
          </span>
        </div>

        {/* Customers Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-blue-700 animate-spin" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loading Customer Master...</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
              <table className="w-full">
                <thead className="sticky top-0 bg-blue-50/95 backdrop-blur z-10 border-b border-blue-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-[11px] font-bold text-blue-900 uppercase">Customer Name</th>
                    <th className="px-6 py-4 text-center text-[11px] font-bold text-blue-900 uppercase w-48">Classification</th>
                    <th className="px-6 py-4 text-center text-[11px] font-bold text-blue-900 uppercase w-40">Quick Toggle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCustomers.map((cust) => (
                    <tr key={cust.id || cust.name} className="hover:bg-blue-50/40 transition-colors">
                      <td className="px-6 py-3.5 font-bold text-slate-800 text-xs">
                        {cust.name}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center space-x-1 text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${
                            cust.type === 'DIRECT'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}
                        >
                          {cust.type === 'DIRECT' ? (
                            <>
                              <Globe2 className="w-3 h-3 mr-1" />
                              <span>Direct (Export)</span>
                            </>
                          ) : (
                            <>
                              <Building2 className="w-3 h-3 mr-1" />
                              <span>Indirect (Local)</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <button
                          onClick={() => handleToggleType(cust)}
                          disabled={updatingId === cust.id}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-white text-slate-700 text-[11px] font-bold transition-all disabled:opacity-50"
                        >
                          {updatingId === cust.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 text-blue-600" />
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-700" />
                  <span>Add New Customer</span>
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddCustomer} className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Customer Name (Exact ERP Match)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MAS FABRICS (PVT) LTD"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Classification
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNewType('DIRECT')}
                      className={`flex items-center justify-center space-x-1.5 p-3 rounded-xl border font-bold text-xs transition-all ${
                        newType === 'DIRECT'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Globe2 className="w-4 h-4" />
                      <span>Direct (Export)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewType('INDIRECT')}
                      className={`flex items-center justify-center space-x-1.5 p-3 rounded-xl border font-bold text-xs transition-all ${
                        newType === 'INDIRECT'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Building2 className="w-4 h-4" />
                      <span>Indirect (Local)</span>
                    </button>
                  </div>
                </div>

                {addError && (
                  <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                    {addError}
                  </p>
                )}

                <div className="flex items-center justify-end space-x-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAdding}
                    className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md transition-all disabled:opacity-50"
                  >
                    {isAdding ? 'Adding...' : 'Add Customer'}
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
