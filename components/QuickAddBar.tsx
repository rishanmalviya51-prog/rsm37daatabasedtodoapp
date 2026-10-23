import React, { useState } from 'react';
import { Plus, Zap, Sparkles, ChevronRight, Check } from 'lucide-react';
import { Habit, HabitCategory, HabitType } from '../types';

interface QuickAddBarProps {
  onQuickAdd: (habitData: {
    title: string;
    type: HabitType;
    target: number;
    unit: string;
    color: string;
    icon: string;
    category: HabitCategory;
    markCompletedToday?: boolean;
  }) => void;
  onOpenFullForm: () => void;
}

interface TemplatePreset {
  title: string;
  type: HabitType;
  target: number;
  unit: string;
  icon: string;
  color: string;
  category: HabitCategory;
}

const PRESET_TEMPLATES: TemplatePreset[] = [
  { title: 'Drink Water', type: 'numeric', target: 2000, unit: 'ml', icon: '💧', color: '#38BDF8', category: 'Health' },
  { title: 'Morning Meditation', type: 'binary', target: 1, unit: 'session', icon: '🧘', color: '#818CF8', category: 'Mindfulness' },
  { title: 'Read Book', type: 'numeric', target: 20, unit: 'min', icon: '📖', color: '#F472B6', category: 'Learning' },
  { title: 'Daily Walk', type: 'numeric', target: 30, unit: 'min', icon: '🏃', color: '#FB923C', category: 'Health' },
  { title: 'Workout', type: 'numeric', target: 45, unit: 'min', icon: '💪', color: '#EF4444', category: 'Health' },
  { title: 'Healthy Meal', type: 'binary', target: 1, unit: 'session', icon: '🥗', color: '#10B981', category: 'Health' },
  { title: 'Deep Work', type: 'numeric', target: 60, unit: 'min', icon: '💻', color: '#6366F1', category: 'Productivity' },
  { title: 'Gratitude Journal', type: 'binary', target: 1, unit: 'session', icon: '✍️', color: '#EC4899', category: 'Mindfulness' },
  { title: '7.5h Sleep', type: 'numeric', target: 8, unit: 'hr', icon: '😴', color: '#A855F7', category: 'Health' },
];

export const QuickAddBar: React.FC<QuickAddBarProps> = ({ onQuickAdd, onOpenFullForm }) => {
  const [inputValue, setInputValue] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplatePreset | null>(null);

  // Parse natural language from text input
  const parseInput = (raw: string) => {
    const text = raw.trim();
    if (!text) return null;

    // Check for numbers and units like "2000 ml water", "30 mins reading", "10 pages"
    const numericMatch = text.match(/(\d+(?:\.\d+)?)\s*(ml|l|min|mins|minutes|hours|hr|hrs|pages|km|miles|steps|reps|glasses)?\s*(.*)/i);

    let title = text;
    let type: HabitType = 'binary';
    let target = 1;
    let unit = 'times';
    let icon = '✨';
    let color = '#818CF8';
    let category: HabitCategory = 'Other';

    const lower = text.toLowerCase();
    if (lower.includes('water') || lower.includes('drink') || lower.includes('hydrate')) {
      icon = '💧'; color = '#38BDF8'; category = 'Health'; unit = 'ml';
    } else if (lower.includes('read') || lower.includes('book') || lower.includes('study')) {
      icon = '📖'; color = '#F472B6'; category = 'Learning'; unit = 'min';
    } else if (lower.includes('meditat') || lower.includes('mindful') || lower.includes('breath')) {
      icon = '🧘'; color = '#818CF8'; category = 'Mindfulness'; unit = 'min';
    } else if (lower.includes('walk') || lower.includes('run') || lower.includes('jog') || lower.includes('steps')) {
      icon = '🏃'; color = '#FB923C'; category = 'Health'; unit = 'min';
    } else if (lower.includes('work') || lower.includes('code') || lower.includes('task')) {
      icon = '💻'; color = '#6366F1'; category = 'Productivity'; unit = 'hr';
    } else if (lower.includes('gym') || lower.includes('pushup') || lower.includes('exercise')) {
      icon = '💪'; color = '#EF4444'; category = 'Health'; unit = 'reps';
    } else if (lower.includes('sleep') || lower.includes('bed')) {
      icon = '😴'; color = '#A855F7'; category = 'Health'; unit = 'hr';
    }

    if (numericMatch && numericMatch[1]) {
      const parsedNum = parseFloat(numericMatch[1]);
      if (!isNaN(parsedNum) && parsedNum > 0) {
        target = parsedNum;
        type = 'numeric';
        if (numericMatch[2]) unit = numericMatch[2].toLowerCase();
        if (numericMatch[3]) title = numericMatch[3].trim() || title;
      }
    }

    return { title, type, target, unit, icon, color, category };
  };

  const handleAdd = (markCompletedToday = false) => {
    const parsed = parseInput(inputValue);
    if (!parsed) return;
    onQuickAdd({
      ...parsed,
      markCompletedToday,
    });
    setInputValue('');
  };

  const handleTemplateAdd = (template: TemplatePreset, markCompletedToday = false) => {
    onQuickAdd({
      ...template,
      markCompletedToday,
    });
    setSelectedTemplate(null);
  };

  return (
    <div className="bg-white/80 dark:bg-neon-surface/80 backdrop-blur-xl rounded-3xl p-4 sm:p-5 border border-white/60 dark:border-white/10 shadow-sm transition-all duration-300 mb-6">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-orange-500 dark:bg-neon-primary" />
          <span className="text-xs font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400">
            Quick-Add & Quick-Log
          </span>
        </div>
        <button
          onClick={onOpenFullForm}
          className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1 transition-colors"
        >
          Custom options <ChevronRight size={14} />
        </button>
      </div>

      {/* Main Single-Tap Quick Add Input Bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd(false);
              }
            }}
            placeholder="Type habit... (e.g. 20 min reading, 2000ml water, stretch)"
            className="w-full h-12 pl-4 pr-10 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 dark:focus:ring-neon-primary transition-all"
          />
          {inputValue && (
            <button
              onClick={() => setInputValue('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white text-xs px-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* 1-Tap Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!inputValue.trim()}
            onClick={() => handleAdd(false)}
            aria-label="Add habit"
            className="flex-1 sm:flex-initial h-12 px-4 rounded-2xl font-bold text-xs tracking-wide uppercase flex items-center justify-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none transition-all active:scale-95 shadow-sm"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Add</span>
          </button>

          <button
            type="button"
            disabled={!inputValue.trim()}
            onClick={() => handleAdd(true)}
            title="Add habit and immediately mark completed today"
            aria-label="Add habit and mark completed today"
            className="flex-1 sm:flex-initial h-12 px-4 rounded-2xl font-bold text-xs tracking-wide uppercase flex items-center justify-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white dark:from-neon-primary dark:to-cyan-500 dark:text-black disabled:opacity-40 disabled:pointer-events-none transition-all shadow-md shadow-orange-500/20 dark:shadow-neon active:scale-95 whitespace-nowrap"
          >
            <Zap size={16} className="fill-current" />
            <span>Add & Done</span>
          </button>
        </div>
      </div>

      {/* 1-Tap Preset Habit Templates Carousel */}
      <div className="mt-3.5 pt-3 border-t border-gray-100 dark:border-white/5">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 shrink-0 uppercase tracking-wider pl-1">
            1-Tap:
          </span>
          {PRESET_TEMPLATES.map((tpl) => (
            <div key={tpl.title} className="inline-flex items-center rounded-xl bg-gray-100/80 dark:bg-white/5 border border-gray-200/50 dark:border-white/5 hover:border-orange-300 dark:hover:border-neon-primary/40 transition-all shrink-0">
              <button
                type="button"
                onClick={() => handleTemplateAdd(tpl, false)}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-white"
                title={`Quick add ${tpl.title}`}
              >
                <span>{tpl.icon}</span>
                <span className="whitespace-nowrap">{tpl.title}</span>
              </button>
              <div className="w-px h-4 bg-gray-200 dark:bg-white/10" />
              <button
                type="button"
                onClick={() => handleTemplateAdd(tpl, true)}
                className="p-1.5 text-orange-600 dark:text-neon-primary hover:bg-orange-100/50 dark:hover:bg-neon-primary/20 rounded-r-xl transition-colors"
                title={`Add ${tpl.title} & mark completed today in 1 tap!`}
                aria-label={`Add ${tpl.title} and mark completed today`}
              >
                <Zap size={13} className="fill-current" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
