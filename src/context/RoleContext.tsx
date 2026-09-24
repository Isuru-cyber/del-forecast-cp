'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CustomerFilter } from '@/lib/types';

export type UserRole = 'admin' | 'viewer';
export type AppTheme = 'light' | 'navy' | 'dark' | 'emerald';

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  loginAsAdmin: (password: string) => boolean;
  logoutAdmin: () => void;
  customerFilter: CustomerFilter;
  setCustomerFilter: (filter: CustomerFilter) => void;
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>('viewer'); // DEFAULT TO VIEWER
  const [customerFilter, setCustomerFilter] = useState<CustomerFilter>('ALL');
  const [theme, setThemeState] = useState<AppTheme>('light'); // DEFAULT TO LIGHT MODE as requested!

  useEffect(() => {
    // 1. Role preference (Only stay admin if explicitly saved as admin)
    const savedRole = localStorage.getItem('cp_del_role') as UserRole;
    if (savedRole === 'admin') {
      setRoleState('admin');
    } else {
      setRoleState('viewer');
    }

    // 2. Theme preference (Default is 'light')
    const savedTheme = localStorage.getItem('cp_del_theme') as AppTheme;
    const initialTheme: AppTheme = savedTheme && ['light', 'navy', 'dark', 'emerald'].includes(savedTheme)
      ? savedTheme
      : 'light';

    applyThemeClass(initialTheme);
    setThemeState(initialTheme);
  }, []);

  const applyThemeClass = (t: AppTheme) => {
    const root = document.documentElement;
    root.classList.remove('dark', 'theme-navy', 'theme-slate', 'theme-emerald');

    if (t === 'light') {
      // Clean light mode
      return;
    }

    root.classList.add('dark');
    if (t === 'navy') {
      root.classList.add('theme-navy');
    } else if (t === 'emerald') {
      root.classList.add('theme-emerald');
    } else {
      root.classList.add('theme-slate');
    }
  };

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem('cp_del_role', newRole);
  };

  const loginAsAdmin = (password: string): boolean => {
    if (password.trim() === 'admin123') {
      setRoleState('admin');
      localStorage.setItem('cp_del_role', 'admin');
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setRoleState('viewer');
    localStorage.setItem('cp_del_role', 'viewer');
  };

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('cp_del_theme', newTheme);
    applyThemeClass(newTheme);
  };

  return (
    <AppContext.Provider value={{ role, setRole, loginAsAdmin, logoutAdmin, customerFilter, setCustomerFilter, theme, setTheme }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
