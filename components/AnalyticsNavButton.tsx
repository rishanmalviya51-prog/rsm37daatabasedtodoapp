import React from "react";
import { BarChart3, CheckSquare } from "lucide-react";

interface AnalyticsNavButtonProps {
  onClick: () => void;
  hideOnPanelOpen?: boolean;
  isPanelOpen?: boolean;
  isActive?: boolean;
}

export const AnalyticsNavButton: React.FC<AnalyticsNavButtonProps> = ({ 
  onClick, 
  hideOnPanelOpen = false, 
  isPanelOpen = false,
  isActive = false
}) => {
  if (hideOnPanelOpen && isPanelOpen) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isActive ? "Switch to Today view" : "Switch to Analytics view"}
      className={`
        inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shadow-sm
        focus:outline-none focus:ring-2 focus:ring-orange-300 dark:focus:ring-neon-primary
        ${isActive 
          ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-md' 
          : 'bg-white/80 dark:bg-neon-surface text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200/80 dark:border-white/10'
        }
      `}
    >
      {isActive ? (
        <>
          <CheckSquare size={15} />
          <span>Today View</span>
        </>
      ) : (
        <>
          <BarChart3 size={15} />
          <span>Analytics</span>
        </>
      )}
    </button>
  );
};
