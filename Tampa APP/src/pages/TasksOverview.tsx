import { useState, useMemo, useEffect } from "react";
import { Plus, Filter, Calendar as CalendarIcon, AlertCircle, Search, X, List, Clock, ChevronLeft, ChevronRight, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  
  // View mode state: 'list', 'timeline', or 'templates'
  const [viewMode, setViewMode] = useState<'list' | 'timeline' | 'templates'>('list');
  
  // Selected date for timeline view
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Debug logging (development only)
  if (process.env.NODE_ENV === 'development') {
    console.log('TasksOverview - context:', context);
    console.log('TasksOverview - contextLoading:', contextLoading);
  }

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
    const taskDate = new Date(task.scheduled_date);
    const today = new Date();
    return (
      taskDate.getDate() === today.getDate() &&
      taskDate.getMonth() === today.getMonth() &&
      taskDate.getFullYear() === today.getFullYear()
    );
  });

  const overdueTasks = filteredTasks.filter((task) => {
    if (!task.scheduled_date || task.status === "completed") return false;
    return new Date(task.scheduled_date) < new Date();
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
    if (process.env.NODE_ENV === 'development') {
      console.log('Creating task with data:', data);
      console.log('Organization ID:', context?.organization_id);
    }
    
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

  // Handle task completion
  const handleCompleteTask = async (task: RoutineTask) => {
    const success = await updateTaskStatus(
      task.id,
      "completed",
      context?.user_id
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
    if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
      const success = await deleteTask(task.id);
      if (success) {
        setSelectedTask(null); // Close detail view
        toast({
          title: "Task Deleted",
          description: "Task has been removed",
        });
      }
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
          updates.completed_by = context?.user_id;
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
      team_member_id: data.team_member_id, // Use team_member_id instead of assigned_to
      scheduled_date: data.scheduled_date,
      scheduled_time: data.scheduled_time,
    });

    if (success) {
      setIsEditDialogOpen(false);
      setTaskToEdit(null);
      
      // Update selected task if it's the one being edited
      if (selectedTask && selectedTask.id === taskToEdit.id) {
        const updatedTask = tasks.find(t => t.id === taskToEdit.id);
        if (updatedTask) {
          setSelectedTask(updatedTask);
        }
      }
      
      toast({
        title: "Success!",
        description: "Task updated successfully",
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
    let successCount = 0;
    for (const taskId of selectedTaskIds) {
      const success = await updateTaskStatus(taskId, "completed", context?.user_id);
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
                  users={teamMembers.map(tm => ({ user_id: tm.id, display_name: tm.display_name }))}
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
            <span>New Task</span>
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks by title or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
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

        <Card>
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <div className="h-4 w-4 rounded-full bg-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressTasks.length}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <div className="h-4 w-4 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks.length}</div>
            <p className="text-xs text-muted-foreground">Finished tasks</p>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Tabs */}
      <Tabs defaultValue="today" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="today" className="gap-2">
            <span>Today</span>
            {todayTasks.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {todayTasks.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="overdue" className="gap-2">
            <span>Overdue</span>
            {overdueTasks.length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {overdueTasks.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="in-progress" className="gap-2">
            <span>In Progress</span>
            {inProgressTasks.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {inProgressTasks.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">All Tasks</TabsTrigger>
        </TabsList>

        {/* Today's Tasks */}
        <TabsContent value="today" className="space-y-4">
          {todayTasks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CalendarIcon className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No tasks scheduled for today</p>
                <p className="text-sm text-muted-foreground">
                  Create a new task to get started
                </p>
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

        {/* All Tasks */}
        <TabsContent value="all" className="space-y-4">
          {filteredTasks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                {hasActiveFilters ? (
                  <>
                    <Filter className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No tasks match your filters</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Try adjusting your search or filters
                    </p>
                    <Button onClick={clearFilters} variant="outline">
                      <X className="w-4 h-4 mr-2" />
                      Clear Filters
                    </Button>
                  </>
                ) : (
                  <>
                    <Plus className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No tasks yet</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create your first task to get started
                    </p>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Task
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTasks.map((task) => (
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
              users={teamMembers.map(tm => ({ user_id: tm.id, display_name: tm.display_name }))}
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
