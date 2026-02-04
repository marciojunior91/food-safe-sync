import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Clock, User, AlertCircle, Camera, Repeat, Plus, X } from "lucide-react";

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
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

// Subtask type
interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

// Form validation schema
const taskFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  subtasks: z.array(z.object({
    id: z.string(),
    title: z.string().min(1, "Subtask title is required"),
    completed: z.boolean(),
  })).optional(),
  task_type: z.enum([
    "cleaning_daily",
    "cleaning_weekly",
    "temperature",
    "opening",
    "closing",
    "maintenance",
    "others",
  ] as const),
  custom_task_type: z.string().optional(),
  priority: z.enum(["critical", "important", "normal"] as const),
  assigned_to: z.string().min(1, "Please assign this task to someone"),
  scheduled_date: z.date({
    required_error: "Please select a date",
  }),
  scheduled_time: z.string().optional(),
  estimated_minutes: z.number().min(1).max(480).optional(),
  requires_approval: z.boolean().default(false),
  // Recurrence fields
  is_recurring: z.boolean().default(false),
  recurrence_frequency: z.enum(["daily", "weekly", "biweekly", "monthly", "custom"]).optional(),
  custom_period_days: z.number().min(1).max(365).optional(),
  recurrence_end_date: z.date().optional(),
}).refine((data) => {
  // If task_type is "others", custom_task_type must be filled
  if (data.task_type === "others" && !data.custom_task_type?.trim()) {
    return false;
  }
  return true;
}, {
  message: "Please specify the task type",
  path: ["custom_task_type"],
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
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtask, setNewSubtask] = useState("");

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

  // Initialize subtasks from defaultValues
  useEffect(() => {
    if (defaultValues?.subtasks) {
      const validSubtasks: Subtask[] = defaultValues.subtasks
        .filter((st): st is Subtask => 
          typeof st.id === 'string' && 
          typeof st.title === 'string' && 
          typeof st.completed === 'boolean'
        );
      setSubtasks(validSubtasks);
    }
  }, [defaultValues?.subtasks]);

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

  // Subtask management functions
  const addSubtask = () => {
    if (newSubtask.trim()) {
      const newSubtaskObj: Subtask = {
        id: crypto.randomUUID(),
        title: newSubtask.trim(),
        completed: false,
      };
      const updatedSubtasks = [...subtasks, newSubtaskObj];
      setSubtasks(updatedSubtasks);
      form.setValue("subtasks", updatedSubtasks);
      setNewSubtask("");
    }
  };

  const removeSubtask = (id: string) => {
    const updatedSubtasks = subtasks.filter((st) => st.id !== id);
    setSubtasks(updatedSubtasks);
    form.setValue("subtasks", updatedSubtasks);
  };

  const updateSubtask = (id: string, title: string) => {
    const updatedSubtasks = subtasks.map((st) => 
      st.id === id ? { ...st, title } : st
    );
    setSubtasks(updatedSubtasks);
    form.setValue("subtasks", updatedSubtasks);
  };

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: defaultValues?.title || "",
      description: defaultValues?.description || "",
      subtasks: defaultValues?.subtasks || [],
      task_type: defaultValues?.task_type || "others",
      custom_task_type: "",
      priority: defaultValues?.priority || "normal",
      assigned_to: defaultValues?.assigned_to || "",
      scheduled_date: defaultValues?.scheduled_date || new Date(),
      scheduled_time: defaultValues?.scheduled_time || "",
      estimated_minutes: defaultValues?.estimated_minutes || 30,
      requires_approval: defaultValues?.requires_approval || false,
      is_recurring: false,
      recurrence_frequency: undefined,
      custom_period_days: undefined,
      recurrence_end_date: undefined,
    },
  });

  const handleSubmit = async (data: TaskFormValues) => {
    try {
      setIsSubmitting(true);

      // Build recurrence pattern if recurring
      let recurrencePattern = undefined;
      if (data.is_recurring && data.recurrence_frequency) {
        let interval = 1;
        let frequency: 'daily' | 'weekly' | 'monthly' = 'daily';
        
        if (data.recurrence_frequency === 'daily') {
          frequency = 'daily';
          interval = 1;
        } else if (data.recurrence_frequency === 'weekly') {
          frequency = 'weekly';
          interval = 1;
        } else if (data.recurrence_frequency === 'biweekly') {
          frequency = 'weekly';
          interval = 2;
        } else if (data.recurrence_frequency === 'monthly') {
          frequency = 'monthly';
          interval = 1;
        } else if (data.recurrence_frequency === 'custom' && data.custom_period_days) {
          frequency = 'daily';
          interval = data.custom_period_days;
        }

        recurrencePattern = {
          frequency,
          interval,
          end_date: data.recurrence_end_date 
            ? format(data.recurrence_end_date, "yyyy-MM-dd") 
            : undefined,
        };
      }

      // Convert to CreateTaskInput format
      const taskInput: CreateTaskInput = {
        title: data.title,
        description: data.task_type === "others" && data.custom_task_type
          ? `[${data.custom_task_type}] ${data.description || ""}`
          : data.description,
        subtasks: subtasks.length > 0 ? subtasks : undefined, // Include subtasks if any
        task_type: data.task_type,
        priority: data.priority,
        team_member_id: data.assigned_to, // Send as team_member_id (new field)
        scheduled_date: format(data.scheduled_date, "yyyy-MM-dd"),
        scheduled_time: data.scheduled_time || undefined,
        estimated_minutes: data.estimated_minutes,
        requires_approval: data.requires_approval,
        recurrence_pattern: recurrencePattern,
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

        {/* Subtasks List */}
        <div className="space-y-3">
          <Label>Subtasks</Label>
          <div className="flex gap-2">
            <Input
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              placeholder="Add a subtask..."
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSubtask();
                }
              }}
            />
            <Button type="button" onClick={addSubtask} size="sm" variant="secondary">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          {subtasks.length > 0 && (
            <div className="space-y-2">
              {subtasks.map((subtask, index) => (
                <div
                  key={subtask.id}
                  className="flex items-start gap-2 p-3 bg-muted rounded-lg"
                >
                  <span className="font-medium text-sm text-muted-foreground mt-0.5">
                    {index + 1}.
                  </span>
                  <span className="flex-1 text-sm">{subtask.title}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSubtask(subtask.id)}
                    className="h-6 w-6 p-0 hover:bg-destructive/10"
                  >
                    <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          <FormDescription>
            Optional checklist of steps to complete this task
          </FormDescription>
        </div>

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
                    <SelectTrigger data-testid="task-type-select">
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

        {/* Custom Task Type - Only show when "others" is selected */}
        {form.watch("task_type") === "others" && (
          <FormField
            control={form.control}
            name="custom_task_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1">
                  Specify Task Type
                  <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    data-testid="custom-task-type-input"
                    placeholder="e.g., Inventory count, Staff meeting, Training..."
                    {...field}
                    className={cn(
                      !field.value?.trim() && "border-yellow-500 focus:ring-yellow-500"
                    )}
                  />
                </FormControl>
                <FormDescription className="flex items-center gap-1 text-yellow-600">
                  <AlertCircle className="w-3 h-3" />
                  Please describe what type of task this is
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Assign To User - MANDATORY FIELD */}
        <FormField
          control={form.control}
          name="assigned_to"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1">
                Assign To
                <span className="text-destructive">*</span>
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger 
                    data-testid="assign-to-select"
                    className={cn(
                      !field.value && "border-destructive focus:ring-destructive"
                    )}
                  >
                    <SelectValue placeholder="Select a team member">
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
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                      <p className="font-medium">No team members found</p>
                      <p className="text-xs mt-1">Please add team members first</p>
                    </div>
                  ) : (
                    users.map((user) => (
                      <SelectItem key={user.user_id} value={user.user_id}>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-medium">
                              {user.display_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          {user.display_name}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormDescription>
                {!field.value ? (
                  <span className="text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    This field is required
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    Task assigned to {users.find((u) => u.user_id === field.value)?.display_name}
                  </span>
                )}
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
                        data-testid="scheduled-date-button"
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

        {/* Recurrence Section */}
        <Separator className="my-6" />
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Repeat className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Recurrence Settings</h3>
          </div>

          {/* Enable Recurrence Toggle */}
          <FormField
            control={form.control}
            name="is_recurring"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Recurring Task
                  </FormLabel>
                  <FormDescription>
                    Create this task automatically on a schedule
                  </FormDescription>
                </div>
                <FormControl>
                  <input
                    data-testid="is-recurring-checkbox"
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Recurrence Frequency - Only show if recurring enabled */}
          {form.watch("is_recurring") && (
            <>
              <FormField
                control={form.control}
                name="recurrence_frequency"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Frequency *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        data-testid="recurrence-frequency-group"
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-2 gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="daily" id="daily" />
                          <Label 
                            htmlFor="daily" 
                            className="font-normal cursor-pointer flex items-center gap-2"
                          >
                            <span className="text-lg">📅</span>
                            <div>
                              <div className="font-medium">Daily</div>
                              <div className="text-xs text-muted-foreground">Every day</div>
                            </div>
                          </Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="weekly" id="weekly" />
                          <Label 
                            htmlFor="weekly" 
                            className="font-normal cursor-pointer flex items-center gap-2"
                          >
                            <span className="text-lg">📆</span>
                            <div>
                              <div className="font-medium">Weekly</div>
                              <div className="text-xs text-muted-foreground">Every 7 days</div>
                            </div>
                          </Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="biweekly" id="biweekly" />
                          <Label 
                            htmlFor="biweekly" 
                            className="font-normal cursor-pointer flex items-center gap-2"
                          >
                            <span className="text-lg">🗓️</span>
                            <div>
                              <div className="font-medium">Biweekly</div>
                              <div className="text-xs text-muted-foreground">Every 14 days</div>
                            </div>
                          </Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="monthly" id="monthly" />
                          <Label 
                            htmlFor="monthly" 
                            className="font-normal cursor-pointer flex items-center gap-2"
                          >
                            <span className="text-lg">📊</span>
                            <div>
                              <div className="font-medium">Monthly</div>
                              <div className="text-xs text-muted-foreground">Every 30 days</div>
                            </div>
                          </Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="custom" id="custom" />
                          <Label 
                            htmlFor="custom" 
                            className="font-normal cursor-pointer flex items-center gap-2"
                          >
                            <span className="text-lg">⚙️</span>
                            <div>
                              <div className="font-medium">Custom</div>
                              <div className="text-xs text-muted-foreground">Set your own period</div>
                            </div>
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormDescription>
                      How often should this task repeat?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Custom Period Input - Only show if "custom" is selected */}
              {form.watch("recurrence_frequency") === "custom" && (
                <FormField
                  control={form.control}
                  name="custom_period_days"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Repeat Every (Days) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="365"
                          placeholder="e.g., 3 for every 3 days"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormDescription>
                        Task will repeat every {field.value || 1} days
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Recurrence End Date */}
              <FormField
                control={form.control}
                name="recurrence_end_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date (Optional)</FormLabel>
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
                              <span>No end date (repeats forever)</span>
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
                    <FormDescription>
                      When should the recurrence stop? Leave empty for no end date.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
        </div>

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
            <Button 
              data-testid="submit-button"
              type="submit" 
              disabled={isSubmitting || isLoading || !form.watch("assigned_to")}
              className={cn(
                !form.watch("assigned_to") && "opacity-50 cursor-not-allowed"
              )}
            >
              {!form.watch("assigned_to") ? (
                <>
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Assign Someone First
                </>
              ) : isSubmitting ? (
                isEditing ? "Saving..." : "Creating..."
              ) : (
                isEditing ? "Save Task Changes" : "Create Task"
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
