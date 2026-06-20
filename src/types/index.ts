export interface User {
  uid: string;
  email: string | null;
  displayName?: string | null;
  photoURL?: string | null;
}

export interface Subtask {
  id: string;
  text: string;
  done: boolean;
}

export type TaskStatus = "todo" | "doing" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type RecurringInterval = "daily" | "weekly" | "monthly";

export interface Task {
  id: string;
  uid: string;
  text: string;
  date: string;
  done: boolean;
  priority: TaskPriority;
  category: string;
  status: TaskStatus;
  subtasks: Subtask[];
  createdAt: string;
  completedAt: string | null;
  notified: boolean;
  notes?: string;
  estimatedTime?: number; // en minutes
  // Tâches récurrentes
  recurring?: boolean;
  recurringInterval?: RecurringInterval;
}

export type HabitFrequency = "daily" | "3x_week" | "weekdays";

export interface Habit {
  id: string;
  uid: string;
  name: string;
  icon: string;
  color: string;
  completedDates: string[];
  createdAt: string;
  frequency?: HabitFrequency; // Par défaut: 'daily'
}

export interface PomodoroSession {
  id: string;
  uid: string;
  duration: number; // en minutes
  completedAt: string;
}

export interface Expense {
  id: string;
  uid: string;
  amount: number;
  category: string;
  date: string;
  description: string;
  type: "income" | "expense";
  createdAt: string;
}
