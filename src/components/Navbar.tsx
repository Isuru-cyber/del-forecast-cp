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
  Lock,
  KeyRound,
  X,
} from 'lucide-react';

interface NavbarProps {
  lastUpdated?: string;
  uploadedBy?: string;
}

export function Navbar({ lastUpdated, uploadedBy }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { role, loginAsAdmin, logoutAdmin, customerFilter, setCustomerFilter, theme, setTheme } = useApp();
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleAdminLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPasswordError(null);
    const success = loginAsAdmin(adminPasswordInput);
    if (success) {
      setShowPasswordModal(false);
      setAdminPasswordInput('');
    } else {
      setPasswordError('Incorrect password. Please enter the valid admin password.');
    }
  };

  const handleLogout = () => {
    logoutAdmin();
    if (pathname === '/customers' || pathname === '/upload') {
      router.push('/');
    }
  };

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
      <div className="max-w-[1750px] mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between py-2 gap-2 flex-nowrap">
          
          {/* Logo / Brand Name: Strictly single line, compact executive style */}
          <div className="flex items-center shrink-0">
            <LinkComponent href="/" className="flex items-center space-x-1 sm:space-x-1.5 hover:opacity-95 transition-opacity">
              <h1 className="hidden sm:inline-block font-black tracking-tight bg-gradient-to-r from-blue-800 via-indigo-600 to-blue-900 dark:from-blue-400 dark:via-sky-300 dark:to-indigo-300 bg-clip-text text-transparent text-sm sm:text-base uppercase select-none whitespace-nowrap">
                DELIVERY FORECAST
              </h1>
              <span className="px-2 py-0.5 text-xs sm:text-[10px] font-black bg-blue-600 text-white rounded border border-blue-700 dark:border-blue-500 tracking-wider whitespace-nowrap shadow-xs">
                CP
              </span>
            </LinkComponent>
          </div>

          {/* Center: Direct / Indirect Global Filter Buttons */}
          <div className="flex items-center bg-slate-100 dark:bg-navy-800 p-0.5 rounded-xl border border-slate-200 dark:border-navy-700 shadow-inner shrink-0">
            <button
              onClick={() => setCustomerFilter('ALL')}
              className={`flex items-center space-x-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                customerFilter === 'ALL'
                  ? 'bg-white dark:bg-navy-700 text-slate-900 dark:text-white shadow-sm border border-slate-200/80 dark:border-navy-600 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>All</span>
            </button>
            <button
              onClick={() => setCustomerFilter('DIRECT')}
              title="Direct (Export)"
              className={`flex items-center space-x-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                customerFilter === 'DIRECT'
                  ? 'bg-emerald-600 text-white shadow-sm font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Globe2 className="w-3.5 h-3.5" />
              <span>Direct<span className="hidden xl:inline"> (Export)</span></span>
            </button>
            <button
              onClick={() => setCustomerFilter('INDIRECT')}
              title="Indirect (Local)"
              className={`flex items-center space-x-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                customerFilter === 'INDIRECT'
                  ? 'bg-indigo-600 text-white shadow-sm font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Indirect<span className="hidden xl:inline"> (Local)</span></span>
            </button>
          </div>

          {/* Right Navigation & Controls */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0 flex-nowrap">
            {/* Last update timestamp: compact and only visible on 2xl screens to preserve space */}
            {lastUpdated && (
              <div
                title={`Last Updated: ${formatTimestamp(lastUpdated)}`}
                className="hidden 2xl:flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-[11px] text-slate-600 dark:text-slate-300 whitespace-nowrap"
              >
                <Clock className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                <span className="text-slate-400 dark:text-slate-500">Updated:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{formatTimestamp(lastUpdated)}</span>
              </div>
            )}

            {/* Nav Links: Dashboard, Analysis, Customers, Upload */}
            <div className="flex items-center space-x-0.5 bg-slate-100 dark:bg-navy-800 p-0.5 rounded-xl border border-slate-200 dark:border-navy-700 shrink-0">
              <LinkComponent
                href="/"
                className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  pathname === '/'
                    ? 'bg-blue-700 text-white shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-navy-700'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="hidden min-[420px]:inline">Dashboard</span>
              </LinkComponent>

              <LinkComponent
                href="/analysis"
                className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  pathname === '/analysis'
                    ? 'bg-blue-700 text-white shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-navy-700'
                }`}
              >
                <LineChart className="w-3.5 h-3.5" />
                <span className="hidden min-[420px]:inline">Analysis</span>
              </LinkComponent>

              {role === 'admin' && (
                <>
                  <LinkComponent
                    href="/customers"
                    className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      pathname === '/customers'
                        ? 'bg-blue-700 text-white shadow-sm font-bold'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-navy-700'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span className="hidden min-[480px]:inline">Customers</span>
                  </LinkComponent>

                  <LinkComponent
                    href="/upload"
                    className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      pathname === '/upload'
                        ? 'bg-blue-700 text-white shadow-sm font-bold'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-navy-700'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span className="hidden min-[480px]:inline">Upload</span>
                  </LinkComponent>
                </>
              )}
            </div>

            {/* Multiple Themes Selector Dropdown */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                title="Change Theme"
                className="flex items-center space-x-1 px-2 sm:px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-navy-800 dark:hover:bg-navy-700 border border-slate-200 dark:border-navy-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all whitespace-nowrap shadow-2xs"
              >
                <Palette className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="hidden lg:inline">Theme</span>
              </button>

              {showThemeMenu && (
                <>
                  {/* Backdrop for outside click dismiss */}
                  <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={() => setShowThemeMenu(false)}
                  />
                  <div
                    className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-navy-800 rounded-xl shadow-2xl border border-slate-200 dark:border-navy-700 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 ring-1 ring-black/5"
                  >
                    <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-navy-700/60 mb-1">
                      Select Theme
                    </div>
                    {themes.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setTheme(t.id);
                          setShowThemeMenu(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors ${
                          theme === t.id
                            ? 'bg-blue-50 dark:bg-navy-700 font-bold text-blue-700 dark:text-blue-300'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-700/60'
                        }`}
                      >
                        <span className="flex items-center space-x-2.5">
                          <span className="text-sm">{t.icon}</span>
                          <span className="font-medium">{t.label}</span>
                        </span>
                        {theme === t.id && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Role & Admin Access Control - Hidden on mobile view as requested */}
            <div className="hidden sm:flex items-center shrink-0">
              {role === 'admin' ? (
                <div className="flex items-center space-x-1 bg-amber-50 dark:bg-amber-950/60 p-0.5 rounded-xl border border-amber-300 dark:border-amber-700/60 shadow-xs">
                  <div className="flex items-center space-x-1 px-1.5 py-0.5 text-[11px] font-bold text-amber-800 dark:text-amber-300 whitespace-nowrap">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span className="hidden md:inline">Admin Mode</span>
                    <span className="md:hidden">Admin</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    title="Lock Admin and return to Viewer mode"
                    className="flex items-center space-x-1 px-1.5 py-0.5 rounded-lg text-[10px] font-bold bg-white dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 border border-slate-200 dark:border-navy-700 shadow-2xs transition-colors whitespace-nowrap"
                  >
                    <Lock className="w-3 h-3" />
                    <span>Lock</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setPasswordError(null);
                    setAdminPasswordInput('');
                    setShowPasswordModal(true);
                  }}
                  title="Unlock Admin Access with Password"
                  className="flex items-center space-x-1 px-2 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-navy-800 dark:hover:bg-navy-700 border border-slate-200 dark:border-navy-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all shadow-2xs whitespace-nowrap"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Admin</span>
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Admin Password Prompt Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-navy-900 rounded-2xl max-w-sm w-full p-5 border border-slate-200 dark:border-navy-700 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-navy-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-xl">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Admin Access Required
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Enter password to unlock Admin controls.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Admin Password
                </label>
                <input
                  type="password"
                  autoFocus
                  placeholder="Enter admin password (e.g. admin123)"
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white"
                />
              </div>

              {passwordError && (
                <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 font-medium">
                  {passwordError}
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-navy-800">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow transition-all flex items-center space-x-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Unlock Admin</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
