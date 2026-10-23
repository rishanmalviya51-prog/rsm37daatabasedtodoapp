import React, { useState, useRef, useEffect } from "react";
import { Plus, MoreVertical, Edit2, Archive, Check, Zap, RotateCcw } from "lucide-react";
import { Habit } from "../types";

interface HabitCardProps {
  habit: Habit;
  onLog: (habitId: string, value: number) => Promise<void>;
  onUndo: (habitId: string) => Promise<void>;
  onCompleteOneTap: (habitId: string) => Promise<void>;
  onEdit: () => void;
  onArchive: () => void;
}

export const HabitCard: React.FC<HabitCardProps> = ({ 
  habit, 
  onLog, 
  onUndo, 
  onCompleteOneTap,
  onEdit, 
  onArchive 
}) => {
  const [loading, setLoading] = useState(false);
  const [optimisticCompleted, setOptimisticCompleted] = useState(habit.completedToday);
  const [optimisticValue, setOptimisticValue] = useState(habit.currentValue);
  const [showMenu, setShowMenu] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Sync state if props change (re-validation)
  useEffect(() => {
    setOptimisticCompleted(habit.completedToday);
    setOptimisticValue(habit.currentValue);
  }, [habit.completedToday, habit.currentValue]);

  // Click outside listener for menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  // Calculate percentage for progress ring
  const progress = habit.target > 0 ? Math.min(optimisticValue / habit.target, 1) : 0;
  const percentage = Math.round(progress * 100);

  // 1-Tap Complete Action for ANY habit
  const handleOneTapComplete = async (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    if (optimisticCompleted) {
      // Toggle back / undo
      setLoading(true);
      setOptimisticCompleted(false);
      setOptimisticValue(0);
      try {
        await onUndo(habit.id);
      } catch (err) {
        setOptimisticCompleted(true);
        setOptimisticValue(habit.target);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Mark complete in one tap
    setCelebrating(true);
    setTimeout(() => setCelebrating(false), 900);

    setOptimisticCompleted(true);
    setOptimisticValue(habit.target);
    setLoading(true);

    try {
      await onCompleteOneTap(habit.id);
    } catch (err) {
      setOptimisticCompleted(habit.completedToday);
      setOptimisticValue(habit.currentValue);
    } finally {
      setLoading(false);
    }
  };

  // Partial increment for numeric habits
  const handlePartialIncrement = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    const step = habit.target > 100 
      ? Math.round(habit.target * 0.25) 
      : (habit.target > 10 ? Math.ceil(habit.target * 0.2) : 1);
    
    const newValue = optimisticValue + step;
    setOptimisticValue(newValue);
    if (newValue >= habit.target) {
      setOptimisticCompleted(true);
      setCelebrating(true);
      setTimeout(() => setCelebrating(false), 900);
    }

    setLoading(true);
    try {
      await onLog(habit.id, step);
    } catch (err) {
      setOptimisticValue(habit.currentValue);
      setOptimisticCompleted(habit.completedToday);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`
        relative group overflow-visible select-none
        p-4 sm:p-5 rounded-3xl transition-all duration-300 ease-out
        border cursor-pointer
        bg-white/70 backdrop-blur-xl border-white/80 shadow-sm
        hover:shadow-md hover:border-orange-200/60 hover:-translate-y-0.5
        dark:bg-neon-surface/70 dark:border-white/5 
        dark:hover:border-neon-primary/30 dark:hover:shadow-[0_0_20px_rgba(0,240,255,0.08)]
        ${optimisticCompleted 
          ? 'ring-1 ring-emerald-500/30 bg-gradient-to-r from-emerald-500/5 to-amber-500/5 dark:ring-neon-primary/40 dark:from-neon-surface dark:to-neon-surface' 
          : ''}
        ${celebrating ? 'scale-[1.01] transition-transform' : ''}
      `}
      role="button"
      tabIndex={0}
      aria-label={`Habit: ${habit.title}, ${optimisticCompleted ? 'Completed' : 'Pending'}`}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          handleOneTapComplete(e);
        }
      }}
    >
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        {/* Left: Icon & Title & Streak */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div
            className={`
              w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-inner
              transition-all duration-300
              ${optimisticCompleted 
                ? 'bg-gradient-to-br from-emerald-500/20 to-amber-500/20 text-emerald-600 dark:text-neon-primary scale-105' 
                : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-200'
              }
            `}
            style={{ 
              backgroundColor: !optimisticCompleted && habit.color ? `${habit.color}15` : undefined,
              color: !optimisticCompleted && habit.color ? habit.color : undefined,
            }}
          >
            {habit.icon ? habit.icon : habit.title.charAt(0)}
          </div>
          
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <h3 className={`
                text-base font-bold tracking-tight truncate transition-colors duration-200
                ${optimisticCompleted ? 'text-gray-800 dark:text-white line-through opacity-85' : 'text-gray-900 dark:text-white'}
              `}>
                {habit.title}
              </h3>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              <span className="font-medium">
                {habit.type === 'binary' 
                  ? (optimisticCompleted ? 'Completed today' : 'Daily Goal') 
                  : (
                    <span className="tabular-nums font-mono">
                      {optimisticValue} / {habit.target} {habit.unit} ({percentage}%)
                    </span>
                  )}
              </span>
              {habit.streak > 0 && (
                <>
                  <span aria-hidden="true" className="text-gray-300 dark:text-gray-600">·</span>
                  <span className="font-semibold text-orange-600 dark:text-orange-400 tabular-nums">
                    🔥 {habit.streak}d streak
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: 1-Tap Quick Action Hitbox Zone */}
        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          {habit.type === 'numeric' && !optimisticCompleted && (
            <button
              type="button"
              onClick={handlePartialIncrement}
              disabled={loading}
              title={`Quick +${habit.target > 100 ? Math.round(habit.target * 0.25) : 1} ${habit.unit}`}
              aria-label={`Increment ${habit.title}`}
              className="h-11 px-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-700 dark:text-gray-200 text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span className="tabular-nums">
                +{habit.target > 100 ? Math.round(habit.target * 0.25) : 1}
              </span>
            </button>
          )}

          {/* 1-Tap Completion Trigger for ANY habit */}
          <button
            type="button"
            onClick={handleOneTapComplete}
            disabled={loading}
            aria-pressed={optimisticCompleted}
            aria-label={optimisticCompleted ? `Unmark ${habit.title}` : `Complete ${habit.title} in 1 tap`}
            title={optimisticCompleted ? "Mark incomplete" : "1-tap complete"}
            className={`
              w-12 h-12 rounded-2xl flex items-center justify-center 
              focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-300 dark:focus-visible:ring-neon-primary
              transition-all duration-300 ease-out active:scale-90 shadow-sm
              ${optimisticCompleted 
                ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/30 dark:from-neon-primary dark:to-cyan-600 dark:text-black dark:shadow-neon scale-100' 
                : 'bg-gray-100 hover:bg-orange-100 dark:bg-white/10 dark:hover:bg-white/20 text-gray-400 hover:text-orange-600 dark:text-gray-300'
              }
            `}
          >
            {optimisticCompleted ? (
              <Check className="w-6 h-6 transform scale-100 transition-transform" strokeWidth={3} />
            ) : (
              habit.type === 'binary' ? (
                <div className="w-5 h-5 rounded-lg border-2 border-current flex items-center justify-center opacity-70" />
              ) : (
                <div className="relative w-8 h-8 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="16" cy="16" r="12"
                      stroke="currentColor" strokeWidth="2.5"
                      fill="transparent"
                      className="opacity-20"
                    />
                    <circle
                      cx="16" cy="16" r="12"
                      stroke="currentColor" strokeWidth="2.5"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 12}
                      strokeDashoffset={2 * Math.PI * 12 * (1 - progress)}
                      strokeLinecap="round"
                      className="transition-all duration-300 text-orange-500 dark:text-neon-primary"
                    />
                  </svg>
                  <Zap size={12} className="absolute inset-0 m-auto text-orange-500 dark:text-neon-primary fill-current" />
                </div>
              )
            )}
          </button>

          {/* 3-Dots Context Menu Button */}
          <div className="relative" ref={menuRef}>
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              aria-label="Habit options"
              className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              <MoreVertical size={16} />
            </button>
            
            {showMenu && (
              <div 
                className="absolute top-10 right-0 w-40 bg-white/95 dark:bg-neon-surface/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 dark:border-white/10 z-30 overflow-hidden animate-scale-in"
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  type="button"
                  onClick={() => { setShowMenu(false); onEdit(); }}
                  className="w-full text-left px-4 py-3 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-2.5 transition-colors"
                >
                  <Edit2 size={14} /> Edit Habit
                </button>
                <button 
                  type="button"
                  onClick={(e) => { setShowMenu(false); handleOneTapComplete(e); }}
                  className="w-full text-left px-4 py-3 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-2.5 transition-colors"
                >
                  {optimisticCompleted ? <RotateCcw size={14} /> : <Check size={14} />}
                  {optimisticCompleted ? 'Reset Today' : '1-Tap Complete'}
                </button>
                <div className="h-px bg-gray-100 dark:bg-white/5 my-0.5" />
                <button 
                  type="button"
                  onClick={() => { setShowMenu(false); onArchive(); }}
                  className="w-full text-left px-4 py-3 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2.5 transition-colors"
                >
                  <Archive size={14} /> Archive Habit
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
