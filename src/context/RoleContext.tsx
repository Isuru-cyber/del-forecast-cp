'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CustomerFilter } from '@/lib/types';

export type UserRole = 'admin' | 'viewer';
export type AppTheme = 'dark' | 'light';

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  customerFilter: CustomerFilter;
  setCustomerFilter: (filter: CustomerFilter) => void;
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>('admin');
  const [customerFilter, setCustomerFilter] = useState<CustomerFilter>('ALL');
  const [theme, setThemeState] = useState<AppTheme>('dark'); // Default to Executive Midnight Navy

  useEffect(() => {
    const savedRole = localStorage.getItem('cp_del_role') as UserRole;
    if (savedRole && (savedRole === 'admin' || savedRole === 'viewer')) {
      setRoleState(savedRole);
    }

    const savedTheme = localStorage.getItem('cp_del_theme') as AppTheme;
    if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light')) {
      setThemeState(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
      // Default to dark mode
      document.documentElement.classList.add('dark');
    }
  }, []);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem('cp_del_role', newRole);
  };

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('cp_del_theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  return (
    <AppContext.Provider value={{ role, setRole, customerFilter, setCustomerFilter, theme, setTheme, toggleTheme }}>
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
