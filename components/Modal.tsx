import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
      // Focus trap could be implemented here
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div 
        ref={modalRef}
        className="relative w-full max-w-lg bg-bone-50 dark:bg-gray-900 rounded-3xl shadow-2xl border border-white/50 dark:border-gray-800 transform transition-all animate-scale-in max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200/50 dark:border-gray-800 bg-bone-50/80 dark:bg-gray-900/80 backdrop-blur-md">
          <h2 id="modal-title" className="text-lg font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};
