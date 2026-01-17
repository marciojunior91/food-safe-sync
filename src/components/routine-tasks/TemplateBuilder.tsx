import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Plus,
  Trash2,
  GripVertical,
  Save,
  X,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

import {
  TaskType,
  TaskPriority,
  TASK_TYPE_LABELS,
  TASK_PRIORITY_LABELS,
} from "@/types/routineTasks";

// Template task schema
const templateTaskSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  task_type: z.enum([
    "cleaning_daily",
    "cleaning_weekly",
    "temperature",
    "opening",
    "closing",
    "inspection",
    "maintenance",
  ]),
  priority: z.enum(["critical", "important", "normal"]),
  estimated_minutes: z.number().min(1).optional(),
  requires_approval: z.boolean(),
});

// Template schema
const templateSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  icon: z.string().min(1, "Icon is required"),
  tasks: z.array(templateTaskSchema).min(1, "Add at least one task"),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

interface TemplateBuilderProps {
  initialData?: TemplateFormValues;
  onSave?: (template: TemplateFormValues) => void;
  onCancel?: () => void;
}

// Priority colors
const PRIORITY_COLORS = {
  critical: "bg-red-500",
  important: "bg-yellow-500",
  normal: "bg-green-500",
};

// Common task type emojis
const TASK_TYPE_ICONS: Record<string, string> = {
  cleaning_daily: "🧹",
  cleaning_weekly: "🧼",
  temperature: "🌡️",
  opening: "🔓",
  closing: "🔒",
  inspection: "🔍",
  maintenance: "🔧",
};

// Emoji options for template icon
const ICON_OPTIONS = [
  "📋", "✅", "🔓", "🔒", "🧹", "🧼", "🌡️", "🔍", 
  "🔧", "📦", "🍽️", "👨‍🍳", "🥗", "🔪", "🍕", "☕"
];

export function TemplateBuilder({
  initialData,
  onSave,
  onCancel,
}: TemplateBuilderProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: initialData || {
      name: "",
      description: "",
      icon: "📋",
      tasks: [
        {
          title: "",
          description: "",
          task_type: "cleaning_daily",
          priority: "normal",
          estimated_minutes: 10,
          requires_approval: false,
        },
      ],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "tasks",
  });

  // Add new task
  const handleAddTask = () => {
    append({
      title: "",
      description: "",
      task_type: "cleaning_daily",
      priority: "normal",
      estimated_minutes: 10,
      requires_approval: false,
    });
  };

  // Move task up
  const handleMoveUp = (index: number) => {
    if (index > 0) {
      move(index, index - 1);
    }
  };

  // Move task down
  const handleMoveDown = (index: number) => {
    if (index < fields.length - 1) {
      move(index, index + 1);
    }
  };

  // Handle form submission
  const handleSubmit = async (data: TemplateFormValues) => {
    setSaving(true);

    try {
      if (onSave) {
        await onSave(data);
      }

      toast({
        title: "Template Saved!",
        description: `"${data.name}" has been created successfully`,
      });
    } catch (error) {
      console.error("Error saving template:", error);
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Calculate total estimated time
  const totalMinutes = form.watch("tasks").reduce(
    (sum, task) => sum + (task.estimated_minutes || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {initialData ? "Edit Template" : "Create Custom Template"}
          </h2>
          <p className="text-muted-foreground">
            Build a reusable checklist for your team
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Template Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Template Information</CardTitle>
              <CardDescription>
                Basic details about your template
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Icon Selector */}
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Icon</FormLabel>
                    <FormControl>
                      <div className="flex flex-wrap gap-2">
                        {ICON_OPTIONS.map((icon) => (
                          <Button
                            key={icon}
                            type="button"
                            variant={field.value === icon ? "default" : "outline"}
                            size="lg"
                            onClick={() => field.onChange(icon)}
                            className="text-2xl h-12 w-12 p-0"
                          >
                            {icon}
                          </Button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Template Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Weekend Opening Checklist"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Give your template a clear, descriptive name
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Template Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what this template is for and when to use it..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Stats */}
              <div className="flex gap-4 p-3 bg-muted rounded-lg">
                <div>
                  <span className="text-sm text-muted-foreground">Tasks:</span>
                  <span className="ml-2 font-medium">{fields.length}</span>
                </div>
                <Separator orientation="vertical" />
                <div>
                  <span className="text-sm text-muted-foreground">
                    Est. Time:
                  </span>
                  <span className="ml-2 font-medium">~{totalMinutes} min</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tasks List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Template Tasks</CardTitle>
                  <CardDescription>
                    Add tasks that will be created when this template is applied
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddTask}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Task
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <Card key={field.id} className="relative">
                  <CardContent className="pt-6">
                    {/* Task Order Badge */}
                    <div className="absolute top-2 left-2">
                      <Badge variant="secondary">#{index + 1}</Badge>
                    </div>

                    {/* Move & Delete Buttons */}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === fields.length - 1}
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="space-y-4 mt-6">
                      {/* Task Title */}
                      <FormField
                        control={form.control}
                        name={`tasks.${index}.title`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Task Title</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., Check refrigerator temperatures"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Task Description */}
                      <FormField
                        control={form.control}
                        name={`tasks.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Additional details or instructions..."
                                rows={2}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Task Type & Priority */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`tasks.${index}.task_type`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Task Type</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Object.entries(TASK_TYPE_LABELS).map(
                                    ([value, label]) => (
                                      <SelectItem key={value} value={value}>
                                        <span className="flex items-center gap-2">
                                          <span>{TASK_TYPE_ICONS[value]}</span>
                                          <span>{label}</span>
                                        </span>
                                      </SelectItem>
                                    )
                                  )}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`tasks.${index}.priority`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Priority</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Object.entries(TASK_PRIORITY_LABELS).map(
                                    ([value, label]) => (
                                      <SelectItem key={value} value={value}>
                                        <span className="flex items-center gap-2">
                                          <div
                                            className={`w-3 h-3 rounded-full ${
                                              PRIORITY_COLORS[
                                                value as keyof typeof PRIORITY_COLORS
                                              ]
                                            }`}
                                          />
                                          <span>{label}</span>
                                        </span>
                                      </SelectItem>
                                    )
                                  )}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Estimated Minutes & Approval */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`tasks.${index}.estimated_minutes`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Estimated Time (minutes)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={1}
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(parseInt(e.target.value) || 0)
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`tasks.${index}.requires_approval`}
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 mt-7">
                              <div className="space-y-0.5">
                                <FormLabel>Requires Approval</FormLabel>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Add Task Button (bottom) */}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleAddTask}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Another Task
              </Button>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Template"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
