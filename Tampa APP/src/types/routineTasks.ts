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
  subtasks?: Array<{
    id: string;
    title: string;
    completed: boolean;
  }>;
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
  subtasks?: Array<{
    id: string;
    title: string;
    completed: boolean;
  }>;
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

// ============================================================================
// Task Activity Log Types
// ============================================================================

export type TaskActivityType =
  | 'created'
  | 'status_changed'
  | 'assignment_changed'
  | 'priority_changed'
  | 'due_date_changed'
  | 'title_updated'
  | 'description_updated'
  | 'note_added'
  | 'attachment_added'
  | 'attachment_removed'
  | 'deleted';

export interface TaskActivity {
  id: string;
  task_id: string;
  organization_id: string;
  activity_type: TaskActivityType;
  performed_by?: string;
  performed_by_name?: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  notes?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export const TASK_ACTIVITY_LABELS: Record<TaskActivityType, string> = {
  created: 'Task Created',
  status_changed: 'Status Changed',
  assignment_changed: 'Assignment Changed',
  priority_changed: 'Priority Changed',
  due_date_changed: 'Due Date Changed',
  title_updated: 'Title Updated',
  description_updated: 'Description Updated',
  note_added: 'Note Added',
  attachment_added: 'Photo Added',
  attachment_removed: 'Photo Removed',
  deleted: 'Task Deleted'
};

export const TASK_ACTIVITY_ICONS: Record<TaskActivityType, string> = {
  created: '✨',
  status_changed: '🔄',
  assignment_changed: '👤',
  priority_changed: '⚡',
  due_date_changed: '📅',
  title_updated: '✏️',
  description_updated: '📝',
  note_added: '💬',
  attachment_added: '📸',
  attachment_removed: '🗑️',
  deleted: '❌'
};
