import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  RoutineTask, 
  TaskTemplate, 
  TaskStatus, 
  TaskType,
  CreateTaskInput,
  UpdateTaskInput,
  TaskFilters
} from '@/types/routineTasks';

/**
 * Hook for managing routine tasks
 * Provides CRUD operations and real-time subscriptions
 */
export function useRoutineTasks(organizationId?: string) {
  const [tasks, setTasks] = useState<RoutineTask[]>([]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch tasks with optional filters
  const fetchTasks = useCallback(async (filters?: TaskFilters) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('routine_tasks')
        .select('*')
        .order('scheduled_date', { ascending: false });

      // Apply organization filter if provided
      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      // Apply additional filters
      if (filters) {
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        if (filters.task_type) {
          query = query.eq('task_type', filters.task_type);
        }
        if (filters.assigned_to) {
          query = query.eq('assigned_to', filters.assigned_to);
        }
        if (filters.date_from) {
          query = query.gte('scheduled_date', filters.date_from);
        }
        if (filters.date_to) {
          query = query.lte('scheduled_date', filters.date_to);
        }
        if (filters.priority) {
          query = query.eq('priority', filters.priority);
        }
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setTasks((data as any[]) || []);
    } catch (err) {
      console.error('Error fetching routine tasks:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  // Fetch task templates
  const fetchTemplates = useCallback(async () => {
    try {
      let query = supabase
        .from('task_templates')
        .select('*')
        .order('name');

      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setTemplates((data as any[]) || []);
    } catch (err) {
      console.error('Error fetching task templates:', err);
    }
  }, [organizationId]);

  // Create a new task
  const createTask = async (input: CreateTaskInput): Promise<RoutineTask | null> => {
    try {
      // Build insert payload explicitly to ensure all fields are included
      const insertPayload: Record<string, any> = {
        title: input.title,
        description: input.description,
        task_type: input.task_type,
        priority: input.priority || 'normal',
        scheduled_date: input.scheduled_date,
        scheduled_time: input.scheduled_time || null,
        estimated_minutes: input.estimated_minutes || null,
        team_member_id: input.team_member_id || null,
        assignees: input.assignees && input.assignees.length > 0 ? input.assignees : [],
        subtasks: input.subtasks || [],
        organization_id: organizationId,
        status: 'not_started',
        requires_approval: input.requires_approval || false,
        recurrence_pattern: input.recurrence_pattern || null,
        department_id: input.department_id || null,
      };

      const { data, error: createError } = await supabase
        .from('routine_tasks')
        .insert(insertPayload as any)
        .select('*')
        .single();

      if (createError) throw createError;

      // Update local state
      if (data) {
        setTasks(prev => [data as any, ...prev]);
      }

      return data as any;
    } catch (err) {
      console.error('Error creating routine task:', err);
      setError(err as Error);
      return null;
    }
  };

  // Update an existing task
  const updateTask = async (
    taskId: string, 
    updates: UpdateTaskInput
  ): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('routine_tasks')
        .update(updates)
        .eq('id', taskId);

      if (updateError) throw updateError;

      // Update local state
      setTasks(prev =>
        prev.map(task =>
          task.id === taskId ? { ...task, ...updates } : task
        )
      );

      return true;
    } catch (err) {
      console.error('Error updating routine task:', err);
      setError(err as Error);
      return false;
    }
  };

  // Update task status
  const updateTaskStatus = async (
    taskId: string,
    status: TaskStatus,
    completedBy?: string
  ): Promise<boolean> => {
    const updates: any = { status };
    
    if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
      if (completedBy) {
        updates.completed_by = completedBy;
      }
    } else if (status === 'in_progress') {
      updates.started_at = new Date().toISOString();
    }

    return updateTask(taskId, updates);
  };

  // Complete a single occurrence of a recurring task (adds date to completion_dates)
  const completeRecurringOccurrence = async (
    taskId: string,
    occurrenceDate: string,
    completedBy?: string
  ): Promise<boolean> => {
    try {
      // Fetch current completion_dates
      const { data, error: fetchError } = await supabase
        .from('routine_tasks')
        .select('completion_dates')
        .eq('id', taskId)
        .single();

      if (fetchError) throw fetchError;

      const existing: string[] = Array.isArray(data?.completion_dates) ? data.completion_dates : [];
      if (existing.includes(occurrenceDate)) return true; // Already completed

      const updated = [...existing, occurrenceDate];
      const { error: updateError } = await supabase
        .from('routine_tasks')
        .update({
          completion_dates: updated,
          completed_at: new Date().toISOString(),
          ...(completedBy ? { completed_by: completedBy } : {}),
        })
        .eq('id', taskId);

      if (updateError) throw updateError;

      // Update local state
      setTasks(prev =>
        prev.map(task =>
          task.id === taskId
            ? { ...task, completion_dates: updated }
            : task
        )
      );

      return true;
    } catch (err) {
      console.error('Error completing recurring occurrence:', err);
      setError(err as Error);
      return false;
    }
  };

  // Delete a task
  const deleteTask = async (taskId: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('routine_tasks')
        .delete()
        .eq('id', taskId);

      if (deleteError) throw deleteError;

      // Update local state
      setTasks(prev => prev.filter(task => task.id !== taskId));

      return true;
    } catch (err) {
      console.error('Error deleting routine task:', err);
      setError(err as Error);
      return false;
    }
  };

  // Get tasks by status
  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status);
  };

  // Get overdue tasks
  const getOverdueTasks = () => {
    const now = new Date();
    return tasks.filter(
      task =>
        task.status !== 'completed' &&
        task.scheduled_date &&
        new Date(task.scheduled_date) < now
    );
  };

  // Get today's tasks
  const getTodayTasks = () => {
    const today = new Date().toISOString().split('T')[0];
    return tasks.filter(
      task => task.scheduled_date?.startsWith(today)
    );
  };

  // Create task from template
  const createFromTemplate = async (
    templateId: string,
    scheduledDate: string,
    assignedTo?: string
  ): Promise<RoutineTask | null> => {
    const template = templates.find(t => t.id === templateId);
    if (!template) {
      setError(new Error('Template not found'));
      return null;
    }

    return createTask({
      title: template.name,
      description: template.description,
      task_type: template.task_type,
      scheduled_date: scheduledDate,
      team_member_id: assignedTo,
      assignees: assignedTo ? [assignedTo] : [],
      priority: 'normal'
    });
  };

  // Initial fetch
  useEffect(() => {
    if (organizationId) {
      fetchTasks();
      fetchTemplates();
    }
  }, [organizationId, fetchTasks, fetchTemplates]);

  // Real-time subscription
  useEffect(() => {
    if (!organizationId) return;

    const channel = supabase
      .channel(`routine-tasks:${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'routine_tasks',
          filter: `organization_id=eq.${organizationId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks(prev => [payload.new as any, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setTasks(prev =>
              prev.map(task =>
                task.id === payload.new.id ? { ...task, ...payload.new } : task
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(task => task.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organizationId]);

  return {
    tasks,
    templates,
    loading,
    error,
    // CRUD operations
    fetchTasks,
    fetchTemplates,
    createTask,
    updateTask,
    updateTaskStatus,
    completeRecurringOccurrence,
    deleteTask,
    // Helper functions
    getTasksByStatus,
    getOverdueTasks,
    getTodayTasks,
    createFromTemplate,
    // Refresh
    refresh: fetchTasks
  };
}
