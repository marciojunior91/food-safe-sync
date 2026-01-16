import { useState } from "react";
import { 
  FileText, 
  Plus, 
  Copy, 
  Trash2, 
  Eye, 
  CheckSquare,
  Clock,
  AlertCircle 
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

import { TaskType, TaskPriority } from "@/types/routineTasks";

// Template task item
interface TemplateTask {
  id: string;
  title: string;
  description?: string;
  task_type: TaskType;
  priority: TaskPriority;
  estimated_minutes?: number;
  requires_approval: boolean;
  order: number;
}

// Template definition
interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  tasks: TemplateTask[];
  is_default: boolean;
  created_by?: string;
}

// Default templates
const DEFAULT_TEMPLATES: TaskTemplate[] = [
  {
    id: "opening-checklist",
    name: "Opening Checklist",
    description: "Complete set of tasks for opening the restaurant",
    icon: "🔓",
    is_default: true,
    tasks: [
      {
        id: "open-1",
        title: "Unlock all doors and turn on lights",
        task_type: "opening",
        priority: "critical",
        estimated_minutes: 5,
        requires_approval: false,
        order: 1,
      },
      {
        id: "open-2",
        title: "Check and record temperatures",
        description: "Record temperatures for all refrigeration units",
        task_type: "temperature",
        priority: "critical",
        estimated_minutes: 10,
        requires_approval: true,
        order: 2,
      },
      {
        id: "open-3",
        title: "Inspect kitchen cleanliness",
        description: "Verify kitchen was properly cleaned previous night",
        task_type: "cleaning_daily",
        priority: "important",
        estimated_minutes: 10,
        requires_approval: false,
        order: 3,
      },
      {
        id: "open-4",
        title: "Check equipment functionality",
        description: "Test all cooking equipment and appliances",
        task_type: "maintenance",
        priority: "important",
        estimated_minutes: 15,
        requires_approval: false,
        order: 4,
      },
      {
        id: "open-5",
        title: "Set up prep stations",
        task_type: "opening",
        priority: "normal",
        estimated_minutes: 20,
        requires_approval: false,
        order: 5,
      },
    ],
  },
  {
    id: "closing-checklist",
    name: "Closing Checklist",
    description: "Complete set of tasks for closing the restaurant",
    icon: "🔒",
    is_default: true,
    tasks: [
      {
        id: "close-1",
        title: "Clean all cooking equipment",
        description: "Deep clean grills, ovens, fryers, and stovetops",
        task_type: "cleaning_daily",
        priority: "critical",
        estimated_minutes: 30,
        requires_approval: false,
        order: 1,
      },
      {
        id: "close-2",
        title: "Clean and sanitize prep areas",
        description: "Wipe down all prep stations and cutting boards",
        task_type: "cleaning_daily",
        priority: "critical",
        estimated_minutes: 20,
        requires_approval: false,
        order: 2,
      },
      {
        id: "close-3",
        title: "Record end-of-day temperatures",
        description: "Final temperature check for all refrigeration",
        task_type: "temperature",
        priority: "critical",
        estimated_minutes: 10,
        requires_approval: true,
        order: 3,
      },
      {
        id: "close-4",
        title: "Empty and clean trash/recycling",
        task_type: "cleaning_daily",
        priority: "important",
        estimated_minutes: 10,
        requires_approval: false,
        order: 4,
      },
      {
        id: "close-5",
        title: "Lock all doors and set alarm",
        task_type: "closing",
        priority: "critical",
        estimated_minutes: 5,
        requires_approval: false,
        order: 5,
      },
    ],
  },
  {
    id: "daily-cleaning",
    name: "Daily Cleaning Routine",
    description: "Comprehensive daily cleaning checklist",
    icon: "🧹",
    is_default: true,
    tasks: [
      {
        id: "clean-1",
        title: "Sweep and mop all floors",
        task_type: "cleaning_daily",
        priority: "important",
        estimated_minutes: 30,
        requires_approval: false,
        order: 1,
      },
      {
        id: "clean-2",
        title: "Clean and sanitize restrooms",
        task_type: "cleaning_daily",
        priority: "critical",
        estimated_minutes: 20,
        requires_approval: false,
        order: 2,
      },
      {
        id: "clean-3",
        title: "Wipe down all dining tables and chairs",
        task_type: "cleaning_daily",
        priority: "important",
        estimated_minutes: 15,
        requires_approval: false,
        order: 3,
      },
      {
        id: "clean-4",
        title: "Clean food contact surfaces",
        description: "Clean and sanitize all cutting boards, knives, utensils",
        task_type: "cleaning_daily",
        priority: "critical",
        estimated_minutes: 25,
        requires_approval: true,
        order: 4,
      },
      {
        id: "clean-5",
        title: "Clean and restock hand washing stations",
        task_type: "cleaning_daily",
        priority: "critical",
        estimated_minutes: 10,
        requires_approval: false,
        order: 5,
      },
      {
        id: "clean-6",
        title: "Check and restock cleaning supplies",
        task_type: "maintenance",
        priority: "normal",
        estimated_minutes: 10,
        requires_approval: false,
        order: 6,
      },
    ],
  },
];

interface TemplateManagerProps {
  onApplyTemplate?: (template: TaskTemplate) => void;
  onCreateCustom?: () => void;
}

export function TemplateManager({
  onApplyTemplate,
  onCreateCustom,
}: TemplateManagerProps) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<TaskTemplate[]>(DEFAULT_TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Priority colors
  const PRIORITY_COLORS = {
    critical: "bg-red-500",
    important: "bg-yellow-500",
    normal: "bg-green-500",
  };

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

  // Handle template preview
  const handlePreview = (template: TaskTemplate) => {
    setSelectedTemplate(template);
    setPreviewOpen(true);
  };

  // Handle apply template
  const handleApply = (template: TaskTemplate) => {
    if (onApplyTemplate) {
      onApplyTemplate(template);
      toast({
        title: "Template Applied",
        description: `${template.tasks.length} tasks created from "${template.name}"`,
      });
    }
  };

  // Handle duplicate template
  const handleDuplicate = (template: TaskTemplate) => {
    const newTemplate: TaskTemplate = {
      ...template,
      id: crypto.randomUUID(),
      name: `${template.name} (Copy)`,
      is_default: false,
      created_by: "current_user", // TODO: Get from user context
    };

    setTemplates([...templates, newTemplate]);
    toast({
      title: "Template Duplicated",
      description: `Created a copy of "${template.name}"`,
    });
  };

  // Handle delete template
  const handleDelete = (template: TaskTemplate) => {
    if (template.is_default) {
      toast({
        title: "Cannot Delete",
        description: "Default templates cannot be deleted",
        variant: "destructive",
      });
      return;
    }

    if (confirm(`Are you sure you want to delete "${template.name}"?`)) {
      setTemplates(templates.filter((t) => t.id !== template.id));
      toast({
        title: "Template Deleted",
        description: `"${template.name}" has been removed`,
      });
    }
  };

  // Calculate template stats
  const getTemplateStats = (template: TaskTemplate) => {
    const totalMinutes = template.tasks.reduce(
      (sum, task) => sum + (task.estimated_minutes || 0),
      0
    );
    const criticalCount = template.tasks.filter(
      (t) => t.priority === "critical"
    ).length;

    return { totalMinutes, criticalCount };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Task Templates</h2>
          <p className="text-muted-foreground">
            Pre-built checklists to speed up task creation
          </p>
        </div>
        <Button onClick={onCreateCustom} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Custom
        </Button>
      </div>

      {/* Templates Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => {
          const stats = getTemplateStats(template);

          return (
            <Card key={template.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">{template.icon}</div>
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      {template.is_default && (
                        <Badge variant="secondary" className="mt-1">
                          Default
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <span className="text-lg">⋮</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handlePreview(template)}>
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      {!template.is_default && (
                        <DropdownMenuItem
                          onClick={() => handleDelete(template)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>

              <CardContent className="flex-1 space-y-3">
                {/* Stats */}
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-muted-foreground" />
                    <span>{template.tasks.length} tasks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>~{stats.totalMinutes} min</span>
                  </div>
                  {stats.criticalCount > 0 && (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span>{stats.criticalCount} critical</span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Task Preview (first 3) */}
                <div className="space-y-2">
                  {template.tasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${PRIORITY_COLORS[task.priority]}`}
                      />
                      <span className="text-muted-foreground">
                        {TASK_TYPE_ICONS[task.task_type]}
                      </span>
                      <span className="truncate">{task.title}</span>
                    </div>
                  ))}
                  {template.tasks.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{template.tasks.length - 3} more tasks...
                    </p>
                  )}
                </div>
              </CardContent>

              <CardFooter className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handlePreview(template)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => handleApply(template)}
                >
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Apply
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Template Preview Dialog */}
      {selectedTemplate && (
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="text-4xl">{selectedTemplate.icon}</div>
                <div>
                  <DialogTitle className="text-2xl">
                    {selectedTemplate.name}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedTemplate.description}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4">
              {/* Template Stats */}
              <div className="flex flex-wrap gap-4 p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">
                    {selectedTemplate.tasks.length} tasks
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">
                    ~{getTemplateStats(selectedTemplate).totalMinutes} minutes
                  </span>
                </div>
              </div>

              <Separator />

              {/* Task List */}
              <div className="space-y-3">
                <h3 className="font-semibold">Tasks in this template:</h3>
                {selectedTemplate.tasks.map((task, index) => (
                  <Card key={task.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium">{task.title}</h4>
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-3 h-3 rounded-full ${PRIORITY_COLORS[task.priority]}`}
                                title={task.priority}
                              />
                              <span className="text-xl">
                                {TASK_TYPE_ICONS[task.task_type]}
                              </span>
                            </div>
                          </div>
                          {task.description && (
                            <p className="text-sm text-muted-foreground">
                              {task.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2">
                            {task.estimated_minutes && (
                              <Badge variant="outline">
                                {task.estimated_minutes} min
                              </Badge>
                            )}
                            {task.requires_approval && (
                              <Badge variant="secondary">Requires Approval</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setPreviewOpen(false)}
              >
                Close
              </Button>
              <Button onClick={() => {
                handleApply(selectedTemplate);
                setPreviewOpen(false);
              }}>
                <CheckSquare className="w-4 h-4 mr-2" />
                Apply Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
