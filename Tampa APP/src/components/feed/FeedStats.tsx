import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FeedItem } from "@/types/feed";
import { Bell, BellDot, AlertCircle, TrendingUp } from "lucide-react";

interface FeedStatsProps {
  items: FeedItem[];
  currentUserId?: string;
}

export default function FeedStats({ items, currentUserId }: FeedStatsProps) {
  // Calculate statistics
  const totalItems = items.length;

  const unreadItems = currentUserId
    ? items.filter(
        (item) =>
          !item.feed_reads?.some((read) => read.user_id === currentUserId)
      )
    : [];

  const unreadCount = unreadItems.length;

  // Count by priority
  const criticalCount = unreadItems.filter(
    (item) => item.priority === "critical"
  ).length;
  const highCount = unreadItems.filter((item) => item.priority === "high")
    .length;
  const normalCount = unreadItems.filter((item) => item.priority === "normal")
    .length;

  // Count by type
  const taskCount = items.filter((item) => item.type === "task_delegated")
    .length;
  const docCount = items.filter((item) => item.type === "pending_docs").length;
  const maintenanceCount = items.filter((item) => item.type === "maintenance")
    .length;

  // Get read percentage
  const readPercentage = totalItems > 0
    ? Math.round(((totalItems - unreadCount) / totalItems) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Unread */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Unread
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold">{unreadCount}</p>
                {totalItems > 0 && (
                  <p className="text-sm text-muted-foreground">
                    of {totalItems}
                  </p>
                )}
              </div>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <BellDot className="w-6 h-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical & High Priority */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Urgent
              </p>
              <div className="flex items-center gap-3">
                {criticalCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="text-base px-2 py-1 font-bold"
                  >
                    🔴 {criticalCount}
                  </Badge>
                )}
                {highCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-base px-2 py-1 font-bold bg-amber-100 text-amber-900"
                  >
                    🟡 {highCount}
                  </Badge>
                )}
                {criticalCount === 0 && highCount === 0 && (
                  <p className="text-3xl font-bold text-green-600">0</p>
                )}
              </div>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* By Type Breakdown */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <p className="text-sm font-medium text-muted-foreground">
                By Type
              </p>
              <div className="space-y-1">
                {taskCount > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <span>📋</span>
                    <span className="font-medium">{taskCount}</span>
                    <span className="text-muted-foreground">Tasks</span>
                  </div>
                )}
                {docCount > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <span>⚠️</span>
                    <span className="font-medium">{docCount}</span>
                    <span className="text-muted-foreground">Docs</span>
                  </div>
                )}
                {maintenanceCount > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <span>🔧</span>
                    <span className="font-medium">{maintenanceCount}</span>
                    <span className="text-muted-foreground">Maintenance</span>
                  </div>
                )}
                {taskCount === 0 && docCount === 0 && maintenanceCount === 0 && (
                  <p className="text-sm text-muted-foreground">No items</p>
                )}
              </div>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Read Progress */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Read Progress
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold">{readPercentage}%</p>
              </div>
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-600 transition-all duration-300"
                  style={{ width: `${readPercentage}%` }}
                />
              </div>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
