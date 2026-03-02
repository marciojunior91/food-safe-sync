/**
 * ================================================================
 * TASK OCCURRENCES - SUPABASE QUERIES
 * ================================================================
 * CRUD operations for task_occurrences table
 * Includes completion, approval, subtasks, and photo management
 * 
 * ⚠️ NOTE: Uses type assertions (as any) due to Supabase types not updated yet
 * See docs/ATUALIZAR_TIPOS_SUPABASE.md for instructions to fix
 * ================================================================
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  TaskOccurrence,
  TaskOccurrenceInsert,
  TaskOccurrenceUpdate,
  TaskOccurrenceFilters,
  TaskOccurrenceWithSeries,
  TaskStatus,
  Subtask,
  PhotoPath,
  TaskStatistics,
} from '@/types/recurring-tasks';

// ================================================================
// CREATE
// ================================================================

export async function createTaskOccurrence(
  occurrence: TaskOccurrenceInsert
): Promise<TaskOccurrence> {
  const { data, error } = await supabase
    .from('task_occurrences' as any)
    .insert(occurrence as any)
    .select()
    .single();

  if (error) {
    console.error('Error creating task occurrence:', error);
    throw new Error(`Failed to create task occurrence: ${error.message}`);
  }

  return data as TaskOccurrence;
}

export async function createOneTimeTask(
  occurrence: Omit<TaskOccurrenceInsert, 'series_id'>
): Promise<TaskOccurrence> {
  return createTaskOccurrence({
    ...occurrence,
    series_id: null,
  });
}

// ================================================================
// READ
// ================================================================

export async function getTaskOccurrence(
  occurrenceId: string
): Promise<TaskOccurrence | null> {
  const { data, error } = await supabase
    .from('task_occurrences' as any)
    .select()
    .eq('id', occurrenceId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching task occurrence:', error);
    throw new Error(`Failed to fetch task occurrence: ${error.message}`);
  }

  return data as TaskOccurrence;
}

export async function getTaskOccurrenceWithSeries(
  occurrenceId: string
): Promise<TaskOccurrenceWithSeries | null> {
  const { data, error } = await supabase
    .from('task_occurrences' as any)
    .select(`
      *,
      series:task_series(*)
    `)
    .eq('id', occurrenceId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching task occurrence with series:', error);
    throw new Error(`Failed to fetch task occurrence: ${error.message}`);
  }

  return data as TaskOccurrenceWithSeries;
}

export async function getTaskOccurrencesList(
  filters: TaskOccurrenceFilters = {}
): Promise<TaskOccurrence[]> {
  let query = supabase.from('task_occurrences' as any).select();

  if (filters.organization_id) {
    query = query.eq('organization_id', filters.organization_id);
  }

  if (filters.series_id) {
    query = query.eq('series_id', filters.series_id);
  }

  if (filters.status) {
    if (Array.isArray(filters.status)) {
      query = query.in('status', filters.status);
    } else {
      query = query.eq('status', filters.status);
    }
  }

  if (filters.assigned_to) {
    if (Array.isArray(filters.assigned_to)) {
      query = query.overlaps('assigned_to', filters.assigned_to);
    } else {
      query = query.contains('assigned_to', [filters.assigned_to]);
    }
  }

  if (filters.task_type) {
    if (Array.isArray(filters.task_type)) {
      query = query.in('task_type', filters.task_type);
    } else {
      query = query.eq('task_type', filters.task_type);
    }
  }

  if (filters.date_from) {
    query = query.gte('scheduled_date', filters.date_from);
  }

  if (filters.date_to) {
    query = query.lte('scheduled_date', filters.date_to);
  }

  if (filters.is_recurring !== undefined) {
    if (filters.is_recurring) {
      query = query.not('series_id', 'is', null);
    } else {
      query = query.is('series_id', null);
    }
  }

  const { data, error } = await query.order('scheduled_date', {
    ascending: true,
  });

  if (error) {
    console.error('Error fetching task occurrences:', error);
    throw new Error(`Failed to fetch task occurrences: ${error.message}`);
  }

  return (data as TaskOccurrence[]) || [];
}

export async function getTaskOccurrencesForDate(
  date: string,
  organizationId: string
): Promise<TaskOccurrence[]> {
  return getTaskOccurrencesList({
    organization_id: organizationId,
    date_from: date,
    date_to: date,
  });
}

export async function getTaskOccurrencesForDateRange(
  startDate: string,
  endDate: string,
  organizationId: string
): Promise<TaskOccurrence[]> {
  return getTaskOccurrencesList({
    organization_id: organizationId,
    date_from: startDate,
    date_to: endDate,
  });
}

export async function getTaskStatistics(
  organizationId: string,
  dateFrom?: string,
  dateTo?: string
): Promise<TaskStatistics> {
  let query = supabase
    .from('task_occurrences' as any)
    .select('status, scheduled_date')
    .eq('organization_id', organizationId);

  if (dateFrom) query = query.gte('scheduled_date', dateFrom);
  if (dateTo) query = query.lte('scheduled_date', dateTo);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching task statistics:', error);
    throw new Error(`Failed to fetch statistics: ${error.message}`);
  }

  const tasks = data as Array<{ status: TaskStatus; scheduled_date: string }>;

  const stats: TaskStatistics = {
    total: tasks.length,
    not_started: 0,
    in_progress: 0,
    completed: 0,
    skipped: 0,
    overdue: 0,
  };

  const today = new Date().toISOString().split('T')[0];

  tasks.forEach((task) => {
    stats[task.status]++;
    if (task.status === 'not_started' && task.scheduled_date < today) {
      stats.overdue++;
    }
  });

  return stats;
}

// ================================================================
// UPDATE
// ================================================================

export async function updateTaskOccurrence(
  occurrenceId: string,
  updates: TaskOccurrenceUpdate
): Promise<TaskOccurrence> {
  const { data, error } = await supabase
    .from('task_occurrences' as any)
    .update(updates as any)
    .eq('id', occurrenceId)
    .select()
    .single();

  if (error) {
    console.error('Error updating task occurrence:', error);
    throw new Error(`Failed to update task occurrence: ${error.message}`);
  }

  return data as TaskOccurrence;
}

export async function updateTaskOccurrenceWithModification(
  occurrenceId: string,
  updates: TaskOccurrenceUpdate
): Promise<TaskOccurrence> {
  return updateTaskOccurrence(occurrenceId, {
    ...updates,
    is_modified: true,
  });
}

// ================================================================
// STATUS MANAGEMENT
// ================================================================

export async function startTask(occurrenceId: string): Promise<TaskOccurrence> {
  return updateTaskOccurrence(occurrenceId, {
    status: 'in_progress',
  });
}

export async function completeTask(
  occurrenceId: string,
  completedBy: string,
  actualMinutes?: number,
  notes?: string
): Promise<TaskOccurrence> {
  return updateTaskOccurrence(occurrenceId, {
    status: 'completed',
    completed_at: new Date().toISOString(),
    completed_by: completedBy,
    actual_minutes: actualMinutes,
    notes,
  });
}

export async function skipTask(
  occurrenceId: string,
  skipReason: string
): Promise<TaskOccurrence> {
  return updateTaskOccurrence(occurrenceId, {
    status: 'skipped',
    skip_reason: skipReason,
  });
}

export async function approveTask(
  occurrenceId: string,
  approvedBy: string
): Promise<TaskOccurrence> {
  return updateTaskOccurrence(occurrenceId, {
    approved_by: approvedBy,
    approved_at: new Date().toISOString(),
  });
}

export async function reopenTask(
  occurrenceId: string
): Promise<TaskOccurrence> {
  return updateTaskOccurrence(occurrenceId, {
    status: 'not_started',
    completed_at: null,
    completed_by: null,
    approved_at: null,
    approved_by: null,
    skip_reason: null,
    actual_minutes: null,
  });
}

// ================================================================
// SUBTASK MANAGEMENT
// ================================================================

export async function updateSubtasks(
  occurrenceId: string,
  subtasks: Subtask[]
): Promise<TaskOccurrence> {
  // Compute percent_complete client-side for optimistic accuracy.
  // The DB trigger (sync_subtask_percent) will also recalculate + auto-complete server-side.
  const total = subtasks.length;
  const completed = subtasks.filter((st) => st.completed).length;
  const percent_complete = total > 0 ? Math.round((completed / total) * 100) : 0;
  return updateTaskOccurrence(occurrenceId, { subtasks, percent_complete });
}

export async function addSubtask(
  occurrenceId: string,
  subtask: Omit<Subtask, 'id' | 'order'>
): Promise<TaskOccurrence> {
  const occurrence = await getTaskOccurrence(occurrenceId);
  if (!occurrence) throw new Error('Task occurrence not found');

  const newSubtask: Subtask = {
    id: crypto.randomUUID(),
    ...subtask,
    order: occurrence.subtasks.length,
  };

  const updatedSubtasks = [...occurrence.subtasks, newSubtask];
  return updateSubtasks(occurrenceId, updatedSubtasks);
}

export async function toggleSubtask(
  occurrenceId: string,
  subtaskId: string
): Promise<TaskOccurrence> {
  const occurrence = await getTaskOccurrence(occurrenceId);
  if (!occurrence) throw new Error('Task occurrence not found');

  const updatedSubtasks = occurrence.subtasks.map((st) =>
    st.id === subtaskId ? { ...st, completed: !st.completed } : st
  );

  return updateSubtasks(occurrenceId, updatedSubtasks);
}

export async function deleteSubtask(
  occurrenceId: string,
  subtaskId: string
): Promise<TaskOccurrence> {
  const occurrence = await getTaskOccurrence(occurrenceId);
  if (!occurrence) throw new Error('Task occurrence not found');

  const updatedSubtasks = occurrence.subtasks
    .filter((st) => st.id !== subtaskId)
    .map((st, idx) => ({ ...st, order: idx }));

  return updateSubtasks(occurrenceId, updatedSubtasks);
}

// ================================================================
// PHOTO MANAGEMENT
// ================================================================

export async function updatePhotos(
  occurrenceId: string,
  photos: PhotoPath[]
): Promise<TaskOccurrence> {
  return updateTaskOccurrence(occurrenceId, { photos });
}

export async function addPhoto(
  occurrenceId: string,
  photoPath: PhotoPath
): Promise<TaskOccurrence> {
  const occurrence = await getTaskOccurrence(occurrenceId);
  if (!occurrence) throw new Error('Task occurrence not found');

  const updatedPhotos = [...occurrence.photos, photoPath];
  return updatePhotos(occurrenceId, updatedPhotos);
}

export async function deletePhoto(
  occurrenceId: string,
  photoPath: PhotoPath
): Promise<TaskOccurrence> {
  const occurrence = await getTaskOccurrence(occurrenceId);
  if (!occurrence) throw new Error('Task occurrence not found');

  const updatedPhotos = occurrence.photos.filter((p) => p !== photoPath);
  return updatePhotos(occurrenceId, updatedPhotos);
}

// ================================================================
// DELETE
// ================================================================

export async function deleteTaskOccurrence(
  occurrenceId: string
): Promise<void> {
  const { error } = await supabase
    .from('task_occurrences' as any)
    .delete()
    .eq('id', occurrenceId);

  if (error) {
    console.error('Error deleting task occurrence:', error);
    throw new Error(`Failed to delete task occurrence: ${error.message}`);
  }
}

export async function deleteAllOccurrencesForSeries(
  seriesId: string
): Promise<void> {
  const { error } = await supabase
    .from('task_occurrences' as any)
    .delete()
    .eq('series_id', seriesId);

  if (error) {
    console.error('Error deleting occurrences for series:', error);
    throw new Error(`Failed to delete occurrences: ${error.message}`);
  }
}

export async function deleteFutureOccurrencesForSeries(
  seriesId: string
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  const { error } = await supabase
    .from('task_occurrences' as any)
    .delete()
    .eq('series_id', seriesId)
    .eq('status', 'not_started')
    .gte('scheduled_date', today);

  if (error) {
    console.error('Error deleting future occurrences:', error);
    throw new Error(`Failed to delete future occurrences: ${error.message}`);
  }
}
