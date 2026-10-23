import React, { useMemo } from "react";
import { Habit, LogEntry } from "../types";
import { aggregateHabits, getHistogramData } from "../utils/analytics";
import { FilterState } from "./FilterBar";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  BarChart, Bar, Brush, AreaChart, Area
} from "recharts";

interface ChartsPanelProps {
  filters: FilterState;
  habits: Habit[];
  logs: LogEntry[];
}

export const ChartsPanel: React.FC<ChartsPanelProps> = ({ filters, habits, logs }) => {
  const { selected, start, end, chartType, metric } = filters;

  // 1. Aggregate Data
  const { dates, series } = useMemo(
    () => aggregateHabits(selected, logs, start, end), 
    [selected, logs, start, end]
  );

  // 2. Prepare Data for Line/Bar: One row per date, keys are habitIds
  const chartData = useMemo(() => {
    return dates.map(d => {
      const row: any = { date: d.slice(5) }; // MM-DD for display
      for (const hid of selected) {
        const s = series[hid]?.find(x => x.date === d) || { completions: 0, totalValue: 0 };
        // Choose metric
        row[hid] = metric === 'completion_rate' ? s.completions : s.totalValue;
        
        // Include full date for tooltips
        row.fullDate = d;
      }
      return row;
    });
  }, [dates, series, selected, metric]);

  // 3. Prepare Histogram Data
  const histogramData = useMemo(
    () => getHistogramData(selected, logs, start, end, 8), 
    [selected, logs, start, end]
  );

  // Helpers
  // If habit color isn't set or is too light, default to a robust palette
  const getHabitColor = (id: string) => habits.find(h => h.id === id)?.color || '#F59E0B';
  const getHabitName = (id: string) => habits.find(h => h.id === id)?.title || id;

  if (!selected || selected.length === 0) {
    return (
      <div className="bg-white/60 dark:bg-neon-surface/60 backdrop-blur-xl rounded-[32px] p-12 border border-dashed border-gray-300 dark:border-white/10 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 animate-fade-in">
        <div className="text-5xl mb-4 opacity-50">📊</div>
        <p className="text-base font-semibold">Select a habit to visualize data</p>
        <p className="text-sm mt-1">Choose 'All' or specific habits from the filter bar</p>
      </div>
    );
  }

  // --- Render Histogram ---
  if (chartType === "histogram") {
    return (
      <div className="bg-white/70 dark:bg-neon-surface/60 backdrop-blur-xl rounded-[32px] p-6 shadow-sm border border-white/50 dark:border-white/5 animate-scale-in">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <span>Distribution Analysis</span>
          <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md">Histogram</span>
        </h3>
        {histogramData.length === 0 ? (
          <div className="text-sm text-gray-400 py-20 text-center font-medium">No numeric data found in this range.</div> 
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={histogramData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid, #E5E7EB)" opacity={0.3} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <Tooltip 
                 contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', backgroundColor: 'rgba(255, 255, 255, 0.95)', color: '#1F2937' }}
                 cursor={{ fill: 'rgba(0,0,0,0.05)' }}
              />
              <Bar dataKey="count" name="Frequency" fill="#F59E0B" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    );
  }

  // --- Render Line/Bar Chart ---
  return (
    <div className="bg-white/70 dark:bg-neon-surface/60 backdrop-blur-xl rounded-[32px] p-6 shadow-sm border border-white/50 dark:border-white/5 animate-scale-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Performance Over Time</h3>
          <p className="text-xs text-gray-400 mt-1 font-medium">
             Visualizing {metric === 'completion_rate' ? 'completions' : 'value'} for {selected.length} habit{selected.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>
      
      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "line" ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                {selected.map((hid) => (
                  <linearGradient key={hid} id={`grad-${hid}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={getHabitColor(hid)} stopOpacity={0.25}/>
                    <stop offset="95%" stopColor={getHabitColor(hid)} stopOpacity={0}/>
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid, #E5E7EB)" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 500 }} axisLine={false} tickLine={false} minTickGap={30} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 500 }} axisLine={false} tickLine={false} />
              <Tooltip 
                labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', backgroundColor: 'rgba(255, 255, 255, 0.95)', padding: '12px 16px' }}
                itemStyle={{ fontSize: '12px', fontWeight: 600, padding: '2px 0' }}
              />
              <Legend wrapperStyle={{ paddingTop: '24px', fontSize: '12px', fontWeight: 600 }} iconType="circle" />
              <Brush dataKey="date" height={24} stroke="#E5E7EB" fill="rgba(0,0,0,0.02)" tickFormatter={() => ''} />
              {selected.map((hid) => (
                <Area 
                  key={hid}
                  type="monotone"
                  dataKey={hid}
                  name={getHabitName(hid)}
                  stroke={getHabitColor(hid)}
                  fill={`url(#grad-${hid})`}
                  strokeWidth={3}
                  activeDot={{ r: 6, strokeWidth: 0, fill: getHabitColor(hid) }}
                />
              ))}
            </AreaChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid, #E5E7EB)" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 500 }} axisLine={false} tickLine={false} minTickGap={30} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 500 }} axisLine={false} tickLine={false} />
              <Tooltip 
                labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', backgroundColor: 'rgba(255, 255, 255, 0.95)', padding: '12px 16px' }}
                itemStyle={{ fontSize: '12px', fontWeight: 600, padding: '2px 0' }}
                cursor={{ fill: 'rgba(0,0,0,0.03)', radius: 8 }}
              />
              <Legend wrapperStyle={{ paddingTop: '24px', fontSize: '12px', fontWeight: 600 }} iconType="circle" />
              <Brush dataKey="date" height={24} stroke="#E5E7EB" fill="rgba(0,0,0,0.02)" tickFormatter={() => ''} />
              {selected.map((hid) => (
                <Bar 
                  key={hid} 
                  dataKey={hid} 
                  name={getHabitName(hid)} 
                  fill={getHabitColor(hid)} 
                  radius={[6, 6, 0, 0]} 
                  barSize={selected.length > 3 ? undefined : 40}
                />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
