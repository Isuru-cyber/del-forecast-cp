'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CustomerFilter } from '@/lib/types';

export type UserRole = 'admin' | 'viewer';

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  customerFilter: CustomerFilter;
  setCustomerFilter: (filter: CustomerFilter) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>('admin');
  const [customerFilter, setCustomerFilter] = useState<CustomerFilter>('ALL');

  useEffect(() => {
    const savedRole = localStorage.getItem('cp_del_role') as UserRole;
    if (savedRole && (savedRole === 'admin' || savedRole === 'viewer')) {
      setRoleState(savedRole);
    }
  }, []);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem('cp_del_role', newRole);
  };

  return (
    <AppContext.Provider value={{ role, setRole, customerFilter, setCustomerFilter }}>
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
