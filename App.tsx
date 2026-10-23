import React, { useState, useEffect, useMemo } from 'react';
import { Habit, ToastMessage, LogEntry, HabitType, HabitCategory } from './types';
import { HabitCard } from './components/HabitCard';
import { BentoStats } from './components/BentoStats';
import { UndoToast } from './components/UndoToast';
import { InsightsView } from './components/InsightsView';
import { Modal } from './components/Modal';
import { HabitForm } from './components/HabitForm';
import { HabitDetail } from './components/HabitDetail';
import { QuickAddBar } from './components/QuickAddBar';
import { WavyBackground } from './components/ui/wavy-background';
import { 
  CheckSquare, 
  BarChart3, 
  Moon, 
  Sun, 
  Plus, 
  Zap, 
  Sparkles, 
  Filter,
  CheckCircle2,
  Calendar,
  RotateCcw
} from 'lucide-react';
import { calculateStreak, getCompletionRate, generateSeedLogs, getDayKey } from './utils/analytics';

const STORAGE_KEY_HABITS = 'lumina_habits_v2';
const STORAGE_KEY_LOGS = 'lumina_logs_v2';

const INITIAL_MOCK_HABITS: Habit[] = [
  { 
    id: '1', 
    title: 'Morning Meditation', 
    type: 'binary', 
    target: 1, 
    unit: 'session', 
    color: '#818CF8', 
    icon: '🧘', 
    category: 'Mindfulness', 
    streak: 12, 
    completedToday: false, 
    currentValue: 0, 
    weeklyProgress: [100, 100, 100, 100, 100, 100, 0], 
    frequency: [0, 1, 2, 3, 4, 5, 6], 
    createdAt: Date.now() - 12 * 86400000, 
    updatedAt: Date.now() 
  },
  { 
    id: '2', 
    title: 'Drink Water', 
    type: 'numeric', 
    target: 2000, 
    unit: 'ml', 
    color: '#38BDF8', 
    icon: '💧', 
    category: 'Health', 
    streak: 45, 
    completedToday: false, 
    currentValue: 500, 
    weeklyProgress: [100, 100, 100, 100, 100, 100, 25], 
    frequency: [0, 1, 2, 3, 4, 5, 6], 
    createdAt: Date.now() - 45 * 86400000, 
    updatedAt: Date.now() 
  },
  { 
    id: '3', 
    title: 'Read Books', 
    type: 'numeric', 
    target: 30, 
    unit: 'min', 
    color: '#F472B6', 
    icon: '📖', 
    category: 'Learning', 
    streak: 3, 
    completedToday: true, 
    currentValue: 30, 
    weeklyProgress: [100, 100, 100, 100, 100, 100, 100], 
    frequency: [0, 1, 2, 3, 4, 5, 6], 
    createdAt: Date.now() - 3 * 86400000, 
    updatedAt: Date.now() 
  },
];

export default function App() {
  // Load persistent habits or fallback to mock
  const [habits, setHabits] = useState<Habit[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HABITS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load saved habits from localStorage', e);
    }
    return INITIAL_MOCK_HABITS;
  });

  // Load persistent logs or fallback to seeded history
  const [logs, setLogs] = useState<LogEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load saved logs from localStorage', e);
    }
    return generateSeedLogs();
  });

  const [view, setView] = useState<'today' | 'insights'>('today');
  const [todayFilter, setTodayFilter] = useState<'all' | 'todo' | 'done'>('all');
  const [darkMode, setDarkMode] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  
  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  // Theme initialization
  useEffect(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) setDarkMode(true);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Persist habits to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HABITS, JSON.stringify(habits));
    } catch (e) {
      console.warn('LocalStorage save habits error', e);
    }
  }, [habits]);

  // Persist logs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
    } catch (e) {
      console.warn('LocalStorage save logs error', e);
    }
  }, [logs]);

  // Compute derived state for habits based on logs
  useEffect(() => {
    const todayKey = getDayKey(new Date());

    setHabits(current => current.map(h => {
      // Sum today's logs using local date key
      const todayTotal = logs
        .filter(l => l.habitId === h.id && getDayKey(new Date(l.timestamp)) === todayKey)
        .reduce((acc, l) => acc + l.value, 0);

      const streak = calculateStreak(h.id, logs, h.target);
      const completedToday = todayTotal >= h.target;

      // Last 7 days progress array for sparklines
      const weeklyProgress = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const k = getDayKey(d);
        const dayTotal = logs
          .filter(l => l.habitId === h.id && getDayKey(new Date(l.timestamp)) === k)
          .reduce((acc, l) => acc + l.value, 0);
        return Math.min(100, Math.round((dayTotal / (h.target || 1)) * 100));
      });

      return {
        ...h,
        currentValue: todayTotal,
        completedToday,
        streak,
        weeklyProgress,
      };
    }));
  }, [logs]);

  // 1-Tap Quick Log: Increment partial or custom
  const handleLog = async (habitId: string, increment: number) => {
    const newLog: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      habitId,
      timestamp: Date.now(),
      value: increment,
      source: 'app'
    };

    setLogs(prev => [...prev, newLog]);

    const habit = habits.find(h => h.id === habitId);
    setToast({
      id: Date.now().toString(),
      text: `Logged +${increment} ${habit?.unit || ''} for ${habit?.title}`,
      duration: 5000,
      action: {
        label: "Undo",
        onClick: () => {
          setLogs(prev => prev.filter(l => l.id !== newLog.id));
          setToast(null);
        }
      }
    });
  };

  // 1-Tap Mark Complete: Fastest path to full daily completion!
  const handleCompleteOneTap = async (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const todayKey = getDayKey(new Date());
    const existingLogsToday = logs.filter(
      l => l.habitId === habitId && getDayKey(new Date(l.timestamp)) === todayKey
    );
    const currentValue = existingLogsToday.reduce((acc, l) => acc + l.value, 0);

    // If already complete, toggle back to 0
    if (currentValue >= habit.target) {
      const removedIds = new Set(existingLogsToday.map(l => l.id));
      setLogs(prev => prev.filter(l => !removedIds.has(l.id)));
      setToast({
        id: Date.now().toString(),
        text: `Reset ${habit.title} for today`,
        duration: 4000,
        action: {
          label: "Restore",
          onClick: () => {
            setLogs(prev => [...prev, ...existingLogsToday]);
            setToast(null);
          }
        }
      });
      return;
    }

    // Amount needed to reach 100% target
    const needed = Math.max(1, habit.target - currentValue);
    const completionLog: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      habitId,
      timestamp: Date.now(),
      value: needed,
      source: 'app'
    };

    setLogs(prev => [...prev, completionLog]);

    setToast({
      id: Date.now().toString(),
      text: `🎉 Completed ${habit.title}!`,
      duration: 5000,
      action: {
        label: "Undo",
        onClick: () => {
          setLogs(prev => prev.filter(l => l.id !== completionLog.id));
          setToast(null);
        }
      }
    });
  };

  // 1-Tap Quick-Add Habit (Optionally mark completed immediately)
  const handleQuickAdd = (habitData: {
    title: string;
    type: HabitType;
    target: number;
    unit: string;
    color: string;
    icon: string;
    category: HabitCategory;
    markCompletedToday?: boolean;
  }) => {
    const now = Date.now();
    const newId = `${now}-${Math.random().toString(36).substr(2, 5)}`;
    
    const newHabit: Habit = {
      id: newId,
      title: habitData.title,
      type: habitData.type,
      target: habitData.target,
      unit: habitData.unit,
      color: habitData.color,
      icon: habitData.icon,
      category: habitData.category,
      frequency: [0, 1, 2, 3, 4, 5, 6],
      streak: habitData.markCompletedToday ? 1 : 0,
      currentValue: habitData.markCompletedToday ? habitData.target : 0,
      completedToday: !!habitData.markCompletedToday,
      weeklyProgress: habitData.markCompletedToday ? [0, 0, 0, 0, 0, 0, 100] : [0, 0, 0, 0, 0, 0, 0],
      createdAt: now,
      updatedAt: now,
      archived: false,
    };

    setHabits(prev => [newHabit, ...prev]);

    if (habitData.markCompletedToday) {
      const completionLog: LogEntry = {
        id: `${now}-quicklog`,
        habitId: newId,
        timestamp: now,
        value: habitData.target,
        source: 'app'
      };
      setLogs(prev => [...prev, completionLog]);

      setToast({
        id: now.toString(),
        text: `⚡ Created & marked "${habitData.title}" as completed!`,
        duration: 5000,
        action: {
          label: "Undo",
          onClick: () => {
            setHabits(prev => prev.filter(h => h.id !== newId));
            setLogs(prev => prev.filter(l => l.id !== completionLog.id));
            setToast(null);
          }
        }
      });
    } else {
      setToast({
        id: now.toString(),
        text: `Added "${habitData.title}" to Today!`,
        duration: 4000,
        action: {
          label: "Undo",
          onClick: () => {
            setHabits(prev => prev.filter(h => h.id !== newId));
            setToast(null);
          }
        }
      });
    }
  };

  // Undo most recent log today for a habit
  const handleUndoLog = async (habitId: string) => {
    const todayKey = getDayKey(new Date());
    setLogs(prev => {
      const todaysLogs = prev.filter(
        l => l.habitId === habitId && getDayKey(new Date(l.timestamp)) === todayKey
      );
      if (todaysLogs.length === 0) return prev;
      const lastLog = todaysLogs[todaysLogs.length - 1];
      return prev.filter(l => l.id !== lastLog.id);
    });
  };

  // 1-Tap "Mark All Remaining as Done"
  const handleQuickCompleteAll = () => {
    const todayKey = getDayKey(new Date());
    const incomplete = activeHabits.filter(h => h.currentValue < h.target);
    if (incomplete.length === 0) return;

    const newLogs: LogEntry[] = incomplete.map(h => ({
      id: `${Date.now()}-${h.id}`,
      habitId: h.id,
      timestamp: Date.now(),
      value: Math.max(1, h.target - h.currentValue),
      source: 'app'
    }));

    setLogs(prev => [...prev, ...newLogs]);

    setToast({
      id: Date.now().toString(),
      text: `⚡ Completed all ${incomplete.length} pending habits!`,
      duration: 5000,
      action: {
        label: "Undo All",
        onClick: () => {
          const addedIds = new Set(newLogs.map(l => l.id));
          setLogs(prev => prev.filter(l => !addedIds.has(l.id)));
          setToast(null);
        }
      }
    });
  };

  // Full Habit Form save (custom creation or edit)
  const handleSaveHabit = (habitData: any) => {
    const now = Date.now();
    if (editingHabit) {
      setHabits(current => current.map(h => h.id === editingHabit.id ? { ...h, ...habitData, updatedAt: now } : h));
      if (selectedHabit && selectedHabit.id === editingHabit.id) {
        setSelectedHabit(prev => prev ? { ...prev, ...habitData, updatedAt: now } : null);
      }
    } else {
      const newHabit: Habit = {
        id: `${now}-${Math.random().toString(36).substr(2, 5)}`,
        ...habitData,
        streak: 0,
        currentValue: 0,
        completedToday: false,
        weeklyProgress: Array(7).fill(0),
        createdAt: now,
        updatedAt: now,
        archived: false
      };
      setHabits([newHabit, ...habits]);
    }
    setIsFormOpen(false);
    setEditingHabit(null);
  };

  // Archive habit
  const handleArchive = (habit: Habit) => {
    setHabits(current => current.map(h => h.id === habit.id ? { ...h, archived: true, updatedAt: Date.now() } : h));
    setSelectedHabit(null);
    
    setToast({
      id: Date.now().toString(),
      text: `Archived ${habit.title}`,
      duration: 5000,
      action: {
        label: "Undo",
        onClick: () => {
          setHabits(current => current.map(h => h.id === habit.id ? { ...h, archived: false, updatedAt: Date.now() } : h));
          setToast(null);
        }
      }
    });
  };

  // Export CSV logs
  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Date,Habit,Value,Unit,Category,Source\n"
      + logs.map(l => {
        const h = habits.find(h => h.id === l.habitId);
        return `${new Date(l.timestamp).toISOString()},"${h?.title || 'Unknown'}",${l.value},"${h?.unit || 'times'}","${h?.category || 'Other'}",${l.source || 'app'}`;
      }).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `lumina_habits_export_${getDayKey(new Date())}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset to initial demo data
  const handleResetDemoData = () => {
    localStorage.removeItem(STORAGE_KEY_HABITS);
    localStorage.removeItem(STORAGE_KEY_LOGS);
    setHabits(INITIAL_MOCK_HABITS);
    setLogs(generateSeedLogs());
    setToast({
      id: Date.now().toString(),
      text: "Reset to rich sample data",
      duration: 3000
    });
  };

  const activeHabits = useMemo(() => habits.filter(h => !h.archived), [habits]);
  const completedCount = useMemo(() => activeHabits.filter(h => h.currentValue >= h.target).length, [activeHabits]);
  const pendingCount = activeHabits.length - completedCount;
  const bestStreak = useMemo(() => Math.max(...activeHabits.map(h => h.streak), 0), [activeHabits]);
  const overallRate = useMemo(() => {
    if (activeHabits.length === 0) return 0;
    return Math.round(activeHabits.reduce((acc, h) => acc + getCompletionRate(logs, h.id, h.target), 0) / activeHabits.length);
  }, [activeHabits, logs]);

  // Filtered habits for Today list
  const filteredHabits = useMemo(() => {
    if (todayFilter === 'todo') {
      return activeHabits.filter(h => h.currentValue < h.target);
    }
    if (todayFilter === 'done') {
      return activeHabits.filter(h => h.currentValue >= h.target);
    }
    return activeHabits;
  }, [activeHabits, todayFilter]);

  const formattedDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric' 
  });

  return (
    <WavyBackground 
      containerClassName="min-h-screen h-auto overflow-visible" 
      className="pb-28"
      backgroundFill={darkMode ? '#050508' : '#FDFCF8'}
      waveOpacity={darkMode ? 0.2 : 0.4}
      colors={darkMode 
        ? ['#00F0FF', '#7000FF', '#FF003C'] 
        : ['#38bdf8', '#818cf8', '#c084fc', '#e879f9', '#22d3ee']
      }
      blur={darkMode ? 15 : 10}
      speed={darkMode ? "slow" : "fast"}
    >
      
      {/* Top Bar Contract: Brand — Nav Links — Primary Action */}
      <header className="sticky top-0 z-40 bg-bone-50/85 dark:bg-neon-dark/85 backdrop-blur-xl border-b border-gray-200/60 dark:border-white/10 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xl sm:text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-neon-primary dark:to-cyan-400 whitespace-nowrap">
              Lumina Habits
            </span>
          </div>

          {/* Zone 2: Navigation Links / Mode Segment */}
          <nav className="flex items-center gap-1.5 p-1 bg-gray-100/80 dark:bg-white/5 rounded-2xl border border-gray-200/50 dark:border-white/5">
            <button
              onClick={() => setView('today')}
              className={`
                px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap
                ${view === 'today' 
                  ? 'bg-white dark:bg-neon-surface text-gray-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10' 
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }
              `}
            >
              <CheckSquare size={14} />
              <span>Today</span>
              {pendingCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 font-mono">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setView('insights')}
              className={`
                px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap
                ${view === 'insights' 
                  ? 'bg-white dark:bg-neon-surface text-gray-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10' 
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }
              `}
            >
              <BarChart3 size={14} />
              <span>Analytics</span>
            </button>
          </nav>

          {/* Zone 3: Primary Action + Theme Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => { setEditingHabit(null); setIsFormOpen(true); }}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl font-bold text-xs uppercase tracking-wider bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 shadow-sm transition-all active:scale-95 whitespace-nowrap"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>New Habit</span>
            </button>

            <button 
              onClick={() => setDarkMode(!darkMode)} 
              className={`
                p-2.5 rounded-2xl transition-all duration-200
                ${darkMode 
                  ? 'bg-neon-surface text-neon-primary hover:bg-white/10' 
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200/80 shadow-sm'}
              `}
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 relative z-10">
        {view === 'today' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left / Primary Column: Fastest Path to Value (Quick-Add + Today List) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Today View Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-orange-600 dark:text-neon-primary flex items-center gap-1.5">
                    <Calendar size={13} />
                    {formattedDate}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight mt-1">
                    Today's Flow
                  </h1>
                </div>

                {/* Quick Master Action: Complete All remaining in 1 Tap */}
                {pendingCount > 0 ? (
                  <button
                    onClick={handleQuickCompleteAll}
                    title="Mark all remaining habits complete for today with one tap!"
                    className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-orange-100 dark:bg-neon-primary/20 text-orange-800 dark:text-neon-primary hover:bg-orange-200 dark:hover:bg-neon-primary/30 transition-all active:scale-95 border border-orange-200/60 dark:border-neon-primary/30"
                  >
                    <Zap size={14} className="fill-current" />
                    <span>Complete All ({pendingCount})</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl">
                    <CheckCircle2 size={15} /> All done for today!
                  </div>
                )}
              </div>

              {/* 1-Tap Quick-Add & Quick-Log Bar */}
              <QuickAddBar 
                onQuickAdd={handleQuickAdd}
                onOpenFullForm={() => { setEditingHabit(null); setIsFormOpen(true); }}
              />

              {/* Filter Tabs: All · To Do · Done */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1 p-1 bg-gray-100/80 dark:bg-white/5 rounded-2xl border border-gray-200/40 dark:border-white/5">
                  <button
                    onClick={() => setTodayFilter('all')}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                      todayFilter === 'all' 
                        ? 'bg-white dark:bg-neon-surface text-gray-900 dark:text-white shadow-sm' 
                        : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
                    }`}
                  >
                    All ({activeHabits.length})
                  </button>
                  <button
                    onClick={() => setTodayFilter('todo')}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                      todayFilter === 'todo' 
                        ? 'bg-white dark:bg-neon-surface text-gray-900 dark:text-white shadow-sm' 
                        : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
                    }`}
                  >
                    To Do ({pendingCount})
                  </button>
                  <button
                    onClick={() => setTodayFilter('done')}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                      todayFilter === 'done' 
                        ? 'bg-white dark:bg-neon-surface text-gray-900 dark:text-white shadow-sm' 
                        : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
                    }`}
                  >
                    Completed ({completedCount})
                  </button>
                </div>

                <div className="text-[11px] font-medium text-gray-400 dark:text-gray-500 hidden sm:block">
                  Tip: Tap checkmark for 1-tap complete
                </div>
              </div>

              {/* Habit Cards Feed */}
              <div className="space-y-3">
                {filteredHabits.length === 0 ? (
                  <div className="p-8 text-center rounded-3xl bg-white/50 dark:bg-neon-surface/40 border border-dashed border-gray-200 dark:border-white/10">
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                      {todayFilter === 'todo' ? '🎉 All habits checked off for today!' : 'No habits found in this view.'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {todayFilter === 'todo' ? 'Take a moment to enjoy your progress.' : 'Use the Quick-Add bar above to track something new.'}
                    </p>
                  </div>
                ) : (
                  filteredHabits.map(habit => (
                    <div key={habit.id} onClick={() => setSelectedHabit(habit)}>
                      <HabitCard 
                        habit={habit} 
                        onLog={handleLog} 
                        onUndo={handleUndoLog}
                        onCompleteOneTap={handleCompleteOneTap}
                        onEdit={() => { setEditingHabit(habit); setIsFormOpen(true); }}
                        onArchive={() => handleArchive(habit)}
                      />
                    </div>
                  ))
                )}
              </div>

              {/* Bottom Quick Action Link */}
              <button 
                onClick={() => { setEditingHabit(null); setIsFormOpen(true); }} 
                className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-800 rounded-3xl text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center justify-center gap-2 hover:bg-white/60 dark:hover:bg-neon-surface/40 transition-all font-semibold text-xs uppercase tracking-wider"
              >
                <Plus size={16} /> <span>Open Detailed Habit Creator</span>
              </button>
            </div>

            {/* Right / Secondary Column on Desktop: Bento Stats & Overview */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Bento Stats Summary */}
              <div>
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Consistency Hub
                  </span>
                  <button
                    onClick={() => setView('insights')}
                    className="text-xs font-semibold text-orange-600 dark:text-neon-primary hover:underline flex items-center gap-1"
                  >
                    Detailed charts →
                  </button>
                </div>
                <BentoStats 
                  totalStreak={bestStreak} 
                  completionRate={overallRate} 
                  habitsDone={completedCount} 
                  totalHabits={activeHabits.length}
                />
              </div>

              {/* Quick Today Progress Card */}
              <div className="bg-white/70 dark:bg-neon-surface/70 backdrop-blur-xl rounded-3xl p-5 border border-white/60 dark:border-white/10 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Today's Velocity
                  </span>
                  <span className="text-sm font-extrabold text-gray-900 dark:text-white tabular-nums font-mono">
                    {Math.round((completedCount / (activeHabits.length || 1)) * 100)}%
                  </span>
                </div>
                
                {/* Visual Progress Bar */}
                <div className="w-full h-3 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden mb-4">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-400 dark:from-neon-primary dark:to-cyan-400 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, Math.round((completedCount / (activeHabits.length || 1)) * 100))}%` }}
                  />
                </div>

                <div className="space-y-2 text-xs">
                  {activeHabits.slice(0, 4).map(h => (
                    <div key={h.id} className="flex items-center justify-between py-1 border-b border-gray-100 dark:border-white/5 last:border-0">
                      <div className="flex items-center gap-2 truncate">
                        <span>{h.icon || '•'}</span>
                        <span className={`truncate ${h.completedToday ? 'text-gray-400 line-through' : 'font-medium text-gray-700 dark:text-gray-200'}`}>
                          {h.title}
                        </span>
                      </div>
                      <span className="font-mono tabular-nums text-gray-500 shrink-0">
                        {h.currentValue}/{h.target} {h.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data & Export Tools */}
              <div className="p-4 rounded-3xl bg-gray-100/60 dark:bg-white/5 border border-gray-200/50 dark:border-white/5 flex items-center justify-between text-xs text-gray-500">
                <span>Local-first storage active</span>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleResetDemoData} 
                    className="hover:text-gray-900 dark:hover:text-white underline"
                    title="Reload rich demo streak records"
                  >
                    Reset Demo
                  </button>
                  <span>·</span>
                  <button 
                    onClick={handleExport} 
                    className="hover:text-gray-900 dark:hover:text-white underline font-semibold"
                  >
                    Export CSV
                  </button>
                </div>
              </div>

            </div>
          </div>
        ) : (
          <InsightsView 
            habits={habits} 
            logs={logs} 
            onExport={handleExport}
            onQuickLog={handleLog}
          />
        )}
      </main>

      {/* Clean Mobile Bottom Navigation Dock */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-neon-surface/90 backdrop-blur-xl border-t border-gray-200/60 dark:border-white/10 shadow-2xl px-6 py-2">
        <div className="flex items-center justify-around h-14">
          <button 
            onClick={() => setView('today')} 
            className={`flex flex-col items-center gap-1 transition-colors ${
              view === 'today' ? 'text-orange-600 dark:text-neon-primary font-bold' : 'text-gray-400'
            }`}
          >
            <CheckSquare size={20} />
            <span className="text-[10px]">Today</span>
          </button>

          <button 
            onClick={() => { setEditingHabit(null); setIsFormOpen(true); }}
            className="w-12 h-12 -mt-5 rounded-2xl bg-gray-900 dark:bg-neon-primary text-white dark:text-black flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            aria-label="Add habit"
          >
            <Plus size={22} strokeWidth={2.5} />
          </button>

          <button 
            onClick={() => setView('insights')} 
            className={`flex flex-col items-center gap-1 transition-colors ${
              view === 'insights' ? 'text-orange-600 dark:text-neon-primary font-bold' : 'text-gray-400'
            }`}
          >
            <BarChart3 size={20} />
            <span className="text-[10px]">Analytics</span>
          </button>
        </div>
      </div>

      {/* Undo Toast Notification */}
      <UndoToast message={toast} onDismiss={() => setToast(null)} />

      {/* Forms & Modals */}
      <Modal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        title={editingHabit ? "Edit Habit" : "New Custom Habit"}
      >
        <HabitForm 
          initialHabit={editingHabit || {}} 
          onSubmit={handleSaveHabit} 
          onCancel={() => setIsFormOpen(false)} 
        />
      </Modal>

      {selectedHabit && (
        <HabitDetail 
          habit={selectedHabit} 
          logs={logs} 
          onClose={() => setSelectedHabit(null)} 
          onEdit={() => { 
            setEditingHabit(selectedHabit); 
            setIsFormOpen(true); 
            setSelectedHabit(null);
          }}
          onArchive={() => handleArchive(selectedHabit)}
          onToggleCompleteToday={handleCompleteOneTap}
        />
      )}
    </WavyBackground>
  );
}
