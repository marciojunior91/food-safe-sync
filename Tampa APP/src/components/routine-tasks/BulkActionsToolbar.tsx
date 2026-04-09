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
      {/* Floating Toolbar — compact on tablets, uses popover for secondary actions */}
      <div
        className={cn(
          "fixed bottom-4 left-1/2 -translate-x-1/2 z-50",
          "bg-card border border-border rounded-xl shadow-2xl",
          "transition-all duration-300 ease-out",
          "animate-in slide-in-from-bottom-5",
          "max-w-[calc(100vw-2rem)]"
        )}
      >
        <div className="flex items-center gap-2 p-2.5 sm:p-3">
          {/* Selection Count */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/10 rounded-md flex-shrink-0">
            <Badge variant="default" className="text-xs font-semibold h-5 min-w-[1.25rem] flex items-center justify-center">
              {selectedCount}
            </Badge>
            <span className="text-xs font-medium whitespace-nowrap">
              {selectedCount === 1 ? "task" : "tasks"}<span className="hidden sm:inline"> selected</span>
            </span>
          </div>

          {/* Primary Actions — always visible */}
          <div className="flex items-center gap-1.5">
            {/* Complete Button */}
            <Button
              size="sm"
              variant="default"
              className="gap-1.5 bg-green-600 hover:bg-green-700 h-8 px-2.5 text-xs"
              onClick={handleComplete}
              disabled={isProcessing || loading}
            >
              <Check className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Complete</span>
            </Button>

            {/* Delete Button */}
            <Button
              size="sm"
              variant="destructive"
              className="gap-1.5 h-8 px-2.5 text-xs"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isProcessing || loading}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Delete</span>
            </Button>

            {/* Reassign Dropdown */}
            <Select onValueChange={handleReassign} disabled={isProcessing || loading}>
              <SelectTrigger className="w-9 sm:w-[120px] h-8 px-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="hidden sm:inline text-xs">Reassign</span>
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
              <SelectTrigger className="w-9 sm:w-[110px] h-8 px-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="hidden sm:inline text-xs">Priority</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="important">Important</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Dropdown — hidden on very small screens */}
            <Select onValueChange={handleChangeStatus} disabled={isProcessing || loading}>
              <SelectTrigger className="hidden sm:flex w-[110px] h-8 px-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-xs">Status</span>
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

          {/* Cancel Button */}
          <Button
            size="sm"
            variant="ghost"
            className="gap-1 h-8 px-2 ml-auto flex-shrink-0"
            onClick={onClearSelection}
            disabled={isProcessing || loading}
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-xs">Cancel</span>
          </Button>
        </div>

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm rounded-xl flex items-center justify-center">
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
