import { useEffect, useState } from "react";
import { Clock, User } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";

import {
  TaskActivity,
  TaskActivityType,
  TASK_ACTIVITY_LABELS,
  TASK_ACTIVITY_ICONS,
} from "@/types/routineTasks";

interface TaskActivityTimelineProps {
  taskId: string;
  limit?: number;
  showTitle?: boolean;
}

export function TaskActivityTimeline({
  taskId,
  limit = 50,
  showTitle = true,
}: TaskActivityTimelineProps) {
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActivities();
  }, [taskId]);

  const fetchActivities = async () => {
    setLoading(true);
    setError(null);

    try {
      // TODO: Uncomment when migration 20260115000002_task_activity_tracking.sql is applied
      // const { data, error: fetchError } = await supabase
      //   .from("task_activity_log")
      //   .select("*")
      //   .eq("task_id", taskId)
      //   .order("created_at", { ascending: false })
      //   .limit(limit);

      // if (fetchError) throw fetchError;

      // setActivities(data || []);
      
      // Temporary: Return empty array until migration is applied
      setActivities([]);
    } catch (err) {
      console.error("Error fetching task activities:", err);
      setError(err instanceof Error ? err.message : "Failed to load activities");
    } finally {
      setLoading(false);
    }
  };

  const getActivityColor = (type: TaskActivityType): string => {
    switch (type) {
      case "created":
        return "bg-green-500/10 text-green-700 border-green-500/20";
      case "status_changed":
        return "bg-blue-500/10 text-blue-700 border-blue-500/20";
      case "assignment_changed":
        return "bg-purple-500/10 text-purple-700 border-purple-500/20";
      case "priority_changed":
        return "bg-orange-500/10 text-orange-700 border-orange-500/20";
      case "due_date_changed":
        return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20";
      case "note_added":
      case "description_updated":
        return "bg-indigo-500/10 text-indigo-700 border-indigo-500/20";
      case "attachment_added":
        return "bg-pink-500/10 text-pink-700 border-pink-500/20";
      case "attachment_removed":
      case "deleted":
        return "bg-red-500/10 text-red-700 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-500/20";
    }
  };

  const renderActivityDetails = (activity: TaskActivity) => {
    const { activity_type, field_name, old_value, new_value, notes } = activity;

    // For status changes, show badges
    if (activity_type === "status_changed" && old_value && new_value) {
      return (
        <div className="flex items-center gap-2 text-sm">
          <Badge variant="outline" className="capitalize">
            {old_value.replace("_", " ")}
          </Badge>
          <span>→</span>
          <Badge variant="default" className="capitalize">
            {new_value.replace("_", " ")}
          </Badge>
        </div>
      );
    }

    // For assignment changes
    if (activity_type === "assignment_changed" && notes) {
      return <p className="text-sm text-muted-foreground">{notes}</p>;
    }

    // For priority changes
    if (activity_type === "priority_changed" && old_value && new_value) {
      return (
        <div className="flex items-center gap-2 text-sm">
          <Badge variant="outline" className="capitalize">
            {old_value}
          </Badge>
          <span>→</span>
          <Badge variant="default" className="capitalize">
            {new_value}
          </Badge>
        </div>
      );
    }

    // For date changes
    if (activity_type === "due_date_changed" && old_value && new_value) {
      return (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">
            {format(new Date(old_value), "MMM d, yyyy")}
          </span>
          <span>→</span>
          <span className="font-medium">
            {format(new Date(new_value), "MMM d, yyyy")}
          </span>
        </div>
      );
    }

    // Default: show notes if available
    if (notes) {
      return <p className="text-sm text-muted-foreground">{notes}</p>;
    }

    return null;
  };

  if (loading) {
    return (
      <Card>
        {showTitle && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Activity History
            </CardTitle>
            <CardDescription>Loading activity timeline...</CardDescription>
          </CardHeader>
        )}
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        {showTitle && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Activity History
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-8">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        {showTitle && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Activity History
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-8">
            <Clock className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">No activity yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Activity History
          </CardTitle>
          <CardDescription>
            {activities.length} {activities.length === 1 ? "activity" : "activities"} recorded
          </CardDescription>
        </CardHeader>
      )}
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={activity.id}>
                <div className="flex gap-4">
                  {/* Icon/Badge Column */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${getActivityColor(
                        activity.activity_type as TaskActivityType
                      )}`}
                    >
                      <span className="text-lg">
                        {TASK_ACTIVITY_ICONS[activity.activity_type as TaskActivityType] || "📋"}
                      </span>
                    </div>
                    {index < activities.length - 1 && (
                      <div className="w-0.5 h-full min-h-[40px] bg-border mt-2" />
                    )}
                  </div>

                  {/* Content Column */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <h4 className="font-medium text-sm">
                          {TASK_ACTIVITY_LABELS[activity.activity_type as TaskActivityType] ||
                            activity.activity_type}
                        </h4>
                        {activity.performed_by_name && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {activity.performed_by_name}
                          </p>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground text-right shrink-0">
                        <p>{formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}</p>
                        <p className="text-[10px]">
                          {format(new Date(activity.created_at), "MMM d, h:mm a")}
                        </p>
                      </div>
                    </div>

                    {/* Activity Details */}
                    <div className="mt-2">{renderActivityDetails(activity)}</div>
                  </div>
                </div>
                {index < activities.length - 1 && <Separator className="my-2" />}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
