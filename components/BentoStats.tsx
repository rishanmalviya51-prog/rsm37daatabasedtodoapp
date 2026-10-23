import React from "react";
import { Flame, Target, TrendingUp, CheckCircle2 } from "lucide-react";

interface BentoStatsProps {
  totalStreak: number;
  completionRate: number;
  habitsDone: number;
  totalHabits: number;
  onQuickCompleteAll?: () => void;
}

export const BentoStats: React.FC<BentoStatsProps> = ({ 
  totalStreak, 
  completionRate, 
  habitsDone, 
  totalHabits,
  onQuickCompleteAll
}) => {
  const allDone = totalHabits > 0 && habitsDone >= totalHabits;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {/* Primary Streak Banner */}
      <div className="col-span-2 p-5 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-transparent dark:from-neon-surface dark:to-black dark:border dark:border-orange-500/30 rounded-3xl shadow-sm border border-orange-200/50 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
          <Flame size={84} className="text-orange-500 dark:text-orange-400" />
        </div>
        <div className="relative z-10 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-bold text-xs uppercase tracking-wider">
              <Flame size={15} className="fill-current" /> Best Streak
            </div>
            {allDone && (
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                All 100% Done!
              </span>
            )}
          </div>
          <div className="mt-2">
            <div className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tabular-nums font-mono tracking-tight">
              {totalStreak} <span className="text-sm font-medium text-gray-500 dark:text-gray-400 font-sans">days</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {totalStreak > 0 ? "Daily compound consistency active." : "Log a habit today to ignite your streak."}
            </p>
          </div>
        </div>
      </div>

      {/* Completion Rate */}
      <div className="col-span-1 p-4 bg-white/70 dark:bg-neon-surface/70 backdrop-blur-md rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm flex flex-col justify-between group hover:border-indigo-300 dark:hover:border-neon-secondary/40 transition-colors">
        <div className="flex items-center justify-between text-gray-400 dark:text-neon-secondary">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">7-Day</span>
          <TrendingUp size={18} />
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums font-mono">
            {completionRate}%
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Weekly Rate</div>
        </div>
      </div>

      {/* Today's Goals */}
      <div className="col-span-1 p-4 bg-white/70 dark:bg-neon-surface/70 backdrop-blur-md rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-emerald-300 dark:hover:border-neon-primary/40 transition-colors">
        <div className="flex items-center justify-between text-emerald-600 dark:text-neon-primary">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Today</span>
          <Target size={18} />
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums font-mono">
            {habitsDone}<span className="text-gray-400 text-lg font-normal">/{totalHabits}</span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Completed</div>
        </div>
      </div>
    </div>
  );
};
