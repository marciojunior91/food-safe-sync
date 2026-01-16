import { useMemo } from "react";
import { format, parseISO, startOfDay, addHours } from "date-fns";
import { Clock } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { TimelineGrid } from "./TimelineGrid";
import { TaskBlock } from "./TaskBlock";
import { RoutineTask } from "@/types/routineTasks";

interface TaskTimelineProps {
  tasks: RoutineTask[];
  selectedDate: Date;
  onTaskClick?: (task: RoutineTask) => void;
  onTaskComplete?: (task: RoutineTask) => void;
}

export function TaskTimeline({
  tasks,
  selectedDate,
  onTaskClick,
  onTaskComplete,
}: TaskTimelineProps) {
  // Get current time for marker
  const now = new Date();
  const isToday = format(selectedDate, "yyyy-MM-dd") === format(now, "yyyy-MM-dd");

  // Filter tasks for the selected date
  const dayTasks = useMemo(() => {
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    return tasks.filter((task) => {
      if (!task.scheduled_date) return false;
      const taskDateStr = format(parseISO(task.scheduled_date), "yyyy-MM-dd");
      return taskDateStr === dateStr;
    });
  }, [tasks, selectedDate]);

  // Sort tasks by scheduled time
  const sortedTasks = useMemo(() => {
    return [...dayTasks].sort((a, b) => {
      const timeA = a.scheduled_time || "00:00";
      const timeB = b.scheduled_time || "00:00";
      return timeA.localeCompare(timeB);
    });
  }, [dayTasks]);

  // Calculate current time position (0-100%)
  const currentTimePosition = useMemo(() => {
    if (!isToday) return null;
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    return (totalMinutes / (24 * 60)) * 100;
  }, [isToday, now]);

  // Group tasks by hour for better visualization
  const tasksByHour = useMemo(() => {
    const groups: Map<number, RoutineTask[]> = new Map();
    
    sortedTasks.forEach((task) => {
      const time = task.scheduled_time || "00:00";
      const hour = parseInt(time.split(":")[0]);
      
      if (!groups.has(hour)) {
        groups.set(hour, []);
      }
      groups.get(hour)!.push(task);
    });
    
    return groups;
  }, [sortedTasks]);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <span>Timeline - {format(selectedDate, "EEEE, MMMM d, yyyy")}</span>
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            {sortedTasks.length} {sortedTasks.length === 1 ? "task" : "tasks"}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="w-full">
          <div className="relative min-w-[800px]">
            {/* Timeline Grid */}
            <TimelineGrid />

            {/* Current Time Marker */}
            {isToday && currentTimePosition !== null && (
              <div
                className="absolute left-0 right-0 z-20 border-t-2 border-red-500"
                style={{ top: `${currentTimePosition}%` }}
              >
                <div className="absolute -left-1 -top-2 w-2 h-2 rounded-full bg-red-500" />
                <div className="absolute left-2 -top-3 text-xs font-medium text-red-500">
                  {format(now, "HH:mm")}
                </div>
              </div>
            )}

            {/* Task Blocks */}
            <div className="absolute inset-0 z-10">
              {Array.from(tasksByHour.entries()).map(([hour, hourTasks]) => (
                <div key={hour} className="relative">
                  {hourTasks.map((task, index) => {
                    const time = task.scheduled_time || "00:00";
                    const [hours, minutes] = time.split(":").map(Number);
                    const totalMinutes = hours * 60 + minutes;
                    const topPosition = (totalMinutes / (24 * 60)) * 100;
                    
                    // Calculate task height based on estimated duration
                    const duration = task.estimated_minutes || 30;
                    const heightPercent = (duration / (24 * 60)) * 100;
                    
                    // Offset multiple tasks at same hour horizontally
                    const leftOffset = index * 5;

                    return (
                      <TaskBlock
                        key={task.id}
                        task={task}
                        style={{
                          position: "absolute",
                          top: `${topPosition}%`,
                          left: `${80 + leftOffset}px`,
                          right: "16px",
                          minHeight: `${Math.max(heightPercent, 2)}%`,
                        }}
                        onClick={() => onTaskClick?.(task)}
                        onComplete={() => onTaskComplete?.(task)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Empty State */}
            {sortedTasks.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-muted-foreground py-12">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No tasks scheduled</p>
                  <p className="text-sm">
                    Create a task for {format(selectedDate, "MMMM d")} to see it here
                  </p>
                </div>
              </div>
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
