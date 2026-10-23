import React from 'react';
import { DailyStats } from '../types';

interface HeatmapProps {
  data: DailyStats[]; // Expects last 30 days
}

export const Heatmap: React.FC<HeatmapProps> = ({ data }) => {
  return (
    <div className="flex flex-wrap gap-1 max-w-[240px]">
      {data.map((day, i) => (
        <div
          key={day.date}
          title={`${day.date}: ${day.value}`}
          className={`
            w-3 h-3 rounded-sm transition-all
            ${day.completed 
              ? 'bg-green-500 dark:bg-green-400' 
              : day.value > 0 
                ? 'bg-green-200 dark:bg-green-900/40' 
                : 'bg-gray-100 dark:bg-gray-800'}
          `}
        />
      ))}
    </div>
  );
};

interface SparklineProps {
  data: number[];
  color: string;
}

export const Sparkline: React.FC<SparklineProps> = ({ data, color }) => {
  const max = Math.max(...data, 1);
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - (val / max) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg className="w-full h-8 overflow-visible" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-80"
      />
    </svg>
  );
};
