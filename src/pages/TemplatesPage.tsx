import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { TemplateManager } from "@/components/routine-tasks/TemplateManager";
import { useToast } from "@/hooks/use-toast";
import { useUserContext } from "@/hooks/useUserContext";
import { useRoutineTasks } from "@/hooks/useRoutineTasks";
import { CreateTaskInput } from "@/types/routineTasks";

// Template task type (from TemplateManager)
interface TemplateTask {
  id: string;
  title: string;
  description?: string;
  task_type: any;
  priority: any;
  estimated_minutes?: number;
  requires_approval: boolean;
  order: number;
}

interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  tasks: TemplateTask[];
  is_default: boolean;
  created_by?: string;
}

export default function TemplatesPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { context } = useUserContext();
  const { createTask } = useRoutineTasks(context?.organization_id);
  const [applying, setApplying] = useState(false);

  // Handle template application
  const handleApplyTemplate = async (template: TaskTemplate) => {
    if (!context?.organization_id) {
      toast({
        title: "Error",
        description: "No organization found",
        variant: "destructive",
      });
      return;
    }

    setApplying(true);

    try {
      // Create all tasks from template
      const today = new Date();
      const createdTasks = [];

      for (const templateTask of template.tasks) {
        const taskData: CreateTaskInput = {
          title: templateTask.title,
          description: templateTask.description,
          task_type: templateTask.task_type,
          priority: templateTask.priority,
          estimated_minutes: templateTask.estimated_minutes,
          requires_approval: templateTask.requires_approval,
          scheduled_date: today.toISOString().split('T')[0],
        };

        const newTask = await createTask(taskData);
        if (newTask) {
          createdTasks.push(newTask);
        }
      }

      toast({
        title: "Template Applied!",
        description: `Created ${createdTasks.length} tasks from "${template.name}"`,
      });

      // Navigate to tasks page after a brief delay
      setTimeout(() => {
        navigate("/routine-tasks");
      }, 1500);
    } catch (error) {
      console.error("Error applying template:", error);
      toast({
        title: "Error",
        description: "Failed to apply template",
        variant: "destructive",
      });
    } finally {
      setApplying(false);
    }
  };

  // Handle create custom template
  const handleCreateCustom = () => {
    toast({
      title: "Custom Templates",
      description: "Template builder coming soon!",
    });
    // TODO: Navigate to template builder
    // navigate("/templates/builder");
  };

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <TemplateManager
        onApplyTemplate={handleApplyTemplate}
        onCreateCustom={handleCreateCustom}
      />

      {applying && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              <span className="font-medium">Creating tasks from template...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
