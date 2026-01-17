import { memo, CSSProperties } from "react";
import { Check, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RoutineTask, TaskType } from "@/types/routineTasks";

interface TaskBlockProps {
  task: RoutineTask;
  style?: CSSProperties;
  onClick?: () => void;
  onComplete?: () => void;
}

// Color scheme for different task types
const TASK_TYPE_COLORS: Record<TaskType, { bg: string; border: string; text: string }> = {
  cleaning_daily: {
    bg: "bg-blue-100 dark:bg-blue-950",
    border: "border-blue-300 dark:border-blue-700",
    text: "text-blue-900 dark:text-blue-100",
  },
  cleaning_weekly: {
    bg: "bg-purple-100 dark:bg-purple-950",
    border: "border-purple-300 dark:border-purple-700",
    text: "text-purple-900 dark:text-purple-100",
  },
  temperature: {
    bg: "bg-orange-100 dark:bg-orange-950",
    border: "border-orange-300 dark:border-orange-700",
    text: "text-orange-900 dark:text-orange-100",
  },
  opening: {
    bg: "bg-green-100 dark:bg-green-950",
    border: "border-green-300 dark:border-green-700",
    text: "text-green-900 dark:text-green-100",
  },
  closing: {
    bg: "bg-red-100 dark:bg-red-950",
    border: "border-red-300 dark:border-red-700",
    text: "text-red-900 dark:text-red-100",
  },
  maintenance: {
    bg: "bg-yellow-100 dark:bg-yellow-950",
    border: "border-yellow-300 dark:border-yellow-700",
    text: "text-yellow-900 dark:text-yellow-100",
  },
  others: {
    bg: "bg-gray-100 dark:bg-gray-800",
    border: "border-gray-300 dark:border-gray-600",
    text: "text-gray-900 dark:text-gray-100",
  },
};

// Status styles
const STATUS_STYLES = {
  completed: "opacity-60",
  in_progress: "ring-2 ring-blue-500",
  overdue: "ring-2 ring-red-500",
  skipped: "opacity-40",
  not_started: "",
};

export const TaskBlock = memo(({ task, style, onClick, onComplete }: TaskBlockProps) => {
  const colors = TASK_TYPE_COLORS[task.task_type];
  const statusStyle = STATUS_STYLES[task.status];
  
  const isCompleted = task.status === "completed";
  const isOverdue = task.status === "overdue";
  const canComplete = task.status !== "completed" && task.status !== "skipped";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            style={style}
            className={cn(
              "border-l-4 rounded-lg p-2 cursor-pointer transition-all hover:shadow-md",
              colors.bg,
              colors.border,
              colors.text,
              statusStyle,
              "group relative overflow-hidden"
            )}
            onClick={onClick}
          >
            {/* Task Header */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {/* Status Icon */}
                  {isCompleted && (
                    <Check className="w-3.5 h-3.5 flex-shrink-0 text-green-600" />
                  )}
                  {isOverdue && (
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-red-600" />
                  )}
                  
                  {/* Task Title */}
                  <h4 className={cn(
                    "text-sm font-medium truncate",
                    isCompleted && "line-through"
                  )}>
                    {task.title}
                  </h4>
                </div>

                {/* Task Time */}
                {task.scheduled_time && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 opacity-70" />
                    <span className="text-xs opacity-70">
                      {task.scheduled_time}
                    </span>
                    {task.estimated_minutes && (
                      <span className="text-xs opacity-70">
                        ({task.estimated_minutes}m)
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Priority Badge */}
              {task.priority === "critical" && (
                <Badge variant="destructive" className="text-xs h-5 px-1.5">
                  !
                </Badge>
              )}
              {task.priority === "important" && (
                <Badge variant="secondary" className="text-xs h-5 px-1.5">
                  ↑
                </Badge>
              )}
            </div>

            {/* Assigned User */}
            {task.assigned_user && (
              <div className="text-xs opacity-70 truncate">
                {task.assigned_user.display_name}
              </div>
            )}

            {/* Quick Complete Button - Shows on hover */}
            {canComplete && onComplete && (
              <Button
                size="sm"
                variant="ghost"
                className={cn(
                  "absolute top-1 right-1 h-6 w-6 p-0",
                  "opacity-0 group-hover:opacity-100 transition-opacity",
                  colors.text
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onComplete();
                }}
              >
                <Check className="w-4 h-4" />
              </Button>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">{task.title}</p>
            {task.description && (
              <p className="text-sm text-muted-foreground">{task.description}</p>
            )}
            <div className="text-xs text-muted-foreground">
              Status: {task.status.replace("_", " ")}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

TaskBlock.displayName = "TaskBlock";
