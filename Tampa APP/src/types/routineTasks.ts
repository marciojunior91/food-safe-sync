// ============================================================================
// Routine Tasks Types
// ============================================================================

export type TaskType = 
  | 'cleaning_daily'
  | 'cleaning_weekly'
  | 'temperature'
  | 'opening'
  | 'closing'
  | 'maintenance'
  | 'others';

export type TaskPriority = 'critical' | 'important' | 'normal';

export type TaskStatus = 
  | 'not_started' 
  | 'in_progress' 
  | 'completed' 
  | 'overdue' 
  | 'skipped';

export interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  interval: number;
  days?: number[]; // 0-6 for days of week (0 = Sunday)
  end_date?: string;
}

export interface TemplateTask {
  title: string;
  description?: string;
  estimated_minutes?: number;
  requires_approval?: boolean;
}

export interface TaskTemplate {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  task_type: TaskType;
  is_default: boolean;
  tasks: TemplateTask[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface RoutineTask {
  id: string;
  organization_id: string;
  template_id?: string;
  title: string;
  description?: string;
  task_type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  assigned_to?: string; // LEGACY: auth user_id
  team_member_id?: string; // NEW: team member ID - preferred
  scheduled_date: string;
  scheduled_time?: string;
  completed_at?: string;
  completed_by?: string;
  notes?: string;
  skip_reason?: string;
  estimated_minutes?: number;
  actual_minutes?: number;
  requires_approval: boolean;
  approved_by?: string;
  approved_at?: string;
  recurrence_pattern?: RecurrencePattern;
  created_at: string;
  updated_at: string;
  // Joined data
  assigned_user?: {
    user_id: string;
    display_name: string;
    avatar_url?: string;
  };
  completed_user?: {
    user_id: string;
    display_name: string;
  };
}

export interface TaskAttachment {
  id: string;
  task_id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  uploaded_by?: string;
  uploaded_at: string;
  metadata?: {
    timestamp?: string;
    geolocation?: {
      lat: number;
      lng: number;
    };
    notes?: string;
  };
}

// Form data types
export interface CreateTaskInput {
  title: string;
  description?: string;
  task_type: TaskType;
  priority?: TaskPriority;
  assigned_to?: string; // LEGACY: auth user_id - kept for backward compatibility
  team_member_id?: string; // NEW: team member ID - preferred
  scheduled_date: string;
  scheduled_time?: string;
  estimated_minutes?: number;
  requires_approval?: boolean;
  recurrence_pattern?: RecurrencePattern;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  assigned_to?: string; // LEGACY: auth user_id - kept for backward compatibility
  team_member_id?: string; // NEW: team member ID - preferred
  scheduled_date?: string;
  scheduled_time?: string;
  notes?: string;
  skip_reason?: string;
  actual_minutes?: number;
}

export interface CompleteTaskInput {
  notes?: string;
  actual_minutes?: number;
}

export interface TaskFilters {
  status?: TaskStatus;
  task_type?: TaskType;
  assigned_to?: string;
  date_from?: string;
  date_to?: string;
  priority?: TaskPriority;
}

// Helper constants
export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  cleaning_daily: 'Daily Cleaning',
  cleaning_weekly: 'Weekly Cleaning',
  temperature: 'Temperature Log',
  opening: 'Opening Checklist',
  closing: 'Closing Checklist',
  maintenance: 'Maintenance',
  others: 'Others'
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  critical: 'Critical',
  important: 'Important',
  normal: 'Normal'
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
  overdue: 'Overdue',
  skipped: 'Skipped'
};
