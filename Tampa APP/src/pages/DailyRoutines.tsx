import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, CheckCircle2, Calendar } from "lucide-react";
interface Routine {
  id: string;
  name: string;
  description: string;
  frequency: string;
  assigned_role: string;
  is_active: boolean;
}

interface RoutineTask {
  id: string;
  task_name: string;
  description: string;
  task_order: number;
}

export default function DailyRoutines() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [selectedRoutine, setSelectedRoutine] = useState<string | null>(null);
  const [tasks, setTasks] = useState<RoutineTask[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRoutines();
  }, []);

  useEffect(() => {
    if (selectedRoutine) {
      fetchTasks(selectedRoutine);
    }
  }, [selectedRoutine]);

  const fetchRoutines = async () => {
    try {
      const { data, error } = await supabase
        .from("daily_routines")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setRoutines(data || []);
    } catch (error) {
      console.error("Error fetching routines:", error);
      toast({
        title: "Error",
        description: "Failed to load routines",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async (routineId: string) => {
    try {
      const { data, error } = await supabase
        .from("routine_tasks")
        .select("*")
        .eq("routine_id", routineId)
        .order("task_order");

      if (error) throw error;
      setTasks(data || []);
      setCompletedTasks(new Set());
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive",
      });
    }
  };

  const toggleTask = (taskId: string) => {
    const newCompleted = new Set(completedTasks);
    if (newCompleted.has(taskId)) {
      newCompleted.delete(taskId);
    } else {
      newCompleted.add(taskId);
    }
    setCompletedTasks(newCompleted);
  };

  const completeRoutine = async () => {
    if (!selectedRoutine) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const taskStatuses = tasks.map(task => ({
        task_id: task.id,
        completed: completedTasks.has(task.id)
      }));

      const { error } = await supabase
        .from("routine_completions")
        .insert({
          routine_id: selectedRoutine,
          completed_by: user.id,
          task_statuses: taskStatuses
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Routine completed successfully",
      });

      setSelectedRoutine(null);
      setCompletedTasks(new Set());
    } catch (error) {
      console.error("Error completing routine:", error);
      toast({
        title: "Error",
        description: "Failed to complete routine",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Daily Routines</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Available Routines</h2>
            <div className="space-y-3">
              {routines.map((routine) => (
                <Card
                  key={routine.id}
                  className={`cursor-pointer transition-colors ${
                    selectedRoutine === routine.id ? "border-primary" : ""
                  }`}
                  onClick={() => setSelectedRoutine(routine.id)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {routine.name}
                    </CardTitle>
                    <CardDescription>{routine.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <span className="text-sm text-muted-foreground">
                      {routine.frequency}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            {selectedRoutine && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Tasks</h2>
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {tasks.map((task) => (
                        <div key={task.id} className="flex items-start space-x-3">
                          <Checkbox
                            id={task.id}
                            checked={completedTasks.has(task.id)}
                            onCheckedChange={() => toggleTask(task.id)}
                          />
                          <div className="flex-1">
                            <label
                              htmlFor={task.id}
                              className={`font-medium cursor-pointer ${
                                completedTasks.has(task.id) ? "line-through text-muted-foreground" : ""
                              }`}
                            >
                              {task.task_name}
                            </label>
                            {task.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <Button
                      onClick={completeRoutine}
                      className="w-full mt-6"
                      disabled={completedTasks.size === 0}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Complete Routine
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
