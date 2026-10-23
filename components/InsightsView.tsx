import React, { useEffect, useState } from 'react';
import { Sparkles, Loader2, Download, CheckCircle2, Lightbulb, Zap, TrendingUp } from 'lucide-react';
import { Habit, LogEntry } from '../types';
import { generateHabitInsights, HabitInsightData } from '../services/geminiService';
import { FilterBar, FilterState } from './FilterBar';
import { ChartsPanel } from './ChartsPanel';

interface InsightsViewProps {
  habits: Habit[];
  logs: LogEntry[];
  onExport: () => void;
  onQuickLog?: (habitId: string, value: number) => void;
}

export const InsightsView: React.FC<InsightsViewProps> = ({ habits, logs, onExport, onQuickLog }) => {
  const [insight, setInsight] = useState<HabitInsightData | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  
  // Initial Filter State
  const [filters, setFilters] = useState<FilterState>({
    selected: habits.length > 0 ? habits.slice(0, 3).map(h => h.id) : [],
    start: (() => { 
      const d = new Date(); 
      d.setDate(d.getDate() - 29); 
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`; 
    })(),
    end: (() => {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    })(),
    chartType: 'line',
    metric: 'completion_rate'
  });

  useEffect(() => {
    const fetchInsights = async () => {
      setLoadingAi(true);
      const data = await generateHabitInsights(habits);
      setInsight(data);
      setLoadingAi(false);
    };

    if (habits.length > 0) {
      fetchInsights();
    }
  }, [habits.length]);

  return (
    <div className="space-y-6 pb-28 animate-fade-in w-full max-w-5xl mx-auto">
      
      {/* Header with Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
             Analytics & Trends
           </h2>
           <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
             Longitudinal streak retention, distribution charts, and behavioral coaching.
           </p>
        </div>
        <button 
          onClick={onExport}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-neon-surface text-gray-700 dark:text-gray-200 rounded-2xl text-xs font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-white/10 transition-colors border border-gray-200 dark:border-white/10"
        >
          <Download size={15} />
          Export CSV Logs
        </button>
      </div>

      {/* AI Behavioral Insights Cards */}
      <div className="bg-white/80 dark:bg-neon-surface/80 backdrop-blur-xl rounded-3xl p-5 sm:p-6 border border-white/60 dark:border-white/10 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-neon-primary">
          <Sparkles size={16} />
          <span>Behavioral Intelligence</span>
        </div>

        {loadingAi ? (
          <div className="flex items-center gap-3 py-6 text-gray-500 text-sm">
            <Loader2 className="animate-spin text-orange-500 dark:text-neon-primary" size={20} />
            <span>Analyzing streak consistency and habit velocity...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Summary */}
            <div className="p-4 rounded-2xl bg-orange-50/70 dark:bg-white/5 border border-orange-100/60 dark:border-white/5">
              <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400 text-xs font-bold mb-1">
                <TrendingUp size={14} /> Momentum Overview
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1 leading-snug">
                {insight?.summary || "Keep up your daily ritual!"}
              </p>
            </div>

            {/* Micro-Action */}
            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-white/5 border border-indigo-100/60 dark:border-white/5">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-neon-primary text-xs font-bold mb-1">
                <Zap size={14} /> Recommended Action
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1 leading-snug">
                {insight?.microAction || "Complete your next scheduled habit today in 1 tap."}
              </p>
            </div>

            {/* Habit Science */}
            <div className="p-4 rounded-2xl bg-teal-50/70 dark:bg-white/5 border border-teal-100/60 dark:border-white/5">
              <div className="flex items-center gap-2 text-teal-700 dark:text-emerald-400 text-xs font-bold mb-1">
                <Lightbulb size={14} /> Cognitive Science
              </div>
              <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">
                {insight?.why || "Single-tap logging removes activation energy, strengthening neural habit loops."}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main Analytics Controls & Charts */}
      <div className="space-y-6">
        <FilterBar habits={habits} onChange={setFilters} />
        <ChartsPanel filters={filters} habits={habits} logs={logs} />
      </div>
      
    </div>
  );
};
