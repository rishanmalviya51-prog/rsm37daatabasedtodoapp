import React, { useEffect, useState } from "react";
import { Habit } from "../types";
import { Calendar, BarChart2, Hash } from "lucide-react";

export interface FilterState {
  selected: string[];
  start: string;
  end: string;
  chartType: 'line' | 'bar' | 'histogram';
  metric: 'completion_rate' | 'total_value';
}

interface FilterBarProps {
  habits: Habit[];
  onChange: (filters: FilterState) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ habits, onChange }) => {
  const [selected, setSelected] = useState<string[]>(habits.length > 0 ? [habits[0].id] : []);
  const [range, setRange] = useState("30"); // "7","30","90","custom"
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [chartType, setChartType] = useState<'line' | 'bar' | 'histogram'>("line");
  const [metric, setMetric] = useState<'completion_rate' | 'total_value'>("completion_rate");

  useEffect(() => {
    // compute start/end from range
    const now = new Date();
    let end = now.toISOString().slice(0, 10);
    let start = "";
    
    if (range === "7") { 
      const s = new Date(); s.setDate(now.getDate() - 6); 
      start = s.toISOString().slice(0, 10); 
    }
    else if (range === "30") { 
      const s = new Date(); s.setDate(now.getDate() - 29); 
      start = s.toISOString().slice(0, 10); 
    }
    else if (range === "90") { 
      const s = new Date(); s.setDate(now.getDate() - 89); 
      start = s.toISOString().slice(0, 10); 
    }
    else { 
      start = customStart || end; 
      end = customEnd || end; 
    }

    onChange({ selected, start, end, chartType, metric });
  }, [selected, range, customStart, customEnd, chartType, metric]);

  const toggleHabit = (id: string) => {
    setSelected(prev => 
      prev.includes(id) 
        ? prev.filter(x => x !== id) 
        : [...prev, id]
    );
  };

  const selectAll = () => setSelected(habits.map(h => h.id));
  const selectNone = () => setSelected([]);

  return (
    <div className="
      bg-white/70 dark:bg-neon-surface/60 backdrop-blur-xl 
      rounded-[32px] p-6 shadow-sm border border-white/50 dark:border-white/5 
      space-y-6 animate-fade-in
    ">
      
      {/* Habit Selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <Hash size={12} /> Habits
          </label>
          <div className="flex gap-3">
             <button onClick={selectAll} className="text-xs text-orange-600 dark:text-neon-primary hover:text-orange-700 font-semibold px-2 py-1 rounded hover:bg-orange-50 dark:hover:bg-white/10 transition-colors">All</button>
             <button onClick={selectNone} className="text-xs text-gray-400 hover:text-gray-500 font-semibold px-2 py-1 rounded hover:bg-gray-50 dark:hover:bg-white/10 transition-colors">None</button>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-4 -mx-1 px-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
          {habits.map(h => {
             const isSelected = selected.includes(h.id);
             return (
              <button 
                key={h.id} 
                onClick={() => toggleHabit(h.id)} 
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-300 border
                  ${isSelected 
                    ? 'bg-gradient-to-r from-gray-900 to-gray-800 dark:from-neon-primary dark:to-cyan-600 text-white dark:text-black border-transparent shadow-lg shadow-gray-200 dark:shadow-neon transform scale-105' 
                    : 'bg-white dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-white/5 hover:bg-orange-50 dark:hover:bg-white/10 hover:border-orange-100'}
                `}
              >
                <span className="text-sm">{h.icon || '•'}</span> {h.title}
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-full h-px bg-gray-100 dark:bg-white/5"></div>

      {/* Controls Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Date Range */}
        <div className="space-y-3">
           <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 px-1">
             <Calendar size={12} /> Time Period
           </label>
           <div className="flex flex-wrap gap-2">
             {["7", "30", "90"].map(r => (
               <button 
                 key={r} 
                 onClick={() => setRange(r)} 
                 className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${range === r 
                   ? 'bg-orange-100 dark:bg-neon-secondary/20 text-orange-700 dark:text-neon-secondary ring-1 ring-orange-200 dark:ring-neon-secondary/50' 
                   : 'bg-gray-50 dark:bg-white/5 text-gray-500 hover:bg-white hover:shadow-sm dark:hover:bg-white/10'}`}
               >
                 Last {r} Days
               </button>
             ))}
             <button 
               onClick={() => setRange("custom")} 
               className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${range === "custom" 
                   ? 'bg-orange-100 dark:bg-neon-secondary/20 text-orange-700 dark:text-neon-secondary ring-1 ring-orange-200 dark:ring-neon-secondary/50' 
                   : 'bg-gray-50 dark:bg-white/5 text-gray-500 hover:bg-white hover:shadow-sm dark:hover:bg-white/10'}`}
             >
               Custom
             </button>
           </div>
           {range === "custom" && (
             <div className="flex gap-3 pt-2 animate-slide-down">
               <input 
                 type="date" 
                 value={customStart} 
                 onChange={e => setCustomStart(e.target.value)} 
                 className="flex-1 bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-medium dark:text-white focus:ring-2 focus:ring-orange-200 outline-none"
               />
               <input 
                 type="date" 
                 value={customEnd} 
                 onChange={e => setCustomEnd(e.target.value)} 
                 className="flex-1 bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-medium dark:text-white focus:ring-2 focus:ring-orange-200 outline-none"
               />
             </div>
           )}
        </div>

        {/* Chart Settings */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 px-1">
            <BarChart2 size={12} /> Visualization
          </label>
          <div className="flex gap-3">
             <div className="flex-1">
               <div className="relative">
                 <select 
                   value={chartType} 
                   onChange={(e) => setChartType(e.target.value as any)} 
                   className="w-full appearance-none bg-gray-50 dark:bg-white/5 border border-transparent dark:border-white/5 rounded-xl text-xs font-bold px-4 py-2.5 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-orange-200 dark:focus:ring-neon-primary/30 outline-none cursor-pointer hover:bg-white dark:hover:bg-white/10 transition-colors"
                 >
                   <option value="line">Line Chart</option>
                   <option value="bar">Bar Chart</option>
                   <option value="histogram">Histogram</option>
                 </select>
                 <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                   <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                 </div>
               </div>
             </div>
             <div className="flex-1">
               <div className="relative">
                 <select 
                   value={metric} 
                   onChange={(e) => setMetric(e.target.value as any)} 
                   className="w-full appearance-none bg-gray-50 dark:bg-white/5 border border-transparent dark:border-white/5 rounded-xl text-xs font-bold px-4 py-2.5 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-orange-200 dark:focus:ring-neon-primary/30 outline-none cursor-pointer hover:bg-white dark:hover:bg-white/10 transition-colors"
                 >
                   <option value="completion_rate">Completions / Count</option>
                   <option value="total_value">Total Value (Sum)</option>
                 </select>
                 <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                   <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                 </div>
               </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};
