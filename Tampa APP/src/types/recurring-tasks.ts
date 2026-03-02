/**
 * ================================================================
 * RECURRING TASKS - TYPES (Microsoft Teams Model)
 * ================================================================
 * Auto-generated types based on Supabase schema
 * Last updated: 21/02/2026
 * 
 * Schema: task_series + task_occurrences
 * Migration: 20260221_recurring_tasks_refactor.sql
 * ================================================================
 */

// ================================================================
// ENUMS & CONSTANTS
// ================================================================

export const RECURRENCE_TYPES = [
  'daily',
  'weekly',
  'fortnightly',
  'monthly',
  'custom_days',
  'custom_weekdays',
  'custom_monthday',
] as const;

export type RecurrenceType = typeof RECURRENCE_TYPES[number];

export const TASK_TYPES = [
  'cleaning_daily',
  'cleaning_weekly',
  'temperature',
  'opening',
  'closing',
  'maintenance',
  'others',
] as const;

export type TaskType = typeof TASK_TYPES[number];

export const TASK_PRIORITIES = ['critical', 'important', 'normal'] as const;

export type TaskPriority = typeof TASK_PRIORITIES[number];

export const TASK_STATUSES = [
  'not_started',
  'in_progress',
  'completed',
  'skipped',
] as const;

export type TaskStatus = typeof TASK_STATUSES[number];

export const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const; // 0=Sunday, 6=Saturday

export type Weekday = typeof WEEKDAYS[number];

// Human-readable labels
export const TASK_TYPE_LABELS: Record<string, string> = {
  cleaning_daily: "Daily Cleaning",
  cleaning_weekly: "Weekly Cleaning",
  temperature: "Temperature Check",
  opening: "Opening",
  closing: "Closing",
  maintenance: "Maintenance",
  others: "Others",
};

export const TASK_PRIORITY_LABELS: Record<string, string> = {
  critical: "Critical",
  important: "Important",
  normal: "Normal",
};

// ================================================================
// SUBTASK & PHOTO TYPES
// ================================================================

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  order: number;
  created_by?: string; // profile.id
}

export type PhotoPath = string; // Supabase storage path

// ================================================================
// TASK SERIES (Parent/Template)
// ================================================================

export interface TaskSeries {
  id: string;
  organization_id: string;
  template_id: string | null;

  // Basic Info
  title: string;
  description: string | null;
  task_type: TaskType;
  priority: TaskPriority;

  // Assignment (array of profile IDs or empty for "everyone")
  assigned_to: string[];

  // Estimation
  estimated_minutes: number | null;

  // Approval
  requires_approval: boolean;

  // Recurrence Configuration
  recurrence_type: RecurrenceType;
  recurrence_interval: number | null; // For custom_days
  recurrence_weekdays: Weekday[] | null; // For custom_weekdays
  recurrence_monthday: number | null; // For custom_monthday (1-31)

  // Series Timeframe
  series_start_date: string; // ISO date string
  series_end_date: string | null; // NULL = indefinite

  // Metadata
  created_at: string;
  created_by: string | null; // profile.id
  updated_at: string;
}

export interface TaskSeriesInsert {
  id?: string;
  organization_id: string;
  template_id?: string | null;
  title: string;
  description?: string | null;
  task_type: TaskType;
  priority?: TaskPriority;
  assigned_to?: string[];
  estimated_minutes?: number | null;
  requires_approval?: boolean;
  recurrence_type: RecurrenceType;
  recurrence_interval?: number | null;
  recurrence_weekdays?: Weekday[] | null;
  recurrence_monthday?: number | null;
  series_start_date: string;
  series_end_date?: string | null;
  created_by?: string | null;
}

export interface TaskSeriesUpdate {
  title?: string;
  description?: string | null;
  task_type?: TaskType;
  priority?: TaskPriority;
  assigned_to?: string[];
  estimated_minutes?: number | null;
  requires_approval?: boolean;
  recurrence_type?: RecurrenceType;
  recurrence_interval?: number | null;
  recurrence_weekdays?: Weekday[] | null;
  recurrence_monthday?: number | null;
  series_end_date?: string | null;
}

// ================================================================
// TASK OCCURRENCE (Instance)
// ================================================================

export interface TaskOccurrence {
  id: string;
  series_id: string | null; // NULL = one-time task, UUID = part of series
  organization_id: string;
  template_id: string | null;

  // Scheduled Info
  scheduled_date: string; // ISO date string
  scheduled_time: string | null; // HH:MM:SS

  // Task Details (can override series)
  title: string;
  description: string | null;
  task_type: TaskType;
  priority: TaskPriority;

  // Assignment (can override series)
  assigned_to: string[];

  // Estimation
  estimated_minutes: number | null;
  actual_minutes: number | null;

  // Status
  status: TaskStatus;

  // Completion
  completed_at: string | null;
  completed_by: string | null; // profile.id

  // Skip/Notes
  notes: string | null;
  skip_reason: string | null;

  // Approval
  requires_approval: boolean;
  approved_by: string | null; // profile.id
  approved_at: string | null;

  // Subtasks (JSONB array)
  subtasks: Subtask[];

  // Photos (JSONB array of storage paths)
  photos: PhotoPath[];

  // Modification Flag
  is_modified: boolean; // True if edited separately from series

  // Completion progress (cached by DB trigger — mirrors Teams percentComplete)
  // 0-100. Set to 100 by trigger when all subtasks are completed.
  percent_complete: number;

  // Metadata
  created_at: string;
  updated_at: string;
}

export interface TaskOccurrenceInsert {
  id?: string;
  series_id?: string | null;
  organization_id: string;
  template_id?: string | null;
  scheduled_date: string;
  scheduled_time?: string | null;
  title: string;
  description?: string | null;
  task_type: TaskType;
  priority?: TaskPriority;
  assigned_to?: string[];
  estimated_minutes?: number | null;
  actual_minutes?: number | null;
  status?: TaskStatus;
  completed_at?: string | null;
  completed_by?: string | null;
  notes?: string | null;
  skip_reason?: string | null;
  requires_approval?: boolean;
  approved_by?: string | null;
  approved_at?: string | null;
  subtasks?: Subtask[];
  photos?: PhotoPath[];
  is_modified?: boolean;
  percent_complete?: number;
}

export interface TaskOccurrenceUpdate {
  scheduled_date?: string;
  scheduled_time?: string | null;
  title?: string;
  description?: string | null;
  task_type?: TaskType;
  priority?: TaskPriority;
  assigned_to?: string[];
  estimated_minutes?: number | null;
  actual_minutes?: number | null;
  status?: TaskStatus;
  completed_at?: string | null;
  completed_by?: string | null;
  notes?: string | null;
  skip_reason?: string | null;
  requires_approval?: boolean;
  approved_by?: string | null;
  approved_at?: string | null;
  subtasks?: Subtask[];
  photos?: PhotoPath[];
  is_modified?: boolean;
  percent_complete?: number;
}

// ================================================================
// JOINED TYPES (for display)
// ================================================================

export interface TaskOccurrenceWithSeries extends TaskOccurrence {
  series: TaskSeries | null;
}

export interface TaskSeriesWithNextOccurrence extends TaskSeries {
  next_occurrence: TaskOccurrence | null;
  total_occurrences: number;
  completed_occurrences: number;
}

// ================================================================
// QUERY FILTERS & PARAMS
// ================================================================

export interface TaskOccurrenceFilters {
  organization_id?: string;
  series_id?: string;
  status?: TaskStatus | TaskStatus[];
  assigned_to?: string | string[];
  task_type?: TaskType | TaskType[];
  date_from?: string;
  date_to?: string;
  is_recurring?: boolean; // series_id IS NOT NULL
}

export interface TaskSeriesFilters {
  organization_id?: string;
  recurrence_type?: RecurrenceType | RecurrenceType[];
  task_type?: TaskType | TaskType[];
  is_active?: boolean; // series_end_date IS NULL OR > today
}

// ================================================================
// EDIT/DELETE CONTEXT (Microsoft Teams Modal)
// ================================================================

export type EditDeleteContext = 'occurrence' | 'series';

export interface EditDeleteAction {
  context: EditDeleteContext;
  occurrence_id?: string; // For occurrence-only edits
  series_id?: string; // For series-wide edits
}

// ================================================================
// RECURRENCE CONFIG (UI Form)
// ================================================================

export interface RecurrenceConfig {
  type: RecurrenceType;
  start_date: string;
  end_date?: string | null;

  // For custom_days
  interval?: number;

  // For custom_weekdays
  weekdays?: Weekday[];

  // For custom_monthday
  monthday?: number; // 1-31
}

// ================================================================
// HELPER TYPES
// ================================================================

export interface RecurrenceDisplay {
  label: string; // "Every day", "Every Monday", "Every 4 days", etc.
  icon: string; // Lucide icon name
  description: string; // Human-readable description
}

export interface TaskStatistics {
  total: number;
  not_started: number;
  in_progress: number;
  completed: number;
  skipped: number;
  overdue: number;
}

// ================================================================
// VALIDATION HELPERS
// ================================================================

export const isValidRecurrenceType = (type: string): type is RecurrenceType => {
  return RECURRENCE_TYPES.includes(type as RecurrenceType);
};

export const isValidTaskType = (type: string): type is TaskType => {
  return TASK_TYPES.includes(type as TaskType);
};

export const isValidTaskStatus = (status: string): status is TaskStatus => {
  return TASK_STATUSES.includes(status as TaskStatus);
};

export const isValidTaskPriority = (priority: string): priority is TaskPriority => {
  return TASK_PRIORITIES.includes(priority as TaskPriority);
};

export const isRecurringTask = (occurrence: TaskOccurrence): boolean => {
  return occurrence.series_id !== null;
};

export const isSeriesActive = (series: TaskSeries): boolean => {
  if (!series.series_end_date) return true;
  return new Date(series.series_end_date) > new Date();
};

// ================================================================
// TYPE GUARDS
// ================================================================

export const isTaskOccurrence = (obj: unknown): obj is TaskOccurrence => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'scheduled_date' in obj &&
    'status' in obj
  );
};

export const isTaskSeries = (obj: unknown): obj is TaskSeries => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'recurrence_type' in obj &&
    'series_start_date' in obj
  );
};
