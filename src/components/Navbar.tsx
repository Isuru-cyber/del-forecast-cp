'use client';

import React, { useState } from 'react';
import Link from 'next/navigation';
import LinkComponent from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp, AppTheme } from '@/context/RoleContext';
import {
  Upload,
  Users,
  LayoutDashboard,
  ShieldCheck,
  Eye,
  Clock,
  Globe2,
  Building2,
  Layers,
  Palette,
  Check,
  LineChart,
} from 'lucide-react';

interface NavbarProps {
  lastUpdated?: string;
  uploadedBy?: string;
}

export function Navbar({ lastUpdated, uploadedBy }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { role, setRole, customerFilter, setCustomerFilter, theme, setTheme } = useApp();
  const [showThemeMenu, setShowThemeMenu] = useState(false);

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

  const themes: { id: AppTheme; label: string; icon: string }[] = [
    { id: 'light', label: 'Light', icon: '☀️' },
    { id: 'navy', label: 'Navy Blue', icon: '🌊' },
    { id: 'dark', label: 'Dark Slate', icon: '🌑' },
    { id: 'emerald', label: 'Emerald', icon: '🌲' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-navy-700 bg-white/95 dark:bg-navy-900/95 backdrop-blur shadow-sm">
      <div className="max-w-[1750px] mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between py-2.5 gap-2.5">
          
          {/* Logo / Brand Name: ALL CAPITAL, BOLD, EXECUTIVE CORPORATE GRADIENT */}
          <div className="flex items-center">
            <LinkComponent href="/" className="hover:opacity-95 transition-opacity">
              <h1 className="font-black tracking-wide bg-gradient-to-r from-blue-800 via-indigo-600 to-blue-900 dark:from-blue-400 dark:via-sky-300 dark:to-indigo-300 bg-clip-text text-transparent text-base sm:text-lg md:text-xl uppercase select-none">
                DELIVERY FORECAST - CP
              </h1>
            </LinkComponent>
          </div>

          {/* Center: Direct / Indirect Global Filter Buttons */}
          <div className="flex items-center bg-slate-100 dark:bg-navy-800 p-0.5 rounded-xl border border-slate-200 dark:border-navy-700 shadow-inner">
            <button
              onClick={() => setCustomerFilter('ALL')}
              className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                customerFilter === 'ALL'
                  ? 'bg-white dark:bg-navy-700 text-slate-900 dark:text-white shadow-sm border border-slate-200/80 dark:border-navy-600 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>All Customers</span>
            </button>
            <button
              onClick={() => setCustomerFilter('DIRECT')}
              className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                customerFilter === 'DIRECT'
                  ? 'bg-emerald-600 text-white shadow-sm font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Globe2 className="w-3.5 h-3.5" />
              <span>Direct (Export)</span>
            </button>
            <button
              onClick={() => setCustomerFilter('INDIRECT')}
              className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                customerFilter === 'INDIRECT'
                  ? 'bg-indigo-600 text-white shadow-sm font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Indirect (Local)</span>
            </button>
          </div>

          {/* Right Navigation & Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Last update timestamp */}
            {lastUpdated && (
              <div className="hidden xl:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-[11px] text-slate-600 dark:text-slate-300">
                <Clock className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                <span className="text-slate-400 dark:text-slate-500">Updated:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{formatTimestamp(lastUpdated)}</span>
              </div>
            )}

            {/* Nav Links: Dashboard, Analysis, Customers, Upload */}
            <div className="flex items-center space-x-0.5 bg-slate-100 dark:bg-navy-800 p-0.5 rounded-xl border border-slate-200 dark:border-navy-700">
              <LinkComponent
                href="/"
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  pathname === '/'
                    ? 'bg-blue-700 text-white shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-navy-700'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </LinkComponent>

              <LinkComponent
                href="/analysis"
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  pathname === '/analysis'
                    ? 'bg-blue-700 text-white shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-navy-700'
                }`}
              >
                <LineChart className="w-3.5 h-3.5" />
                <span>Analysis</span>
              </LinkComponent>

              {role === 'admin' && (
                <>
                  <LinkComponent
                    href="/customers"
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      pathname === '/customers'
                        ? 'bg-blue-700 text-white shadow-sm font-bold'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-navy-700'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Customers</span>
                  </LinkComponent>

                  <LinkComponent
                    href="/upload"
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      pathname === '/upload'
                        ? 'bg-blue-700 text-white shadow-sm font-bold'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-navy-700'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                  </LinkComponent>
                </>
              )}
            </div>

            {/* Multiple Themes Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                title="Change Theme"
                className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-navy-800 dark:hover:bg-navy-700 border border-slate-200 dark:border-navy-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all"
              >
                <Palette className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="hidden sm:inline">Theme</span>
              </button>

              {showThemeMenu && (
                <div
                  className="absolute right-0 mt-2 w-48 bg-white dark:bg-navy-800 rounded-xl shadow-xl border border-slate-200 dark:border-navy-700 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
                  onMouseLeave={() => setShowThemeMenu(false)}
                >
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Select Theme
                  </div>
                  {themes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTheme(t.id);
                        setShowThemeMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors ${
                        theme === t.id
                          ? 'bg-blue-50 dark:bg-navy-700 font-bold text-blue-700 dark:text-blue-300'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-700/60'
                      }`}
                    >
                      <span className="flex items-center space-x-2">
                        <span>{t.icon}</span>
                        <span>{t.label}</span>
                      </span>
                      {theme === t.id && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Role Switcher Pill */}
            <div className="flex items-center bg-slate-100 dark:bg-navy-800 p-0.5 rounded-xl border border-slate-200 dark:border-navy-700">
              <button
                onClick={() => setRole('admin')}
                title="Switch to Admin role"
                className={`flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-all ${
                  role === 'admin'
                    ? 'bg-slate-900 dark:bg-navy-700 text-amber-400 shadow-sm font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-3 h-3 text-amber-400" />
                <span>Admin</span>
              </button>
              <button
                onClick={() => {
                  setRole('viewer');
                  if (pathname === '/customers' || pathname === '/upload') {
                    router.push('/');
                  }
                }}
                title="Switch to Viewer role"
                className={`flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-all ${
                  role === 'viewer'
                    ? 'bg-white dark:bg-navy-700 text-blue-700 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-navy-600 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Eye className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                <span>Viewer</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
