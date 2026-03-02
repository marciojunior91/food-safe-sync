/**
 * ================================================================
 * useRecurringTasks — Business Logic Hook (Sprint 5, Fase 1.4)
 * ================================================================
 * Wraps task_occurrences + task_series query functions and provides:
 *   - State management (occurrences, series, loading, error)
 *   - Single-occurrence vs whole-series edit/delete context
 *   - Subtask reorder (drag & drop)
 *   - Completion, skip, and approval workflow
 *   - Real-time Supabase subscription
 * ================================================================
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

import type {
  TaskOccurrence,
  TaskOccurrenceInsert,
  TaskOccurrenceUpdate,
  TaskOccurrenceFilters,
  TaskSeries,
  TaskSeriesInsert,
  TaskSeriesUpdate,
  TaskSeriesFilters,
  EditDeleteContext,
  Subtask,
  PhotoPath,
  TaskStatistics,
} from '@/types/recurring-tasks';

import {
  getTaskOccurrencesList,
  getTaskOccurrencesForDateRange,
  getTaskStatistics,
  createTaskOccurrence,
  createOneTimeTask as createOneTimeTaskQuery,
  updateTaskOccurrence,
  updateTaskOccurrenceWithModification,
  completeTask as completeTaskQuery,
  startTask as startTaskQuery,
  skipTask as skipTaskQuery,
  approveTask as approveTaskQuery,
  reopenTask as reopenTaskQuery,
  deleteTaskOccurrence,
  deleteFutureOccurrencesForSeries,
  updateSubtasks,
} from '@/lib/queries/task-occurrences';

import {
  getTaskSeriesList,
  createTaskSeriesWithOccurrences,
  updateTaskSeries,
  updateTaskSeriesWithRegeneration,
  softDeleteTaskSeries,
  deleteTaskSeries,
  generateOccurrencesForRange,
} from '@/lib/queries/task-series';

// ================================================================
// TYPES
// ================================================================

export interface UseRecurringTasksOptions {
  organizationId?: string;
  /** Auto-fetch on mount when true (default: true) */
  autoFetch?: boolean;
  /** How many days ahead to generate occurrences on series create/update */
  generationDaysAhead?: number;
}

export interface DateRangeFilter {
  start: string; // ISO date YYYY-MM-DD
  end: string;
}

// ================================================================
// HOOK
// ================================================================

export function useRecurringTasks({
  organizationId,
  autoFetch = true,
  generationDaysAhead = 30,
}: UseRecurringTasksOptions = {}) {
  const [occurrences, setOccurrences] = useState<TaskOccurrence[]>([]);
  const [series, setSeries] = useState<TaskSeries[]>([]);
  const [statistics, setStatistics] = useState<TaskStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Track current date range for re-fetch after mutations
  const currentRangeRef = useRef<DateRangeFilter | null>(null);

  // ----------------------------------------------------------------
  // READ
  // ----------------------------------------------------------------

  const fetchOccurrences = useCallback(
    async (range?: DateRangeFilter) => {
      if (!organizationId) return;
      setLoading(true);
      setError(null);
      try {
        const filters: TaskOccurrenceFilters = { organization_id: organizationId };
        if (range) {
          filters.date_from = range.start;
          filters.date_to = range.end;
          currentRangeRef.current = range;
        }
        const data = await getTaskOccurrencesList(filters);
        setOccurrences(data);
      } catch (err) {
        console.error('[useRecurringTasks] fetchOccurrences error:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    },
    [organizationId]
  );

  const fetchSeries = useCallback(
    async (filters?: TaskSeriesFilters) => {
      if (!organizationId) return;
      try {
        const data = await getTaskSeriesList({
          organization_id: organizationId,
          ...filters,
        });
        setSeries(data);
      } catch (err) {
        console.error('[useRecurringTasks] fetchSeries error:', err);
      }
    },
    [organizationId]
  );

  const fetchStatistics = useCallback(
    async (range?: DateRangeFilter) => {
      if (!organizationId) return;
      try {
        const stats = await getTaskStatistics(
          organizationId,
          range?.start,
          range?.end
        );
        setStatistics(stats);
      } catch (err) {
        console.error('[useRecurringTasks] fetchStatistics error:', err);
      }
    },
    [organizationId]
  );

  // Re-fetch occurrences using the last known range
  const refresh = useCallback(() => {
    return fetchOccurrences(currentRangeRef.current ?? undefined);
  }, [fetchOccurrences]);

  // ----------------------------------------------------------------
  // CREATE
  // ----------------------------------------------------------------

  /** Create a one-time (non-recurring) task */
  const createOneTimeTask = async (
    occurrence: Omit<TaskOccurrenceInsert, 'series_id'>
  ): Promise<TaskOccurrence | null> => {
    try {
      const created = await createOneTimeTaskQuery({
        ...occurrence,
        organization_id: organizationId ?? occurrence.organization_id,
      });
      setOccurrences((prev) => [...prev, created]);
      return created;
    } catch (err) {
      console.error('[useRecurringTasks] createOneTimeTask error:', err);
      setError(err as Error);
      return null;
    }
  };

  /**
   * Create a recurring task series + generate the first N occurrences.
   * Uses createTaskSeriesWithOccurrences from task-series queries.
   */
  const createRecurringSeries = async (
    seriesData: Omit<TaskSeriesInsert, 'organization_id'>,
    daysAhead: number = generationDaysAhead
  ): Promise<{ series: TaskSeries; occurrences_created: number } | null> => {
    if (!organizationId) return null;
    try {
      const result = await createTaskSeriesWithOccurrences(
        { ...seriesData, organization_id: organizationId },
        daysAhead
      );
      setSeries((prev) => [result.series, ...prev]);
      // Refresh to pick up newly generated occurrences
      await refresh();
      return result;
    } catch (err) {
      console.error('[useRecurringTasks] createRecurringSeries error:', err);
      setError(err as Error);
      return null;
    }
  };

  // ----------------------------------------------------------------
  // UPDATE — EDIT CONTEXT (occurrence vs series)
  // ----------------------------------------------------------------

  /**
   * Update an occurrence.
   * - context='occurrence': marks is_modified=true, only this row changes.
   * - context='series': updates the series template + regenerates future occurrences.
   */
  const updateOccurrence = async (
    occurrence: TaskOccurrence,
    updates: TaskOccurrenceUpdate,
    context: EditDeleteContext = 'occurrence'
  ): Promise<boolean> => {
    try {
      if (context === 'occurrence' || !occurrence.series_id) {
        // Only this occurrence
        const updated = await updateTaskOccurrenceWithModification(
          occurrence.id,
          updates
        );
        setOccurrences((prev) =>
          prev.map((o) => (o.id === occurrence.id ? updated : o))
        );
      } else {
        // Whole series — derive series updates from occurrence update fields
        // Fields that can propagate: title, description, task_type, priority,
        // assigned_to, estimated_minutes, requires_approval, notes
        const seriesUpdates: TaskSeriesUpdate = {};
        if (updates.title !== undefined) seriesUpdates.title = updates.title;
        if (updates.description !== undefined) seriesUpdates.description = updates.description;
        if (updates.task_type !== undefined) seriesUpdates.task_type = updates.task_type;
        if (updates.priority !== undefined) seriesUpdates.priority = updates.priority;
        if (updates.estimated_minutes !== undefined) seriesUpdates.estimated_minutes = updates.estimated_minutes;
        if (updates.requires_approval !== undefined) seriesUpdates.requires_approval = updates.requires_approval;

        await updateTaskSeriesWithRegeneration(
          occurrence.series_id,
          seriesUpdates,
          generationDaysAhead
        );
        setSeries((prev) =>
          prev.map((s) =>
            s.id === occurrence.series_id ? { ...s, ...seriesUpdates } : s
          )
        );
        await refresh();
      }
      return true;
    } catch (err) {
      console.error('[useRecurringTasks] updateOccurrence error:', err);
      setError(err as Error);
      return false;
    }
  };

  // ----------------------------------------------------------------
  // DELETE — DELETE CONTEXT (occurrence vs series)
  // ----------------------------------------------------------------

  /**
   * Delete an occurrence.
   * - context='occurrence': deletes only this occurrence.
   * - context='series': soft-deletes the series (preserves history, removes future).
   */
  const deleteOccurrence = async (
    occurrence: TaskOccurrence,
    context: EditDeleteContext = 'occurrence'
  ): Promise<boolean> => {
    try {
      if (context === 'occurrence' || !occurrence.series_id) {
        await deleteTaskOccurrence(occurrence.id);
        setOccurrences((prev) => prev.filter((o) => o.id !== occurrence.id));
      } else {
        // Soft-delete: end series + remove future not_started occurrences
        await softDeleteTaskSeries(occurrence.series_id);
        // Remove future occurrences from local state
        const today = format(new Date(), 'yyyy-MM-dd');
        setOccurrences((prev) =>
          prev.filter(
            (o) =>
              !(
                o.series_id === occurrence.series_id &&
                o.status === 'not_started' &&
                o.scheduled_date >= today
              )
          )
        );
        setSeries((prev) =>
          prev.map((s) =>
            s.id === occurrence.series_id
              ? { ...s, series_end_date: today }
              : s
          )
        );
      }
      return true;
    } catch (err) {
      console.error('[useRecurringTasks] deleteOccurrence error:', err);
      setError(err as Error);
      return false;
    }
  };

  // ----------------------------------------------------------------
  // STATUS MANAGEMENT
  // ----------------------------------------------------------------

  const completeOccurrence = async (
    occurrenceId: string,
    completedBy: string,
    opts?: { actualMinutes?: number; notes?: string }
  ): Promise<boolean> => {
    try {
      const updated = await completeTaskQuery(
        occurrenceId,
        completedBy,
        opts?.actualMinutes,
        opts?.notes
      );
      setOccurrences((prev) =>
        prev.map((o) => (o.id === occurrenceId ? updated : o))
      );
      return true;
    } catch (err) {
      console.error('[useRecurringTasks] completeOccurrence error:', err);
      setError(err as Error);
      return false;
    }
  };

  const startOccurrence = async (occurrenceId: string): Promise<boolean> => {
    try {
      const updated = await startTaskQuery(occurrenceId);
      setOccurrences((prev) =>
        prev.map((o) => (o.id === occurrenceId ? updated : o))
      );
      return true;
    } catch (err) {
      console.error('[useRecurringTasks] startOccurrence error:', err);
      setError(err as Error);
      return false;
    }
  };

  const skipOccurrence = async (
    occurrenceId: string,
    reason: string
  ): Promise<boolean> => {
    try {
      const updated = await skipTaskQuery(occurrenceId, reason);
      setOccurrences((prev) =>
        prev.map((o) => (o.id === occurrenceId ? updated : o))
      );
      return true;
    } catch (err) {
      console.error('[useRecurringTasks] skipOccurrence error:', err);
      setError(err as Error);
      return false;
    }
  };

  const reopenOccurrence = async (occurrenceId: string): Promise<boolean> => {
    try {
      const updated = await reopenTaskQuery(occurrenceId);
      setOccurrences((prev) =>
        prev.map((o) => (o.id === occurrenceId ? updated : o))
      );
      return true;
    } catch (err) {
      console.error('[useRecurringTasks] reopenOccurrence error:', err);
      setError(err as Error);
      return false;
    }
  };

  // ----------------------------------------------------------------
  // APPROVAL WORKFLOW
  // ----------------------------------------------------------------

  const approveOccurrence = async (
    occurrenceId: string,
    approvedBy: string
  ): Promise<boolean> => {
    try {
      const updated = await approveTaskQuery(occurrenceId, approvedBy);
      setOccurrences((prev) =>
        prev.map((o) => (o.id === occurrenceId ? updated : o))
      );
      return true;
    } catch (err) {
      console.error('[useRecurringTasks] approveOccurrence error:', err);
      setError(err as Error);
      return false;
    }
  };

  // ----------------------------------------------------------------
  // SUBTASKS — Reorder (drag & drop)
  // ----------------------------------------------------------------

  /**
   * Reorder subtasks for an occurrence.
   * Called after DnD completes with the new array order.
   */
  const reorderSubtasks = async (
    occurrenceId: string,
    reorderedSubtasks: Subtask[]
  ): Promise<boolean> => {
    // Assign order indices to reflect new positions
    const withOrder = reorderedSubtasks.map((st, idx) => ({ ...st, order: idx }));

    // Optimistic update
    setOccurrences((prev) =>
      prev.map((o) =>
        o.id === occurrenceId ? { ...o, subtasks: withOrder } : o
      )
    );

    try {
      await updateSubtasks(occurrenceId, withOrder);
      return true;
    } catch (err) {
      console.error('[useRecurringTasks] reorderSubtasks error:', err);
      setError(err as Error);
      // Revert on failure
      await refresh();
      return false;
    }
  };

  /** Toggle a subtask's completed state */
  const toggleSubtask = async (
    occurrenceId: string,
    subtaskId: string
  ): Promise<boolean> => {
    const occurrence = occurrences.find((o) => o.id === occurrenceId);
    if (!occurrence) return false;

    const updated = occurrence.subtasks.map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );

    // Compute optimistic percent_complete
    const total = updated.length;
    const completedCount = updated.filter((st) => st.completed).length;
    const newPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    // Optimistic update — mirrors what the DB trigger will do:
    //   • percent_complete updated to newPercent
    //   • if 100% → auto-complete status (same as Teams percentComplete = 100)
    const now = new Date().toISOString();
    setOccurrences((prev) =>
      prev.map((o) => {
        if (o.id !== occurrenceId) return o;
        const autoComplete =
          newPercent === 100 &&
          total > 0 &&
          o.status !== 'completed' &&
          o.status !== 'skipped';
        return {
          ...o,
          subtasks: updated,
          percent_complete: newPercent,
          ...(autoComplete
            ? { status: 'completed' as const, completed_at: now }
            : {}),
        };
      })
    );

    try {
      await updateSubtasks(occurrenceId, updated);
      return true;
    } catch (err) {
      console.error('[useRecurringTasks] toggleSubtask error:', err);
      setError(err as Error);
      await refresh();
      return false;
    }
  };

  // ----------------------------------------------------------------
  // PHOTOS
  // ----------------------------------------------------------------

  const addPhoto = async (
    occurrenceId: string,
    photoPath: PhotoPath
  ): Promise<boolean> => {
    const occurrence = occurrences.find((o) => o.id === occurrenceId);
    if (!occurrence) return false;

    const updatedPhotos = [...occurrence.photos, photoPath];

    setOccurrences((prev) =>
      prev.map((o) =>
        o.id === occurrenceId ? { ...o, photos: updatedPhotos } : o
      )
    );

    try {
      await updateTaskOccurrence(occurrenceId, { photos: updatedPhotos });
      return true;
    } catch (err) {
      console.error('[useRecurringTasks] addPhoto error:', err);
      setError(err as Error);
      await refresh();
      return false;
    }
  };

  const removePhoto = async (
    occurrenceId: string,
    photoPath: PhotoPath
  ): Promise<boolean> => {
    const occurrence = occurrences.find((o) => o.id === occurrenceId);
    if (!occurrence) return false;

    const updatedPhotos = occurrence.photos.filter((p) => p !== photoPath);

    setOccurrences((prev) =>
      prev.map((o) =>
        o.id === occurrenceId ? { ...o, photos: updatedPhotos } : o
      )
    );

    try {
      await updateTaskOccurrence(occurrenceId, { photos: updatedPhotos });
      // Also delete from storage
      await supabase.storage.from('task-occurrences').remove([photoPath]);
      return true;
    } catch (err) {
      console.error('[useRecurringTasks] removePhoto error:', err);
      setError(err as Error);
      await refresh();
      return false;
    }
  };

  // ----------------------------------------------------------------
  // OCCURRENCE GENERATION (manual trigger / ensure future coverage)
  // ----------------------------------------------------------------

  const ensureOccurrences = async (
    seriesId: string,
    daysAhead: number = generationDaysAhead
  ): Promise<number> => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + daysAhead);
    const endDateStr = format(endDate, 'yyyy-MM-dd');

    try {
      const count = await generateOccurrencesForRange(seriesId, today, endDateStr);
      if (count > 0) await refresh();
      return count;
    } catch (err) {
      console.error('[useRecurringTasks] ensureOccurrences error:', err);
      return 0;
    }
  };

  // ----------------------------------------------------------------
  // REAL-TIME SUBSCRIPTION
  // ----------------------------------------------------------------

  useEffect(() => {
    if (!organizationId) return;

    const channel = supabase
      .channel(`recurring-tasks-${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_occurrences',
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newOcc = payload.new as TaskOccurrence;
            setOccurrences((prev) => {
              if (prev.find((o) => o.id === newOcc.id)) return prev;
              return [...prev, newOcc];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedOcc = payload.new as TaskOccurrence;
            setOccurrences((prev) =>
              prev.map((o) => (o.id === updatedOcc.id ? updatedOcc : o))
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id as string;
            setOccurrences((prev) => prev.filter((o) => o.id !== deletedId));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_series',
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setSeries((prev) => [payload.new as TaskSeries, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as TaskSeries;
            setSeries((prev) =>
              prev.map((s) => (s.id === updated.id ? updated : s))
            );
          } else if (payload.eventType === 'DELETE') {
            setSeries((prev) => prev.filter((s) => s.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organizationId]);

  // ----------------------------------------------------------------
  // AUTO-FETCH
  // ----------------------------------------------------------------

  useEffect(() => {
    if (autoFetch && organizationId) {
      const today = format(new Date(), 'yyyy-MM-dd');
      const in30 = format(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        'yyyy-MM-dd'
      );
      fetchOccurrences({ start: today, end: in30 });
      fetchSeries();
    }
  }, [autoFetch, organizationId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ----------------------------------------------------------------
  // DERIVED STATE
  // ----------------------------------------------------------------

  const getOccurrencesByDate = (date: string) =>
    occurrences.filter((o) => o.scheduled_date === date);

  const getOccurrencesBySeries = (seriesId: string) =>
    occurrences.filter((o) => o.series_id === seriesId);

  const getSeriesById = (seriesId: string) =>
    series.find((s) => s.id === seriesId);

  // ----------------------------------------------------------------
  // RETURN
  // ----------------------------------------------------------------

  return {
    // State
    occurrences,
    series,
    statistics,
    loading,
    error,

    // Read
    fetchOccurrences,
    fetchSeries,
    fetchStatistics,
    refresh,

    // Create
    createOneTimeTask,
    createRecurringSeries,

    // Update (with edit context)
    updateOccurrence,

    // Delete (with delete context)
    deleteOccurrence,

    // Status management
    completeOccurrence,
    startOccurrence,
    skipOccurrence,
    reopenOccurrence,

    // Approval
    approveOccurrence,

    // Subtasks
    reorderSubtasks,
    toggleSubtask,

    // Photos
    addPhoto,
    removePhoto,

    // Occurrence generation
    ensureOccurrences,

    // Derived helpers
    getOccurrencesByDate,
    getOccurrencesBySeries,
    getSeriesById,
  };
}
