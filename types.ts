export type HabitType = 'binary' | 'numeric';
export type HabitCategory = 'Health' | 'Productivity' | 'Learning' | 'Mindfulness' | 'Other';

export interface Habit {
  id: string;
  title: string;
  description?: string;
  type: HabitType;
  unit?: string;
  target: number; 
  color: string;
  icon?: string; // Emoji or URL
  category?: HabitCategory;
  
  // Stats (Derived)
  streak: number;
  completedToday: boolean;
  currentValue: number;
  weeklyProgress: number[]; 
  
  // Configuration
  frequency: number[]; // 0=Sun, 6=Sat
  reminder?: string; // "HH:MM"
  
  // Lifecycle & Audit
  archived?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface LogEntry {
  id: string;
  habitId: string;
  timestamp: number;
  value: number;
  note?: string;
  source?: 'app' | 'widget' | 'stt';
}

export interface ToastMessage {
  id: string;
  text: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface HabitTemplate {
  title: string;
  type: HabitType;
  target: number;
  unit: string;
  color: string;
  icon: string;
  category: HabitCategory;
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  completed: boolean;
  value: number;
}
