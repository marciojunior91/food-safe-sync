/**
 * ================================================================
 * SUBTASKS MANAGER
 * ================================================================
 * Comprehensive subtask management component with:
 * - Add new subtasks
 * - Mark as completed (checkbox toggle)
 * - Drag & drop reordering (@dnd-kit)
 * - Delete with confirmation
 * - Visual progress indicator
 * ================================================================
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  GripVertical,
  Trash2,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { Subtask } from "@/types/recurring-tasks";

// ================================================================
// TYPES
// ================================================================

interface SubtasksManagerProps {
  subtasks: Subtask[];
  onChange: (subtasks: Subtask[]) => void;
  readOnly?: boolean;
  showProgress?: boolean;
  maxHeight?: string;
}

// ================================================================
// SORTABLE SUBTASK ITEM
// ================================================================

interface SortableSubtaskItemProps {
  subtask: Subtask;
  index: number;
  readOnly: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

function SortableSubtaskItem({
  subtask,
  index,
  readOnly,
  onToggle,
  onDelete,
}: SortableSubtaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subtask.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-start gap-2 p-3 rounded-lg border bg-card transition-all",
        isDragging && "opacity-50 shadow-lg",
        subtask.completed && "bg-muted/50"
      )}
    >
      {/* Drag Handle */}
      {!readOnly && (
        <button
          type="button"
          className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4" />
        </button>
      )}

      {/* Checkbox */}
      <div className="mt-1">
        <Checkbox
          id={`subtask-${subtask.id}`}
          checked={subtask.completed}
          onCheckedChange={() => onToggle(subtask.id)}
          disabled={readOnly}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <Label
          htmlFor={`subtask-${subtask.id}`}
          className={cn(
            "text-sm cursor-pointer",
            subtask.completed && "line-through text-muted-foreground"
          )}
        >
          {index + 1}. {subtask.title}
        </Label>
      </div>

      {/* Status Icon */}
      <div className="mt-1">
        {subtask.completed ? (
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        ) : (
          <Circle className="w-4 h-4 text-muted-foreground" />
        )}
      </div>

      {/* Delete Button */}
      {!readOnly && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onDelete(subtask.id)}
          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      )}
    </div>
  );
}

// ================================================================
// MAIN COMPONENT
// ================================================================

export function SubtasksManager({
  subtasks,
  onChange,
  readOnly = false,
  showProgress = true,
  maxHeight = "400px",
}: SubtasksManagerProps) {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [subtaskToDelete, setSubtaskToDelete] = useState<string | null>(null);

  // Drag & Drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Calculate progress
  const completedCount = subtasks.filter((s) => s.completed).length;
  const totalCount = subtasks.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Add subtask
  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;

    const newSubtask: Subtask = {
      id: crypto.randomUUID(),
      title: newSubtaskTitle.trim(),
      completed: false,
      order: subtasks.length,
    };

    onChange([...subtasks, newSubtask]);
    setNewSubtaskTitle("");
  };

  // Toggle subtask completion
  const handleToggleSubtask = (id: string) => {
    const updated = subtasks.map((st) =>
      st.id === id ? { ...st, completed: !st.completed } : st
    );
    onChange(updated);
  };

  // Delete subtask (with confirmation)
  const handleDeleteSubtask = (id: string) => {
    const filtered = subtasks.filter((st) => st.id !== id);
    // Update order values
    const reordered = filtered.map((st, index) => ({ ...st, order: index }));
    onChange(reordered);
    setSubtaskToDelete(null);
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = subtasks.findIndex((st) => st.id === active.id);
      const newIndex = subtasks.findIndex((st) => st.id === over.id);

      const reordered = arrayMove(subtasks, oldIndex, newIndex);
      // Update order values
      const withOrder = reordered.map((st, index) => ({ ...st, order: index }));
      onChange(withOrder);
    }
  };

  // Handle Enter key in input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSubtask();
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">Subtasks</h3>
          <Badge variant="secondary">
            {completedCount}/{totalCount}
          </Badge>
        </div>
        {showProgress && totalCount > 0 && (
          <span className="text-xs text-muted-foreground">
            {Math.round(progressPercent)}% complete
          </span>
        )}
      </div>

      {/* Progress Bar */}
      {showProgress && totalCount > 0 && (
        <Progress value={progressPercent} className="h-2" />
      )}

      {/* Add New Subtask */}
      {!readOnly && (
        <div className="flex gap-2">
          <Input
            placeholder="Add a subtask..."
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button
            type="button"
            onClick={handleAddSubtask}
            disabled={!newSubtaskTitle.trim()}
            size="sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
      )}

      {/* Subtasks List */}
      {subtasks.length > 0 ? (
        <ScrollArea style={{ maxHeight }}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={subtasks.map((st) => st.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {subtasks.map((subtask, index) => (
                  <SortableSubtaskItem
                    key={subtask.id}
                    subtask={subtask}
                    index={index}
                    readOnly={readOnly}
                    onToggle={handleToggleSubtask}
                    onDelete={(id) => setSubtaskToDelete(id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </ScrollArea>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No subtasks yet.</p>
          {!readOnly && (
            <p className="text-xs mt-1">Add one to break down this task.</p>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!subtaskToDelete}
        onOpenChange={(open) => !open && setSubtaskToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subtask?</AlertDialogTitle>
            <AlertDialogDescription>
              This subtask will be permanently removed. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => subtaskToDelete && handleDeleteSubtask(subtaskToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
