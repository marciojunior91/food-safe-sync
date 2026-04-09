import { format } from "date-fns";
import { Clock, User, Check, Eye, Trash2, MoreVertical } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import {
  RoutineTask,
  TaskStatus,
  TASK_TYPE_LABELS,
  TASK_PRIORITY_LABELS,
} from "@/types/routineTasks";

interface TaskCardProps {
  task: RoutineTask;
  onView?: (task: RoutineTask) => void;
  onComplete?: (task: RoutineTask) => void;
  onDelete?: (task: RoutineTask) => void;
  showActions?: boolean;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (taskId: string, selected: boolean) => void;
}

// Task type icons
const TASK_TYPE_ICONS: Record<string, string> = {
  cleaning_daily: "🧹",
  cleaning_weekly: "🧼",
  temperature: "🌡️",
  opening: "🔓",
  closing: "🔒",
  maintenance: "🔧",
  others: "📋",
};

// Status colors
const STATUS_COLORS: Record<TaskStatus, string> = {
  not_started: "bg-gray-100 text-gray-700 border-gray-300",
  in_progress: "bg-blue-100 text-blue-700 border-blue-300",
  completed: "bg-green-100 text-green-700 border-green-300",
  overdue: "bg-red-100 text-red-700 border-red-300",
  skipped: "bg-yellow-100 text-yellow-700 border-yellow-300",
};

// Priority colors
const PRIORITY_COLORS = {
  critical: "bg-red-500",
  important: "bg-yellow-500",
  normal: "bg-green-500",
};

export function TaskCard({
  task,
  onView,
  onComplete,
  onDelete,
  showActions = true,
  selectable = false,
  selected = false,
  onSelect,
}: TaskCardProps) {
  const taskIcon = TASK_TYPE_ICONS[task.task_type] || "📋";
  const statusColor = STATUS_COLORS[task.status];
  const priorityColor = PRIORITY_COLORS[task.priority];

  const isCompleted = task.status === "completed";
  const isOverdue = task.status === "overdue";

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md overflow-hidden",
        isCompleted && "opacity-75",
        selected && "ring-2 ring-primary shadow-lg",
        isOverdue && "border-red-500 border-2 bg-red-50/30 shadow-red-100"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          {/* Selection Checkbox (if selectable) */}
          {selectable && (
            <div className="pt-1 flex-shrink-0">
              <Checkbox
                checked={selected}
                onCheckedChange={(checked) => onSelect?.(task.id, checked as boolean)}
                className="h-5 w-5"
              />
            </div>
          )}
          
          {/* Left side - Icon and Info */}
          <div className="flex items-start gap-2 flex-1 min-w-0 overflow-hidden">
            {/* Task Icon */}
            <div
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0",
                isCompleted
                  ? "bg-green-100"
                  : isOverdue
                  ? "bg-red-100"
                  : "bg-primary/10"
              )}
            >
              {taskIcon}
            </div>

            {/* Task Info */}
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="flex items-start gap-1.5 mb-1 min-w-0">
                {/* Priority Indicator */}
                <div
                  className={cn(
                    "w-2 h-2 rounded-full flex-shrink-0 mt-1.5",
                    priorityColor
                  )}
                  title={TASK_PRIORITY_LABELS[task.priority]}
                />

                {/* Task Title */}
                <h3
                  className={cn(
                    "font-semibold text-sm leading-tight line-clamp-2",
                    isCompleted && "line-through text-muted-foreground"
                  )}
                  title={task.title}
                >
                  {task.title}
                </h3>
              </div>

              {/* Task Type Badge */}
              <Badge variant="secondary" className="text-xs max-w-full truncate">
                {TASK_TYPE_LABELS[task.task_type]}
              </Badge>
            </div>
          </div>

          {/* Right side - Actions Menu */}
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onView && (
                  <DropdownMenuItem onClick={() => onView(task)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                )}
                {onComplete && task.status !== "completed" && (
                  <DropdownMenuItem onClick={() => onComplete(task)}>
                    <Check className="mr-2 h-4 w-4" />
                    Mark Complete
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(task)}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Description (if present) */}
        {task.description && !isCompleted && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2 overflow-hidden">
            {task.description}
          </p>
        )}

        {/* Subtask progress */}
        {task.subtasks && task.subtasks.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Subtasks</span>
              <span>
                {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div
                className="bg-primary h-1.5 rounded-full transition-all"
                style={{
                  width: `${(task.subtasks.filter((s) => s.completed).length / task.subtasks.length) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Task Metadata */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {/* Scheduled Date/Time */}
          <div className="flex items-center gap-1 min-w-0">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">
              {format(new Date(task.scheduled_date), "MMM d, yyyy")}
              {task.scheduled_time && ` at ${task.scheduled_time}`}
            </span>
          </div>

          {/* Assigned User */}
          {task.assigned_user && (
            <div className="flex items-center gap-1 min-w-0">
              <User className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{task.assigned_user.display_name}</span>
            </div>
          )}

          {/* Estimated Time */}
          {task.estimated_minutes && (
            <div className="flex items-center gap-1 whitespace-nowrap">
              <span>⏱️ {task.estimated_minutes} min</span>
            </div>
          )}
        </div>

        {/* Status Badge */}
        <div className="mt-3 pt-3 border-t flex flex-wrap items-center gap-1.5">
          <Badge
            variant="outline"
            className={cn(
              "font-medium text-xs",
              statusColor,
              isOverdue && "animate-pulse border-red-600 bg-red-100 text-red-800 font-bold"
            )}
          >
            {isOverdue && "⚠️ "}
            {task.status.replace("_", " ").toUpperCase()}
          </Badge>

          {/* Completed Info */}
          {isCompleted && task.completed_at && (
            <span className="text-xs text-muted-foreground truncate">
              Completed {format(new Date(task.completed_at), "MMM d 'at' h:mm a")}
            </span>
          )}
          
          {/* Overdue Warning */}
          {isOverdue && task.scheduled_date && (
            <span className="text-xs text-red-600 font-semibold">
              Overdue since {format(new Date(task.scheduled_date), "MMM d")}
            </span>
          )}
        </div>

        {/* Quick Complete Button (for non-completed tasks) */}
        {!isCompleted && onComplete && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-3"
            onClick={() => onComplete(task)}
          >
            <Check className="w-4 h-4 mr-2" />
            Mark as Complete
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
