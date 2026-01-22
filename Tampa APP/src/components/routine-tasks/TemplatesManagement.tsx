import { useState } from "react";
import { Plus, Edit2, Trash2, Copy, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  TaskTemplate,
  TASK_TYPE_LABELS,
} from "@/types/routineTasks";
import { cn } from "@/lib/utils";

interface TemplatesManagementProps {
  templates: TaskTemplate[];
  loading: boolean;
  onCreateTemplate: () => void;
  onEditTemplate: (template: TaskTemplate) => void;
  onDeleteTemplate: (templateId: string) => Promise<boolean>;
  onDuplicateTemplate: (template: TaskTemplate) => Promise<void>;
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

export function TemplatesManagement({
  templates,
  loading,
  onCreateTemplate,
  onEditTemplate,
  onDeleteTemplate,
  onDuplicateTemplate,
}: TemplatesManagementProps) {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<TaskTemplate | null>(null);

  const handleDelete = async () => {
    if (!templateToDelete) return;

    const success = await onDeleteTemplate(templateToDelete.id);
    if (success) {
      setTemplateToDelete(null);
      toast({
        title: "Template Deleted",
        description: `"${templateToDelete.name}" has been removed`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    }
  };

  const handleDuplicate = async (template: TaskTemplate) => {
    await onDuplicateTemplate(template);
    toast({
      title: "Template Duplicated",
      description: `Created a copy of "${template.name}"`,
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  // Group templates by type
  const defaultTemplates = templates.filter((t) => t.is_default);
  const customTemplates = templates.filter((t) => !t.is_default);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Task Templates</h2>
          <p className="text-muted-foreground">
            Manage pre-defined task templates for routine operations
          </p>
        </div>
        <Button onClick={onCreateTemplate} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Template
        </Button>
      </div>

      {/* Default Templates Section */}
      {defaultTemplates.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">System Templates</h3>
            <Badge variant="secondary">Read-only</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {defaultTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onView={() => setSelectedTemplate(template)}
                onEdit={null} // Default templates can't be edited
                onDelete={null}
                onDuplicate={() => handleDuplicate(template)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Custom Templates Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Custom Templates</h3>
          <Badge variant="default">{customTemplates.length}</Badge>
        </div>
        
        {customTemplates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Plus className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No custom templates yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first custom template to get started
              </p>
              <Button onClick={onCreateTemplate}>
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {customTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onView={() => setSelectedTemplate(template)}
                onEdit={() => onEditTemplate(template)}
                onDelete={() => setTemplateToDelete(template)}
                onDuplicate={() => handleDuplicate(template)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Template Preview Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={(open) => !open && setSelectedTemplate(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTemplate && TASK_TYPE_ICONS[selectedTemplate.task_type]}
              {selectedTemplate?.name}
              {selectedTemplate?.is_default && (
                <Badge variant="secondary" className="ml-2">
                  System
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate?.description || "No description provided"}
            </DialogDescription>
          </DialogHeader>

          {selectedTemplate && (
            <ScrollArea className="max-h-96 pr-4">
              <div className="space-y-4">
                {/* Template Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Type</p>
                    <Badge variant="outline" className="mt-1">
                      {TASK_TYPE_LABELS[selectedTemplate.task_type]}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tasks</p>
                    <p className="text-2xl font-bold">{selectedTemplate.tasks.length}</p>
                  </div>
                </div>

                {/* Tasks List */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Tasks in Template:</p>
                  <div className="space-y-2">
                    {selectedTemplate.tasks.map((task, index) => (
                      <Card key={index} className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium">{task.title}</p>
                            {task.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {task.description}
                              </p>
                            )}
                            <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                              {task.estimated_minutes && (
                                <span>⏱️ {task.estimated_minutes} min</span>
                              )}
                              {task.requires_approval && (
                                <Badge variant="outline" className="text-xs">
                                  Requires Approval
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!templateToDelete} onOpenChange={(open) => !open && setTemplateToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{templateToDelete?.name}"? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Template Card Component
interface TemplateCardProps {
  template: TaskTemplate;
  onView: () => void;
  onEdit: (() => void) | null;
  onDelete: (() => void) | null;
  onDuplicate: () => void;
}

function TemplateCard({
  template,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
}: TemplateCardProps) {
  const taskIcon = TASK_TYPE_ICONS[template.task_type] || "📋";
  const isDefault = template.is_default;

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md cursor-pointer",
        isDefault && "border-primary/30 bg-primary/5"
      )}
      onClick={onView}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Template Icon */}
            <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl bg-primary/10 flex-shrink-0">
              {taskIcon}
            </div>

            {/* Template Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold truncate">{template.name}</h3>
                {isDefault && (
                  <Lock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                )}
              </div>
              <Badge variant="secondary" className="text-xs">
                {TASK_TYPE_LABELS[template.task_type]}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Description */}
        {template.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {template.description}
          </p>
        )}

        {/* Tasks Count */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {template.tasks.length} {template.tasks.length === 1 ? "task" : "tasks"}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4 pt-4 border-t">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-2"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
          >
            <Copy className="w-3 h-3" />
            Duplicate
          </Button>
          
          {onEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Edit2 className="w-3 h-3" />
            </Button>
          )}
          
          {onDelete && (
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
