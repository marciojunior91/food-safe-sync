import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import type { TeamTrainingStats } from "@/types/training";

interface TrainingStatsProps {
  stats: TeamTrainingStats;
  loading?: boolean;
}

export default function TrainingStats({ stats, loading = false }: TrainingStatsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Courses",
      value: stats.total_courses,
      description: `${stats.required_courses} required`,
      icon: BookOpen,
      color: "text-blue-600 dark:text-blue-400"
    },
    {
      title: "Completed",
      value: stats.completed_count,
      description: `${Math.round(stats.average_completion)}% average`,
      icon: CheckCircle,
      color: "text-green-600 dark:text-green-400"
    },
    {
      title: "In Progress",
      value: stats.in_progress_count,
      description: `${stats.not_started_count} not started`,
      icon: Clock,
      color: "text-yellow-600 dark:text-yellow-400"
    },
    {
      title: "Expiring Soon",
      value: stats.expiring_soon,
      description: "Next 30 days",
      icon: AlertTriangle,
      color: "text-red-600 dark:text-red-400"
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
