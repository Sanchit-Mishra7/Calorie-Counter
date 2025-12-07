import React, { useEffect } from 'react';
import { Check, X } from 'lucide-react';

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className="fixed top-4 right-4 z-[120] animate-fade-in-down pointer-events-auto">
      <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
        <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
        <span className="font-medium text-sm">{message}</span>
        <button onClick={onClose} className="text-slate-400 hover:text-white dark:hover:text-slate-700 ml-2">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};