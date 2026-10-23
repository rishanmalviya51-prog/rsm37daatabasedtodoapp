import React, { useState } from 'react';
import { Habit, LogEntry } from '../types';
import { X, Play, Brain, Activity, Calendar, Edit2, Archive, Check, RotateCcw } from 'lucide-react';
import { getLast30DaysData } from '../utils/analytics';
import { Heatmap } from './AnalyticsWidgets';
import { analyzeTrends, speakSummary } from '../services/geminiService';

interface HabitDetailProps {
  habit: Habit;
  logs: LogEntry[];
  onClose: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onToggleCompleteToday?: (habitId: string) => void;
}

export const HabitDetail: React.FC<HabitDetailProps> = ({ 
  habit, 
  logs, 
  onClose, 
  onEdit, 
  onArchive,
  onToggleCompleteToday
}) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const history = getLast30DaysData(habit.id, logs, habit.target);
  const sparkData = history.map(d => d.value);

  const handleAnalyze = async () => {
    setLoadingAnalysis(true);
    const result = await analyzeTrends(habit.title, sparkData);
    setAnalysis(result);
    setLoadingAnalysis(false);
  };

  const handleSpeak = async () => {
    if (!analysis) return;
    setIsPlaying(true);
    try {
      const audioBuffer = await speakSummary(analysis);
      if (audioBuffer) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        ctx.decodeAudioData(audioBuffer, (buffer) => {
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(ctx.destination);
          source.start(0);
          source.onended = () => setIsPlaying(false);
        }, () => setIsPlaying(false));
      } else {
        setIsPlaying(false);
      }
    } catch (e) {
      setIsPlaying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-auto">
      <div 
        className="absolute inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      <div 
        className="
          relative w-full max-w-lg bg-bone-50 dark:bg-gray-900 
          rounded-t-3xl sm:rounded-3xl shadow-2xl 
          border border-white/50 dark:border-gray-800 
          overflow-hidden max-h-[90vh] pointer-events-auto animate-slide-up z-10
        "
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner shrink-0"
              style={{ backgroundColor: `${habit.color}20`, color: habit.color }}
            >
              {habit.icon || habit.title[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{habit.title}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {habit.type === 'binary' ? 'Daily Yes/No Goal' : `Daily Target: ${habit.target} ${habit.unit}`}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close dialog"
          >
             <X size={18} className="text-gray-500 dark:text-gray-300" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          
          {/* 1-Tap Complete from Details */}
          {onToggleCompleteToday && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent dark:from-neon-surface border border-orange-200/60 dark:border-neon-primary/30 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-neon-primary">
                  Today's Status
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">
                  {habit.completedToday ? "Completed today! 🎉" : "Pending for today"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onToggleCompleteToday(habit.id)}
                className={`
                  px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 shadow-sm
                  ${habit.completedToday 
                    ? 'bg-gray-200 text-gray-700 dark:bg-white/10 dark:text-white hover:bg-gray-300' 
                    : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white dark:from-neon-primary dark:to-cyan-600 dark:text-black shadow-emerald-500/20'
                  }
                `}
              >
                {habit.completedToday ? (
                  <>
                    <RotateCcw size={14} /> Reset Today
                  </>
                ) : (
                  <>
                    <Check size={14} strokeWidth={3} /> 1-Tap Complete
                  </>
                )}
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button 
              onClick={onEdit} 
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-700 dark:text-gray-200 font-bold text-xs hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <Edit2 size={15} /> Edit Habit
            </button>
            <button 
              onClick={onArchive} 
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-600 dark:text-red-400 font-bold text-xs hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
            >
              <Archive size={15} /> Archive
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
               <div className="flex items-center gap-2 text-orange-500 mb-1">
                 <Activity size={15} />
                 <span className="text-xs font-bold uppercase tracking-wider">Current Streak</span>
               </div>
               <div className="text-3xl font-extrabold text-gray-900 dark:text-white font-mono tabular-nums">
                 {habit.streak} <span className="text-xs font-sans text-gray-400">days</span>
               </div>
            </div>
             <div className="p-4 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
               <div className="flex items-center gap-2 text-blue-500 mb-1">
                 <Calendar size={15} />
                 <span className="text-xs font-bold uppercase tracking-wider">30-Day Rate</span>
               </div>
               <div className="text-3xl font-extrabold text-gray-900 dark:text-white font-mono tabular-nums">
                 {Math.round((history.filter(d => d.completed).length / 30) * 100)}%
               </div>
            </div>
          </div>

          {/* Visualization */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
              Consistency Heatmap (Last 30 Days)
            </h3>
            <div className="p-4 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 flex justify-center">
              <Heatmap data={history} />
            </div>
          </div>

          {/* AI Insights */}
          <div className="p-5 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-800/50 rounded-3xl border border-indigo-100 dark:border-indigo-900/30 relative overflow-hidden">
             <div className="flex items-center justify-between mb-3 relative z-10">
               <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                 <Brain size={17} />
                 <span className="font-bold text-xs uppercase tracking-wider">Gemini Behavioral Analysis</span>
               </div>
               {!analysis ? (
                 <button 
                   onClick={handleAnalyze} 
                   disabled={loadingAnalysis}
                   className="text-xs bg-white dark:bg-indigo-900 px-3 py-1.5 rounded-full shadow-sm font-semibold hover:scale-105 transition-transform disabled:opacity-50"
                 >
                   {loadingAnalysis ? "Thinking..." : "Analyze Trend"}
                 </button>
               ) : (
                 <button 
                   onClick={handleSpeak}
                   disabled={isPlaying}
                   className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50"
                   aria-label="Listen to audio analysis"
                 >
                   <Play size={14} fill="currentColor" />
                 </button>
               )}
             </div>
             
             <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed relative z-10">
               {analysis ? analysis : "Tap 'Analyze Trend' to evaluate your habit momentum and get behavioral guidance."}
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};
