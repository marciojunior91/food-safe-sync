import { Check, Trash2, UserCheck, AlertTriangle, XCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TaskStatus, TaskPriority } from "@/types/routineTasks";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface BulkActionsToolbarProps {
  selectedCount: number;
  onCompleteSelected: () => Promise<void>;
  onDeleteSelected: () => Promise<void>;
  onReassignSelected: (teamMemberId: string) => Promise<void>;
  onChangePrioritySelected: (priority: TaskPriority) => Promise<void>;
  onChangeStatusSelected: (status: TaskStatus) => Promise<void>;
  onClearSelection: () => void;
  teamMembers: Array<{ id: string; name: string }>;
  loading?: boolean;
}

export function BulkActionsToolbar({
  selectedCount,
  onCompleteSelected,
  onDeleteSelected,
  onReassignSelected,
  onChangePrioritySelected,
  onChangeStatusSelected,
  onClearSelection,
  teamMembers,
  loading = false,
}: BulkActionsToolbarProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Don't render if nothing selected
  if (selectedCount === 0) return null;

  const handleComplete = async () => {
    setIsProcessing(true);
    await onCompleteSelected();
    setIsProcessing(false);
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    setIsProcessing(true);
    await onDeleteSelected();
    setIsProcessing(false);
  };

  const handleReassign = async (value: string) => {
    setIsProcessing(true);
    await onReassignSelected(value);
    setIsProcessing(false);
  };

  const handleChangePriority = async (value: string) => {
    setIsProcessing(true);
    await onChangePrioritySelected(value as TaskPriority);
    setIsProcessing(false);
  };

  const handleChangeStatus = async (value: string) => {
    setIsProcessing(true);
    await onChangeStatusSelected(value as TaskStatus);
    setIsProcessing(false);
  };

  return (
    <>
      {/* Floating Toolbar */}
      <div
        className={cn(
          "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
          "bg-card border border-border rounded-lg shadow-2xl",
          "transition-all duration-300 ease-out",
          "animate-in slide-in-from-bottom-5"
        )}
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 sm:p-4 min-w-[320px] max-w-[95vw]">
          {/* Selection Count */}
          <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-md">
            <Badge variant="default" className="text-sm font-semibold">
              {selectedCount}
            </Badge>
            <span className="text-sm font-medium">
              {selectedCount === 1 ? "task selected" : "tasks selected"}
            </span>
          </div>

          {/* Divider (hidden on mobile) */}
          <div className="hidden sm:block w-px h-8 bg-border" />

          {/* Actions - Row 1 (Primary actions) */}
          <div className="flex flex-wrap gap-2">
            {/* Complete Button */}
            <Button
              size="sm"
              variant="default"
              className="gap-2 bg-green-600 hover:bg-green-700"
              onClick={handleComplete}
              disabled={isProcessing || loading}
            >
              <Check className="w-4 h-4" />
              <span className="hidden sm:inline">Complete</span>
            </Button>

            {/* Delete Button */}
            <Button
              size="sm"
              variant="destructive"
              className="gap-2"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isProcessing || loading}
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Delete</span>
            </Button>

            {/* Reassign Dropdown */}
            <Select onValueChange={handleReassign} disabled={isProcessing || loading}>
              <SelectTrigger className="w-[140px] h-9">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">Reassign</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassign</SelectItem>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Priority Dropdown */}
            <Select onValueChange={handleChangePriority} disabled={isProcessing || loading}>
              <SelectTrigger className="w-[130px] h-9">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="hidden sm:inline">Priority</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="important">Important</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Dropdown */}
            <Select onValueChange={handleChangeStatus} disabled={isProcessing || loading}>
              <SelectTrigger className="w-[140px] h-9">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Status</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="skipped">Skipped</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Divider (hidden on mobile) */}
          <div className="hidden sm:block w-px h-8 bg-border" />

          {/* Cancel Button */}
          <Button
            size="sm"
            variant="ghost"
            className="gap-2 sm:ml-auto"
            onClick={onClearSelection}
            disabled={isProcessing || loading}
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </Button>
        </div>

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm rounded-lg flex items-center justify-center">
            <div className="flex items-center gap-2 text-sm font-medium">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Processing...
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} tasks?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected tasks
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete {selectedCount} {selectedCount === 1 ? "task" : "tasks"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
