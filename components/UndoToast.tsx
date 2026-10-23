import React, { useEffect, useState } from 'react';
import { RotateCcw, X } from 'lucide-react';
import { ToastMessage } from '../types';

interface UndoToastProps {
  message: ToastMessage | null;
  onDismiss: () => void;
}

export const UndoToast: React.FC<UndoToastProps> = ({ message, onDismiss }) => {
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (message) {
      const duration = message.duration || 6000;
      setCountdown(Math.ceil(duration / 1000));
      
      const interval = setInterval(() => {
        setCountdown((c) => Math.max(0, c - 1));
      }, 1000);

      const timer = setTimeout(onDismiss, duration);
      
      return () => { 
        clearTimeout(timer); 
        clearInterval(interval); 
      };
    }
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 animate-bounce-in w-full max-w-sm px-4">
      <div className="flex items-center justify-between gap-4 bg-gray-900/95 dark:bg-bone-50/95 backdrop-blur-md text-white dark:text-gray-900 px-5 py-3.5 rounded-2xl shadow-2xl border border-white/10 dark:border-black/5">
        <span className="text-sm font-medium truncate">{message.text}</span>
        
        <div className="flex items-center gap-3 shrink-0">
          {message.action && (
            <>
              <button
                onClick={() => {
                  message.action?.onClick();
                  onDismiss();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 dark:bg-black/5 hover:bg-white/20 dark:hover:bg-black/10 rounded-lg text-sm font-bold text-yellow-400 dark:text-blue-600 transition-colors"
              >
                <RotateCcw size={14} />
                {message.action.label}
              </button>
              <span className="text-xs text-white/40 dark:text-black/40 font-mono w-4">
                {countdown}s
              </span>
            </>
          )}
          
          <button 
            onClick={onDismiss} 
            className="p-1 text-white/50 dark:text-black/30 hover:text-white dark:hover:text-black transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
