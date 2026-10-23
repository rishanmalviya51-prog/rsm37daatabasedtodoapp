import React, { useState } from 'react';
import { Habit, HabitType, HabitTemplate, HabitCategory } from '../types';
import { Check, X } from 'lucide-react';

interface HabitFormProps {
  initialHabit?: Partial<Habit>;
  onSubmit: (habit: Omit<Habit, 'id' | 'streak' | 'completedToday' | 'currentValue' | 'weeklyProgress' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

const TEMPLATES: HabitTemplate[] = [
  { title: 'Drink Water', type: 'numeric', target: 2000, unit: 'ml', color: '#38BDF8', icon: '💧', category: 'Health' },
  { title: 'Read', type: 'numeric', target: 20, unit: 'pages', color: '#F472B6', icon: '📖', category: 'Learning' },
  { title: 'Meditate', type: 'binary', target: 1, unit: 'session', color: '#818CF8', icon: '🧘', category: 'Mindfulness' },
  { title: 'Walk', type: 'numeric', target: 30, unit: 'min', color: '#FB923C', icon: '🏃', category: 'Health' },
  { title: 'Coding', type: 'numeric', target: 1, unit: 'hr', color: '#10B981', icon: '💻', category: 'Productivity' },
];

const COLORS = ['#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899'];
const ICONS = ['🔥', '💧', '🧘', '🏃', '📖', '💻', '🎨', '🎵', '🥦', '💤'];
const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const CATEGORIES: HabitCategory[] = ['Health', 'Productivity', 'Learning', 'Mindfulness', 'Other'];

export const HabitForm: React.FC<HabitFormProps> = ({ initialHabit, onSubmit, onCancel }) => {
  const [title, setTitle] = useState(initialHabit?.title || '');
  const [type, setType] = useState<HabitType>(initialHabit?.type || 'binary');
  const [target, setTarget] = useState(initialHabit?.target?.toString() || '1');
  const [unit, setUnit] = useState(initialHabit?.unit || 'times');
  const [color, setColor] = useState(initialHabit?.color || COLORS[5]);
  const [icon, setIcon] = useState(initialHabit?.icon || ICONS[0]);
  const [frequency, setFrequency] = useState<number[]>(initialHabit?.frequency || [0, 1, 2, 3, 4, 5, 6]);
  const [category, setCategory] = useState<HabitCategory>(initialHabit?.category || 'Health');
  
  const applyTemplate = (t: HabitTemplate) => {
    setTitle(t.title);
    setType(t.type);
    setTarget(t.target.toString());
    setUnit(t.unit);
    setColor(t.color);
    setIcon(t.icon);
    setCategory(t.category);
  };

  const toggleDay = (dayIndex: number) => {
    if (frequency.includes(dayIndex)) {
      if (frequency.length > 1) setFrequency(frequency.filter(d => d !== dayIndex));
    } else {
      setFrequency([...frequency, dayIndex].sort());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      title,
      type,
      target: parseFloat(target),
      unit: type === 'binary' ? 'session' : unit,
      color,
      frequency,
      icon,
      category,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Templates */}
      {!initialHabit?.id && (
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Start from template</label>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {TEMPLATES.map((t) => (
              <button
                key={t.title}
                type="button"
                onClick={() => applyTemplate(t)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-full whitespace-nowrap hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-xs font-medium"
              >
                <span>{t.icon}</span> {t.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Inputs */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
          <div className="flex gap-2">
            <button
               type="button"
               onClick={() => {
                 const idx = ICONS.indexOf(icon);
                 setIcon(ICONS[(idx + 1) % ICONS.length]);
               }}
               className="w-12 h-12 flex-shrink-0 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-xl hover:bg-gray-200 transition-colors"
            >
              {icon}
            </button>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Habit Name"
              className="flex-1 px-4 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white"
              autoFocus
            />
          </div>
        </div>

        {/* Goal Type */}
        <div className="p-1 bg-gray-100 dark:bg-gray-800 rounded-xl grid grid-cols-2 gap-1">
          {(['binary', 'numeric'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`py-2 rounded-lg text-sm font-medium transition-all ${type === t ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}
            >
              {t === 'binary' ? 'Yes/No' : 'Numeric'}
            </button>
          ))}
        </div>

        {/* Numeric Details */}
        {type === 'numeric' && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-1/3">
              <label className="text-xs text-gray-500 mb-1 block">Target</label>
              <input type="number" value={target} onChange={(e) => setTarget(e.target.value)} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl dark:text-white" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">Unit</label>
              <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl dark:text-white" />
            </div>
          </div>
        )}

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${category === cat ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Schedule */}
        <div>
           <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Frequency</label>
           <div className="flex justify-between">
             {DAYS.map((d, i) => (
               <button
                 key={i}
                 type="button"
                 onClick={() => toggleDay(i)}
                 className={`w-9 h-9 rounded-full text-xs font-bold transition-all ${frequency.includes(i) ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}
               >
                 {d}
               </button>
             ))}
           </div>
        </div>

        {/* Color */}
        <div>
           <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Theme</label>
           <div className="flex flex-wrap gap-2">
             {COLORS.map(c => (
               <button
                 key={c}
                 type="button"
                 onClick={() => setColor(c)}
                 className={`w-8 h-8 rounded-full transition-transform ${color === c ? 'scale-110 ring-2 ring-offset-2 dark:ring-offset-gray-900 ring-gray-400' : ''}`}
                 style={{ backgroundColor: c }}
               />
             ))}
           </div>
        </div>
      </div>

      <div className="pt-2 flex gap-3">
        <button type="button" onClick={onCancel} className="flex-1 py-3 text-gray-500 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">Cancel</button>
        <button type="submit" disabled={!title} className="flex-1 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl shadow-lg disabled:opacity-50">Save</button>
      </div>
    </form>
  );
};
