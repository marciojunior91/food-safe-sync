import { useState, useMemo, useEffect } from "react";
import { Plus, Filter, Calendar as CalendarIcon, AlertCircle, Search, X, List, Clock, ChevronLeft, ChevronRight, FileText, Repeat, CheckCircle2, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Calendar } from "@/components/ui/calendar";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";

import { TaskForm } from "@/components/routine-tasks/TaskForm";
import { TaskCard } from "@/components/routine-tasks/TaskCard";
import { TaskDetailView } from "@/components/routine-tasks/TaskDetailView";
import { EditDeleteContextModal } from "@/components/routine-tasks/EditDeleteContextModal";
import { TaskOccurrenceCard } from "@/components/routine-tasks/TaskOccurrenceCard";
import { useRecurringTasks } from "@/hooks/useRecurringTasks";
import type { TaskOccurrence, TaskSeries } from "@/types/recurring-tasks";
import { TaskTimeline } from "@/components/routine-tasks/TaskTimeline";
import { BulkActionsToolbar } from "@/components/routine-tasks/BulkActionsToolbar";
import { TemplatesManagement } from "@/components/routine-tasks/TemplatesManagement";
import { ComingSoonBadge } from "@/components/ui/ComingSoonBadge";
import { useRoutineTasks } from "@/hooks/useRoutineTasks";
import { usePeople } from "@/hooks/usePeople";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useUserContext } from "@/hooks/useUserContext";
import {
  RoutineTask,
  CreateTaskInput,
  TaskStatus,
  TaskType,
  TaskPriority,
  TASK_TYPE_LABELS,
  TASK_PRIORITY_LABELS,
} from "@/types/routineTasks";

export default function TasksOverview() {
  const { toast } = useToast();
  const { context, loading: contextLoading } = useUserContext();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<RoutineTask | null>(null);
  const [taskToEdit, setTaskToEdit] = useState<RoutineTask | null>(null);
  
  // Bulk selection state
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  // Recurring task edit/delete context state (RoutineTask – old system)
  const [editContextTask, setEditContextTask] = useState<RoutineTask | null>(null);
  const [editContextAction, setEditContextAction] = useState<'edit' | 'delete'>('delete');
  const [showEditDeleteModal, setShowEditDeleteModal] = useState(false);
  const [editSeriesMode, setEditSeriesMode] = useState(false);

  // ── Recurring tab state (new task_occurrences / task_series system) ──
  const [recurringRange, setRecurringRange] = useState(() => {
    const today = new Date();
    return {
      start: format(today, 'yyyy-MM-dd'),
      end: format(addDays(today, 6), 'yyyy-MM-dd'),
    };
  });
  const [occModal, setOccModal] = useState<{
    occ: TaskOccurrence;
    action: 'edit' | 'delete';
  } | null>(null);

  // Active tab state (controlled)
  const [activeTab, setActiveTab] = useState("today");

  // Assignee picker for "Mark as Complete"
  const [completingTask, setCompletingTask] = useState<RoutineTask | null>(null);
  const [selectedCompleter, setSelectedCompleter] = useState<string>("");

  // Hook for new recurring system
  const recurringTasks = useRecurringTasks({
    organizationId: context?.organization_id,
    autoFetch: false,          // we control fetching manually
    generationDaysAhead: 30,
  });

  // Fetch when org is ready or date range changes
  useEffect(() => {
    if (context?.organization_id) {
      recurringTasks.fetchOccurrences(recurringRange);
      recurringTasks.fetchSeries();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context?.organization_id, recurringRange.start, recurringRange.end]);

  // Shift the 7-day window forward or backward
  const shiftRecurringRange = (dir: 'prev' | 'next') => {
    setRecurringRange((prev) => {
      const offset = dir === 'next' ? 7 : -7;
      return {
        start: format(addDays(new Date(prev.start), offset), 'yyyy-MM-dd'),
        end:   format(addDays(new Date(prev.end),   offset), 'yyyy-MM-dd'),
      };
    });
  };

  // Complete a TaskOccurrence
  const handleCompleteOccurrence = async (occ: TaskOccurrence) => {
    if (!context?.user_id) return;
    const ok = await recurringTasks.completeOccurrence(occ.id, context.user_id);
    if (ok) {
      toast({ title: 'Task Completed!', description: `"${occ.title}" marked as complete` });
    }
  };

  // Skip a TaskOccurrence
  const handleSkipOccurrence = async (occ: TaskOccurrence) => {
    const ok = await recurringTasks.skipOccurrence(occ.id, 'Skipped by user');
    if (ok) {
      toast({ title: 'Task Skipped', description: `"${occ.title}" has been skipped` });
    }
  };

  // Open edit/delete context modal for a TaskOccurrence
  const openOccModal = (occ: TaskOccurrence, action: 'edit' | 'delete') => {
    // One-off tasks (no series_id) → skip modal, act directly
    if (!occ.series_id) {
      if (action === 'delete') {
        if (confirm(`Delete "${occ.title}"?`)) {
          recurringTasks.deleteOccurrence(occ)
            .then(ok => ok && toast({ title: 'Deleted', description: `"${occ.title}" removed` }));
        }
      }
      return;
    }
    setOccModal({ occ, action });
  };

  // Confirm handler from the occurrence EditDeleteContextModal
  const handleOccModalConfirm = async (ctx: 'occurrence' | 'series') => {
    if (!occModal) return;
    const { occ, action } = occModal;
    setOccModal(null);
    if (action === 'delete') {
      const ok = await recurringTasks.deleteOccurrence(occ, ctx);
      if (ok) {
        toast({
          title: ctx === 'series' ? 'Series Deleted' : 'Task Deleted',
          description: ctx === 'series'
            ? 'All future occurrences removed'
            : `"${occ.title}" removed`,
        });
      }
    } else {
      // edit — for now, reload so the user can use the existing RoutineTask form
      // TODO (Fase 3): open dedicated occurrence edit form
      toast({
        title: 'Edit coming soon',
        description: 'Occurrence editing form is planned for Fase 3',
        variant: 'default',
      });
    }
  };
  
  // View mode state: 'list', 'timeline', or 'templates'
  const [viewMode, setViewMode] = useState<'list' | 'timeline' | 'templates'>('list');
  
  // Selected date for timeline view
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "all">("all");
  const [filterType, setFilterType] = useState<TaskType | "all">("all");
  const [filterPriority, setFilterPriority] = useState<TaskPriority | "all">("all");
  const [filterAssignedUser, setFilterAssignedUser] = useState<string | "all">("all");

  // Fetch users from the organization (auth users - kept for backward compatibility)
  const { users, loading: usersLoading } = usePeople(context?.organization_id);
  
  // Fetch team members from the organization
  const { teamMembers, loading: teamMembersLoading, fetchTeamMembers } = useTeamMembers();
  
  // Fetch team members when organization context is available
  useEffect(() => {
    if (context?.organization_id) {
      fetchTeamMembers({ organization_id: context.organization_id, is_active: true });
    }
  }, [context?.organization_id]);

  // Use the routine tasks hook
  const {
    tasks,
    templates,
    loading,
    error,
    createTask,
    updateTask,
    updateTaskStatus,
    completeRecurringOccurrence,
    deleteTask,
    getTodayTasks,
    getOverdueTasks,
    getTasksByStatus,
    createFromTemplate,
  } = useRoutineTasks(context?.organization_id);

  // Filter tasks based on search and filters
  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((task) => task.status === filterStatus);
    }

    // Task type filter
    if (filterType !== "all") {
      filtered = filtered.filter((task) => task.task_type === filterType);
    }

    // Priority filter
    if (filterPriority !== "all") {
      filtered = filtered.filter((task) => task.priority === filterPriority);
    }

    // Assigned user filter (now using team_member_id instead of assigned_to)
    if (filterAssignedUser !== "all") {
      filtered = filtered.filter((task) => 
        task.team_member_id === filterAssignedUser || 
        task.assigned_to === filterAssignedUser // Fallback for legacy tasks
      );
    }

    return filtered;
  }, [tasks, searchQuery, filterStatus, filterType, filterPriority, filterAssignedUser]);

  // Get categorized tasks (using filtered tasks)
  const todayTasks = filteredTasks.filter((task) => {
    if (!task.scheduled_date) return false;
    const taskDate = task.scheduled_date.split('T')[0]; // Extract date part (YYYY-MM-DD)
    const today = format(new Date(), "yyyy-MM-dd");
    return taskDate === today;
  });

  const overdueTasks = filteredTasks.filter((task) => {
    if (!task.scheduled_date || task.status === "completed") return false;
    const taskDate = task.scheduled_date.split('T')[0]; // Extract date part
    const today = format(new Date(), "yyyy-MM-dd");
    return taskDate < today; // String comparison works for YYYY-MM-DD format
  });

  const notStartedTasks = filteredTasks.filter((task) => task.status === "not_started");
  const inProgressTasks = filteredTasks.filter((task) => task.status === "in_progress");
  const completedTasks = filteredTasks.filter((task) => task.status === "completed");

  // Get team members for the filter dropdown (instead of auth users)
  const uniqueUsers = useMemo(() => {
    return teamMembers.map((member) => ({
      id: member.id,
      name: member.display_name,
    }));
  }, [teamMembers]);

  // Check if any filters are active
  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    filterStatus !== "all" ||
    filterType !== "all" ||
    filterPriority !== "all" ||
    filterAssignedUser !== "all";

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setFilterStatus("all");
    setFilterType("all");
    setFilterPriority("all");
    setFilterAssignedUser("all");
  };

  // Handle task creation
  const handleCreateTask = async (data: CreateTaskInput) => {
    if (!context?.organization_id) {
      toast({
        title: "Error",
        description: "No organization found. Please log in again.",
        variant: "destructive",
      });
      return;
    }
    
    const newTask = await createTask(data);
    if (newTask) {
      setIsCreateDialogOpen(false);
      toast({
        title: "Success!",
        description: "Task created successfully",
      });
    }
  };

  // Open assignee picker before completing a task
  const handleCompleteTask = (task: RoutineTask) => {
    const assignees = task.assignees && task.assignees.length > 0 ? task.assignees : null;
    if (assignees && assignees.length > 1) {
      setCompletingTask(task);
      setSelectedCompleter(assignees[0]);
    } else {
      // Single assignee or unassigned — complete directly
      executeCompleteTask(task, assignees?.[0] ?? undefined);
    }
  };

  // Actually complete a task (called from picker dialog or directly)
  const executeCompleteTask = async (task: RoutineTask, completedByMemberId?: string) => {
    let completedById: string | undefined;
    if (completedByMemberId) {
      completedById = completedByMemberId;
    } else {
      const completingMember = teamMembers.find(tm => tm.auth_role_id === context?.user_id);
      completedById = completingMember?.id || context?.user_id;
    }

    // Detect virtual recurring instance (has _recurringInstanceDate from expandRecurringTask)
    const instanceDate = (task as any)._recurringInstanceDate as string | undefined;
    if (instanceDate && task.recurrence_pattern) {
      const success = await completeRecurringOccurrence(task.id, instanceDate, completedById);
      if (success) {
        toast({
          title: "Occurrence Completed!",
          description: `"${task.title}" on ${instanceDate} marked as complete`,
        });
      }
      return;
    }
    // Non-recurring task — update status as before
    const success = await updateTaskStatus(
      task.id,
      "completed",
      completedById
    );
    if (success) {
      toast({
        title: "Task Completed!",
        description: `"${task.title}" has been marked as complete`,
      });
    }
  };

  // Handle task deletion
  const handleDeleteTask = async (task: RoutineTask) => {
    // Recurring task — show context modal first
    if (task.recurrence_pattern) {
      setEditContextTask(task);
      setEditContextAction('delete');
      setShowEditDeleteModal(true);
      return;
    }
    // Non-recurring — direct confirm
    if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
      const success = await deleteTask(task.id);
      if (success) {
        setSelectedTask(null);
        toast({ title: "Task Deleted", description: "Task has been removed" });
      }
    }
  };

  // Confirm callback from EditDeleteContextModal
  const handleEditDeleteContextConfirm = async (ctx: 'occurrence' | 'series') => {
    setShowEditDeleteModal(false);
    if (!editContextTask) return;

    if (editContextAction === 'delete') {
      if (ctx === 'occurrence') {
        const success = await deleteTask(editContextTask.id);
        if (success) {
          setSelectedTask(null);
          toast({ title: "Task Deleted", description: "This occurrence has been removed" });
        }
      } else {
        // Delete all tasks in the series (same title + has recurrence_pattern)
        const seriesTasks = tasks.filter(
          (t) => t.title === editContextTask.title && !!t.recurrence_pattern
        );
        let count = 0;
        for (const t of seriesTasks) {
          if (await deleteTask(t.id)) count++;
        }
        setSelectedTask(null);
        toast({
          title: "Series Deleted",
          description: `${count} recurring task${count !== 1 ? 's' : ''} removed`,
        });
      }
    } else {
      // edit action
      setEditSeriesMode(ctx === 'series');
      setTaskToEdit(editContextTask);
      setIsEditDialogOpen(true);
    }
  };

  // Handle status change from detail view
  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    const success = await updateTaskStatus(taskId, newStatus, context?.user_id);
    if (success) {
      // Update the selected task with new status and timestamps
      if (selectedTask && selectedTask.id === taskId) {
        const updates: any = { status: newStatus };
        if (newStatus === 'completed') {
          updates.completed_at = new Date().toISOString();
          // Store team_member_id for score tracking (falls back to auth user_id)
          const completingMember = teamMembers.find(tm => tm.auth_role_id === context?.user_id);
          updates.completed_by = completingMember?.id || context?.user_id;
        } else if (newStatus === 'in_progress') {
          updates.started_at = new Date().toISOString();
        }
        setSelectedTask({ ...selectedTask, ...updates });
      }
      
      toast({
        title: "Status Updated",
        description: `Task status changed to ${newStatus.replace("_", " ")}`,
      });
    }
  };

  // Handle adding notes
  const handleAddNote = async (taskId: string, note: string) => {
    if (!note.trim()) {
      toast({
        title: "Error",
        description: "Note cannot be empty",
        variant: "destructive",
      });
      return;
    }

    // Append the new note to existing notes
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const timestamp = new Date().toLocaleString();
    const username = context?.display_name || "User";
    const newNote = `[${timestamp}] ${username}: ${note}`;
    const updatedNotes = task.notes 
      ? `${task.notes}\n${newNote}` 
      : newNote;

    // Update the selected task immediately for instant UI feedback
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask({ ...selectedTask, notes: updatedNotes });
    }

    const success = await updateTask(taskId, { notes: updatedNotes });
    
    if (success) {
      toast({
        title: "Note Added",
        description: "Your note has been saved",
      });
    } else {
      // Revert the optimistic update on failure
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask({ ...selectedTask, notes: task.notes });
      }
      toast({
        title: "Error",
        description: "Failed to save note",
        variant: "destructive",
      });
    }
  };

  // Handle task editing
  const handleEditTask = async (data: CreateTaskInput) => {
    if (!taskToEdit) return;

    const success = await updateTask(taskToEdit.id, {
      title: data.title,
      description: data.description,
      priority: data.priority,
      team_member_id: data.team_member_id,
      assignees: data.assignees,
      scheduled_date: data.scheduled_date,
      scheduled_time: data.scheduled_time,
    });

    if (success) {
      // Series mode: also update all other tasks with the same title + recurrence_pattern
      if (editSeriesMode) {
        const updates = {
          title: data.title,
          description: data.description,
          priority: data.priority,
          team_member_id: data.team_member_id,
          assignees: data.assignees,
          scheduled_time: data.scheduled_time,
          estimated_minutes: data.estimated_minutes,
        };
        const seriesTasks = tasks.filter(
          (t) => t.title === taskToEdit.title && !!t.recurrence_pattern && t.id !== taskToEdit.id
        );
        for (const t of seriesTasks) {
          await updateTask(t.id, updates);
        }
      }

      setIsEditDialogOpen(false);
      setTaskToEdit(null);
      setEditSeriesMode(false);

      // Update selected task if it's the one being edited
      if (selectedTask && selectedTask.id === taskToEdit.id) {
        const updatedTask = tasks.find(t => t.id === taskToEdit.id);
        if (updatedTask) setSelectedTask(updatedTask);
      }

      toast({
        title: "Success!",
        description: editSeriesMode ? "All tasks in the series updated" : "Task updated successfully",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    }
  };

  // Open edit dialog
  const openEditDialog = (task: RoutineTask) => {
    // Recurring task — show context modal first
    if (task.recurrence_pattern) {
      setEditContextTask(task);
      setEditContextAction('edit');
      setShowEditDeleteModal(true);
      return;
    }
    setEditSeriesMode(false);
    setTaskToEdit(task);
    setIsEditDialogOpen(true);
  };

  // Bulk Actions Handlers
  const handleSelectTask = (taskId: string, selected: boolean) => {
    setSelectedTaskIds(prev =>
      selected
        ? [...prev, taskId]
        : prev.filter(id => id !== taskId)
    );
  };

  const handleSelectAll = () => {
    setSelectedTaskIds(
      selectedTaskIds.length === filteredTasks.length
        ? []
        : filteredTasks.map(t => t.id)
    );
  };

  const handleBulkComplete = async () => {
    const completingMember = teamMembers.find(tm => tm.auth_role_id === context?.user_id);
    const completedById = completingMember?.id || context?.user_id;
    let successCount = 0;
    for (const taskId of selectedTaskIds) {
      const success = await updateTaskStatus(taskId, "completed", completedById);
      if (success) successCount++;
    }
    setSelectedTaskIds([]);
    toast({
      title: "Tasks Completed!",
      description: `${successCount} ${successCount === 1 ? 'task' : 'tasks'} marked as complete`,
    });
  };

  const handleBulkDelete = async () => {
    let successCount = 0;
    for (const taskId of selectedTaskIds) {
      const success = await deleteTask(taskId);
      if (success) successCount++;
    }
    setSelectedTaskIds([]);
    toast({
      title: "Tasks Deleted",
      description: `${successCount} ${successCount === 1 ? 'task' : 'tasks'} removed`,
    });
  };

  const handleBulkReassign = async (teamMemberId: string) => {
    let successCount = 0;
    for (const taskId of selectedTaskIds) {
      const success = await updateTask(taskId, {
        team_member_id: teamMemberId === "unassigned" ? null : teamMemberId
      });
      if (success) successCount++;
    }
    setSelectedTaskIds([]);
    toast({
      title: "Tasks Reassigned",
      description: `${successCount} ${successCount === 1 ? 'task' : 'tasks'} reassigned`,
    });
  };

  const handleBulkChangePriority = async (priority: TaskPriority) => {
    let successCount = 0;
    for (const taskId of selectedTaskIds) {
      const success = await updateTask(taskId, { priority });
      if (success) successCount++;
    }
    setSelectedTaskIds([]);
    toast({
      title: "Priority Updated",
      description: `${successCount} ${successCount === 1 ? 'task' : 'tasks'} updated`,
    });
  };

  const handleBulkChangeStatus = async (status: TaskStatus) => {
    let successCount = 0;
    for (const taskId of selectedTaskIds) {
      const success = await updateTaskStatus(taskId, status, context?.user_id);
      if (success) successCount++;
    }
    setSelectedTaskIds([]);
    toast({
      title: "Status Updated",
      description: `${successCount} ${successCount === 1 ? 'task' : 'tasks'} updated`,
    });
  };

  // Template Management Handlers
  const handleCreateTemplate = () => {
    toast({
      title: "Coming Soon",
      description: "Template creation form will be available soon",
    });
  };

  const handleEditTemplate = (template: any) => {
    toast({
      title: "Coming Soon",
      description: `Editing "${template.name}" will be available soon`,
    });
  };

  const handleDeleteTemplate = async (templateId: string): Promise<boolean> => {
    // TODO: Implement template deletion
    // For now, just show error since templates are managed in the database
    toast({
      title: "Cannot Delete",
      description: "Template deletion requires backend implementation",
      variant: "destructive",
    });
    return false;
  };

  const handleDuplicateTemplate = async (template: any) => {
    toast({
      title: "Coming Soon",
      description: `Duplicating "${template.name}" will be available soon`,
    });
  };

  // Loading state
  if (loading || contextLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  // No context state
  if (!context) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">Setup Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-700">
              Please complete your organization setup to access routine tasks.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Error Loading Tasks</CardTitle>
            <CardDescription className="text-red-600">
              {error.message}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Routine Tasks</h1>
          <p className="text-muted-foreground">
            Manage your daily operations and checklists
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {/* View Toggle */}
          <ToggleGroup 
            type="single" 
            value={viewMode} 
            onValueChange={(value) => value && setViewMode(value as 'list' | 'timeline' | 'templates')}
            className="justify-start sm:justify-center"
          >
            <ToggleGroupItem value="list" aria-label="List view" className="gap-2">
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">List</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="timeline" aria-label="Timeline view" className="gap-2">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Timeline</span>
            </ToggleGroupItem>
            {/* Templates view - Coming Soon */}
            {false && (
              <ToggleGroupItem value="templates" aria-label="Templates view" className="gap-2">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Templates</span>
              </ToggleGroupItem>
            )}
          </ToggleGroup>

          {/* Create Task Button (hidden in templates view) */}
          {viewMode !== 'templates' && (
            <>
              {isCreateDialogOpen && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                  <DialogDescription>
                    Add a new routine task to your schedule
                  </DialogDescription>
                </DialogHeader>
                <TaskForm
                  onSubmit={handleCreateTask}
                  users={teamMembers.map(tm => ({ user_id: tm.id, display_name: tm.display_name, role_type: tm.role_type }))}
                  isLoading={teamMembersLoading}
                />
              </DialogContent>
            </Dialog>
          )}
          
          <Button 
            size="lg" 
            className="gap-2 w-full sm:w-auto"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="w-5 h-5" />
            <span>{todayTasks.length === 0 ? 'Add Task' : 'New Task'}</span>
          </Button>
            </>
          )}
        </div>
      </div>

      {/* Templates View - Coming Soon */}
      {false && viewMode === 'templates' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Task Templates</CardTitle>
                  <CardDescription>Create and manage reusable task templates</CardDescription>
                </div>
                <ComingSoonBadge />
              </div>
            </CardHeader>
          </Card>
          <TemplatesManagement
            templates={templates}
            loading={loading}
            onCreateTemplate={handleCreateTemplate}
            onEditTemplate={handleEditTemplate}
            onDeleteTemplate={handleDeleteTemplate}
            onDuplicateTemplate={handleDuplicateTemplate}
          />
        </div>
      )}

      {/* Timeline Date Navigation (only shown in timeline view) */}
      {viewMode === 'timeline' && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Previous Day Button */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setDate(newDate.getDate() - 1);
                  setSelectedDate(newDate);
                }}
                className="shrink-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              {/* Center: Calendar Picker, Today Button, and Date Display */}
              <div className="flex items-center gap-2 flex-wrap justify-center">
                {/* Calendar Picker */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Select Date</span>
                      <span className="sm:hidden">Date</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="center">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      initialFocus
                      captionLayout="dropdown-buttons"
                      fromYear={2020}
                      toYear={2035}
                      fixedWeeks
                    />
                  </PopoverContent>
                </Popover>
                
                {/* Today Button */}
                <Button
                  variant={format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") ? "default" : "outline"}
                  onClick={() => setSelectedDate(new Date())}
                >
                  Today
                </Button>
                
                {/* Selected Date Display */}
                <div className="hidden md:block text-center font-semibold px-4 py-2 bg-muted rounded-md min-w-[200px]">
                  {format(selectedDate, "PPP")}
                </div>
              </div>
              
              {/* Next Day Button */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setDate(newDate.getDate() + 1);
                  setSelectedDate(newDate);
                }}
                className="shrink-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Mobile Date Display (shown only on small screens) */}
            <div className="md:hidden mt-4 text-center font-semibold text-sm text-muted-foreground">
              {format(selectedDate, "PPP")}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Filter Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="w-4 h-4" />
                    <span className="hidden sm:inline">Filters</span>
                    {hasActiveFilters && (
                      <Badge variant="secondary" className="ml-1 px-1.5 py-0">
                        {[
                          filterStatus !== "all",
                          filterType !== "all",
                          filterPriority !== "all",
                          filterAssignedUser !== "all",
                        ].filter(Boolean).length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Filters</h4>
                      {hasActiveFilters && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearFilters}
                          className="h-auto py-1 px-2"
                        >
                          Clear all
                        </Button>
                      )}
                    </div>

                    {/* Status Filter */}
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={filterStatus}
                        onValueChange={(value) =>
                          setFilterStatus(value as TaskStatus | "all")
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="not_started">Not Started</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                          <SelectItem value="blocked">Blocked</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Task Type Filter */}
                    <div className="space-y-2">
                      <Label>Task Type</Label>
                      <Select
                        value={filterType}
                        onValueChange={(value) =>
                          setFilterType(value as TaskType | "all")
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          {Object.entries(TASK_TYPE_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Priority Filter */}
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select
                        value={filterPriority}
                        onValueChange={(value) =>
                          setFilterPriority(value as TaskPriority | "all")
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Priorities</SelectItem>
                          {Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Assigned User Filter */}
                    {uniqueUsers.length > 0 && (
                      <div className="space-y-2">
                        <Label>Assigned To</Label>
                        <Select
                          value={filterAssignedUser}
                          onValueChange={setFilterAssignedUser}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Users</SelectItem>
                            {uniqueUsers.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1">
                    Search: "{searchQuery}"
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => setSearchQuery("")}
                    />
                  </Badge>
                )}
                {filterStatus !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Status: {filterStatus.replace("_", " ")}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => setFilterStatus("all")}
                    />
                  </Badge>
                )}
                {filterType !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Type: {TASK_TYPE_LABELS[filterType]}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => setFilterType("all")}
                    />
                  </Badge>
                )}
                {filterPriority !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Priority: {TASK_PRIORITY_LABELS[filterPriority]}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => setFilterPriority("all")}
                    />
                  </Badge>
                )}
                {filterAssignedUser !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    User: {uniqueUsers.find((u) => u.id === filterAssignedUser)?.name}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => setFilterAssignedUser("all")}
                    />
                  </Badge>
                )}
              </div>
            )}

            {/* Results Count */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {filteredTasks.length} of {tasks.length} tasks
                {hasActiveFilters && " (filtered)"}
              </div>
              
              {/* Select All Checkbox (only in list view) */}
              {viewMode === 'list' && filteredTasks.length > 0 && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="select-all"
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                    checked={selectedTaskIds.length === filteredTasks.length && filteredTasks.length > 0}
                    onChange={handleSelectAll}
                  />
                  <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                    Select All
                  </label>
                  {selectedTaskIds.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedTaskIds.length} selected
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <TaskTimeline
          tasks={filteredTasks}
          selectedDate={selectedDate}
          onTaskClick={setSelectedTask}
          onTaskComplete={handleCompleteTask}
        />
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <>
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card
          className={cn("cursor-pointer hover:shadow-md transition-shadow", activeTab === "today" && "ring-2 ring-primary")}
          onClick={() => setActiveTab("today")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Tasks</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled for today
            </p>
          </CardContent>
        </Card>

        <Card
          className={cn("cursor-pointer hover:shadow-md transition-shadow", activeTab === "overdue" && "ring-2 ring-destructive")}
          onClick={() => setActiveTab("overdue")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Overdue Tasks
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {overdueTasks.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Need immediate attention
            </p>
          </CardContent>
        </Card>

        <Card
          className={cn("cursor-pointer hover:shadow-md transition-shadow", activeTab === "in-progress" && "ring-2 ring-primary")}
          onClick={() => setActiveTab("in-progress")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <div className="h-4 w-4 rounded-full bg-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressTasks.length}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card
          className={cn("cursor-pointer hover:shadow-md transition-shadow", activeTab === "completed" && "ring-2 ring-primary")}
          onClick={() => setActiveTab("completed")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <div className="h-4 w-4 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks.length}</div>
            <p className="text-xs text-muted-foreground">Finished tasks</p>
          </CardContent>
        </Card>

        <Card
          className={cn("cursor-pointer hover:shadow-md transition-shadow", activeTab === "recurring" && "ring-2 ring-primary")}
          onClick={() => setActiveTab("recurring")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recurring</CardTitle>
            <Repeat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recurringTasks.series.length}</div>
            <p className="text-xs text-muted-foreground">Active series</p>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 h-auto p-1">
          <TabsTrigger value="today" className="gap-2 py-2 px-3">
            <span>Today</span>
            {todayTasks.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {todayTasks.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="overdue" className="gap-2 py-2 px-3">
            <span>Overdue</span>
            {overdueTasks.length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {overdueTasks.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="in-progress" className="gap-2 py-2 px-3">
            <span>In Progress</span>
            {inProgressTasks.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {inProgressTasks.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="py-2 px-3">Completed</TabsTrigger>
          <TabsTrigger value="recurring" className="gap-2 py-2 px-3">
            <Repeat className="w-3 h-3" />
            <span className="tracking-tight text-sm font-medium">Recurring</span>
            {recurringTasks.series.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {recurringTasks.series.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Today's Tasks */}
        <TabsContent value="today" className="space-y-4">
          {todayTasks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CalendarIcon className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No tasks scheduled for today</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Create a new task to get started
                </p>
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Task
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {todayTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onView={setSelectedTask}
                  onComplete={handleCompleteTask}
                  onDelete={handleDeleteTask}
                  selectable={true}
                  selected={selectedTaskIds.includes(task.id)}
                  onSelect={handleSelectTask}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Overdue Tasks */}
        <TabsContent value="overdue" className="space-y-4">
          {overdueTasks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="w-12 h-12 text-green-500 mb-4" />
                <p className="text-lg font-medium">No overdue tasks!</p>
                <p className="text-sm text-muted-foreground">
                  You're all caught up
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {overdueTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onView={setSelectedTask}
                  onComplete={handleCompleteTask}
                  onDelete={handleDeleteTask}
                  selectable={true}
                  selected={selectedTaskIds.includes(task.id)}
                  onSelect={handleSelectTask}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* In Progress Tasks */}
        <TabsContent value="in-progress" className="space-y-4">
          {inProgressTasks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <span className="text-2xl">🚀</span>
                </div>
                <p className="text-lg font-medium">No tasks in progress</p>
                <p className="text-sm text-muted-foreground">
                  Start working on a task to see it here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {inProgressTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onView={setSelectedTask}
                  onComplete={handleCompleteTask}
                  onDelete={handleDeleteTask}
                  selectable={true}
                  selected={selectedTaskIds.includes(task.id)}
                  onSelect={handleSelectTask}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Completed Tasks */}
        <TabsContent value="completed" className="space-y-4">
          {completedTasks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No completed tasks</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Tasks you mark as complete will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {completedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onView={setSelectedTask}
                  onComplete={handleCompleteTask}
                  onDelete={handleDeleteTask}
                  selectable={true}
                  selected={selectedTaskIds.includes(task.id)}
                  onSelect={handleSelectTask}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── Recurring Tab ──────────────────────────────────── */}
        <TabsContent value="recurring" className="space-y-6">

          {/* ── Active Series ───────────────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">Active Series</h3>
              <div className="flex-1 h-px bg-border" />
              <Badge variant="outline" className="text-xs">
                {recurringTasks.series.length} series
              </Badge>
            </div>

            {recurringTasks.loading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-36 w-full rounded-xl" />
                ))}
              </div>
            ) : recurringTasks.series.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Repeat className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No recurring series</p>
                  <p className="text-sm text-muted-foreground">
                    Create a recurring task series to see it here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recurringTasks.series.map((s: TaskSeries) => {
                  const RECURRENCE_LABELS: Record<string, string> = {
                    daily: 'Daily',
                    weekly: 'Weekly',
                    fortnightly: 'Fortnightly',
                    monthly: 'Monthly',
                    custom_days: `Every ${s.recurrence_interval ?? '?'} days`,
                    custom_weekdays: 'Custom weekdays',
                    custom_monthday: `Monthly (day ${s.recurrence_monthday ?? '?'})`,
                  };
                  const assignedNames = s.assigned_to
                    .map(id => teamMembers.find(tm => tm.id === id)?.display_name)
                    .filter(Boolean) as string[];
                  const nextOcc = recurringTasks.occurrences
                    .filter(o => o.series_id === s.id && o.status !== 'completed' && o.status !== 'skipped')
                    .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))[0];

                  return (
                    <Card key={s.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-sm font-semibold leading-tight line-clamp-2">
                            {s.title}
                          </CardTitle>
                          <Badge
                            variant="outline"
                            className="text-xs flex-shrink-0"
                          >
                            {TASK_TYPE_LABELS[s.task_type] ?? s.task_type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Repeat className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {RECURRENCE_LABELS[s.recurrence_type] ?? s.recurrence_type}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2 pt-0">
                        {/* Dates */}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarIcon className="w-3 h-3" />
                          <span>From {format(new Date(s.series_start_date + 'T00:00:00'), 'MMM d, yyyy')}</span>
                          {s.series_end_date && (
                            <span>→ {format(new Date(s.series_end_date + 'T00:00:00'), 'MMM d, yyyy')}</span>
                          )}
                          {!s.series_end_date && (
                            <span className="text-green-600 font-medium">· No end</span>
                          )}
                        </div>

                        {/* Assigned */}
                        {assignedNames.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <User className="w-3 h-3" />
                            <span className="truncate">{assignedNames.join(', ')}</span>
                          </div>
                        )}

                        {/* Next occurrence */}
                        {nextOcc && (
                          <div className="flex items-center gap-1 text-xs">
                            <Clock className="w-3 h-3 text-primary" />
                            <span className="font-medium text-primary">
                              Next: {format(new Date(nextOcc.scheduled_date + 'T00:00:00'), 'EEE, MMM d')}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Upcoming Occurrences (7-day window) ─────────── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">Upcoming Occurrences</h3>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Date range navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => shiftRecurringRange('prev')}
                className="gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Prev 7 days
              </Button>
              <span className="text-sm font-medium text-muted-foreground">
                {format(new Date(recurringRange.start + 'T00:00:00'), 'MMM d')} –{' '}
                {format(new Date(recurringRange.end + 'T00:00:00'), 'MMM d, yyyy')}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => shiftRecurringRange('next')}
                className="gap-1"
              >
                Next 7 days
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {recurringTasks.loading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-40 w-full rounded-xl" />
                ))}
              </div>
            ) : recurringTasks.occurrences.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No occurrences in this period
              </p>
            ) : (
              <div className="space-y-6">
                {[...new Set(recurringTasks.occurrences.map(o => o.scheduled_date))]
                  .sort()
                  .map(date => (
                    <div key={date} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">
                          {format(new Date(date + 'T00:00:00'), 'EEEE, MMM d')}
                        </span>
                        <div className="flex-1 h-px bg-border" />
                        <Badge variant="outline" className="text-xs">
                          {recurringTasks.getOccurrencesByDate(date).length} tasks
                        </Badge>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {recurringTasks.getOccurrencesByDate(date).map(occ => (
                          <TaskOccurrenceCard
                            key={occ.id}
                            occurrence={occ}
                            showActions
                            onComplete={handleCompleteOccurrence}
                            onEdit={(o) => openOccModal(o, 'edit')}
                            onDelete={(o) => openOccModal(o, 'delete')}
                            assignedUserName={
                              teamMembers.find(tm => tm.id === occ.assigned_to)?.display_name
                            }
                            completedByName={
                              occ.completed_by
                                ? (users.find(u => u.user_id === occ.completed_by)?.display_name
                                  ?? teamMembers.find(tm => tm.auth_role_id === occ.completed_by)?.display_name)
                                : undefined
                            }
                          />
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

        </TabsContent>

      </Tabs>
        </>
      )}

      {/* Edit Task Dialog */}
      {isEditDialogOpen && taskToEdit && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
              <DialogDescription>
                Update the task details below
              </DialogDescription>
            </DialogHeader>
            <TaskForm
              onSubmit={handleEditTask}
              users={teamMembers.map(tm => ({ user_id: tm.id, display_name: tm.display_name, role_type: tm.role_type }))}
              isLoading={teamMembersLoading}
              isEditing={true}
              taskId={taskToEdit.id}
              userRole={context?.user_role}
              defaultValues={{
                title: taskToEdit.title,
                description: taskToEdit.description || "",
                task_type: taskToEdit.task_type,
                priority: taskToEdit.priority,
                assigned_to: taskToEdit.team_member_id || taskToEdit.assigned_to || "",
                scheduled_date: new Date(taskToEdit.scheduled_date),
                scheduled_time: taskToEdit.scheduled_time || "",
                estimated_minutes: taskToEdit.estimated_minutes || 30,
                requires_approval: taskToEdit.requires_approval,
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Occurrence Edit/Delete Context Modal (task_occurrences system) */}
      {occModal && (
        <EditDeleteContextModal
          open={!!occModal}
          onOpenChange={(open) => { if (!open) setOccModal(null); }}
          action={occModal.action}
          taskTitle={occModal.occ.title}
          taskDate={occModal.occ.scheduled_date
            ? format(new Date(occModal.occ.scheduled_date + 'T00:00:00'), 'MMM d, yyyy')
            : undefined}
          onConfirm={handleOccModalConfirm}
          showDeleteConfirmation={occModal.action === 'delete'}
        />
      )}

      {/* Edit/Delete Context Modal for recurring tasks */}
      {editContextTask && (
        <EditDeleteContextModal
          open={showEditDeleteModal}
          onOpenChange={(open) => {
            setShowEditDeleteModal(open);
            if (!open) setEditContextTask(null);
          }}
          action={editContextAction}
          taskTitle={editContextTask.title}
          taskDate={editContextTask.scheduled_date
            ? format(new Date(editContextTask.scheduled_date), "MMM d, yyyy")
            : undefined}
          onConfirm={handleEditDeleteContextConfirm}
          showDeleteConfirmation={editContextAction === 'delete'}
        />
      )}

      {/* Task Detail View Dialog */}
      {selectedTask && (
        <TaskDetailView
          task={selectedTask}
          open={!!selectedTask}
          onOpenChange={(open) => !open && setSelectedTask(null)}
          onComplete={handleCompleteTask}
          onStatusChange={handleStatusChange}
          onEdit={openEditDialog}
          onDelete={handleDeleteTask}
          onAddNote={handleAddNote}
        />
      )}

      {/* Assignee Picker Dialog for Mark as Complete */}
      {completingTask && (
        <Dialog open={!!completingTask} onOpenChange={(open) => { if (!open) setCompletingTask(null); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Who completed this task?</DialogTitle>
              <DialogDescription>
                "{completingTask.title}" is shared. Select who is marking it complete.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              {completingTask.assignees?.map((memberId) => {
                const member = teamMembers.find(tm => tm.id === memberId);
                if (!member) return null;
                return (
                  <div
                    key={memberId}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                      selectedCompleter === memberId
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    )}
                    onClick={() => setSelectedCompleter(memberId)}
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs">
                        {member.display_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm">{member.display_name}</span>
                    {selectedCompleter === memberId && (
                      <CheckCircle2 className="w-4 h-4 ml-auto text-primary" />
                    )}
                  </div>
                );
              })}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setCompletingTask(null)}>Cancel</Button>
              <Button
                disabled={!selectedCompleter}
                onClick={() => {
                  executeCompleteTask(completingTask, selectedCompleter);
                  setCompletingTask(null);
                }}
              >
                Mark Complete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Bulk Actions Toolbar (floating) */}
      <BulkActionsToolbar
        selectedCount={selectedTaskIds.length}
        onCompleteSelected={handleBulkComplete}
        onDeleteSelected={handleBulkDelete}
        onReassignSelected={handleBulkReassign}
        onChangePrioritySelected={handleBulkChangePriority}
        onChangeStatusSelected={handleBulkChangeStatus}
        onClearSelection={() => setSelectedTaskIds([])}
        teamMembers={uniqueUsers}
        loading={loading}
      />
    </div>
  );
}
