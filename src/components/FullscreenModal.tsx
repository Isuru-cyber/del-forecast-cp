'use client';

import React, { useEffect } from 'react';
import { Minimize2, X } from 'lucide-react';

interface FullscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function FullscreenModal({ isOpen, onClose, title, children }: FullscreenModalProps) {
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
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="flex-1 flex flex-col m-2 md:m-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 shadow-2xl overflow-hidden">
        {/* Fullscreen Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-wide uppercase">
              {title}
            </h2>
            <span className="text-[10px] font-semibold text-slate-400 bg-slate-200/60 dark:bg-navy-700 px-2 py-0.5 rounded">
              Presentation View (Esc to exit)
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-200/70 hover:bg-slate-300 dark:bg-navy-700 dark:hover:bg-navy-600 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Close</span>
          </button>
        </div>

        {/* Fullscreen Body */}
        <div className="flex-1 p-5 overflow-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}
