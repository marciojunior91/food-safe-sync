/**
 * ================================================================
 * TASK OCCURRENCE CARD
 * ================================================================
 * Card component for displaying TaskOccurrence instances
 * Features:
 * - Series indicator badge
 * - Recurrence frequency display
 * - Subtasks progress bar (X/Y completed)
 * - Photo thumbnails grid
 * - Edit/Delete context menu
 * - Status indicators
 * ================================================================
 */

import { format } from "date-fns";
import {
  Clock,
  User,
  Check,
  Eye,
  Trash2,
  Edit2,
  MoreVertical,
  Repeat,
  CheckSquare,
  Image as ImageIcon,
  AlertCircle,
} from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

import {
  TaskOccurrence,
  TaskOccurrenceWithSeries,
  TASK_TYPE_LABELS,
  TASK_PRIORITY_LABELS,
  isRecurringTask,
} from "@/types/recurring-tasks";

// ================================================================
// TYPES
// ================================================================

interface TaskOccurrenceCardProps {
  occurrence: TaskOccurrence | TaskOccurrenceWithSeries;
  onView?: (occurrence: TaskOccurrence) => void;
  onEdit?: (occurrence: TaskOccurrence) => void;
  onComplete?: (occurrence: TaskOccurrence) => void;
  onDelete?: (occurrence: TaskOccurrence) => void;
  showActions?: boolean;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (occurrenceId: string, selected: boolean) => void;
  assignedUserName?: string; // Display name for assigned user
}

// ================================================================
// CONSTANTS
// ================================================================

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
const STATUS_COLORS = {
  not_started: "bg-gray-100 text-gray-700 border-gray-300",
  in_progress: "bg-blue-100 text-blue-700 border-blue-300",
  completed: "bg-green-100 text-green-700 border-green-300",
  skipped: "bg-yellow-100 text-yellow-700 border-yellow-300",
};

// Priority colors
const PRIORITY_COLORS = {
  critical: "bg-red-500",
  important: "bg-yellow-500",
  normal: "bg-green-500",
};

// Recurrence labels
const RECURRENCE_LABELS: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  fortnightly: "Every 2 weeks",
  monthly: "Monthly",
  custom_days: "Custom",
  custom_weekdays: "Weekdays",
  custom_monthday: "Monthly",
};

// ================================================================
// UTILITY FUNCTIONS
// ================================================================

const getRecurrenceLabel = (occurrence: TaskOccurrence | TaskOccurrenceWithSeries): string | null => {
  if (!isRecurringTask(occurrence)) return null;

  if ("series" in occurrence && occurrence.series) {
    const type = occurrence.series.recurrence_type;
    const baseLabel = RECURRENCE_LABELS[type] || "Recurring";

    // Add custom interval/details
    if (type === "custom_days" && occurrence.series.recurrence_interval) {
      return `Every ${occurrence.series.recurrence_interval} days`;
    }

    return baseLabel;
  }

  return "Recurring";
};

const isOverdue = (occurrence: TaskOccurrence): boolean => {
  if (occurrence.status === "completed" || occurrence.status === "skipped") {
    return false;
  }

  const scheduledDate = new Date(occurrence.scheduled_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  scheduledDate.setHours(0, 0, 0, 0);

  return scheduledDate < today;
};

// ================================================================
// MAIN COMPONENT
// ================================================================

export function TaskOccurrenceCard({
  occurrence,
  onView,
  onEdit,
  onComplete,
  onDelete,
  showActions = true,
  selectable = false,
  selected = false,
  onSelect,
  assignedUserName,
}: TaskOccurrenceCardProps) {
  const taskIcon = TASK_TYPE_ICONS[occurrence.task_type] || "📋";
  const statusColor = STATUS_COLORS[occurrence.status];
  const priorityColor = PRIORITY_COLORS[occurrence.priority];

  const isCompleted = occurrence.status === "completed";
  const isSkipped = occurrence.status === "skipped";
  const overdue = isOverdue(occurrence);
  const recurring = isRecurringTask(occurrence);
  const modified = occurrence.is_modified;

  // Subtasks progress
  // Prefer the DB-cached percent_complete (set by trigger) for accuracy.
  // Fall back to client-side derivation if the field is absent (old rows or insert path).
  const subtasksTotal = occurrence.subtasks?.length || 0;
  const subtasksCompleted = occurrence.subtasks?.filter((st) => st.completed).length || 0;
  const subtasksProgress =
    typeof occurrence.percent_complete === 'number' && subtasksTotal > 0
      ? occurrence.percent_complete
      : subtasksTotal > 0
      ? Math.round((subtasksCompleted / subtasksTotal) * 100)
      : 0;

  // Photos count
  const photosCount = occurrence.photos?.length || 0;

  // Recurrence label
  const recurrenceLabel = getRecurrenceLabel(occurrence);

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md",
        (isCompleted || isSkipped) && "opacity-75",
        selected && "ring-2 ring-primary shadow-lg",
        overdue && "border-red-500 border-2 bg-red-50/30 shadow-red-100"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          {/* Selection Checkbox (if selectable) */}
          {selectable && (
            <div className="pt-1">
              <Checkbox
                checked={selected}
                onCheckedChange={(checked) =>
                  onSelect?.(occurrence.id, checked as boolean)
                }
                className="h-5 w-5"
              />
            </div>
          )}

          {/* Left side - Icon and Info */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Task Icon */}
            <div
              className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0",
                isCompleted
                  ? "bg-green-100"
                  : isSkipped
                  ? "bg-yellow-100"
                  : overdue
                  ? "bg-red-100"
                  : "bg-primary/10"
              )}
            >
              {taskIcon}
            </div>

            {/* Task Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {/* Priority Indicator */}
                <div
                  className={cn(
                    "w-2 h-2 rounded-full flex-shrink-0",
                    priorityColor
                  )}
                  title={TASK_PRIORITY_LABELS[occurrence.priority]}
                />

                {/* Task Title */}
                <h3
                  className={cn(
                    "font-semibold text-base truncate",
                    (isCompleted || isSkipped) && "line-through text-muted-foreground"
                  )}
                  title={occurrence.title}
                >
                  {occurrence.title}
                </h3>
              </div>

              {/* Badges Row */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Task Type Badge */}
                <Badge variant="secondary" className="text-xs">
                  {TASK_TYPE_LABELS[occurrence.task_type] || "Others"}
                </Badge>

                {/* Recurring Badge */}
                {recurring && recurrenceLabel && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <Repeat className="w-3 h-3" />
                    {recurrenceLabel}
                  </Badge>
                )}

                {/* Modified Badge */}
                {modified && (
                  <Badge variant="outline" className="text-xs">
                    Modified
                  </Badge>
                )}

                {/* Status Badge */}
                <Badge className={cn("text-xs", statusColor)}>
                  {occurrence.status.replace("_", " ")}
                </Badge>

                {/* Overdue Badge */}
                {overdue && (
                  <Badge variant="destructive" className="text-xs gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Overdue
                  </Badge>
                )}
              </div>
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
                  <DropdownMenuItem onClick={() => onView(occurrence)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(occurrence)}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onComplete && occurrence.status !== "completed" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onComplete(occurrence)}>
                      <Check className="mr-2 h-4 w-4" />
                      Mark Complete
                    </DropdownMenuItem>
                  </>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(occurrence)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Description (if present) */}
        {occurrence.description && !isCompleted && !isSkipped && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {occurrence.description}
          </p>
        )}

        {/* Task Metadata */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {/* Scheduled Date/Time */}
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>
              {format(new Date(occurrence.scheduled_date), "MMM d, yyyy")}
              {occurrence.scheduled_time && ` at ${occurrence.scheduled_time}`}
            </span>
          </div>

          {/* Assigned To */}
          {occurrence.assigned_to && occurrence.assigned_to.length > 0 && (
            <div className="flex items-center gap-1.5">
              <User className="w-4 h-4" />
              <span>
                {assignedUserName || `${occurrence.assigned_to.length} assigned`}
              </span>
            </div>
          )}

          {/* Estimated Time */}
          {occurrence.estimated_minutes && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>{occurrence.estimated_minutes} min</span>
            </div>
          )}
        </div>

        {/* Subtasks Progress */}
        {subtasksTotal > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <CheckSquare className="w-3.5 h-3.5" />
                <span>
                  Subtasks: {subtasksCompleted}/{subtasksTotal}
                </span>
              </div>
              <span className="text-muted-foreground">
                {Math.round(subtasksProgress)}%
              </span>
            </div>
            <Progress value={subtasksProgress} className="h-1.5" />
          </div>
        )}

        {/* Photos Indicator */}
        {photosCount > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {occurrence.photos.slice(0, 3).map((photo, index) => (
                <div
                  key={index}
                  className="w-8 h-8 rounded border-2 border-background bg-muted flex items-center justify-center"
                >
                  <ImageIcon className="w-4 h-4 text-muted-foreground" />
                </div>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {photosCount} photo{photosCount > 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* Approval Status */}
        {occurrence.requires_approval && (
          <div className="flex items-center gap-2 text-xs">
            {occurrence.approved_by ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                ✓ Approved
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                Pending Approval
              </Badge>
            )}
          </div>
        )}

        {/* Completion Info */}
        {isCompleted && occurrence.completed_at && (
          <div className="text-xs text-muted-foreground">
            Completed {format(new Date(occurrence.completed_at), "MMM d 'at' h:mm a")}
          </div>
        )}

        {/* Skip Reason */}
        {isSkipped && occurrence.skip_reason && (
          <div className="text-xs text-muted-foreground italic">
            Skipped: {occurrence.skip_reason}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
