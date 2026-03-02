/**
 * ================================================================
 * TASK SERIES - SUPABASE QUERIES
 * ================================================================
 * CRUD operations for task_series table
 * Includes recurrence management and occurrence generation
 * 
 * ⚠️ NOTE: Uses type assertions (as any) due to Supabase types not updated yet
 * See docs/ATUALIZAR_TIPOS_SUPABASE.md for instructions to fix
 * ================================================================
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  TaskSeries,
  TaskSeriesInsert,
  TaskSeriesUpdate,
  TaskSeriesFilters,
  TaskSeriesWithNextOccurrence,
} from '@/types/recurring-tasks';

// ================================================================
// CREATE
// ================================================================

/**
 * Create a new task series with recurrence configuration
 * @param series - Task series data to insert
 * @returns Created task series with ID
 */
export async function createTaskSeries(
  series: TaskSeriesInsert
): Promise<TaskSeries> {
  const { data, error } = await supabase
    .from('task_series' as any)
    .insert(series as any)
    .select()
    .single();

  if (error) {
    console.error('Error creating task series:', error);
    throw new Error(`Failed to create task series: ${error.message}`);
  }

  return data as TaskSeries;
}

/**
 * Create a task series AND generate occurrences for the next N days
 * @param series - Task series data
 * @param daysAhead - Number of days to generate (default: 30)
 * @returns Created series with generated occurrences count
 */
export async function createTaskSeriesWithOccurrences(
  series: TaskSeriesInsert,
  daysAhead: number = 30
): Promise<{ series: TaskSeries; occurrences_created: number }> {
  // Step 1: Create series
  const createdSeries = await createTaskSeries(series);

  // Step 2: Generate occurrences using PostgreSQL function
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + daysAhead);

  const { data, error } = await supabase.rpc('generate_task_occurrences' as any, {
    p_series_id: createdSeries.id,
    p_start_date: createdSeries.series_start_date,
    p_end_date: endDate.toISOString().split('T')[0],
  } as any);

  if (error) {
    console.error('Error generating occurrences:', error);
    throw new Error(`Failed to generate occurrences: ${error.message}`);
  }

  return {
    series: createdSeries,
    occurrences_created: (data as number) || 0,
  };
}

// ================================================================
// READ
// ================================================================

/**
 * Get a single task series by ID
 * @param seriesId - Task series UUID
 * @returns Task series or null
 */
export async function getTaskSeries(
  seriesId: string
): Promise<TaskSeries | null> {
  const { data, error } = await supabase
    .from('task_series' as any)
    .select()
    .eq('id', seriesId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('Error fetching task series:', error);
    throw new Error(`Failed to fetch task series: ${error.message}`);
  }

  return data as TaskSeries;
}

/**
 * Get all task series for an organization with optional filters
 * @param filters - Query filters
 * @returns Array of task series
 */
export async function getTaskSeriesList(
  filters: TaskSeriesFilters = {}
): Promise<TaskSeries[]> {
  let query = supabase.from('task_series' as any).select();

  // Apply filters
  if (filters.organization_id) {
    query = query.eq('organization_id', filters.organization_id);
  }

  if (filters.recurrence_type) {
    if (Array.isArray(filters.recurrence_type)) {
      query = query.in('recurrence_type', filters.recurrence_type);
    } else {
      query = query.eq('recurrence_type', filters.recurrence_type);
    }
  }

  if (filters.task_type) {
    if (Array.isArray(filters.task_type)) {
      query = query.in('task_type', filters.task_type);
    } else {
      query = query.eq('task_type', filters.task_type);
    }
  }

  if (filters.is_active !== undefined) {
    const today = new Date().toISOString().split('T')[0];
    if (filters.is_active) {
      query = query.or(`series_end_date.is.null,series_end_date.gt.${today}`);
    } else {
      query = query.lte('series_end_date', today);
    }
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching task series list:', error);
    throw new Error(`Failed to fetch task series: ${error.message}`);
  }

  return (data as TaskSeries[]) || [];
}

/**
 * Get task series with next upcoming occurrence and statistics
 * @param seriesId - Task series UUID
 * @returns Series with next occurrence and stats
 */
export async function getTaskSeriesWithStats(
  seriesId: string
): Promise<TaskSeriesWithNextOccurrence | null> {
  const series = await getTaskSeries(seriesId);
  if (!series) return null;

  const today = new Date().toISOString().split('T')[0];

  // Get next occurrence (scheduled >= today, not completed, ordered by date)
  const { data: nextOccurrence } = await supabase
    .from('task_occurrences' as any)
    .select()
    .eq('series_id', seriesId)
    .gte('scheduled_date', today)
    .neq('status', 'completed')
    .order('scheduled_date', { ascending: true })
    .limit(1)
    .single();

  // Get total occurrences
  const { count: totalCount } = await supabase
    .from('task_occurrences' as any)
    .select('*', { count: 'exact', head: true })
    .eq('series_id', seriesId);

  // Get completed occurrences
  const { count: completedCount } = await supabase
    .from('task_occurrences' as any)
    .select('*', { count: 'exact', head: true })
    .eq('series_id', seriesId)
    .eq('status', 'completed');

  return {
    ...series,
    next_occurrence: (nextOccurrence as any) || null,
    total_occurrences: totalCount || 0,
    completed_occurrences: completedCount || 0,
  };
}

// ================================================================
// UPDATE
// ================================================================

/**
 * Update task series (affects ONLY new occurrences, not past ones)
 * @param seriesId - Task series UUID
 * @param updates - Fields to update
 * @returns Updated task series
 */
export async function updateTaskSeries(
  seriesId: string,
  updates: TaskSeriesUpdate
): Promise<TaskSeries> {
  const { data, error } = await supabase
    .from('task_series' as any)
    .update(updates as any)
    .eq('id', seriesId)
    .select()
    .single();

  if (error) {
    console.error('Error updating task series:', error);
    throw new Error(`Failed to update task series: ${error.message}`);
  }

  return data as TaskSeries;
}

/**
 * Update task series AND regenerate future occurrences
 * (Deletes existing future occurrences and recreates them)
 * @param seriesId - Task series UUID
 * @param updates - Fields to update
 * @param daysAhead - Number of days to regenerate (default: 30)
 * @returns Updated series with regenerated occurrences count
 */
export async function updateTaskSeriesWithRegeneration(
  seriesId: string,
  updates: TaskSeriesUpdate,
  daysAhead: number = 30
): Promise<{ series: TaskSeries; occurrences_created: number }> {
  // Step 1: Update series
  const updatedSeries = await updateTaskSeries(seriesId, updates);

  // Step 2: Delete future occurrences (not started + scheduled >= today)
  const today = new Date().toISOString().split('T')[0];
  await supabase
    .from('task_occurrences' as any)
    .delete()
    .eq('series_id', seriesId)
    .eq('status', 'not_started')
    .gte('scheduled_date', today);

  // Step 3: Regenerate occurrences
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + daysAhead);

  const { data, error } = await supabase.rpc('generate_task_occurrences' as any, {
    p_series_id: seriesId,
    p_start_date: today,
    p_end_date: endDate.toISOString().split('T')[0],
  } as any);

  if (error) {
    console.error('Error regenerating occurrences:', error);
    throw new Error(`Failed to regenerate occurrences: ${error.message}`);
  }

  return {
    series: updatedSeries,
    occurrences_created: (data as number) || 0,
  };
}

/**
 * End a task series (set series_end_date to today)
 * @param seriesId - Task series UUID
 * @returns Updated task series
 */
export async function endTaskSeries(seriesId: string): Promise<TaskSeries> {
  const today = new Date().toISOString().split('T')[0];
  return updateTaskSeries(seriesId, { series_end_date: today });
}

// ================================================================
// DELETE
// ================================================================

/**
 * Delete task series (CASCADE deletes all occurrences)
 * ⚠️ WARNING: This deletes ALL occurrences, including completed ones
 * @param seriesId - Task series UUID
 */
export async function deleteTaskSeries(seriesId: string): Promise<void> {
  const { error } = await supabase
    .from('task_series' as any)
    .delete()
    .eq('id', seriesId);

  if (error) {
    console.error('Error deleting task series:', error);
    throw new Error(`Failed to delete task series: ${error.message}`);
  }
}

/**
 * Soft delete: End series + delete future occurrences only
 * (Preserves historical data)
 * @param seriesId - Task series UUID
 * @returns Updated task series with end date
 */
export async function softDeleteTaskSeries(
  seriesId: string
): Promise<TaskSeries> {
  const today = new Date().toISOString().split('T')[0];

  // Step 1: End series
  const updatedSeries = await endTaskSeries(seriesId);

  // Step 2: Delete future occurrences (not started + scheduled >= today)
  await supabase
    .from('task_occurrences' as any)
    .delete()
    .eq('series_id', seriesId)
    .eq('status', 'not_started')
    .gte('scheduled_date', today);

  return updatedSeries;
}

// ================================================================
// OCCURRENCE GENERATION
// ================================================================

/**
 * Generate occurrences for a specific date range
 * @param seriesId - Task series UUID
 * @param startDate - ISO date string
 * @param endDate - ISO date string
 * @returns Number of occurrences created
 */
export async function generateOccurrencesForRange(
  seriesId: string,
  startDate: string,
  endDate: string
): Promise<number> {
  const { data, error } = await supabase.rpc('generate_task_occurrences' as any, {
    p_series_id: seriesId,
    p_start_date: startDate,
    p_end_date: endDate,
  } as any);

  if (error) {
    console.error('Error generating occurrences:', error);
    throw new Error(`Failed to generate occurrences: ${error.message}`);
  }

  return (data as number) || 0;
}

/**
 * Batch generate occurrences for multiple series
 * (Useful for daily cron job)
 * @param seriesIds - Array of series UUIDs
 * @param daysAhead - Number of days to generate (default: 30)
 * @returns Total occurrences created across all series
 */
export async function batchGenerateOccurrences(
  seriesIds: string[],
  daysAhead: number = 30
): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + daysAhead);
  const endDateStr = endDate.toISOString().split('T')[0];

  let totalCreated = 0;

  for (const seriesId of seriesIds) {
    try {
      const count = await generateOccurrencesForRange(
        seriesId,
        today,
        endDateStr
      );
      totalCreated += count;
    } catch (error) {
      console.error(`Failed to generate for series ${seriesId}:`, error);
      // Continue with next series
    }
  }

  return totalCreated;
}
