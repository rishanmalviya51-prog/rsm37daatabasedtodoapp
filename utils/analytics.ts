import { Habit, LogEntry, DailyStats } from '../types';

/**
 * Returns YYYY-MM-DD in local time to avoid UTC day boundary mismatch.
 */
export const getDayKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const calculateStreak = (habitId: string, logs: LogEntry[], target: number): number => {
  const sortedLogs = logs
    .filter(l => l.habitId === habitId)
    .sort((a, b) => b.timestamp - a.timestamp); // Newest first

  if (sortedLogs.length === 0) return 0;

  const today = new Date();
  const todayKey = getDayKey(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = getDayKey(yesterday);
  
  // Group by day key
  const dailyTotals: Record<string, number> = {};
  sortedLogs.forEach(log => {
    const key = getDayKey(new Date(log.timestamp));
    dailyTotals[key] = (dailyTotals[key] || 0) + log.value;
  });

  let streak = 0;
  const currentCheckDate = new Date(today);
  
  // Check today or yesterday to start the chain
  if ((dailyTotals[todayKey] || 0) >= target) {
    streak++;
    currentCheckDate.setDate(currentCheckDate.getDate() - 1);
  } else if ((dailyTotals[yesterdayKey] || 0) >= target) {
    // If today is not done but yesterday was, streak is alive
    currentCheckDate.setDate(currentCheckDate.getDate() - 1);
  } else {
    return 0; // Streak broken
  }

  // Iterate backwards day by day
  for (let safety = 0; safety < 365; safety++) {
    const key = getDayKey(currentCheckDate);
    if ((dailyTotals[key] || 0) >= target) {
      streak++;
      currentCheckDate.setDate(currentCheckDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};

export const getLast30DaysData = (habitId: string, logs: LogEntry[], target: number): DailyStats[] => {
  const days: DailyStats[] = [];
  const today = new Date();
  
  const habitLogs = logs.filter(l => l.habitId === habitId);
  const dailyTotals: Record<string, number> = {};
  habitLogs.forEach(log => {
    const key = getDayKey(new Date(log.timestamp));
    dailyTotals[key] = (dailyTotals[key] || 0) + log.value;
  });

  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const key = getDayKey(d);
    const val = dailyTotals[key] || 0;
    days.push({
      date: key,
      value: val,
      completed: val >= target
    });
  }
  return days;
};

export const getCompletionRate = (logs: LogEntry[], habitId: string, target: number, days = 7): number => {
  const data = getLast30DaysData(habitId, logs, target).slice(30 - days);
  const completed = data.filter(d => d.completed).length;
  return Math.round((completed / days) * 100);
};

// --- Analytics Aggregations ---

export const aggregateHabits = (
  selectedHabitIds: string[],
  logs: LogEntry[],
  startDate: string, // YYYY-MM-DD
  endDate: string
) => {
  // Generate date range in local dates
  const dates: string[] = [];
  const [sy, sm, sd] = startDate.split('-').map(Number);
  const [ey, em, ed] = endDate.split('-').map(Number);
  const current = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);

  while (current <= end) {
    dates.push(getDayKey(current));
    current.setDate(current.getDate() + 1);
  }

  const series: Record<string, Array<{ date: string; completions: number; totalValue: number }>> = {};

  selectedHabitIds.forEach(habitId => {
    const habitLogs = logs.filter(l => l.habitId === habitId);
    const dayMap: Record<string, { completions: number; totalValue: number }> = {};
    
    dates.forEach(date => {
      dayMap[date] = { completions: 0, totalValue: 0 };
    });

    habitLogs.forEach(log => {
      const date = getDayKey(new Date(log.timestamp));
      if (date >= startDate && date <= endDate && dayMap[date]) {
        dayMap[date].completions += 1;
        dayMap[date].totalValue += log.value;
      }
    });

    series[habitId] = dates.map(date => ({
      date,
      ...dayMap[date]
    }));
  });

  return { dates, series };
};

export const getHistogramData = (
  selectedHabitIds: string[],
  logs: LogEntry[],
  startDate: string,
  endDate: string,
  numBins = 8
) => {
  const values: number[] = [];
  logs.forEach(l => {
    const date = getDayKey(new Date(l.timestamp));
    if (selectedHabitIds.includes(l.habitId) && date >= startDate && date <= endDate) {
      values.push(l.value);
    }
  });

  if (values.length === 0) return [];

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const binSize = range === 0 ? 1 : Math.max(1, Math.ceil(range / numBins));

  const bins = Array.from({ length: numBins }, (_, i) => ({
    label: `${Math.round(min + i * binSize)}-${Math.round(min + (i + 1) * binSize)}`,
    count: 0
  }));

  values.forEach(v => {
    const idx = Math.min(numBins - 1, Math.max(0, Math.floor((v - min) / binSize)));
    if (bins[idx]) {
      bins[idx].count++;
    }
  });

  return bins;
};

/**
 * Seed realistic historical logs for mock habits so streaks and graphs are immediately active and rich.
 */
export const generateSeedLogs = (): LogEntry[] => {
  const logs: LogEntry[] = [];
  const now = new Date();

  // 1. Morning Meditation (12 day streak through yesterday)
  for (let i = 12; i >= 1; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(8, 15, 0, 0);
    logs.push({
      id: `seed-med-${i}`,
      habitId: '1',
      timestamp: d.getTime(),
      value: 1,
      source: 'app'
    });
  }

  // 2. Drink Water (45 day streak, target 2000ml)
  for (let i = 45; i >= 1; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(12, 0, 0, 0);
    logs.push({
      id: `seed-water-${i}-1`,
      habitId: '2',
      timestamp: d.getTime(),
      value: 1200,
      source: 'app'
    });
    d.setHours(18, 30, 0, 0);
    logs.push({
      id: `seed-water-${i}-2`,
      habitId: '2',
      timestamp: d.getTime(),
      value: 800,
      source: 'app'
    });
  }
  // Today's partial water: 500ml
  const todayWater = new Date(now);
  todayWater.setHours(10, 0, 0, 0);
  logs.push({
    id: `seed-water-today`,
    habitId: '2',
    timestamp: todayWater.getTime(),
    value: 500,
    source: 'app'
  });

  // 3. Read Books (3 day streak, completed today 30 min)
  for (let i = 2; i >= 1; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(21, 0, 0, 0);
    logs.push({
      id: `seed-read-${i}`,
      habitId: '3',
      timestamp: d.getTime(),
      value: 30,
      source: 'app'
    });
  }
  // Today's reading completed
  const todayRead = new Date(now);
  todayRead.setHours(14, 20, 0, 0);
  logs.push({
    id: `seed-read-today`,
    habitId: '3',
    timestamp: todayRead.getTime(),
    value: 30,
    source: 'app'
  });

  return logs;
};
