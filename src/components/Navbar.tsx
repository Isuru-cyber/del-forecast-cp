'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/RoleContext';
import {
  FileSpreadsheet,
  Upload,
  Users,
  LayoutDashboard,
  ShieldCheck,
  Eye,
  Clock,
  Globe2,
  Building2,
  Layers,
} from 'lucide-react';

interface NavbarProps {
  lastUpdated?: string;
  uploadedBy?: string;
}

export function Navbar({ lastUpdated, uploadedBy }: NavbarProps) {
  const pathname = usePathname();
  const { role, setRole, customerFilter, setCustomerFilter } = useApp();

  const formatTimestamp = (dateStr?: string) => {
    if (!dateStr) return 'No forecast loaded';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur shadow-sm">
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between py-3.5 gap-3">
          
          {/* Logo & Subtitle */}
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 bg-gradient-to-br from-blue-700 to-indigo-900 rounded-xl shadow-md text-white">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-slate-900">
                  Covering Plant
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 uppercase tracking-wider">
                  v2.0 Enterprise
                </span>
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-blue-700">
                Delivery Forecast System
              </p>
            </div>
          </div>

          {/* Center: Direct / Indirect Global Filter Buttons */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
            <button
              onClick={() => setCustomerFilter('ALL')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                customerFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>All Customers</span>
            </button>
            <button
              onClick={() => setCustomerFilter('DIRECT')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                customerFilter === 'DIRECT'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Globe2 className="w-3.5 h-3.5" />
              <span>Direct (Export)</span>
            </button>
            <button
              onClick={() => setCustomerFilter('INDIRECT')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                customerFilter === 'INDIRECT'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Indirect (Local)</span>
            </button>
          </div>

          {/* Right Navigation & Role Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Last update timestamp */}
            {lastUpdated && (
              <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-semibold text-slate-500">Updated:</span>
                <span className="font-bold text-slate-800">{formatTimestamp(lastUpdated)}</span>
                {uploadedBy && (
                  <span className="text-[10px] text-slate-400">({uploadedBy})</span>
                )}
              </div>
            )}

            {/* Nav Links */}
            <div className="flex items-center space-x-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
              <Link
                href="/"
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  pathname === '/'
                    ? 'bg-blue-700 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>

              {role === 'admin' && (
                <>
                  <Link
                    href="/customers"
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      pathname === '/customers'
                        ? 'bg-blue-700 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Customers</span>
                  </Link>

                  <Link
                    href="/upload"
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      pathname === '/upload'
                        ? 'bg-blue-700 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Data</span>
                  </Link>
                </>
              )}
            </div>

            {/* Role Switcher Pill */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                onClick={() => setRole('admin')}
                title="Switch to Admin role"
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  role === 'admin'
                    ? 'bg-slate-900 text-amber-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <ShieldCheck className="w-3 h-3 text-amber-400" />
                <span>Admin</span>
              </button>
              <button
                onClick={() => setRole('viewer')}
                title="Switch to Viewer role"
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  role === 'viewer'
                    ? 'bg-white text-blue-700 shadow-sm border border-slate-200/60'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Eye className="w-3 h-3 text-blue-600" />
                <span>Viewer</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
