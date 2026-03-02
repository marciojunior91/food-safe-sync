/**
 * ================================================================
 * EDIT/DELETE CONTEXT MODAL
 * ================================================================
 * Microsoft Teams-inspired modal for choosing edit/delete scope
 * - "This task only" → affects single occurrence
 * - "All tasks in series" → affects entire series
 * ================================================================
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, AlertTriangle } from "lucide-react";
import { EditDeleteContext } from "@/types/recurring-tasks";

// ================================================================
// TYPES
// ================================================================

interface EditDeleteContextModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: "edit" | "delete";
  taskTitle: string;
  taskDate?: string; // For display purposes (e.g., "March 1, 2026")
  seriesName?: string; // Optional name of series (defaults to taskTitle)
  onConfirm: (context: EditDeleteContext) => void;
  showDeleteConfirmation?: boolean; // If true, shows additional confirmation for delete
}

// ================================================================
// CONTENT CONFIGURATION
// ================================================================

const getContentConfig = (action: "edit" | "delete") => {
  if (action === "edit") {
    return {
      title: "Edit Task",
      description: "How would you like to edit this recurring task?",
      occurrenceLabel: "This task only",
      occurrenceDescription: "Changes will apply only to this occurrence",
      seriesLabel: "All tasks in the series",
      seriesDescription: "Changes will apply to all future occurrences",
      confirmButton: "Continue",
      confirmIcon: Info,
      alertVariant: "default" as const,
    };
  } else {
    return {
      title: "Delete Task",
      description: "How would you like to delete this recurring task?",
      occurrenceLabel: "This task only",
      occurrenceDescription: "Only this occurrence will be deleted",
      seriesLabel: "All tasks in the series",
      seriesDescription: "The entire series will be deleted (cannot be undone)",
      confirmButton: "Delete",
      confirmIcon: AlertTriangle,
      alertVariant: "destructive" as const,
    };
  }
};

// ================================================================
// MAIN COMPONENT
// ================================================================

export function EditDeleteContextModal({
  open,
  onOpenChange,
  action,
  taskTitle,
  taskDate,
  seriesName,
  onConfirm,
  showDeleteConfirmation = true,
}: EditDeleteContextModalProps) {
  const [selectedContext, setSelectedContext] = useState<EditDeleteContext>("occurrence");
  const [showFinalConfirmation, setShowFinalConfirmation] = useState(false);

  const config = getContentConfig(action);
  const displaySeriesName = seriesName || taskTitle;

  // Handle primary action
  const handlePrimaryAction = () => {
    // For delete of entire series, show additional confirmation
    if (action === "delete" && selectedContext === "series" && showDeleteConfirmation) {
      setShowFinalConfirmation(true);
    } else {
      // Proceed directly
      onConfirm(selectedContext);
      onOpenChange(false);
    }
  };

  // Handle final confirmation (for series delete)
  const handleFinalConfirm = () => {
    setShowFinalConfirmation(false);
    onConfirm(selectedContext);
    onOpenChange(false);
  };

  // Reset state when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedContext("occurrence");
      setShowFinalConfirmation(false);
    }
    onOpenChange(newOpen);
  };

  return (
    <>
      {/* Main Context Selection Dialog */}
      <Dialog open={open && !showFinalConfirmation} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{config.title}</DialogTitle>
            <DialogDescription>{config.description}</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {/* Task Info */}
            <div className="mb-4 p-3 bg-muted rounded-lg">
              <p className="font-medium text-sm">{taskTitle}</p>
              {taskDate && (
                <p className="text-xs text-muted-foreground mt-1">{taskDate}</p>
              )}
            </div>

            {/* Context Selection */}
            <RadioGroup
              value={selectedContext}
              onValueChange={(value) => setSelectedContext(value as EditDeleteContext)}
              className="space-y-3"
            >
              {/* Option 1: This occurrence only */}
              <div className="flex items-start space-x-3 border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="occurrence" id="occurrence" className="mt-1" />
                <div className="flex-1">
                  <Label
                    htmlFor="occurrence"
                    className="font-medium cursor-pointer"
                  >
                    {config.occurrenceLabel}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {config.occurrenceDescription}
                  </p>
                </div>
              </div>

              {/* Option 2: Entire series */}
              <div className="flex items-start space-x-3 border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="series" id="series" className="mt-1" />
                <div className="flex-1">
                  <Label
                    htmlFor="series"
                    className="font-medium cursor-pointer"
                  >
                    {config.seriesLabel}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {config.seriesDescription}
                  </p>
                  {selectedContext === "series" && (
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      Series: "{displaySeriesName}"
                    </p>
                  )}
                </div>
              </div>
            </RadioGroup>

            {/* Warning for series-wide changes */}
            {selectedContext === "series" && (
              <Alert variant={config.alertVariant} className="mt-4">
                <config.confirmIcon className="h-4 w-4" />
                <AlertDescription>
                  {action === "edit" && (
                    <>
                      All future occurrences of this series will be updated.
                      Past occurrences remain unchanged.
                    </>
                  )}
                  {action === "delete" && (
                    <>
                      This will delete the entire series including all future occurrences.
                      <strong className="block mt-1">This action cannot be undone.</strong>
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handlePrimaryAction}
              variant={action === "delete" && selectedContext === "series" ? "destructive" : "default"}
            >
              {config.confirmButton}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Final Confirmation Dialog (for series delete) */}
      <AlertDialog
        open={showFinalConfirmation}
        onOpenChange={setShowFinalConfirmation}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete Entire Series?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                You are about to permanently delete the series:
              </p>
              <p className="font-semibold text-foreground">
                "{displaySeriesName}"
              </p>
              <p className="text-destructive">
                This will delete all future occurrences and cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowFinalConfirmation(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleFinalConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Series
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
