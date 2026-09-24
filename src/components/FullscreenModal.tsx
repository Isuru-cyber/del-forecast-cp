'use client';

import React, { useEffect } from 'react';
import { Minimize2 } from 'lucide-react';

interface FullscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  noPadding?: boolean;
}

export function FullscreenModal({
  isOpen,
  onClose,
  title,
  children,
  noPadding = true, // Default to true for true edge-to-edge flush presentation
}: FullscreenModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-white dark:bg-navy-950 overflow-hidden w-screen h-screen m-0 p-0 animate-in fade-in duration-150">
      {/* 0 margin, 100% flush header bar */}
      <div className="w-full px-4 py-2 border-b border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-900 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
          <h2 className="text-xs font-bold text-slate-900 dark:text-white tracking-wider uppercase">
            {title}
          </h2>
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-200/70 dark:bg-navy-800 px-2 py-0.5 rounded">
            Full Screen View (Esc to exit)
          </span>
        </div>
        <button
          onClick={onClose}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition-all shadow-sm"
        >
          <Minimize2 className="w-3.5 h-3.5" />
          <span>Exit Full Screen</span>
        </button>
      </div>

      {/* Fullscreen Body - 100% Edge-to-edge flush with zero margins */}
      <div
        className={`flex-1 overflow-auto custom-scrollbar bg-slate-50/50 dark:bg-navy-950 ${
          noPadding ? 'p-0 m-0' : 'p-3'
        }`}
      >
        {children}
      </div>
    </div>
  );
}
