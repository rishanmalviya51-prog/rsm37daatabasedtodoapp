import React from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend, Brush,
  PieChart, Pie, Cell
} from "recharts";

interface LineChartHabitProps {
  timeseries: Array<{
    date: string;
    completion_rate: number;
    rolling7?: number;
  }>;
  title: string;
  showRolling?: boolean;
}

export const LineChartHabit: React.FC<LineChartHabitProps> = ({ timeseries, title, showRolling = true }) => {
  if (!timeseries || timeseries.length === 0) return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-center h-[280px] text-gray-400">
      Not enough data yet
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={timeseries} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 10, fill: '#9CA3AF' }} 
              axisLine={false} 
              tickLine={false}
              minTickGap={30}
            />
            <YAxis 
              tickFormatter={(v) => `${Math.round(v)}%`} 
              tick={{ fontSize: 10, fill: '#9CA3AF' }} 
              axisLine={false} 
              tickLine={false}
              domain={[0, 100]}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
              formatter={(v: number) => [`${Math.round(v)}%`, '']}
            />
            <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
            <Line 
              type="monotone" 
              dataKey="completion_rate" 
              name="Daily Rate" 
              stroke="#3B82F6" 
              dot={false} 
              strokeWidth={2} 
              activeDot={{ r: 4 }}
            />
            {showRolling && (
              <Line 
                type="monotone" 
                dataKey="rolling7" 
                name="7-Day Avg" 
                stroke="#10B981" 
                dot={false} 
                strokeWidth={2} 
                strokeDasharray="4 4" 
              />
            )}
            <Brush 
              dataKey="date" 
              height={20} 
              stroke="#E5E7EB" 
              fill="transparent" 
              tickFormatter={() => ''}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

interface PieCategoryProps {
  data: Array<{
    category: string;
    value: number;
    color: string;
  }>;
  title: string;
}

export const PieCategory: React.FC<PieCategoryProps> = ({ data, title }) => {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      {(!data || data.length === 0 || total === 0) ? (
        <div className="flex items-center justify-center h-[200px] text-xs text-gray-400">No data available</div>
      ) : (
        <div className="h-[200px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie 
                data={data} 
                dataKey="value" 
                nameKey="category" 
                innerRadius={50} 
                outerRadius={80} 
                paddingAngle={4}
                cornerRadius={4}
              >
                {data.map((entry, index) => (
                  <Cell key={entry.category} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip 
                 contentStyle={{ borderRadius: '8px', border: 'none', padding: '4px 8px', fontSize: '12px' }}
                 formatter={(v: number) => [`${v} logs`, '']}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xl font-bold text-gray-900 dark:text-white pb-6">{total}</span>
          </div>
        </div>
      )}
    </div>
  );
};
