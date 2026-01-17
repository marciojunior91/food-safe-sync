import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  X,
  Clock,
  User,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Camera,
  MessageSquare,
  History,
  Edit,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

import {
  RoutineTask,
  TaskStatus,
  TASK_TYPE_LABELS,
  TASK_PRIORITY_LABELS,
} from "@/types/routineTasks";
import { ImageUpload } from "./ImageUpload";
import { TaskActivityTimeline } from "./TaskActivityTimeline";

interface TaskDetailViewProps {
  task: RoutineTask;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (task: RoutineTask) => void;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  onEdit?: (task: RoutineTask) => void;
  onDelete?: (task: RoutineTask) => void;
  onAddNote?: (taskId: string, note: string) => void;
}

// Task type emojis
const TASK_TYPE_ICONS: Record<string, string> = {
  cleaning_daily: "🧹",
  cleaning_weekly: "🧼",
  temperature: "🌡️",
  opening: "🔓",
  closing: "🔒",
  inspection: "🔍",
  maintenance: "🔧",
};

// Status colors
const STATUS_COLORS: Record<TaskStatus, string> = {
  not_started: "bg-gray-100 text-gray-700 border-gray-300",
  in_progress: "bg-blue-100 text-blue-700 border-blue-300",
  completed: "bg-green-100 text-green-700 border-green-300",
  overdue: "bg-red-100 text-red-700 border-red-300",
  skipped: "bg-gray-100 text-gray-500 border-gray-300",
};

// Priority colors
const PRIORITY_COLORS = {
  critical: "bg-red-500",
  important: "bg-yellow-500",
  normal: "bg-green-500",
};

export function TaskDetailView({
  task,
  open,
  onOpenChange,
  onComplete,
  onStatusChange,
  onEdit,
  onDelete,
  onAddNote,
}: TaskDetailViewProps) {
  const { toast } = useToast();
  const [note, setNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

  // Load attachments when dialog opens or task changes
  useEffect(() => {
    if (open && task.id) {
      loadAttachments();
    }
  }, [open, task.id]);

  // Load attachments from database
  const loadAttachments = async () => {
    console.log("🔍 Loading attachments for task:", task.id);
    setLoadingAttachments(true);
    try {
      const { data, error } = await supabase
        .from("task_attachments")
        .select("*")
        .eq("task_id", task.id)
        .order("uploaded_at", { ascending: true });

      if (error) {
        console.error("❌ Error loading attachments:", error);
        return;
      }

      console.log("✅ Loaded attachments from database:", data);
      const urls = data?.map((a) => a.file_url) || [];
      console.log("📷 Attachment URLs:", urls);
      setAttachments(urls);
    } catch (error) {
      console.error("❌ Error loading attachments:", error);
    } finally {
      setLoadingAttachments(false);
    }
  };

  // Format date and time
  const scheduledDate = task.scheduled_date
    ? format(new Date(task.scheduled_date), "MMM d, yyyy")
    : "Not scheduled";

  const scheduledTime = task.scheduled_time || "No specific time";

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Handle status change
  const handleStatusChange = (newStatus: TaskStatus) => {
    if (onStatusChange) {
      onStatusChange(task.id, newStatus);
      toast({
        title: "Status Updated",
        description: `Task status changed to ${newStatus.replace("_", " ")}`,
      });
    }
  };

  // Handle complete action
  const handleComplete = () => {
    if (onComplete) {
      onComplete(task);
    }
  };

  // Handle note submission
  const handleAddNote = () => {
    if (note.trim() && onAddNote) {
      onAddNote(task.id, note.trim());
      setNote("");
      setIsAddingNote(false);
      toast({
        title: "Note Added",
        description: "Your note has been saved",
      });
    }
  };

  // Handle delete
  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
      if (onDelete) {
        onDelete(task);
        onOpenChange(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="text-4xl">
                {TASK_TYPE_ICONS[task.task_type] || "📋"}
              </div>
              <div>
                <DialogTitle className="text-2xl">{task.title}</DialogTitle>
                <DialogDescription>
                  {TASK_TYPE_LABELS[task.task_type]}
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Priority */}
          <div className="flex flex-wrap items-center gap-3">
            <Badge
              variant="outline"
              className={`${STATUS_COLORS[task.status]} border`}
            >
              {task.status.replace("_", " ").toUpperCase()}
            </Badge>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${PRIORITY_COLORS[task.priority]}`} />
              <span className="text-sm font-medium">
                {TASK_PRIORITY_LABELS[task.priority]} Priority
              </span>
            </div>
            {task.requires_approval && (
              <Badge variant="secondary">Requires Approval</Badge>
            )}
          </div>

          <Separator />

          {/* Task Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Scheduled Date */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Scheduled Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{scheduledDate}</p>
              </CardContent>
            </Card>

            {/* Scheduled Time */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Scheduled Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{scheduledTime}</p>
              </CardContent>
            </Card>

            {/* Assigned User */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Assigned To
                </CardTitle>
              </CardHeader>
              <CardContent>
                {task.assigned_to ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={task.assigned_user?.avatar_url} />
                      <AvatarFallback>
                        {task.assigned_user?.display_name
                          ? getInitials(task.assigned_user.display_name)
                          : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">
                      {task.assigned_user?.display_name || "Unknown User"}
                    </span>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Unassigned</p>
                )}
              </CardContent>
            </Card>

            {/* Estimated Duration */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Estimated Duration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">
                  {task.estimated_minutes
                    ? `${task.estimated_minutes} minutes`
                    : "Not specified"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Description */}
          {task.description && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Description
                </h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {task.description}
                </p>
              </div>
            </>
          )}

          {/* Completion Info */}
          {task.completed_at && (
            <>
              <Separator />
              <Card className="bg-green-50 border-green-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-green-700">
                    <CheckCircle2 className="w-4 h-4" />
                    Completed
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Date:</span>{" "}
                    {format(new Date(task.completed_at), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                  {task.completed_user && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">By:</span>
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs">
                          {getInitials(task.completed_user.display_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">
                        {task.completed_user.display_name}
                      </span>
                    </div>
                  )}
                  {task.notes && (
                    <div className="text-sm space-y-2">
                      <span className="font-medium block mb-2">Notes & Comments:</span>
                      <div className="bg-muted/50 p-3 rounded-md whitespace-pre-wrap text-sm">
                        {task.notes}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Photo Attachments */}
          <Separator />
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Photo Attachments
            </h3>
            <ImageUpload
              taskId={task.id}
              existingImages={attachments}
              onUploadComplete={(urls) => {
                console.log("Images uploaded:", urls);
                // Reload attachments to show newly uploaded images
                loadAttachments();
              }}
              maxImages={10}
            />
          </div>

          {/* Notes Section */}
          <Separator />
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Notes & Comments
              </h3>
              {!isAddingNote && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingNote(true)}
                >
                  Add Note
                </Button>
              )}
            </div>

            {isAddingNote && (
              <Card className="mb-4">
                <CardContent className="pt-4 space-y-3">
                  <Label htmlFor="note">Add a note</Label>
                  <Textarea
                    id="note"
                    placeholder="Enter your note here..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleAddNote} size="sm">
                      Save Note
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setNote("");
                        setIsAddingNote(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Display existing notes or empty state */}
            {task.notes ? (
              <div className="bg-muted/50 p-4 rounded-md whitespace-pre-wrap text-sm">
                {task.notes}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <MessageSquare className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No notes yet. Add one to get started.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Activity History */}
          <Separator />
          <div>
            <TaskActivityTimeline 
              taskId={task.id} 
              limit={20}
              showTitle={true}
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {/* Action Buttons */}
          <div className="flex flex-1 gap-2">
            {task.status !== "completed" && (
              <Button
                onClick={handleComplete}
                className="flex-1 sm:flex-initial"
                variant="default"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Mark Complete
              </Button>
            )}

            {task.status === "not_started" && (
              <Button
                onClick={() => handleStatusChange("in_progress")}
                variant="outline"
                className="flex-1 sm:flex-initial"
              >
                Start Task
              </Button>
            )}

            {onEdit && (
              <Button
                onClick={() => onEdit(task)}
                variant="outline"
                size="icon"
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}

            {onDelete && (
              <Button
                onClick={handleDelete}
                variant="outline"
                size="icon"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
