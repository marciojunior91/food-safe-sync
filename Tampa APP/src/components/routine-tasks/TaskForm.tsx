import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Clock, User, AlertCircle, Camera } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ImageUpload } from "./ImageUpload";

import {
  TaskType,
  TaskPriority,
  TASK_TYPE_LABELS,
  TASK_PRIORITY_LABELS,
  CreateTaskInput,
} from "@/types/routineTasks";

// Form validation schema
const taskFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  task_type: z.enum([
    "cleaning_daily",
    "cleaning_weekly",
    "temperature",
    "opening",
    "closing",
    "maintenance",
    "others",
  ] as const),
  priority: z.enum(["critical", "important", "normal"] as const),
  assigned_to: z.string().min(1, "Please assign this task to someone"),
  scheduled_date: z.date({
    required_error: "Please select a date",
  }),
  scheduled_time: z.string().optional(),
  estimated_minutes: z.number().min(1).max(480).optional(),
  requires_approval: z.boolean().default(false),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

interface TaskFormProps {
  onSubmit: (data: CreateTaskInput) => Promise<void>;
  onCancel?: () => void;
  defaultValues?: Partial<TaskFormValues>;
  users?: Array<{ user_id: string; display_name: string }>;
  isLoading?: boolean;
  isEditing?: boolean; // New prop to determine if we're editing
  taskId?: string; // Task ID when editing (for attachments)
  userRole?: string; // Current user's role for permissions
}

export function TaskForm({
  onSubmit,
  onCancel,
  defaultValues,
  users = [],
  isLoading = false,
  isEditing = false,
  taskId,
  userRole,
}: TaskFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

  // Check if user has permission to delete images
  // Includes: admin, owner, manager, leader_chef roles
  console.log("🔐 TaskForm - User role:", userRole);
  const canDeleteImages = 
    userRole === 'admin' || 
    userRole === 'owner' ||
    userRole === 'manager' ||
    userRole === 'leader_chef';
  console.log("🔐 TaskForm - Can delete images:", canDeleteImages);

  // Load attachments when editing
  useEffect(() => {
    if (isEditing && taskId) {
      loadAttachments();
    }
  }, [isEditing, taskId]);

  const loadAttachments = async () => {
    if (!taskId) return;
    
    setLoadingAttachments(true);
    try {
      const { data, error } = await supabase
        .from("task_attachments")
        .select("*")
        .eq("task_id", taskId)
        .order("uploaded_at", { ascending: true });

      if (error) {
        console.error("Error loading attachments:", error);
        return;
      }

      setAttachments(data?.map((a) => a.file_url) || []);
    } catch (error) {
      console.error("Error loading attachments:", error);
    } finally {
      setLoadingAttachments(false);
    }
  };

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: defaultValues?.title || "",
      description: defaultValues?.description || "",
      task_type: defaultValues?.task_type || "others",
      priority: defaultValues?.priority || "normal",
      assigned_to: defaultValues?.assigned_to || "",
      scheduled_date: defaultValues?.scheduled_date || new Date(),
      scheduled_time: defaultValues?.scheduled_time || "",
      estimated_minutes: defaultValues?.estimated_minutes || 30,
      requires_approval: defaultValues?.requires_approval || false,
    },
  });

  const handleSubmit = async (data: TaskFormValues) => {
    try {
      setIsSubmitting(true);

      // Convert to CreateTaskInput format
      const taskInput: CreateTaskInput = {
        title: data.title,
        description: data.description,
        task_type: data.task_type,
        priority: data.priority,
        team_member_id: data.assigned_to, // Send as team_member_id (new field)
        scheduled_date: format(data.scheduled_date, "yyyy-MM-dd"),
        scheduled_time: data.scheduled_time || undefined,
        estimated_minutes: data.estimated_minutes,
        requires_approval: data.requires_approval,
      };

      await onSubmit(taskInput);

      // Don't show toast here - let the parent component handle it
      form.reset();
    } catch (error) {
      console.error("Error submitting task:", error);
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Task Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Task Title *</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Check refrigerator temperature"
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any additional details or instructions..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Optional notes or instructions for this task
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Task Type and Priority - Side by Side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Task Type */}
          <FormField
            control={form.control}
            name="task_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Task Type *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select task type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(Object.keys(TASK_TYPE_LABELS) as TaskType[]).map(
                      (type) => (
                        <SelectItem key={type} value={type}>
                          {TASK_TYPE_LABELS[type]}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Priority */}
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(Object.keys(TASK_PRIORITY_LABELS) as TaskPriority[]).map(
                      (priority) => (
                        <SelectItem key={priority} value={priority}>
                          <span className="flex items-center gap-2">
                            <span
                              className={cn(
                                "w-2 h-2 rounded-full",
                                priority === "critical" && "bg-red-500",
                                priority === "important" && "bg-yellow-500",
                                priority === "normal" && "bg-green-500"
                              )}
                            />
                            {TASK_PRIORITY_LABELS[priority]}
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

        {/* Assign To User */}
        <FormField
          control={form.control}
          name="assigned_to"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assign To *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>
                          {field.value && field.value !== "unassigned"
                            ? users.find((u) => u.user_id === field.value)
                                ?.display_name || "Select user"
                            : "Select a team member"}
                        </span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {users.length === 0 ? (
                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                      No team members found
                    </div>
                  ) : (
                    users.map((user) => (
                      <SelectItem key={user.user_id} value={user.user_id}>
                        {user.display_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormDescription>
                Assign this task to a team member
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Date and Time - Side by Side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Scheduled Date */}
          <FormField
            control={form.control}
            name="scheduled_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Scheduled Date *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Scheduled Time */}
          <FormField
            control={form.control}
            name="scheduled_time"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Scheduled Time</FormLabel>
                <FormControl>
                  <Input
                    type="time"
                    className="w-full h-10 [color-scheme:light] dark:[color-scheme:dark]"
                    placeholder="09:00"
                    {...field}
                  />
                </FormControl>
                <FormDescription>Optional specific time</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Estimated Duration */}
        <FormField
          control={form.control}
          name="estimated_minutes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estimated Duration (minutes)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  max="480"
                  placeholder="30"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                How long do you expect this task to take?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Photo Attachments - Only show when editing */}
        {isEditing && taskId && (
          <>
            <Separator className="my-6" />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Photo Attachments</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Add photos to document this task
                {canDeleteImages && " • You can delete images as an admin/leader"}
              </p>
              <ImageUpload
                taskId={taskId}
                existingImages={attachments}
                onUploadComplete={(urls) => {
                  console.log("Images uploaded:", urls);
                  loadAttachments();
                }}
                maxImages={10}
                canDelete={canDeleteImages}
              />
            </div>
          </>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="w-4 h-4" />
            <span>* Required fields</span>
          </div>

          <div className="flex items-center gap-3">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting || isLoading}
              >
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting || isLoading}>
              {isSubmitting 
                ? (isEditing ? "Saving..." : "Creating...") 
                : (isEditing ? "Save Task Changes" : "Create Task")
              }
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
